/**
 * Auth Module
 *
 * Provisions:
 *   - Cognito User Pool (email-based, self-service sign-up)
 *   - Cognito App Client (SRP auth, no client secret — required for browser apps)
 *
 * Design decisions:
 *   - SRP (Secure Remote Password) auth: password never sent in plaintext
 *   - PreventUserExistenceErrors: prevents user enumeration attacks
 *   - Short access/ID token validity (1 hour): limits blast radius if token leaked
 *   - 30-day refresh token: good UX without compromising security
 *   - No client secret: browser apps cannot keep secrets; SRP compensates
 *
 * Interview talking point:
 *   "I chose Cognito over a custom auth solution because it handles
 *    MFA, token rotation, and OWASP auth best practices out of the box,
 *    reducing the attack surface I need to maintain."
 */

resource "aws_cognito_user_pool" "main" {
  name = "${var.project_name}-${var.environment}-users"

  # Email as the primary identifier
  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  # Password policy — meets NIST 800-63B recommendations
  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = false
    require_uppercase = true
  }

  # Prevent user enumeration (don't reveal if email exists)
  user_pool_add_ons {
    advanced_security_mode = "AUDIT"
  }

  # Email verification
  verification_message_template {
    default_email_option = "CONFIRM_WITH_CODE"
    email_subject        = "Your verification code"
    email_message        = "Your verification code is {####}"
  }

  schema {
    name                = "email"
    attribute_data_type = "String"
    required            = true
    mutable             = false
  }

  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }
}

resource "aws_cognito_user_pool_client" "main" {
  name         = "${var.project_name}-${var.environment}-client"
  user_pool_id = aws_cognito_user_pool.main.id

  # No client secret — browser apps cannot securely store secrets
  generate_secret = false

  explicit_auth_flows = [
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
  ]

  # Prevent user enumeration via auth errors
  prevent_user_existence_errors = "ENABLED"

  # Token validity
  access_token_validity  = 1
  id_token_validity      = 1
  refresh_token_validity = 30

  token_validity_units {
    access_token  = "hours"
    id_token      = "hours"
    refresh_token = "days"
  }
}
