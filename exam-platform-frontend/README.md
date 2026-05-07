# Exam Platform Frontend

React-based frontend for the exam practice platform that consumes the exam-platform-backend API.

## Project Info

**Repository**: https://github.com/aneesahamed/exam-zen  
**Backend**: [exam-platform-backend](https://github.com/aneesahamed/exam-platform-backend)  
**Built with**: Lovable AI + React + TypeScript + Tailwind CSS + shadcn/ui

## Overview

This is the frontend application for an exam practice platform, currently supporting AWS SAA-C03 certification exam preparation with:
- 1,000+ enriched practice questions
- Instant feedback with detailed explanations
- Memory hooks for better retention
- Progress tracking and statistics
- Spaced repetition learning
- Bookmarking and review features

## Tech Stack

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS
- **Routing**: TanStack Router
- **State Management**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts
- **Icons**: Lucide React

## Getting Started

### Prerequisites
- Node.js 18+ or Bun
- npm or bun package manager

### Installation

```sh
# Clone the repository
git clone https://github.com/aneesahamed/exam-zen.git
cd exam-zen

# Install dependencies
npm install
# or
bun install
```

### Environment Setup

**Important:** You must configure the backend API URL before running the app.

1. **Copy the example environment file:**
```sh
cp .env.example .env.local
```

2. **Edit `.env.local` with your backend API URL:**
```env
# Backend API URL (required)
VITE_API_BASE_URL=https://oqyx2wzbxi.execute-api.us-east-1.amazonaws.com/dev
```

**Environment Variables:**
- `VITE_API_BASE_URL` - Backend API Gateway URL
  - Get this from your backend deployment outputs
  - Format: `https://{api-id}.execute-api.{region}.amazonaws.com/{stage}`
  - Fallback: `http://localhost:3001` if not set

### Running the App

```sh
# Start development server (runs on port 8080)
npm run dev
# or
bun dev
```

The application will be available at `http://localhost:8080`

**Build for production:**
```sh
npm run build
npm run preview
```

## Project Structure

```
src/
├── components/         # React components
├── pages/             # Page components
├── hooks/             # Custom React hooks
├── lib/               # Utilities and helpers
├── types/             # TypeScript type definitions
└── styles/            # Global styles
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build in development mode
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Using Lovable AI

This project can be edited using [Lovable AI](https://lovable.dev). Changes made via Lovable will be committed automatically to this repository.

### Code Style

This project uses:
- ESLint for linting
- TypeScript for type safety
- Prettier formatting via ESLint config

## Features

- ✅ Question practice with multiple choice
- ✅ Instant feedback and explanations
- ✅ Memory hooks for retention
- ✅ Progress tracking
- ✅ Statistics dashboard
- ✅ Bookmarking system
- ✅ Dark mode support
- ✅ Responsive design

## Deployment

### Deploy to Vercel/Netlify

```sh
npm run build
# Upload the dist/ folder to your hosting provider
```

### Using Lovable

Simply open your Lovable project and click on **Share → Publish**.

## Contributing

This is a personal learning project. Contributions, issues, and feature requests are welcome!

## License

[MIT License](LICENSE) (to be added)

## Related Projects

- [exam-platform-backend](https://github.com/aneesahamed/exam-platform-backend) - REST API backend
- [exam-content-factory](https://github.com/aneesahamed/exam-content-factory) - Content enrichment pipeline

---

**Last Updated**: January 2, 2026
