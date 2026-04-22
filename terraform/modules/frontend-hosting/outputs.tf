output "frontend_bucket_name" {
  description = "S3 bucket name for the React SPA"
  value       = aws_s3_bucket.frontend.bucket
}

output "frontend_bucket_arn" {
  description = "S3 bucket ARN"
  value       = aws_s3_bucket.frontend.arn
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID — used to invalidate cache after deploy"
  value       = aws_cloudfront_distribution.frontend.id
}

output "cloudfront_domain_name" {
  description = "CloudFront domain name (use this if no custom domain configured)"
  value       = aws_cloudfront_distribution.frontend.domain_name
}
