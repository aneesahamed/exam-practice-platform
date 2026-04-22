/**
 * Root Outputs
 *
 * These values are used by CI/CD pipelines to configure
 * deployments without hardcoding resource names.
 *
 * In GitHub Actions, outputs are read via:
 *   terraform output -raw <output_name>
 */

output "questions_bucket_name" {
  description = "S3 bucket name for the questions dataset"
  value       = module.storage.questions_bucket_name
}

output "frontend_bucket_name" {
  description = "S3 bucket name for the React SPA"
  value       = module.frontend_hosting.frontend_bucket_name
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID — used to invalidate cache after frontend deploy"
  value       = module.frontend_hosting.cloudfront_distribution_id
}

output "cloudfront_domain_name" {
  description = "CloudFront URL for the frontend (use this if no custom domain)"
  value       = module.frontend_hosting.cloudfront_domain_name
}

output "cognito_user_pool_id" {
  description = "Cognito User Pool ID — used in frontend .env and SAM template"
  value       = module.auth.user_pool_id
}

output "cognito_user_pool_client_id" {
  description = "Cognito App Client ID — used in frontend .env"
  value       = module.auth.user_pool_client_id
}

output "progress_table_name" {
  description = "DynamoDB table name for user progress"
  value       = module.storage.progress_table_name
}

output "flags_table_name" {
  description = "DynamoDB table name for user flags"
  value       = module.storage.flags_table_name
}
