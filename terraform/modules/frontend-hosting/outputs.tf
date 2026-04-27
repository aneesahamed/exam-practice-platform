output "frontend_bucket_name" {
  description = "S3 bucket name — managed by Layer 02"
  value       = data.aws_s3_bucket.frontend.bucket
}

output "frontend_bucket_arn" {
  description = "S3 bucket ARN — managed by Layer 02"
  value       = data.aws_s3_bucket.frontend.arn
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID — managed by Layer 02"
  value       = data.aws_cloudfront_distribution.frontend.id
}

output "cloudfront_domain_name" {
  description = "CloudFront domain name — managed by Layer 02"
  value       = data.aws_cloudfront_distribution.frontend.domain_name
}

output "site_url" {
  description = "Live URL — managed by Layer 02"
  value       = var.domain_name != "" ? "https://${var.domain_name}" : "https://${data.aws_cloudfront_distribution.frontend.domain_name}"
}

output "route53_zone_id" {
  description = "Route 53 zone ID — managed by Layer 01"
  value       = var.domain_name != "" ? data.aws_route53_zone.frontend[0].zone_id : null
}
