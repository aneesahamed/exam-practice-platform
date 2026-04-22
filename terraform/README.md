# Terraform — Infrastructure as Code

Manages all AWS infrastructure for the exam practice platform.

## Structure

```
terraform/
├── backend.tf                    ← Remote state (S3 + DynamoDB lock)
├── main.tf                       ← Root module — composes all modules
├── variables.tf                  ← Input variable definitions
├── outputs.tf                    ← Output values used by CI/CD
├── modules/
│   ├── storage/                  ← S3 questions bucket + DynamoDB tables
│   ├── auth/                     ← Cognito User Pool + App Client
│   └── frontend-hosting/         ← S3 + CloudFront + ACM + Route 53
└── environments/
    ├── dev/terraform.tfvars.example
    └── prod/terraform.tfvars.example
```

## Prerequisites

1. AWS CLI configured (`aws configure`)
2. Terraform >= 1.6.0 installed
3. Bootstrap resources created (see below)

## Bootstrap (one-time setup)

Before running `terraform init`, the remote state bucket and lock table must exist.

```bash
# Create S3 bucket for Terraform state
aws s3api create-bucket \
  --bucket exam-practice-platform-tfstate \
  --region eu-west-1 \
  --create-bucket-configuration LocationConstraint=eu-west-1

# Enable versioning on state bucket
aws s3api put-bucket-versioning \
  --bucket exam-practice-platform-tfstate \
  --versioning-configuration Status=Enabled

# Enable encryption on state bucket
aws s3api put-bucket-encryption \
  --bucket exam-practice-platform-tfstate \
  --server-side-encryption-configuration \
  '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'

# Create DynamoDB table for state locking
aws dynamodb create-table \
  --table-name exam-practice-platform-tfstate-lock \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region eu-west-1
```

## Usage

### Dev environment

```bash
cd terraform

# Initialise (downloads providers, configures remote state)
terraform init

# Copy and fill in dev variables
cp environments/dev/terraform.tfvars.example terraform.tfvars

# Preview changes
terraform plan

# Apply
terraform apply
```

### Prod environment

```bash
# Use a separate state key for prod
terraform init \
  -backend-config="key=exam-practice-platform/prod/terraform.tfstate"

cp environments/prod/terraform.tfvars.example terraform.tfvars
terraform plan
terraform apply
```

## Outputs

After apply, retrieve values needed for CI/CD:

```bash
terraform output questions_bucket_name
terraform output frontend_bucket_name
terraform output cloudfront_distribution_id
terraform output cognito_user_pool_id
terraform output cognito_user_pool_client_id
```

These are injected as GitHub Actions secrets and used in deployment pipelines.

## Why Terraform over CloudFormation?

- **Multi-cloud portable** — skills transfer to Azure/GCP
- **Better state management** — explicit plan/apply cycle
- **Richer ecosystem** — modules, providers, Terragrunt
- **Industry standard** — most cloud engineering roles expect Terraform

The Lambda functions still use AWS SAM (via `exam-platform-backend/template.yaml`) because SAM provides the best developer experience for Lambda packaging and local testing. This hybrid approach is common in production environments.
