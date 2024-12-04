import { format } from 'date-fns';
import OfflineStorageService from './OfflineStorageService';
import OptimizationService from './OptimizationService';

interface NotificationTemplate {
  id: string;
  name: string;
  category: string;
  template: string;
  variables: TemplateVariable[];
  style: NotificationStyle;
  priority: Priority;
  performance: TemplatePerformance;
  conditions?: NotificationCondition[];
  localization?: LocalizationConfig;
}

interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'array';
  required: boolean;
  defaultValue?: any;
  validation?: ValidationRule[];
}

interface NotificationStyle {
  theme: 'default' | 'urgent' | 'success' | 'warning' | 'info';
  icon?: string;
  color?: string;
  sound?: string;
  vibration?: boolean;
  actionButtons?: ActionButton[];
}

interface ActionButton {
  id: string;
  label: string;
  action: string;
  style?: 'primary' | 'secondary' | 'danger';
}

interface TemplatePerformance {
  openRate: number;
  responseRate: number;
  actionRate: number;
  dismissRate: number;
  averageResponseTime: number;
  lastUpdated: Date;
}

interface NotificationCondition {
  type: 'time' | 'weather' | 'location' | 'userPreference' | 'systemStatus';
  operator: 'equals' | 'notEquals' | 'greater' | 'less' | 'contains' | 'notContains';
  value: any;
}

interface LocalizationConfig {
  defaultLanguage: string;
  translations: Record<string, Record<string, string>>;
}

interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'regex' | 'range';
  value?: any;
  message: string;
}

enum Priority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

class NotificationTemplateService {
  private readonly PERFORMANCE_UPDATE_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
  private readonly MIN_TEMPLATE_PERFORMANCE_THRESHOLD = 0.6;

  async createTemplate(template: Partial<NotificationTemplate>): Promise<NotificationTemplate> {
    try {
      const newTemplate: NotificationTemplate = {
        id: `template_${Date.now()}`,
        name: template.name || 'Unnamed Template',
        category: template.category || 'general',
        template: template.template || '',
        variables: template.variables || [],
        style: template.style || {
          theme: 'default',
          vibration: false,
          actionButtons: [],
        },
        priority: template.priority || Priority.MEDIUM,
        performance: {
          openRate: 0,
          responseRate: 0,
          actionRate: 0,
          dismissRate: 0,
          averageResponseTime: 0,
          lastUpdated: new Date(),
        },
        conditions: template.conditions,
        localization: template.localization,
      };

      await this.validateTemplate(newTemplate);
      await this.saveTemplate(newTemplate);

      return newTemplate;
    } catch (error) {
      console.error('Error creating template:', error);
      throw error;
    }
  }

  async generateNotification(templateId: string, data: Record<string, any>): Promise<string> {
    try {
      const template = await this.getTemplate(templateId);
      if (!template) throw new Error('Template not found');

      await this.validateTemplateData(template, data);
      let content = template.template;

      // Replace variables
      for (const variable of template.variables) {
        const value = data[variable.name] ?? variable.defaultValue;
        const formattedValue = this.formatValue(value, variable.type);
        content = content.replace(new RegExp(`{{${variable.name}}}`, 'g'), formattedValue);
      }

      // Apply localization if needed
      if (template.localization && data.language) {
        content = this.localizeContent(content, template.localization, data.language);
      }

      return content;
    } catch (error) {
      console.error('Error generating notification:', error);
      throw error;
    }
  }

  async updatePerformance(templateId: string, metrics: Partial<TemplatePerformance>): Promise<void> {
    try {
      const template = await this.getTemplate(templateId);
      if (!template) throw new Error('Template not found');

      const now = new Date();
      const timeSinceLastUpdate = now.getTime() - template.performance.lastUpdated.getTime();

      if (timeSinceLastUpdate >= this.PERFORMANCE_UPDATE_INTERVAL) {
        template.performance = {
          ...template.performance,
          ...metrics,
          lastUpdated: now,
        };

        await this.saveTemplate(template);
        await this.checkPerformance(template);
      }
    } catch (error) {
      console.error('Error updating template performance:', error);
    }
  }

  async getTemplatesByCategory(category: string): Promise<NotificationTemplate[]> {
    try {
      const templates = await this.getAllTemplates();
      return templates.filter(template => template.category === category);
    } catch (error) {
      console.error('Error getting templates by category:', error);
      return [];
    }
  }

  async optimizeTemplate(templateId: string): Promise<NotificationTemplate> {
    try {
      const template = await this.getTemplate(templateId);
      if (!template) throw new Error('Template not found');

      const optimizations = await OptimizationService.generateOptimizations();
      const relevantOptimizations = optimizations.filter(opt => 
        opt.category === template.category && opt.type === 'content'
      );

      if (relevantOptimizations.length > 0) {
        const bestOptimization = relevantOptimizations[0];
        template.template = this.applyOptimization(template.template, bestOptimization);
        await this.saveTemplate(template);
      }

      return template;
    } catch (error) {
      console.error('Error optimizing template:', error);
      throw error;
    }
  }

  private async validateTemplate(template: NotificationTemplate): Promise<void> {
    if (!template.template) {
      throw new Error('Template content is required');
    }

    if (!template.category) {
      throw new Error('Template category is required');
    }

    // Validate variables
    const templateVars = this.extractVariables(template.template);
    const definedVars = new Set(template.variables.map(v => v.name));

    for (const variable of templateVars) {
      if (!definedVars.has(variable)) {
        throw new Error(`Variable ${variable} used in template but not defined`);
      }
    }

    // Validate localization
    if (template.localization) {
      const { defaultLanguage, translations } = template.localization;
      if (!translations[defaultLanguage]) {
        throw new Error(`Missing translations for default language: ${defaultLanguage}`);
      }
    }
  }

  private async validateTemplateData(template: NotificationTemplate, data: Record<string, any>): Promise<void> {
    for (const variable of template.variables) {
      if (variable.required && !(variable.name in data)) {
        throw new Error(`Required variable ${variable.name} not provided`);
      }

      if (variable.validation && (variable.name in data)) {
        for (const rule of variable.validation) {
          const value = data[variable.name];
          
          switch (rule.type) {
            case 'required':
              if (!value) throw new Error(rule.message);
              break;
            case 'minLength':
              if (String(value).length < rule.value) throw new Error(rule.message);
              break;
            case 'maxLength':
              if (String(value).length > rule.value) throw new Error(rule.message);
              break;
            case 'regex':
              if (!new RegExp(rule.value).test(String(value))) throw new Error(rule.message);
              break;
            case 'range':
              if (typeof value === 'number' && (value < rule.value.min || value > rule.value.max)) {
                throw new Error(rule.message);
              }
              break;
          }
        }
      }
    }
  }

  private formatValue(value: any, type: string): string {
    if (value === undefined || value === null) return '';

    switch (type) {
      case 'date':
        return format(new Date(value), 'PPP');
      case 'array':
        return Array.isArray(value) ? value.join(', ') : String(value);
      default:
        return String(value);
    }
  }

  private localizeContent(content: string, config: LocalizationConfig, language: string): string {
    const translations = config.translations[language] || config.translations[config.defaultLanguage];
    if (!translations) return content;

    return Object.entries(translations).reduce(
      (localizedContent, [key, value]) => 
        localizedContent.replace(new RegExp(`{{${key}}}`, 'g'), value),
      content
    );
  }

  private extractVariables(template: string): string[] {
    const matches = template.match(/{{([^}]+)}}/g) || [];
    return matches.map(match => match.slice(2, -2));
  }

  private async checkPerformance(template: NotificationTemplate): Promise<void> {
    const performance = template.performance;
    const overallPerformance = (
      performance.openRate +
      performance.responseRate +
      performance.actionRate
    ) / 3;

    if (overallPerformance < this.MIN_TEMPLATE_PERFORMANCE_THRESHOLD) {
      await this.optimizeTemplate(template.id);
    }
  }

  private applyOptimization(template: string, optimization: any): string {
    // Apply optimization suggestions to the template
    // This is a simplified implementation
    let optimizedTemplate = template;

    if (optimization.suggestion.includes('clarity')) {
      optimizedTemplate = this.improveClarity(optimizedTemplate);
    }

    if (optimization.suggestion.includes('action')) {
      optimizedTemplate = this.improveCallToAction(optimizedTemplate);
    }

    return optimizedTemplate;
  }

  private improveClarity(template: string): string {
    // Implement clarity improvements
    return template
      .replace(/\b(please|kindly)\b/gi, '')
      .replace(/\b(utilize|implement)\b/gi, 'use')
      .replace(/\b(commence)\b/gi, 'start')
      .trim();
  }

  private improveCallToAction(template: string): string {
    // Implement call-to-action improvements
    if (!template.includes('!')) {
      template = template.replace(/[.:]$/, '!');
    }
    
    return template;
  }

  private async getTemplate(templateId: string): Promise<NotificationTemplate | null> {
    try {
      const templates = await this.getAllTemplates();
      return templates.find(template => template.id === templateId) || null;
    } catch (error) {
      console.error('Error getting template:', error);
      return null;
    }
  }

  private async getAllTemplates(): Promise<NotificationTemplate[]> {
    try {
      return await OfflineStorageService.getHistoricalData();
    } catch (error) {
      console.error('Error getting all templates:', error);
      return [];
    }
  }

  private async saveTemplate(template: NotificationTemplate): Promise<void> {
    try {
      const templates = await this.getAllTemplates();
      const index = templates.findIndex(t => t.id === template.id);

      if (index >= 0) {
        templates[index] = template;
      } else {
        templates.push(template);
      }

      await OfflineStorageService.saveHistoricalData(templates);
    } catch (error) {
      console.error('Error saving template:', error);
      throw error;
    }
  }
}

export default new NotificationTemplateService();
