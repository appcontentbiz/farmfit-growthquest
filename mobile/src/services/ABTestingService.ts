import { addDays, subDays, differenceInDays } from 'date-fns';
import OfflineStorageService from './OfflineStorageService';

interface ABTest {
  id: string;
  name: string;
  description: string;
  variants: TestVariant[];
  startDate: Date;
  endDate: Date;
  status: TestStatus;
  metrics: TestMetrics;
  targetAudience?: string[];
  minimumSampleSize: number;
}

interface TestVariant {
  id: string;
  name: string;
  description: string;
  config: any;
  metrics: VariantMetrics;
  sampleSize: number;
}

interface TestMetrics {
  primaryMetric: string;
  secondaryMetrics: string[];
  minimumImprovement: number;
  confidenceLevel: number;
}

interface VariantMetrics {
  successRate: number;
  responseTime: number;
  engagementRate: number;
  conversionRate: number;
  confidence: number;
}

enum TestStatus {
  DRAFT = 'draft',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}

class ABTestingService {
  private readonly MIN_TEST_DURATION_DAYS = 7;
  private readonly MAX_TEST_DURATION_DAYS = 30;
  private readonly MIN_SAMPLE_SIZE = 100;
  private readonly CONFIDENCE_THRESHOLD = 0.95;

  async createTest(testConfig: Partial<ABTest>): Promise<ABTest> {
    try {
      const test: ABTest = {
        id: `test_${Date.now()}`,
        name: testConfig.name || 'Unnamed Test',
        description: testConfig.description || '',
        variants: testConfig.variants || [],
        startDate: testConfig.startDate || new Date(),
        endDate: testConfig.endDate || addDays(new Date(), this.MIN_TEST_DURATION_DAYS),
        status: TestStatus.DRAFT,
        metrics: testConfig.metrics || {
          primaryMetric: 'successRate',
          secondaryMetrics: ['responseTime', 'engagementRate'],
          minimumImprovement: 0.1,
          confidenceLevel: 0.95,
        },
        targetAudience: testConfig.targetAudience,
        minimumSampleSize: testConfig.minimumSampleSize || this.MIN_SAMPLE_SIZE,
      };

      await this.validateTest(test);
      await this.saveTest(test);

      return test;
    } catch (error) {
      console.error('Error creating A/B test:', error);
      throw error;
    }
  }

  async startTest(testId: string): Promise<void> {
    try {
      const test = await this.getTest(testId);
      if (!test) throw new Error('Test not found');

      await this.validateTest(test);
      test.status = TestStatus.RUNNING;
      test.startDate = new Date();
      
      await this.saveTest(test);
    } catch (error) {
      console.error('Error starting A/B test:', error);
      throw error;
    }
  }

  async pauseTest(testId: string): Promise<void> {
    try {
      const test = await this.getTest(testId);
      if (!test) throw new Error('Test not found');

      test.status = TestStatus.PAUSED;
      await this.saveTest(test);
    } catch (error) {
      console.error('Error pausing A/B test:', error);
      throw error;
    }
  }

  async completeTest(testId: string): Promise<void> {
    try {
      const test = await this.getTest(testId);
      if (!test) throw new Error('Test not found');

      const results = await this.analyzeResults(test);
      test.status = TestStatus.COMPLETED;
      test.variants = results.variants;

      await this.saveTest(test);
    } catch (error) {
      console.error('Error completing A/B test:', error);
      throw error;
    }
  }

  async getVariantForUser(testId: string, userId: string): Promise<TestVariant | null> {
    try {
      const test = await this.getTest(testId);
      if (!test || test.status !== TestStatus.RUNNING) return null;

      // Consistent variant assignment using hash of userId and testId
      const variantIndex = this.hashString(`${userId}_${testId}`) % test.variants.length;
      return test.variants[variantIndex];
    } catch (error) {
      console.error('Error getting variant for user:', error);
      return null;
    }
  }

  async recordEvent(testId: string, variantId: string, event: any): Promise<void> {
    try {
      const test = await this.getTest(testId);
      if (!test || test.status !== TestStatus.RUNNING) return;

      const variant = test.variants.find(v => v.id === variantId);
      if (!variant) return;

      // Update variant metrics based on event
      await this.updateVariantMetrics(test, variant, event);
      await this.saveTest(test);

      // Check if test should be automatically completed
      if (await this.shouldCompleteTest(test)) {
        await this.completeTest(testId);
      }
    } catch (error) {
      console.error('Error recording event:', error);
    }
  }

  private async validateTest(test: ABTest): Promise<void> {
    if (test.variants.length < 2) {
      throw new Error('Test must have at least two variants');
    }

    const duration = differenceInDays(test.endDate, test.startDate);
    if (duration < this.MIN_TEST_DURATION_DAYS || duration > this.MAX_TEST_DURATION_DAYS) {
      throw new Error(`Test duration must be between ${this.MIN_TEST_DURATION_DAYS} and ${this.MAX_TEST_DURATION_DAYS} days`);
    }

    if (!test.metrics.primaryMetric) {
      throw new Error('Test must have a primary metric');
    }
  }

  private async analyzeResults(test: ABTest): Promise<ABTest> {
    const controlVariant = test.variants[0];
    const testVariants = test.variants.slice(1);

    for (const variant of testVariants) {
      const comparison = this.compareVariants(controlVariant, variant);
      variant.metrics.confidence = comparison.confidence;
    }

    return test;
  }

  private compareVariants(control: TestVariant, variant: TestVariant): { confidence: number } {
    // Implement statistical significance testing
    const zScore = this.calculateZScore(control, variant);
    const confidence = this.calculateConfidence(zScore);

    return { confidence };
  }

  private calculateZScore(control: TestVariant, variant: TestVariant): number {
    const p1 = variant.metrics.successRate;
    const p2 = control.metrics.successRate;
    const n1 = variant.sampleSize;
    const n2 = control.sampleSize;

    const p = (p1 * n1 + p2 * n2) / (n1 + n2);
    const se = Math.sqrt(p * (1 - p) * (1/n1 + 1/n2));

    return Math.abs(p1 - p2) / se;
  }

  private calculateConfidence(zScore: number): number {
    // Simplified confidence calculation
    return Math.min(1, Math.max(0, zScore / 3));
  }

  private async updateVariantMetrics(test: ABTest, variant: TestVariant, event: any): Promise<void> {
    const metrics = variant.metrics;

    // Update metrics based on event type
    switch (event.type) {
      case 'success':
        metrics.successRate = this.updateRate(metrics.successRate, event.value, variant.sampleSize);
        break;
      case 'response':
        metrics.responseTime = this.updateAverage(metrics.responseTime, event.value, variant.sampleSize);
        break;
      case 'engagement':
        metrics.engagementRate = this.updateRate(metrics.engagementRate, event.value, variant.sampleSize);
        break;
      case 'conversion':
        metrics.conversionRate = this.updateRate(metrics.conversionRate, event.value, variant.sampleSize);
        break;
    }

    variant.sampleSize++;
  }

  private updateRate(currentRate: number, newValue: boolean, sampleSize: number): number {
    return (currentRate * sampleSize + (newValue ? 1 : 0)) / (sampleSize + 1);
  }

  private updateAverage(currentAvg: number, newValue: number, sampleSize: number): number {
    return (currentAvg * sampleSize + newValue) / (sampleSize + 1);
  }

  private async shouldCompleteTest(test: ABTest): Promise<boolean> {
    // Check if minimum sample size is reached
    const totalSamples = test.variants.reduce((sum, variant) => sum + variant.sampleSize, 0);
    if (totalSamples < test.minimumSampleSize) return false;

    // Check if test duration is reached
    const now = new Date();
    if (now < test.endDate) return false;

    // Check if we have statistical significance
    const controlVariant = test.variants[0];
    const testVariants = test.variants.slice(1);

    return testVariants.some(variant => {
      const comparison = this.compareVariants(controlVariant, variant);
      return comparison.confidence >= this.CONFIDENCE_THRESHOLD;
    });
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  private async getTest(testId: string): Promise<ABTest | null> {
    try {
      const tests = await OfflineStorageService.getHistoricalData();
      return tests.find((test: ABTest) => test.id === testId) || null;
    } catch (error) {
      console.error('Error getting test:', error);
      return null;
    }
  }

  private async saveTest(test: ABTest): Promise<void> {
    try {
      const tests = await OfflineStorageService.getHistoricalData();
      const index = tests.findIndex((t: ABTest) => t.id === test.id);

      if (index >= 0) {
        tests[index] = test;
      } else {
        tests.push(test);
      }

      await OfflineStorageService.saveHistoricalData(tests);
    } catch (error) {
      console.error('Error saving test:', error);
      throw error;
    }
  }
}

export default new ABTestingService();
