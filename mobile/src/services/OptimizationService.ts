import { addDays, subDays, format, differenceInMinutes } from 'date-fns';
import AdvancedAnalyticsService from './AdvancedAnalyticsService';
import MLPredictionService from './MLPredictionService';
import OfflineStorageService from './OfflineStorageService';

interface Optimization {
  id: string;
  category: string;
  type: OptimizationType;
  suggestion: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  metrics: OptimizationMetrics;
  implementationSteps: string[];
}

interface OptimizationMetrics {
  currentPerformance: number;
  expectedImprovement: number;
  resourceImpact: number;
  implementationEffort: number;
}

enum OptimizationType {
  TIMING = 'timing',
  FREQUENCY = 'frequency',
  CONTENT = 'content',
  RESOURCE = 'resource',
  WORKFLOW = 'workflow',
}

class OptimizationService {
  private readonly ANALYSIS_WINDOW_DAYS = 30;
  private readonly MIN_CONFIDENCE_THRESHOLD = 0.7;
  private readonly PERFORMANCE_THRESHOLD = 0.8;

  async generateOptimizations(): Promise<Optimization[]> {
    try {
      const analytics = await AdvancedAnalyticsService.generateAnalytics();
      const historicalData = await OfflineStorageService.getHistoricalData();
      const recentData = this.getRecentData(historicalData);

      const optimizations: Optimization[] = [];

      // Generate timing optimizations
      const timingOpts = await this.analyzeTiming(recentData);
      optimizations.push(...timingOpts);

      // Generate frequency optimizations
      const frequencyOpts = await this.analyzeFrequency(recentData);
      optimizations.push(...frequencyOpts);

      // Generate content optimizations
      const contentOpts = await this.analyzeContent(recentData);
      optimizations.push(...contentOpts);

      // Generate resource optimizations
      const resourceOpts = await this.analyzeResources(recentData, analytics);
      optimizations.push(...resourceOpts);

      // Generate workflow optimizations
      const workflowOpts = await this.analyzeWorkflow(recentData, analytics);
      optimizations.push(...workflowOpts);

      return this.prioritizeOptimizations(optimizations);
    } catch (error) {
      console.error('Error generating optimizations:', error);
      return [];
    }
  }

  private async analyzeTiming(data: any[]): Promise<Optimization[]> {
    const optimizations: Optimization[] = [];
    const categories = new Set(data.map(item => item.category));

    for (const category of categories) {
      const categoryData = data.filter(item => item.category === category);
      const successfulNotifications = categoryData.filter(item => item.wasSuccessful);

      if (successfulNotifications.length === 0) continue;

      // Analyze successful notification times
      const successTimes = successfulNotifications.map(item => {
        const date = new Date(item.scheduledFor);
        return date.getHours();
      });

      const optimalHour = this.findOptimalHour(successTimes);
      const currentPerformance = successfulNotifications.length / categoryData.length;

      if (currentPerformance < this.PERFORMANCE_THRESHOLD) {
        optimizations.push({
          id: `timing_${category}_${Date.now()}`,
          category,
          type: OptimizationType.TIMING,
          suggestion: `Schedule ${category} notifications around ${optimalHour}:00`,
          impact: this.calculateImpact(currentPerformance),
          confidence: this.calculateConfidence(successfulNotifications.length),
          metrics: {
            currentPerformance,
            expectedImprovement: 0.15,
            resourceImpact: 0.1,
            implementationEffort: 0.2,
          },
          implementationSteps: [
            `Update notification scheduling for ${category}`,
            'Monitor performance for 2 weeks',
            'Adjust timing based on results',
          ],
        });
      }
    }

    return optimizations;
  }

  private async analyzeFrequency(data: any[]): Promise<Optimization[]> {
    const optimizations: Optimization[] = [];
    const categories = new Set(data.map(item => item.category));

    for (const category of categories) {
      const categoryData = data.filter(item => item.category === category);
      const dailyFrequency = this.calculateDailyFrequency(categoryData);
      const responseRates = this.calculateResponseRates(categoryData);

      if (responseRates.average < this.PERFORMANCE_THRESHOLD) {
        const suggestion = responseRates.overloaded
          ? `Reduce ${category} notification frequency by 30%`
          : `Increase ${category} notification frequency by 20%`;

        optimizations.push({
          id: `frequency_${category}_${Date.now()}`,
          category,
          type: OptimizationType.FREQUENCY,
          suggestion,
          impact: 'high',
          confidence: this.calculateConfidence(categoryData.length),
          metrics: {
            currentPerformance: responseRates.average,
            expectedImprovement: 0.2,
            resourceImpact: 0.15,
            implementationEffort: 0.3,
          },
          implementationSteps: [
            'Adjust notification frequency settings',
            'Monitor user response rates',
            'Collect user feedback',
            'Fine-tune based on results',
          ],
        });
      }
    }

    return optimizations;
  }

  private async analyzeContent(data: any[]): Promise<Optimization[]> {
    const optimizations: Optimization[] = [];
    const categories = new Set(data.map(item => item.category));

    for (const category of categories) {
      const categoryData = data.filter(item => item.category === category);
      const contentAnalysis = this.analyzeContentEffectiveness(categoryData);

      if (contentAnalysis.effectiveness < this.PERFORMANCE_THRESHOLD) {
        optimizations.push({
          id: `content_${category}_${Date.now()}`,
          category,
          type: OptimizationType.CONTENT,
          suggestion: contentAnalysis.suggestion,
          impact: 'medium',
          confidence: this.calculateConfidence(categoryData.length),
          metrics: {
            currentPerformance: contentAnalysis.effectiveness,
            expectedImprovement: 0.25,
            resourceImpact: 0.2,
            implementationEffort: 0.4,
          },
          implementationSteps: contentAnalysis.implementationSteps,
        });
      }
    }

    return optimizations;
  }

  private async analyzeResources(data: any[], analytics: any): Promise<Optimization[]> {
    const optimizations: Optimization[] = [];
    const { resourceUtilization } = analytics;

    if (resourceUtilization.staffUtilization < this.PERFORMANCE_THRESHOLD) {
      optimizations.push({
        id: `resource_staff_${Date.now()}`,
        category: 'staff',
        type: OptimizationType.RESOURCE,
        suggestion: 'Optimize staff allocation based on peak notification times',
        impact: 'high',
        confidence: 0.85,
        metrics: {
          currentPerformance: resourceUtilization.staffUtilization,
          expectedImprovement: 0.3,
          resourceImpact: 0.4,
          implementationEffort: 0.5,
        },
        implementationSteps: [
          'Analyze peak notification times',
          'Adjust staff schedules',
          'Implement rotation system',
          'Monitor performance improvements',
        ],
      });
    }

    return optimizations;
  }

  private async analyzeWorkflow(data: any[], analytics: any): Promise<Optimization[]> {
    const optimizations: Optimization[] = [];
    const workflowEfficiency = this.calculateWorkflowEfficiency(data);

    if (workflowEfficiency < this.PERFORMANCE_THRESHOLD) {
      optimizations.push({
        id: `workflow_${Date.now()}`,
        category: 'workflow',
        type: OptimizationType.WORKFLOW,
        suggestion: 'Streamline notification response workflow',
        impact: 'high',
        confidence: 0.9,
        metrics: {
          currentPerformance: workflowEfficiency,
          expectedImprovement: 0.35,
          resourceImpact: 0.25,
          implementationEffort: 0.6,
        },
        implementationSteps: [
          'Map current workflow',
          'Identify bottlenecks',
          'Implement automated responses',
          'Train staff on new workflow',
          'Monitor efficiency improvements',
        ],
      });
    }

    return optimizations;
  }

  private getRecentData(data: any[]): any[] {
    const cutoffDate = subDays(new Date(), this.ANALYSIS_WINDOW_DAYS);
    return data.filter(item => new Date(item.scheduledFor) >= cutoffDate);
  }

  private findOptimalHour(times: number[]): number {
    const hourCounts = new Array(24).fill(0);
    times.forEach(hour => hourCounts[hour]++);
    return hourCounts.indexOf(Math.max(...hourCounts));
  }

  private calculateDailyFrequency(data: any[]): number {
    const days = new Set(data.map(item => format(new Date(item.scheduledFor), 'yyyy-MM-dd')));
    return data.length / days.size;
  }

  private calculateResponseRates(data: any[]): { average: number; overloaded: boolean } {
    const responses = data.filter(item => item.responseTime).length;
    const average = responses / data.length;
    const overloaded = average < 0.5;
    return { average, overloaded };
  }

  private analyzeContentEffectiveness(data: any[]): {
    effectiveness: number;
    suggestion: string;
    implementationSteps: string[];
  } {
    const readRate = data.filter(item => item.wasRead).length / data.length;
    const actionRate = data.filter(item => item.hadAction).length / data.length;
    const effectiveness = (readRate + actionRate) / 2;

    let suggestion = '';
    let implementationSteps: string[] = [];

    if (readRate < 0.7) {
      suggestion = 'Improve notification visibility and content clarity';
      implementationSteps = [
        'Review notification content structure',
        'Implement attention-grabbing elements',
        'Test different content formats',
        'Monitor read rates',
      ];
    } else if (actionRate < 0.5) {
      suggestion = 'Enhance call-to-action effectiveness';
      implementationSteps = [
        'Analyze successful action patterns',
        'Implement clearer action buttons',
        'Add contextual information',
        'Track action completion rates',
      ];
    }

    return { effectiveness, suggestion, implementationSteps };
  }

  private calculateWorkflowEfficiency(data: any[]): number {
    const completionTimes = data
      .filter(item => item.completedAt)
      .map(item => differenceInMinutes(new Date(item.completedAt), new Date(item.scheduledFor)));

    if (completionTimes.length === 0) return 0;

    const averageCompletionTime = completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length;
    const maxAcceptableTime = 120; // 2 hours
    return Math.max(0, 1 - (averageCompletionTime / maxAcceptableTime));
  }

  private calculateImpact(performance: number): 'high' | 'medium' | 'low' {
    if (performance < 0.5) return 'high';
    if (performance < 0.7) return 'medium';
    return 'low';
  }

  private calculateConfidence(sampleSize: number): number {
    const minSamples = 10;
    const maxSamples = 100;
    return Math.min(1, Math.max(0.5, sampleSize / maxSamples));
  }

  private prioritizeOptimizations(optimizations: Optimization[]): Optimization[] {
    return optimizations.sort((a, b) => {
      const aScore = this.calculatePriorityScore(a);
      const bScore = this.calculatePriorityScore(b);
      return bScore - aScore;
    });
  }

  private calculatePriorityScore(optimization: Optimization): number {
    const impactScore = optimization.impact === 'high' ? 3 : optimization.impact === 'medium' ? 2 : 1;
    const confidenceScore = optimization.confidence;
    const effortScore = 1 - optimization.metrics.implementationEffort;
    const improvementScore = optimization.metrics.expectedImprovement;

    return (impactScore * 0.4) + (confidenceScore * 0.3) + (effortScore * 0.1) + (improvementScore * 0.2);
  }
}

export default new OptimizationService();
