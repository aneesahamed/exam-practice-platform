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

output "site_url" {
  description = "Live URL — custom domain if configured, otherwise CloudFront URL"
  value       = var.domain_name != "" ? "https://${var.domain_name}" : "https://${aws_cloudfront_distribution.frontend.domain_name}"
}

output "route53_name_servers" {
  description = "NS records to add in GoDaddy for subdomain delegation. Only populated when domain_name is set."
  value       = var.domain_name != "" ? aws_route53_zone.frontend[0].name_servers : []
}

output "route53_zone_id" {
  description = "Route 53 hosted zone ID"
  value       = var.domain_name != "" ? aws_route53_zone.frontend[0].zone_id : null
}
