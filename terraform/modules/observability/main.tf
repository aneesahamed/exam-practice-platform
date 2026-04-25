/**
 * Observability Module
 *
 * Provisions:
 *   - CloudWatch alarms for Lambda errors, API Gateway 5xx, DynamoDB throttles
 *   - CloudWatch dashboard for at-a-glance system health
 *   - SNS topic for alarm notifications (email)
 *
 * X-Ray tracing is enabled at the Lambda level via SAM template (active tracing).
 *
 * Interview talking point:
 *   "I implemented the four golden signals — latency, traffic, errors, saturation.
 *    CloudWatch alarms fire on error rate thresholds, X-Ray traces individual
 *    requests end-to-end across Lambda and DynamoDB."
 */

# ── SNS Topic for alarm notifications ───────────────────────────────────────

resource "aws_sns_topic" "alarms" {
  name = "${var.project_name}-${var.environment}-alarms"
}

resource "aws_sns_topic_subscription" "email" {
  count     = var.alarm_email != "" ? 1 : 0
  topic_arn = aws_sns_topic.alarms.arn
  protocol  = "email"
  endpoint  = var.alarm_email
}

# ── Lambda: Error rate alarms ────────────────────────────────────────────────

resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  for_each = toset(var.lambda_function_names)

  alarm_name          = "${var.project_name}-${var.environment}-${each.key}-errors"
  alarm_description   = "Lambda function ${each.key} error rate too high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 60
  statistic           = "Sum"
  threshold           = 5
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = each.key
  }

  alarm_actions = [aws_sns_topic.alarms.arn]
  ok_actions    = [aws_sns_topic.alarms.arn]
}

resource "aws_cloudwatch_metric_alarm" "lambda_duration" {
  for_each = toset(var.lambda_function_names)

  alarm_name          = "${var.project_name}-${var.environment}-${each.key}-duration"
  alarm_description   = "Lambda function ${each.key} duration approaching timeout"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "Duration"
  namespace           = "AWS/Lambda"
  period              = 60
  statistic           = "p99"
  threshold           = 25000 # 25 seconds — Lambda timeout is 30s
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = each.key
  }

  alarm_actions = [aws_sns_topic.alarms.arn]
}

# ── API Gateway: 5xx error alarm ─────────────────────────────────────────────

resource "aws_cloudwatch_metric_alarm" "api_5xx" {
  alarm_name          = "${var.project_name}-${var.environment}-api-5xx-errors"
  alarm_description   = "API Gateway 5xx error rate too high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "5XXError"
  namespace           = "AWS/ApiGateway"
  period              = 60
  statistic           = "Sum"
  threshold           = 10
  treat_missing_data  = "notBreaching"

  dimensions = {
    ApiName = "exam-practice-platform-${var.environment}-api"
    Stage   = var.environment
  }

  alarm_actions = [aws_sns_topic.alarms.arn]
  ok_actions    = [aws_sns_topic.alarms.arn]
}

resource "aws_cloudwatch_metric_alarm" "api_4xx" {
  alarm_name          = "${var.project_name}-${var.environment}-api-4xx-errors"
  alarm_description   = "API Gateway 4xx error rate elevated — possible auth issues"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "4XXError"
  namespace           = "AWS/ApiGateway"
  period              = 300
  statistic           = "Sum"
  threshold           = 50
  treat_missing_data  = "notBreaching"

  dimensions = {
    ApiName = "exam-practice-platform-${var.environment}-api"
    Stage   = var.environment
  }

  alarm_actions = [aws_sns_topic.alarms.arn]
}

# ── DynamoDB: Throttle alarms ────────────────────────────────────────────────

resource "aws_cloudwatch_metric_alarm" "dynamodb_throttles" {
  for_each = toset(var.dynamodb_table_names)

  alarm_name          = "${var.project_name}-${var.environment}-${each.key}-throttles"
  alarm_description   = "DynamoDB table ${each.key} is being throttled"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "ThrottledRequests"
  namespace           = "AWS/DynamoDB"
  period              = 60
  statistic           = "Sum"
  threshold           = 0
  treat_missing_data  = "notBreaching"

  dimensions = {
    TableName = each.key
  }

  alarm_actions = [aws_sns_topic.alarms.arn]
}

# ── CloudWatch Dashboard ─────────────────────────────────────────────────────

resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.project_name}-${var.environment}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          title  = "Lambda Errors"
          period = 300
          stat   = "Sum"
          metrics = [
            for fn in var.lambda_function_names :
            ["AWS/Lambda", "Errors", "FunctionName", fn]
          ]
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          title  = "API Gateway Requests & Errors"
          period = 300
          stat   = "Sum"
          metrics = [
            ["AWS/ApiGateway", "Count", "ApiName", "exam-practice-platform-${var.environment}-api", "Stage", var.environment],
            ["AWS/ApiGateway", "5XXError", "ApiName", "exam-practice-platform-${var.environment}-api", "Stage", var.environment],
            ["AWS/ApiGateway", "4XXError", "ApiName", "exam-practice-platform-${var.environment}-api", "Stage", var.environment]
          ]
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6
        properties = {
          title  = "Lambda Duration (p99)"
          period = 300
          stat   = "p99"
          metrics = [
            for fn in var.lambda_function_names :
            ["AWS/Lambda", "Duration", "FunctionName", fn]
          ]
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 6
        width  = 12
        height = 6
        properties = {
          title  = "DynamoDB Throttled Requests"
          period = 300
          stat   = "Sum"
          metrics = [
            for table in var.dynamodb_table_names :
            ["AWS/DynamoDB", "ThrottledRequests", "TableName", table]
          ]
        }
      }
    ]
  })
}
