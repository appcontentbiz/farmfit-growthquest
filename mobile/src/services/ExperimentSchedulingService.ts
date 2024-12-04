import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, addHours, isAfter, isBefore, parseISO } from 'date-fns';
import ExperimentManagementService from './ExperimentManagementService';
import ModelManagementService from './ModelManagementService';
import StatisticalAnalysisService from './StatisticalAnalysisService';

interface ScheduleConfig {
  experimentId: string;
  schedule: {
    startDate: Date;
    endDate: Date;
    checkpoints: number[];
    evaluationInterval: number;
    maxConcurrent: number;
    priority: number;
    retryStrategy: {
      maxRetries: number;
      backoffMultiplier: number;
      initialDelay: number;
    };
  };
  resources: {
    cpuLimit: number;
    memoryLimit: number;
    gpuRequired: boolean;
  };
  notifications: {
    onStart: boolean;
    onCheckpoint: boolean;
    onCompletion: boolean;
    onError: boolean;
    channels: string[];
  };
}

interface ExperimentTask {
  id: string;
  experimentId: string;
  type: 'evaluation' | 'checkpoint' | 'completion';
  scheduledTime: Date;
  status: 'pending' | 'running' | 'completed' | 'failed';
  retries: number;
  lastError?: string;
  results?: any;
}

class ExperimentSchedulingService {
  private readonly STORAGE_KEY = '@FarmFit:ExperimentSchedules';
  private schedules: Map<string, ScheduleConfig> = new Map();
  private tasks: ExperimentTask[] = [];
  private schedulerInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeState();
    this.startScheduler();
  }

  private async initializeState() {
    try {
      const storedData = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (storedData) {
        const parsed = JSON.parse(storedData);
        this.schedules = new Map(Object.entries(parsed.schedules));
        this.tasks = parsed.tasks.map((task: any) => ({
          ...task,
          scheduledTime: parseISO(task.scheduledTime),
        }));
      }
    } catch (error) {
      console.error('Error initializing scheduler state:', error);
    }
  }

  private async saveState() {
    try {
      await AsyncStorage.setItem(
        this.STORAGE_KEY,
        JSON.stringify({
          schedules: Object.fromEntries(this.schedules),
          tasks: this.tasks.map(task => ({
            ...task,
            scheduledTime: task.scheduledTime.toISOString(),
          })),
        })
      );
    } catch (error) {
      console.error('Error saving scheduler state:', error);
    }
  }

  async scheduleExperiment(config: ScheduleConfig): Promise<string> {
    // Validate schedule configuration
    this.validateScheduleConfig(config);

    // Generate schedule ID
    const scheduleId = `schedule_${format(new Date(), 'yyyyMMdd_HHmmss')}`;

    // Store schedule configuration
    this.schedules.set(scheduleId, config);

    // Generate initial tasks
    this.generateTasks(scheduleId, config);

    await this.saveState();
    return scheduleId;
  }

  private validateScheduleConfig(config: ScheduleConfig) {
    if (isBefore(config.schedule.endDate, config.schedule.startDate)) {
      throw new Error('End date must be after start date');
    }

    if (config.schedule.maxConcurrent < 1) {
      throw new Error('Maximum concurrent experiments must be at least 1');
    }

    if (config.schedule.evaluationInterval < 60000) {
      throw new Error('Evaluation interval must be at least 1 minute');
    }
  }

  private generateTasks(scheduleId: string, config: ScheduleConfig) {
    const { startDate, endDate, checkpoints, evaluationInterval } = config.schedule;

    // Generate evaluation tasks
    let currentTime = new Date(startDate);
    while (isBefore(currentTime, endDate)) {
      this.tasks.push({
        id: `task_${format(currentTime, 'yyyyMMdd_HHmmss')}`,
        experimentId: config.experimentId,
        type: 'evaluation',
        scheduledTime: currentTime,
        status: 'pending',
        retries: 0,
      });

      currentTime = addHours(currentTime, evaluationInterval / (60 * 60 * 1000));
    }

    // Generate checkpoint tasks
    checkpoints.forEach((checkpoint) => {
      this.tasks.push({
        id: `checkpoint_${checkpoint}`,
        experimentId: config.experimentId,
        type: 'checkpoint',
        scheduledTime: addHours(startDate, checkpoint),
        status: 'pending',
        retries: 0,
      });
    });

    // Generate completion task
    this.tasks.push({
      id: `completion_${config.experimentId}`,
      experimentId: config.experimentId,
      type: 'completion',
      scheduledTime: endDate,
      status: 'pending',
      retries: 0,
    });
  }

  private startScheduler() {
    // Check for tasks every minute
    this.schedulerInterval = setInterval(async () => {
      await this.processScheduledTasks();
    }, 60000);
  }

  private async processScheduledTasks() {
    const now = new Date();
    const pendingTasks = this.tasks.filter(
      task =>
        task.status === 'pending' &&
        isAfter(now, task.scheduledTime) &&
        task.retries < this.getRetryLimit(task.experimentId)
    );

    // Sort tasks by priority and scheduled time
    pendingTasks.sort((a, b) => {
      const scheduleA = this.schedules.get(a.experimentId);
      const scheduleB = this.schedules.get(b.experimentId);
      
      if (!scheduleA || !scheduleB) return 0;
      
      if (scheduleA.schedule.priority !== scheduleB.schedule.priority) {
        return scheduleB.schedule.priority - scheduleA.schedule.priority;
      }
      
      return a.scheduledTime.getTime() - b.scheduledTime.getTime();
    });

    // Process tasks respecting concurrent limits
    const runningTasks = this.tasks.filter(task => task.status === 'running');
    const availableSlots = Math.max(
      0,
      this.getMaxConcurrent() - runningTasks.length
    );

    for (let i = 0; i < Math.min(availableSlots, pendingTasks.length); i++) {
      const task = pendingTasks[i];
      await this.executeTask(task);
    }
  }

  private async executeTask(task: ExperimentTask) {
    try {
      task.status = 'running';
      await this.saveState();

      switch (task.type) {
        case 'evaluation':
          await this.executeEvaluation(task);
          break;
        case 'checkpoint':
          await this.executeCheckpoint(task);
          break;
        case 'completion':
          await this.executeCompletion(task);
          break;
      }

      task.status = 'completed';
    } catch (error) {
      console.error(`Error executing task ${task.id}:`, error);
      task.status = 'failed';
      task.lastError = error.message;
      task.retries++;

      // Schedule retry if within limits
      if (task.retries < this.getRetryLimit(task.experimentId)) {
        const delay = this.calculateRetryDelay(task);
        task.scheduledTime = addHours(new Date(), delay / (60 * 60 * 1000));
        task.status = 'pending';
      }
    }

    await this.saveState();
    await this.notifyTaskCompletion(task);
  }

  private async executeEvaluation(task: ExperimentTask) {
    const experiment = await ExperimentManagementService.getExperiment(
      task.experimentId
    );
    
    if (!experiment) {
      throw new Error('Experiment not found');
    }

    // Perform evaluation
    const results = await ExperimentManagementService.evaluateExperiment(
      task.experimentId
    );

    // Analyze results
    const analysis = await StatisticalAnalysisService.analyzeResults(results);

    task.results = {
      evaluation: results,
      analysis: analysis,
    };
  }

  private async executeCheckpoint(task: ExperimentTask) {
    const experiment = await ExperimentManagementService.getExperiment(
      task.experimentId
    );
    
    if (!experiment) {
      throw new Error('Experiment not found');
    }

    // Save checkpoint
    const checkpoint = await ModelManagementService.saveCheckpoint(
      experiment.modelId,
      {
        experimentId: task.experimentId,
        checkpointId: task.id,
        timestamp: new Date(),
      }
    );

    task.results = {
      checkpoint: checkpoint,
    };
  }

  private async executeCompletion(task: ExperimentTask) {
    const experiment = await ExperimentManagementService.getExperiment(
      task.experimentId
    );
    
    if (!experiment) {
      throw new Error('Experiment not found');
    }

    // Generate final results and analysis
    const results = await ExperimentManagementService.getFinalResults(
      task.experimentId
    );
    const analysis = await StatisticalAnalysisService.generateFinalAnalysis(
      results
    );

    task.results = {
      finalResults: results,
      finalAnalysis: analysis,
    };
  }

  private getRetryLimit(experimentId: string): number {
    const schedule = this.schedules.get(experimentId);
    return schedule?.schedule.retryStrategy.maxRetries ?? 3;
  }

  private calculateRetryDelay(task: ExperimentTask): number {
    const schedule = this.schedules.get(task.experimentId);
    if (!schedule) return 300000; // 5 minutes default

    const { initialDelay, backoffMultiplier } = schedule.schedule.retryStrategy;
    return initialDelay * Math.pow(backoffMultiplier, task.retries);
  }

  private getMaxConcurrent(): number {
    return Math.max(
      ...Array.from(this.schedules.values()).map(
        (schedule) => schedule.schedule.maxConcurrent
      )
    );
  }

  private async notifyTaskCompletion(task: ExperimentTask) {
    const schedule = this.schedules.get(task.experimentId);
    if (!schedule) return;

    const { notifications } = schedule;
    const shouldNotify =
      (task.type === 'evaluation' && notifications.onCheckpoint) ||
      (task.type === 'completion' && notifications.onCompletion) ||
      (task.status === 'failed' && notifications.onError);

    if (shouldNotify) {
      // Implementation for your notification system
      // This could integrate with various notification services
      console.log(`Task ${task.id} completed with status ${task.status}`);
    }
  }

  async getScheduleStatus(scheduleId: string) {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) {
      throw new Error('Schedule not found');
    }

    const tasks = this.tasks.filter(
      (task) => task.experimentId === schedule.experimentId
    );

    return {
      schedule,
      tasks: tasks.map((task) => ({
        id: task.id,
        type: task.type,
        status: task.status,
        scheduledTime: task.scheduledTime,
        retries: task.retries,
        lastError: task.lastError,
      })),
      progress: {
        total: tasks.length,
        completed: tasks.filter((task) => task.status === 'completed').length,
        failed: tasks.filter((task) => task.status === 'failed').length,
        pending: tasks.filter((task) => task.status === 'pending').length,
        running: tasks.filter((task) => task.status === 'running').length,
      },
    };
  }

  async cancelSchedule(scheduleId: string) {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) {
      throw new Error('Schedule not found');
    }

    // Cancel all pending tasks
    this.tasks = this.tasks.map((task) =>
      task.experimentId === schedule.experimentId && task.status === 'pending'
        ? { ...task, status: 'failed', lastError: 'Schedule cancelled' }
        : task
    );

    // Remove schedule
    this.schedules.delete(scheduleId);

    await this.saveState();
  }

  dispose() {
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
    }
  }
}

export default new ExperimentSchedulingService();
