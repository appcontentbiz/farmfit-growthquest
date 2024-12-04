terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
  }
  
  backend "s3" {
    bucket = "farmfit-terraform-state"
    key    = "prod/terraform.tfstate"
    region = "us-east-1"
    encrypt = true
    dynamodb_table = "farmfit-terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region
}

# EKS Cluster
module "eks" {
  source = "./modules/eks"

  cluster_name    = "farmfit-${var.environment}"
  cluster_version = "1.27"
  vpc_id          = module.vpc.vpc_id
  subnet_ids      = module.vpc.private_subnets

  node_groups = {
    general = {
      desired_capacity = 3
      max_capacity     = 10
      min_capacity    = 3
      instance_types  = ["t3.large"]
    }
  }

  tags = {
    Environment = var.environment
    Project     = "FarmFit"
  }
}

# VPC Configuration
module "vpc" {
  source = "./modules/vpc"

  name = "farmfit-${var.environment}"
  cidr = "10.0.0.0/16"

  azs             = ["us-east-1a", "us-east-1b", "us-east-1c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]

  enable_nat_gateway = true
  single_nat_gateway = false

  tags = {
    Environment = var.environment
    Project     = "FarmFit"
  }
}

# RDS Database
module "rds" {
  source = "./modules/rds"

  identifier = "farmfit-${var.environment}"
  engine     = "postgres"
  engine_version = "14.7"
  instance_class = "db.t3.large"
  allocated_storage = 100

  db_name  = "farmfit"
  username = var.db_username
  password = var.db_password

  vpc_security_group_ids = [aws_security_group.rds.id]
  subnet_ids             = module.vpc.private_subnets

  backup_retention_period = 7
  multi_az               = true

  tags = {
    Environment = var.environment
    Project     = "FarmFit"
  }
}

# ElastiCache Redis
module "elasticache" {
  source = "./modules/elasticache"

  cluster_id           = "farmfit-${var.environment}"
  engine              = "redis"
  engine_version      = "7.0"
  node_type           = "cache.t3.medium"
  num_cache_nodes     = 2
  parameter_group_family = "redis7"

  subnet_group_name    = aws_elasticache_subnet_group.default.name
  security_group_ids   = [aws_security_group.redis.id]

  automatic_failover_enabled = true
  multi_az_enabled          = true

  tags = {
    Environment = var.environment
    Project     = "FarmFit"
  }
}

# S3 Buckets
module "s3" {
  source = "./modules/s3"

  buckets = {
    assets = {
      name = "farmfit-assets-${var.environment}"
      versioning = true
      encryption = true
    }
    backups = {
      name = "farmfit-backups-${var.environment}"
      versioning = true
      encryption = true
    }
  }

  tags = {
    Environment = var.environment
    Project     = "FarmFit"
  }
}

# CloudFront Distribution
module "cloudfront" {
  source = "./modules/cloudfront"

  domain_name = "farmfit.com"
  aliases     = ["www.farmfit.com", "api.farmfit.com"]
  
  origins = {
    assets = {
      domain_name = module.s3.bucket_regional_domain_names["assets"]
      origin_id   = "S3-assets"
    }
    api = {
      domain_name = module.eks.cluster_endpoint
      origin_id   = "EKS-api"
    }
  }

  certificate_arn = module.acm.certificate_arn

  tags = {
    Environment = var.environment
    Project     = "FarmFit"
  }
}

# Route53 DNS
module "route53" {
  source = "./modules/route53"

  domain_name = "farmfit.com"
  
  records = {
    www = {
      type = "A"
      alias = {
        name    = module.cloudfront.domain_name
        zone_id = module.cloudfront.hosted_zone_id
      }
    }
    api = {
      type = "A"
      alias = {
        name    = module.cloudfront.domain_name
        zone_id = module.cloudfront.hosted_zone_id
      }
    }
  }

  tags = {
    Environment = var.environment
    Project     = "FarmFit"
  }
}

# Security Groups
resource "aws_security_group" "rds" {
  name        = "farmfit-rds-${var.environment}"
  description = "Security group for RDS"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [module.eks.cluster_security_group_id]
  }
}

resource "aws_security_group" "redis" {
  name        = "farmfit-redis-${var.environment}"
  description = "Security group for Redis"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [module.eks.cluster_security_group_id]
  }
}
