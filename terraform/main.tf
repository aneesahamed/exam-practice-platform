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

module "observability" {
  source = "./modules/observability"

  project_name = var.project_name
  environment  = var.environment
  alarm_email  = var.alarm_email

  lambda_function_names = [
    "exam-practice-platform-${var.environment}-health",
    "exam-practice-platform-${var.environment}-get-questions",
    "exam-practice-platform-${var.environment}-record-progress",
    "exam-practice-platform-${var.environment}-get-progress-stats",
    "exam-practice-platform-${var.environment}-get-incorrect",
    "exam-practice-platform-${var.environment}-put-flag",
    "exam-practice-platform-${var.environment}-delete-flag",
    "exam-practice-platform-${var.environment}-list-flags",
    "exam-practice-platform-${var.environment}-get-flags-summary",
  ]

  dynamodb_table_names = [
    module.storage.progress_table_name,
    module.storage.flags_table_name,
  ]
}

module "waf" {
  source = "./modules/waf"

  project_name = var.project_name
  environment  = var.environment
  enabled      = var.waf_enabled

  providers = {
    aws           = aws
    aws.us_east_1 = aws.us_east_1
  }
}
