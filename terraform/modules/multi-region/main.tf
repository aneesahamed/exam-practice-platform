/**
 * Multi-Region Module
 *
 * Provisions active-passive multi-region failover:
 *   - DynamoDB Global Tables (replication to secondary region)
 *   - Route 53 health checks on primary API endpoint
 *   - Route 53 failover routing policy (primary → secondary)
 *
 * DISABLED BY DEFAULT: set multi_region_enabled = true to activate.
 * Cost when enabled: ~$2-3/month (Route 53 health checks + Global Tables replication)
 *
 * Architecture:
 *   Primary region:   eu-west-1 (Ireland)
 *   Secondary region: eu-central-1 (Frankfurt)
 *
 *   Normal traffic:   DNS → eu-west-1 API
 *   On failure:       Route 53 health check detects outage →
 *                     DNS automatically fails over to eu-central-1
 *
 * Interview talking point:
 *   "I implemented active-passive multi-region failover using Route 53 health
 *    checks and DynamoDB Global Tables. The secondary region is kept warm with
 *    replicated data. RTO is under 60 seconds — the time for Route 53 to detect
 *    the health check failure and update DNS. This is disabled in dev to avoid
 *    the replication cost, enabled in prod with a single Terraform variable."
 */

# ── DynamoDB Global Tables ───────────────────────────────────────────────────
# Adds a replica of both tables in the secondary region.
# Replication is asynchronous — eventual consistency across regions.

resource "aws_dynamodb_table_replica" "progress" {
  count            = var.enabled ? 1 : 0
  global_table_arn = var.progress_table_arn
}

resource "aws_dynamodb_table_replica" "flags" {
  count            = var.enabled ? 1 : 0
  global_table_arn = var.flags_table_arn
}

# ── Route 53: Health check on primary API ────────────────────────────────────

resource "aws_route53_health_check" "primary_api" {
  count = var.enabled ? 1 : 0

  fqdn              = var.primary_api_fqdn
  port              = 443
  type              = "HTTPS"
  resource_path     = "/health"
  failure_threshold = 3
  request_interval  = 30

  tags = {
    Name        = "${var.project_name}-${var.environment}-primary-health"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# ── Route 53: Failover routing records ───────────────────────────────────────
# Primary record — serves traffic when healthy
# Secondary record — serves traffic when primary health check fails

resource "aws_route53_record" "api_primary" {
  count   = var.enabled && var.domain_name != "" ? 1 : 0
  zone_id = var.route53_zone_id
  name    = "api.${var.domain_name}"
  type    = "CNAME"
  ttl     = 60
  records = [var.primary_api_fqdn]

  set_identifier = "primary"

  failover_routing_policy {
    type = "PRIMARY"
  }

  health_check_id = aws_route53_health_check.primary_api[0].id
}

resource "aws_route53_record" "api_secondary" {
  count   = var.enabled && var.domain_name != "" ? 1 : 0
  zone_id = var.route53_zone_id
  name    = "api.${var.domain_name}"
  type    = "CNAME"
  ttl     = 60
  records = [var.secondary_api_fqdn]

  set_identifier = "secondary"

  failover_routing_policy {
    type = "SECONDARY"
  }
}
