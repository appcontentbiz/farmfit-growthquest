import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigManager } from '../config/config-manager';

const execAsync = promisify(exec);

interface InfrastructureCheck {
  name: string;
  check: () => Promise<boolean>;
  fix?: () => Promise<void>;
}

class InfrastructureInitializer {
  private config: ConfigManager;

  constructor() {
    this.config = ConfigManager.getInstance({
      environment: process.env.NODE_ENV || 'development',
      region: process.env.AWS_REGION || 'us-east-1'
    });
  }

  private async runCommand(command: string): Promise<string> {
    try {
      const { stdout } = await execAsync(command);
      return stdout.trim();
    } catch (error) {
      console.error(`Command failed: ${command}`, error);
      throw error;
    }
  }

  private async checkTerraform(): Promise<boolean> {
    try {
      await this.runCommand('terraform version');
      return true;
    } catch {
      return false;
    }
  }

  private async checkAWSCredentials(): Promise<boolean> {
    try {
      await this.runCommand('aws sts get-caller-identity');
      return true;
    } catch {
      return false;
    }
  }

  private async checkKubernetes(): Promise<boolean> {
    try {
      await this.runCommand('kubectl version --client');
      return true;
    } catch {
      return false;
    }
  }

  private async initializeTerraform(): Promise<void> {
    console.log('Initializing Terraform...');
    
    const terraformDir = path.join(__dirname, '../infrastructure/terraform');
    
    // Initialize Terraform
    await this.runCommand(`cd ${terraformDir} && terraform init`);
    
    // Validate Terraform configuration
    await this.runCommand(`cd ${terraformDir} && terraform validate`);
    
    // Plan Terraform changes
    const planOutput = await this.runCommand(`cd ${terraformDir} && terraform plan -out=tfplan`);
    console.log('Terraform plan:', planOutput);
  }

  private async configureKubernetes(): Promise<void> {
    console.log('Configuring Kubernetes...');
    
    // Update kubeconfig for EKS
    await this.runCommand(`aws eks update-kubeconfig --name farmfit-${this.config.get('environment')}`);
    
    // Apply Kubernetes configurations
    const k8sDir = path.join(__dirname, '../k8s/production');
    await this.runCommand(`kubectl apply -f ${k8sDir}`);
  }

  private async setupMonitoring(): Promise<void> {
    console.log('Setting up monitoring...');
    
    // Deploy Prometheus
    await this.runCommand('kubectl apply -f ../monitoring/prometheus.yml');
    
    // Deploy Grafana
    await this.runCommand('kubectl apply -f ../monitoring/grafana.yml');
    
    // Wait for pods to be ready
    await this.runCommand('kubectl wait --for=condition=ready pod -l app=prometheus');
    await this.runCommand('kubectl wait --for=condition=ready pod -l app=grafana');
  }

  private async validateInfrastructure(): Promise<void> {
    const checks: InfrastructureCheck[] = [
      {
        name: 'Terraform Installation',
        check: () => this.checkTerraform(),
        fix: async () => {
          throw new Error('Please install Terraform: https://www.terraform.io/downloads.html');
        }
      },
      {
        name: 'AWS Credentials',
        check: () => this.checkAWSCredentials(),
        fix: async () => {
          throw new Error('Please configure AWS credentials: aws configure');
        }
      },
      {
        name: 'Kubernetes CLI',
        check: () => this.checkKubernetes(),
        fix: async () => {
          throw new Error('Please install kubectl: https://kubernetes.io/docs/tasks/tools/');
        }
      }
    ];

    for (const check of checks) {
      console.log(`Checking ${check.name}...`);
      const passed = await check.check();
      
      if (!passed) {
        console.error(`❌ ${check.name} check failed`);
        if (check.fix) {
          await check.fix();
        }
      } else {
        console.log(`✅ ${check.name} check passed`);
      }
    }
  }

  public async initialize(): Promise<void> {
    try {
      console.log('Starting infrastructure initialization...');
      
      // Validate prerequisites
      await this.validateInfrastructure();
      
      // Initialize Terraform
      await this.initializeTerraform();
      
      // Configure Kubernetes
      await this.configureKubernetes();
      
      // Setup monitoring
      await this.setupMonitoring();
      
      console.log('Infrastructure initialization completed successfully!');
      
    } catch (error) {
      console.error('Infrastructure initialization failed:', error);
      throw error;
    }
  }
}

// Run initialization if executed directly
if (require.main === module) {
  const initializer = new InfrastructureInitializer();
  initializer.initialize().catch(error => {
    console.error('Failed to initialize infrastructure:', error);
    process.exit(1);
  });
}
