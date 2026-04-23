# AWS Exam Practice Platform

A production-grade, cloud-native exam preparation platform built entirely on AWS serverless architecture. Demonstrates end-to-end ownership of infrastructure, backend, frontend, and AI-powered content generation.

[![Backend CI/CD](https://github.com/aneesahamed/exam-practice-platform/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/aneesahamed/exam-practice-platform/actions/workflows/backend-ci.yml)
[![Frontend CI/CD](https://github.com/aneesahamed/exam-practice-platform/actions/workflows/frontend-ci.yml/badge.svg)](https://github.com/aneesahamed/exam-practice-platform/actions/workflows/frontend-ci.yml)
[![Terraform CI/CD](https://github.com/aneesahamed/exam-practice-platform/actions/workflows/terraform-ci.yml/badge.svg)](https://github.com/aneesahamed/exam-practice-platform/actions/workflows/terraform-ci.yml)

---

## Architecture

![Architecture](./docs/architecture.png)

| Layer | Services |
|---|---|
| Edge | CloudFront · WAF · Route 53 · ACM |
| Frontend | S3 (private, OAC) · React SPA |
| Auth | Cognito User Pool · SRP · JWT |
| API | API Gateway REST · Cognito Authorizer |
| Compute | Lambda (Node.js 20, arm64) × 9 functions |
| Data | DynamoDB (progress + flags) · S3 (questions dataset) |
| Content | AWS Bedrock · Claude 3.5 Sonnet v2 · Batch API |
| IaC | Terraform · AWS SAM |
| CI/CD | GitHub Actions (3 pipelines) |

---

---

## What's Built

### Content Pipeline — AI-Powered Question Enrichment
Raw exam PDFs are processed through an automated pipeline using **AWS Bedrock** (Claude 3.5 Sonnet v2 Batch API) to produce structured, enriched question datasets at scale.

- 1,003 AWS SAA-C03 questions enriched at **$0.0095/question**
- Each question includes: detailed explanation, per-option reasoning, memory hook, difficulty rating, taxonomy tags
- 98.7% enrichment success rate across 21 batch jobs
- Schema-validated JSON output, versioned and frozen for production use

### Backend — Serverless REST API
Nine Lambda functions behind API Gateway, all authenticated via Cognito JWT.

| Endpoint | Method | Description |
|---|---|---|
| `/health` | GET | Health check |
| `/questions` | GET | Fetch questions with filtering, pagination, shuffle |
| `/progress/attempt` | POST | Record a question attempt |
| `/progress/stats` | GET | User progress statistics |
| `/progress/incorrect` | GET | Questions answered incorrectly |
| `/flags/{questionId}` | PUT | Flag a question |
| `/flags/{questionId}` | DELETE | Remove a flag |
| `/flags` | GET | List flagged questions |
| `/flags/summary` | GET | Flag counts by type |

### Frontend — React SPA
Practice platform with session management, progress tracking, and review modes.

- Practice mode with filtering by topic, difficulty, and shuffle
- Session resume — picks up where you left off
- Review mode for incorrect answers
- Flagging system for questions to revisit
- Progress dashboard with charts
- Dark/light theme

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| Auth | AWS Cognito (User Pool, SRP auth, JWT) |
| API | AWS API Gateway (REST) + Cognito Authorizer |
| Compute | AWS Lambda (Node.js 20, arm64, PAY_PER_REQUEST) |
| Database | Amazon DynamoDB (single-table design, on-demand) |
| Storage | Amazon S3 (questions dataset + static hosting) |
| CDN | Amazon CloudFront (OAC, HTTPS, SPA routing) |
| DNS / TLS | Route 53 + ACM |
| IaC | Terraform + AWS SAM |
| CI/CD | GitHub Actions (3 pipelines) |
| AI / ML | AWS Bedrock — Claude 3.5 Sonnet v2 (Batch API) |

---

## Repository Structure

```
exam-practice-platform/
├── .github/
│   └── workflows/
│       ├── backend-ci.yml        # Build → test → SAM deploy
│       ├── frontend-ci.yml       # Build → S3 sync → CloudFront invalidation
│       └── terraform-ci.yml      # Plan on PR → apply on merge
├── terraform/
│   ├── modules/
│   │   ├── frontend-hosting/     # S3 + CloudFront + ACM + Route 53
│   │   ├── auth/                 # Cognito User Pool + App Client
│   │   └── storage/              # DynamoDB tables + S3 questions bucket
│   ├── environments/
│   │   ├── dev/
│   │   └── prod/
│   ├── backend.tf                # Remote state: S3 + DynamoDB lock
│   ├── main.tf
│   ├── variables.tf
│   └── outputs.tf
├── exam-platform-frontend/       # React 18 + Vite + Tailwind + shadcn/ui
├── exam-platform-backend/        # AWS SAM + Lambda + TypeScript
└── exam-content-factory/         # Python pipeline + AWS Bedrock
```

---

## Infrastructure as Code

All infrastructure is managed via Terraform with remote state in S3.

```bash
cd terraform
terraform init
terraform workspace select dev   # or prod
terraform plan
terraform apply
```

Remote state backend:
- **State bucket:** `exam-practice-platform-tfstate` (versioned, encrypted, eu-west-1)
- **Lock table:** `exam-practice-platform-tfstate-lock` (DynamoDB, PAY_PER_REQUEST)

---

## CI/CD Pipelines

| Pipeline | Trigger | Steps |
|---|---|---|
| Backend | Push to `main` / `develop` | TypeScript compile → Jest → SAM build → SAM deploy |
| Frontend | Push to `main` / `develop` | ESLint → tsc → Vite build → S3 sync → CloudFront invalidation |
| Terraform | PR or push to `main` | fmt check → validate → plan (PR comment) → apply (main only) |

Environment separation: `develop` branch → dev stack, `main` branch → prod stack.

---

## Local Development

### Frontend
```bash
cd exam-platform-frontend
npm install
cp .env.example .env.local
npm run dev
```

### Backend
```bash
cd exam-platform-backend
npm install
sam build
sam local start-api
```

### Content Factory
```bash
cd exam-content-factory
python3 -m venv .venv
source .venv/bin/activate
pip install -r scripts/requirements.txt
```

---

## AWS Services Coverage

Covers the core AWS SAA-C03 exam domains in a real working system:

- **Compute:** Lambda (serverless, arm64, event-driven)
- **Storage:** S3 (static hosting, versioning, server-side encryption, lifecycle)
- **Database:** DynamoDB (single-table design, GSI, Streams, PITR, on-demand)
- **Networking:** CloudFront (OAC, custom error pages, HTTPS redirect), API Gateway (REST, stages, throttling)
- **Security:** Cognito (SRP auth, JWT, token rotation), IAM (least-privilege per Lambda), ACM (TLS 1.2+)
- **IaC:** Terraform (modules, remote state, workspaces), AWS SAM (Lambda packaging)
- **CI/CD:** GitHub Actions (matrix builds, environment protection, secret injection)
- **AI/ML:** Bedrock (Claude 3.5 Sonnet v2, Batch API, prompt engineering at scale)

---

## License

MIT
