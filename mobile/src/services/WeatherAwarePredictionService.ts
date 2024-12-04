import axios from 'axios';
import { addDays, format, isSameDay } from 'date-fns';
import { store } from '../store';
import { TreatmentPriority } from '../types/therapeutic';

interface WeatherCondition {
  temperature: number;
  humidity: number;
  precipitation: number;
  windSpeed: number;
  condition: string;
}

interface WeatherImpact {
  category: string;
  impact: 'high' | 'medium' | 'low';
  recommendation: string;
}

class WeatherAwarePredictionService {
  private readonly WEATHER_API_KEY = process.env.WEATHER_API_KEY;
  private readonly WEATHER_API_BASE = 'https://api.weatherapi.com/v1';
  private weatherCache: Map<string, WeatherCondition> = new Map();

  private readonly WEATHER_IMPACT_RULES: {
    [key: string]: (weather: WeatherCondition) => WeatherImpact[];
  } = {
    'medication_reminder': (weather) => {
      const impacts: WeatherImpact[] = [];

      // Temperature impacts
      if (weather.temperature > 30) {
        impacts.push({
          category: 'medication_reminder',
          impact: 'high',
          recommendation: 'Consider adjusting medication timing to cooler hours',
        });
      }

      // Humidity impacts
      if (weather.humidity > 80) {
        impacts.push({
          category: 'medication_reminder',
          impact: 'medium',
          recommendation: 'Monitor for heat stress and adjust medication if needed',
        });
      }

      return impacts;
    },
    'vaccination': (weather) => {
      const impacts: WeatherImpact[] = [];

      // Temperature impacts on vaccine storage
      if (weather.temperature > 25) {
        impacts.push({
          category: 'vaccination',
          impact: 'high',
          recommendation: 'Ensure proper vaccine storage temperature',
        });
      }

      // Weather condition impacts
      if (weather.condition.includes('rain')) {
        impacts.push({
          category: 'vaccination',
          impact: 'medium',
          recommendation: 'Consider rescheduling if outdoor vaccination required',
        });
      }

      return impacts;
    },
    'dietary_update': (weather) => {
      const impacts: WeatherImpact[] = [];

      // Temperature impacts on feeding
      if (weather.temperature > 28) {
        impacts.push({
          category: 'dietary_update',
          impact: 'high',
          recommendation: 'Consider adjusting feeding times to cooler periods',
        });
      }

      // Wind impacts on feed storage
      if (weather.windSpeed > 30) {
        impacts.push({
          category: 'dietary_update',
          impact: 'medium',
          recommendation: 'Secure feed storage and adjust feeding locations',
        });
      }

      return impacts;
    },
  };

  async getWeatherForecast(latitude: number, longitude: number, days: number = 7): Promise<Map<string, WeatherCondition>> {
    try {
      const response = await axios.get(
        `${this.WEATHER_API_BASE}/forecast.json?key=${this.WEATHER_API_KEY}&q=${latitude},${longitude}&days=${days}`
      );

      const forecast = new Map<string, WeatherCondition>();
      
      response.data.forecast.forecastday.forEach((day: any) => {
        forecast.set(format(new Date(day.date), 'yyyy-MM-dd'), {
          temperature: day.day.avgtemp_c,
          humidity: day.day.avghumidity,
          precipitation: day.day.totalprecip_mm,
          windSpeed: day.day.maxwind_kph,
          condition: day.day.condition.text.toLowerCase(),
        });
      });

      this.weatherCache = forecast;
      return forecast;
    } catch (error) {
      console.error('Error fetching weather forecast:', error);
      return new Map();
    }
  }

  async getWeatherAwarePredictions(
    baseNotifications: any[],
    latitude: number,
    longitude: number
  ): Promise<any[]> {
    const weatherForecast = await this.getWeatherForecast(latitude, longitude);
    
    return baseNotifications.map(notification => {
      const notificationDate = format(new Date(notification.predictedDate), 'yyyy-MM-dd');
      const weather = weatherForecast.get(notificationDate);

      if (!weather) return notification;

      const impacts = this.WEATHER_IMPACT_RULES[notification.category]?.(weather) || [];
      const highestImpact = impacts.reduce((highest, current) => 
        this.getImpactScore(current.impact) > this.getImpactScore(highest.impact) ? current : highest
      , { impact: 'low' as const });

      return {
        ...notification,
        weatherImpacts: impacts,
        adjustedConfidence: this.adjustConfidence(notification.confidence, highestImpact.impact),
        weatherRecommendations: impacts.map(impact => impact.recommendation),
        weatherCondition: weather,
      };
    });
  }

  private getImpactScore(impact: 'high' | 'medium' | 'low'): number {
    switch (impact) {
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
    }
  }

  private adjustConfidence(baseConfidence: number, impact: 'high' | 'medium' | 'low'): number {
    const adjustments = {
      high: -20,
      medium: -10,
      low: 0,
    };

    return Math.max(0, Math.min(100, baseConfidence + adjustments[impact]));
  }

  suggestAlternativeTime(
    originalTime: string,
    weather: WeatherCondition,
    category: string
  ): string | null {
    // Time blocks
    const timeBlocks = [
      'Early Morning (04:00-07:00)',
      'Morning (07:00-10:00)',
      'Late Morning (10:00-12:00)',
      'Early Afternoon (12:00-14:00)',
      'Afternoon (14:00-16:00)',
      'Late Afternoon (16:00-18:00)',
      'Evening (18:00-20:00)',
      'Night (20:00-04:00)',
    ];

    // Category-specific time preferences
    const categoryPreferences: { [key: string]: string[] } = {
      medication_reminder: weather.temperature > 30 
        ? ['Early Morning (04:00-07:00)', 'Evening (18:00-20:00)']
        : ['Morning (07:00-10:00)', 'Afternoon (14:00-16:00)'],
      
      vaccination: weather.temperature > 25
        ? ['Early Morning (04:00-07:00)', 'Late Afternoon (16:00-18:00)']
        : ['Morning (07:00-10:00)', 'Afternoon (14:00-16:00)'],
      
      dietary_update: weather.temperature > 28
        ? ['Early Morning (04:00-07:00)', 'Evening (18:00-20:00)']
        : ['Morning (07:00-10:00)', 'Late Afternoon (16:00-18:00)'],
    };

    const preferences = categoryPreferences[category];
    if (!preferences) return null;

    // Find the best alternative time that's different from the original
    return preferences.find(time => time !== originalTime) || null;
  }

  getWeatherBasedPriority(
    baseCategory: string,
    weather: WeatherCondition
  ): TreatmentPriority {
    // Define weather thresholds for priority elevation
    const severeConditions = [
      weather.temperature > 35,
      weather.temperature < 5,
      weather.humidity > 85,
      weather.windSpeed > 40,
      weather.precipitation > 50,
    ];

    const moderateConditions = [
      weather.temperature > 30,
      weather.temperature < 10,
      weather.humidity > 75,
      weather.windSpeed > 30,
      weather.precipitation > 30,
    ];

    // Count how many severe and moderate conditions are met
    const severeCount = severeConditions.filter(Boolean).length;
    const moderateCount = moderateConditions.filter(Boolean).length;

    // Determine if priority should be elevated
    if (severeCount >= 2) {
      return TreatmentPriority.HIGH;
    } else if (moderateCount >= 2) {
      return TreatmentPriority.MEDIUM;
    }

    // Return original priority if no weather-based elevation needed
    return this.getBasePriority(baseCategory);
  }

  private getBasePriority(category: string): TreatmentPriority {
    const priorityMap: { [key: string]: TreatmentPriority } = {
      medication_reminder: TreatmentPriority.HIGH,
      vaccination: TreatmentPriority.MEDIUM,
      dietary_update: TreatmentPriority.LOW,
    };

    return priorityMap[category] || TreatmentPriority.MEDIUM;
  }
}

export default new WeatherAwarePredictionService();
