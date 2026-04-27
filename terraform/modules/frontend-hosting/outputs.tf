output "frontend_bucket_name" {
  description = "S3 bucket name for the React SPA"
  value       = aws_s3_bucket.frontend.bucket
}

output "frontend_bucket_arn" {
  description = "S3 bucket ARN"
  value       = aws_s3_bucket.frontend.arn
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.frontend.id
}

output "cloudfront_domain_name" {
  description = "CloudFront domain name"
  value       = aws_cloudfront_distribution.frontend.domain_name
}

output "site_url" {
  description = "CloudFront URL (custom domain will be in Layer 02 after Phase 4B)"
  value       = "https://${aws_cloudfront_distribution.frontend.domain_name}"
}

output "route53_zone_id" {
  description = "Placeholder — Route 53 zone managed by Layer 01"
  value       = null
}
