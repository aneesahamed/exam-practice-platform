/**
 * WAF Module
 *
 * AWS WAF Web ACL for CloudFront protection.
 *
 * COST NOTE: WAF costs $5/month per Web ACL regardless of traffic.
 * This module is disabled by default (enabled = false).
 * Enable in prod when real users are onboarded.
 *
 * Rules included when enabled:
 *   - AWSManagedRulesCommonRuleSet    : OWASP Top 10 (SQLi, XSS, etc.)
 *   - AWSManagedRulesKnownBadInputsRuleSet : Known malicious inputs
 *   - Rate limiting: 1000 requests per 5 minutes per IP
 *
 * Interview talking point:
 *   "WAF is defined in Terraform and disabled in dev to avoid the $5/month
 *    flat fee. In production it would be enabled with AWS managed rule groups
 *    covering OWASP Top 10 and rate limiting to prevent abuse."
 *
 * IMPORTANT: WAF for CloudFront must be in us-east-1.
 */

resource "aws_wafv2_web_acl" "main" {
  count = var.enabled ? 1 : 0

  provider    = aws.us_east_1
  name        = "${var.project_name}-${var.environment}-waf"
  description = "WAF for ${var.project_name} CloudFront distribution"
  scope       = "CLOUDFRONT"

  default_action {
    allow {}
  }

  # Rate limiting — 1000 requests per 5 minutes per IP
  rule {
    name     = "RateLimitRule"
    priority = 1

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 1000
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.project_name}-${var.environment}-rate-limit"
      sampled_requests_enabled   = true
    }
  }

  # AWS Managed Rules — Common Rule Set (OWASP Top 10)
  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 2

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.project_name}-${var.environment}-common-rules"
      sampled_requests_enabled   = true
    }
  }

  # AWS Managed Rules — Known Bad Inputs
  rule {
    name     = "AWSManagedRulesKnownBadInputsRuleSet"
    priority = 3

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.project_name}-${var.environment}-bad-inputs"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${var.project_name}-${var.environment}-waf"
    sampled_requests_enabled   = true
  }

  tags = {
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}
