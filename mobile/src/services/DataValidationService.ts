import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

interface ValidationResult {
  isValid: boolean;
  missingData: string[];
  recommendations: string[];
  criticalIssues: string[];
}

interface DataRequirement {
  path: string;
  type: 'required' | 'optional';
  validator?: (data: any) => boolean;
  defaultValue?: any;
  dependencies?: string[];
}

class DataValidationService {
  private static instance: DataValidationService;
  private readonly STORAGE_KEY = '@FarmFit:ValidationState';

  private dataRequirements: { [key: string]: DataRequirement[] } = {
    livestock: [
      {
        path: 'basicInfo',
        type: 'required',
        validator: (data) => data && data.species && data.breed && data.age,
      },
      {
        path: 'healthMetrics',
        type: 'required',
        validator: (data) => data && data.weight && data.temperature && data.activity,
      },
      {
        path: 'feedingSchedule',
        type: 'required',
        validator: (data) => Array.isArray(data) && data.length > 0,
      },
      {
        path: 'medicalHistory',
        type: 'required',
        validator: (data) => Array.isArray(data),
      }
    ],
    analytics: [
      {
        path: 'performanceMetrics',
        type: 'required',
        validator: (data) => data && Object.keys(data).length > 0,
      },
      {
        path: 'historicalData',
        type: 'required',
        validator: (data) => Array.isArray(data) && data.length > 0,
      },
      {
        path: 'predictions',
        type: 'required',
        validator: (data) => data && data.shortTerm && data.longTerm,
      }
    ],
    experiments: [
      {
        path: 'activeExperiments',
        type: 'required',
        validator: (data) => Array.isArray(data),
      },
      {
        path: 'results',
        type: 'required',
        validator: (data) => data && Object.keys(data).length > 0,
      },
      {
        path: 'configurations',
        type: 'required',
        validator: (data) => data && Object.keys(data).length > 0,
      }
    ],
    visualization: [
      {
        path: 'chartData',
        type: 'required',
        validator: (data) => data && Object.keys(data).length > 0,
      },
      {
        path: 'insights',
        type: 'required',
        validator: (data) => Array.isArray(data) && data.length > 0,
      }
    ],
    machineLeaning: [
      {
        path: 'models',
        type: 'required',
        validator: (data) => Array.isArray(data) && data.length > 0,
      },
      {
        path: 'trainingData',
        type: 'required',
        validator: (data) => data && data.features && data.labels,
      },
      {
        path: 'evaluationMetrics',
        type: 'required',
        validator: (data) => data && data.accuracy && data.precision && data.recall,
      }
    ]
  };

  private defaultContent: { [key: string]: any } = {
    livestock: {
      species: ['Cattle', 'Sheep', 'Goats', 'Pigs', 'Poultry'],
      breeds: {
        Cattle: ['Angus', 'Hereford', 'Holstein', 'Jersey'],
        Sheep: ['Merino', 'Suffolk', 'Dorper'],
        Goats: ['Boer', 'Nubian', 'Alpine'],
        Pigs: ['Duroc', 'Yorkshire', 'Berkshire'],
        Poultry: ['Leghorn', 'Rhode Island Red', 'Plymouth Rock']
      },
      healthMetrics: {
        temperature: { min: 37.5, max: 39.5, unit: '°C' },
        weight: { unit: 'kg' },
        activity: { levels: ['Low', 'Normal', 'High'] }
      },
      feedTypes: {
        Cattle: ['Grass', 'Hay', 'Grain', 'Silage'],
        Sheep: ['Pasture', 'Hay', 'Grain'],
        Goats: ['Browse', 'Hay', 'Grain'],
        Pigs: ['Commercial Feed', 'Grain', 'Vegetables'],
        Poultry: ['Layer Feed', 'Broiler Feed', 'Grain']
      }
    },
    analytics: {
      metrics: {
        growth: {
          daily: { unit: 'kg/day', threshold: 0.5 },
          weekly: { unit: 'kg/week', threshold: 3.5 },
          monthly: { unit: 'kg/month', threshold: 15 }
        },
        health: {
          temperature: { unit: '°C', normal: { min: 37.5, max: 39.5 } },
          activity: { unit: 'steps/day', threshold: 5000 },
          feeding: { unit: 'kg/day' }
        },
        reproduction: {
          cycles: { unit: 'days' },
          success_rate: { unit: '%', threshold: 85 }
        }
      },
      insights: {
        categories: ['Health', 'Growth', 'Nutrition', 'Reproduction'],
        priorities: ['Critical', 'Warning', 'Info'],
        actions: ['Monitor', 'Intervene', 'Optimize']
      }
    },
    experiments: {
      types: ['A/B Test', 'Controlled Study', 'Longitudinal Study'],
      metrics: ['Growth Rate', 'Feed Efficiency', 'Health Score'],
      durations: ['1 Week', '1 Month', '3 Months', '6 Months'],
      controls: ['Feed Type', 'Feed Amount', 'Environment', 'Activity']
    },
    visualization: {
      chartTypes: {
        timeSeries: {
          options: ['Line', 'Area', 'Bar'],
          metrics: ['Growth', 'Temperature', 'Activity']
        },
        distribution: {
          options: ['Histogram', 'Box Plot', 'Violin Plot'],
          metrics: ['Weight', 'Age', 'Feed Intake']
        },
        comparison: {
          options: ['Bar', 'Radar', 'Scatter'],
          metrics: ['Breed Performance', 'Feed Efficiency', 'Health Scores']
        }
      },
      colors: {
        primary: ['#1f77b4', '#ff7f0e', '#2ca02c'],
        secondary: ['#d62728', '#9467bd', '#8c564b'],
        highlight: '#e377c2'
      }
    }
  };

  async validateSection(section: string): Promise<ValidationResult> {
    const requirements = this.dataRequirements[section];
    if (!requirements) {
      return {
        isValid: false,
        missingData: [`No requirements defined for section: ${section}`],
        recommendations: ['Define data requirements for this section'],
        criticalIssues: ['Missing section configuration']
      };
    }

    const missingData: string[] = [];
    const recommendations: string[] = [];
    const criticalIssues: string[] = [];

    for (const requirement of requirements) {
      try {
        const data = await AsyncStorage.getItem(`@FarmFit:${section}:${requirement.path}`);
        const parsedData = data ? JSON.parse(data) : null;

        if (requirement.type === 'required' && (!parsedData || (requirement.validator && !requirement.validator(parsedData)))) {
          missingData.push(requirement.path);
          
          if (requirement.defaultValue) {
            recommendations.push(`Initialize ${requirement.path} with default data`);
            await this.initializeDefaultData(section, requirement.path);
          } else {
            criticalIssues.push(`Missing required data: ${requirement.path}`);
          }
        }

        // Check dependencies
        if (requirement.dependencies) {
          for (const dep of requirement.dependencies) {
            const depData = await AsyncStorage.getItem(`@FarmFit:${section}:${dep}`);
            if (!depData) {
              criticalIssues.push(`Missing dependency: ${dep} for ${requirement.path}`);
            }
          }
        }
      } catch (error) {
        criticalIssues.push(`Error validating ${requirement.path}: ${error.message}`);
      }
    }

    return {
      isValid: missingData.length === 0 && criticalIssues.length === 0,
      missingData,
      recommendations,
      criticalIssues
    };
  }

  async initializeDefaultData(section: string, path: string): Promise<void> {
    const defaultData = this.defaultContent[section]?.[path];
    if (defaultData) {
      await AsyncStorage.setItem(
        `@FarmFit:${section}:${path}`,
        JSON.stringify(defaultData)
      );
    }
  }

  async validateAllSections(): Promise<{ [key: string]: ValidationResult }> {
    const results: { [key: string]: ValidationResult } = {};
    
    for (const section of Object.keys(this.dataRequirements)) {
      results[section] = await this.validateSection(section);
    }

    return results;
  }

  async ensureDataCompleteness(): Promise<boolean> {
    const validationResults = await this.validateAllSections();
    let hasIssues = false;

    for (const [section, result] of Object.entries(validationResults)) {
      if (!result.isValid) {
        hasIssues = true;
        console.error(`Validation issues in ${section}:`, result);

        // Handle critical issues
        if (result.criticalIssues.length > 0) {
          Alert.alert(
            `Critical Issues in ${section}`,
            result.criticalIssues.join('\n'),
            [{ text: 'OK' }]
          );
        }

        // Initialize missing data with defaults where possible
        for (const missingItem of result.missingData) {
          await this.initializeDefaultData(section, missingItem);
        }
      }
    }

    return !hasIssues;
  }

  async getContentStatus(): Promise<{
    complete: string[];
    incomplete: string[];
    recommendations: string[];
  }> {
    const validationResults = await this.validateAllSections();
    const status = {
      complete: [],
      incomplete: [],
      recommendations: []
    };

    for (const [section, result] of Object.entries(validationResults)) {
      if (result.isValid) {
        status.complete.push(section);
      } else {
        status.incomplete.push(section);
        status.recommendations.push(...result.recommendations);
      }
    }

    return status;
  }
}

export default new DataValidationService();
