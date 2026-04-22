/**
 * Storage Module
 *
 * Provisions:
 *   - S3 bucket for the enriched questions dataset (private, versioned, encrypted)
 *   - DynamoDB table for user progress (single-table design, PAY_PER_REQUEST)
 *   - DynamoDB table for user flags (with GSI for reverse lookups)
 *
 * Design decisions:
 *   - PAY_PER_REQUEST billing: no capacity planning needed, scales to zero
 *   - DynamoDB Streams enabled: future use for analytics / event-driven processing
 *   - S3 versioning: allows rollback of question dataset without data loss
 *   - AES256 encryption: AWS-managed keys, no cost, compliance baseline
 */

# ── S3: Questions Dataset ────────────────────────────────────────────────────

resource "aws_s3_bucket" "questions" {
  bucket = "${var.project_name}-${var.environment}-questions-${data.aws_caller_identity.current.account_id}"
}

resource "aws_s3_bucket_versioning" "questions" {
  bucket = aws_s3_bucket.questions.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "questions" {
  bucket = aws_s3_bucket.questions.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "questions" {
  bucket                  = aws_s3_bucket.questions.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ── DynamoDB: User Progress ──────────────────────────────────────────────────

resource "aws_dynamodb_table" "progress" {
  name         = "${var.project_name}-${var.environment}-progress"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "PK"
  range_key    = "SK"

  attribute {
    name = "PK"
    type = "S"
  }

  attribute {
    name = "SK"
    type = "S"
  }

  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  point_in_time_recovery {
    enabled = true
  }
}

# ── DynamoDB: User Flags ─────────────────────────────────────────────────────

resource "aws_dynamodb_table" "flags" {
  name         = "${var.project_name}-${var.environment}-flags"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "PK"
  range_key    = "SK"

  attribute {
    name = "PK"
    type = "S"
  }

  attribute {
    name = "SK"
    type = "S"
  }

  attribute {
    name = "GSI1PK"
    type = "S"
  }

  attribute {
    name = "GSI1SK"
    type = "S"
  }

  global_secondary_index {
    name            = "GSI1"
    hash_key        = "GSI1PK"
    range_key       = "GSI1SK"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }
}

data "aws_caller_identity" "current" {}
