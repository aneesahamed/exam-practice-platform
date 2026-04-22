/**
 * Root Module
 *
 * Composes all infrastructure modules for the exam practice platform.
 * Each module is independently reusable and versioned.
 *
 * Modules:
 *   - storage:          DynamoDB tables + S3 questions bucket
 *   - auth:             Cognito User Pool + App Client
 *   - frontend-hosting: S3 static site + CloudFront + ACM + Route 53
 */

module "storage" {
  source = "./modules/storage"

  project_name = var.project_name
  environment  = var.environment
}

module "auth" {
  source = "./modules/auth"

  project_name = var.project_name
  environment  = var.environment
}

module "frontend_hosting" {
  source = "./modules/frontend-hosting"

  project_name = var.project_name
  environment  = var.environment
  domain_name  = var.domain_name

  providers = {
    aws           = aws
    aws.us_east_1 = aws.us_east_1
  }
}
