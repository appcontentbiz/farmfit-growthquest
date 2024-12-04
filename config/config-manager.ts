import { SecretsManager } from '@aws-sdk/client-secrets-manager';
import { SSM } from '@aws-sdk/client-ssm';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

interface ConfigOptions {
  environment: string;
  region: string;
  configPath?: string;
}

export class ConfigManager {
  private static instance: ConfigManager;
  private config: Map<string, any> = new Map();
  private secretsManager: SecretsManager;
  private ssm: SSM;
  private environment: string;

  private constructor(options: ConfigOptions) {
    this.environment = options.environment;
    this.secretsManager = new SecretsManager({ region: options.region });
    this.ssm = new SSM({ region: options.region });
    
    // Load environment variables
    dotenv.config({ path: options.configPath });
    
    // Initialize configuration
    this.initializeConfig();
  }

  public static getInstance(options: ConfigOptions): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager(options);
    }
    return ConfigManager.instance;
  }

  private async initializeConfig(): Promise<void> {
    try {
      // Load base configuration
      await this.loadBaseConfig();
      
      // Load environment-specific configuration
      await this.loadEnvironmentConfig();
      
      // Load secrets
      await this.loadSecrets();
      
      // Validate configuration
      this.validateConfig();
      
      console.log(`Configuration loaded successfully for environment: ${this.environment}`);
    } catch (error) {
      console.error('Failed to initialize configuration:', error);
      throw error;
    }
  }

  private async loadBaseConfig(): Promise<void> {
    const baseConfigPath = path.join(__dirname, 'base.json');
    if (fs.existsSync(baseConfigPath)) {
      const baseConfig = JSON.parse(fs.readFileSync(baseConfigPath, 'utf8'));
      Object.entries(baseConfig).forEach(([key, value]) => {
        this.config.set(key, value);
      });
    }
  }

  private async loadEnvironmentConfig(): Promise<void> {
    const envConfigPath = path.join(__dirname, `${this.environment}.json`);
    if (fs.existsSync(envConfigPath)) {
      const envConfig = JSON.parse(fs.readFileSync(envConfigPath, 'utf8'));
      Object.entries(envConfig).forEach(([key, value]) => {
        this.config.set(key, value);
      });
    }
  }

  private async loadSecrets(): Promise<void> {
    try {
      // Load secrets from AWS Secrets Manager
      const secretName = `farmfit/${this.environment}/secrets`;
      const response = await this.secretsManager.getSecretValue({ SecretId: secretName });
      
      if (response.SecretString) {
        const secrets = JSON.parse(response.SecretString);
        Object.entries(secrets).forEach(([key, value]) => {
          this.config.set(key, value);
        });
      }

      // Load parameters from AWS Systems Manager Parameter Store
      const parameterPath = `/farmfit/${this.environment}/`;
      const parameters = await this.ssm.getParametersByPath({
        Path: parameterPath,
        Recursive: true,
        WithDecryption: true
      });

      parameters.Parameters?.forEach(parameter => {
        if (parameter.Name && parameter.Value) {
          const key = parameter.Name.replace(parameterPath, '');
          this.config.set(key, parameter.Value);
        }
      });
    } catch (error) {
      console.error('Error loading secrets:', error);
      throw error;
    }
  }

  private validateConfig(): void {
    const requiredKeys = [
      'DATABASE_URL',
      'REDIS_URL',
      'AWS_REGION',
      'JWT_SECRET',
      'API_KEY',
      'STORAGE_BUCKET'
    ];

    const missingKeys = requiredKeys.filter(key => !this.config.has(key));
    if (missingKeys.length > 0) {
      throw new Error(`Missing required configuration keys: ${missingKeys.join(', ')}`);
    }
  }

  public get<T>(key: string): T {
    if (!this.config.has(key)) {
      throw new Error(`Configuration key not found: ${key}`);
    }
    return this.config.get(key) as T;
  }

  public getAll(): Record<string, any> {
    return Object.fromEntries(this.config);
  }

  public async refresh(): Promise<void> {
    await this.initializeConfig();
  }

  public isDevelopment(): boolean {
    return this.environment === 'development';
  }

  public isProduction(): boolean {
    return this.environment === 'production';
  }

  public isStaging(): boolean {
    return this.environment === 'staging';
  }
}
