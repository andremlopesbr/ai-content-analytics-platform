# 🧪 AI Content Analytics Platform

> Intelligent web scraping and content analysis platform powered by Google Gemini AI

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)]()
[![Fastify](https://img.shields.io/badge/Fastify-000000?style=for-the-badge&logo=fastify&logoColor=white)]()
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)]()
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)]()
[![Gemini](https://img.shields.io/badge/Google_Gemini-8E75B2?style=for-the-badge&logo=google&logoColor=white)]()

## 📋 Overview

Advanced platform for web content extraction, AI-powered analysis using Google Gemini, and interactive data visualization. Perfect for content marketers, researchers, and data analysts.

## ✨ Key Features

- 🔍 **Intelligent Web Scraping**: Automated content extraction from articles and blogs
- 🤖 **AI-Powered Analysis**: Gemini AI integration for sentiment, topics, and insights
- 📊 **Interactive Dashboards**: Real-time charts and analytics with Recharts/Chart.js
- 🐿 **Queue System**: Bull/BullMQ for async scraping jobs
- 🗄️ **NoSQL Storage**: MongoDB for flexible document storage
- 🔒 **Authentication**: JWT-based secure access
- 🚀 **Performance**: Redis caching for optimized queries

## 🏗️ Architecture

### Hexagonal Architecture

```
backend/
├── src/
│   ├── domain/
│   │   ├── entities/       # Content, Analysis, Report
│   │   └── repositories/   # Interfaces
│   ├── application/
│   │   ├── use-cases/      # Scrape, Analyze, Generate
│   │   └── services/       # AI, Queue services
│   └── infrastructure/
│       ├── database/       # MongoDB adapters
│       ├── scraper/        # Cheerio/Puppeteer
│       ├── ai/             # Gemini integration
│       └── http/           # Fastify routes
```

## 🚀 Tech Stack

**Frontend:**
- React 18 + TypeScript
- TailwindCSS
- Recharts / Chart.js
- React Query
- Axios

**Backend:**
- Fastify (high-performance)
- TypeScript
- MongoDB + Mongoose
- Redis
- Bull Queue
- Google Gemini AI API
- Cheerio / Puppeteer

## 🐳 Quick Start

```bash
# Clone repository
git clone https://github.com/andremlopesbr/ai-content-analytics-platform.git
cd ai-content-analytics-platform

# Environment setup
cp .env.example .env

# Start with Docker
docker-compose up -d

# Access
# Frontend: http://localhost:3000
# Backend: http://localhost:4000
# MongoDB: localhost:27017
```

## 📦 Services

| Service | Port | Description |
|---------|------|--------------|
| Frontend | 3000 | React dashboard |
| Backend | 4000 | Fastify API |
| MongoDB | 27017 | Database |
| Redis | 6379 | Cache |

## 📚 API Endpoints

```
POST   /api/scrape       - Start scraping job
GET    /api/content/:id  - Get scraped content
POST   /api/analyze      - Analyze with Gemini AI
GET    /api/reports      - List all reports
GET    /api/stats        - Get analytics
```

## 🧪 AI Features

- **Sentiment Analysis**: Detect positive/negative/neutral tones
- **Topic Extraction**: Identify main themes
- **Summarization**: Generate concise summaries
- **Entity Recognition**: Extract names, places, organizations
- **Trend Detection**: Identify content patterns

## 🔧 Development

```bash
# Install dependencies
npm install

# Run dev mode
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## 🌍 Environment Variables

```env
# Database
MONGODB_URI=mongodb://localhost:27017/analytics

# Redis
REDIS_URL=redis://localhost:6379

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Authentication
JWT_SECRET=your_jwt_secret
```

## 🚧 Roadmap

- [ ] Multiple AI providers (OpenAI, Claude)
- [ ] Scheduled scraping
- [ ] Export reports (PDF, CSV)
- [ ] Multi-language support
- [ ] Browser extension

## 👤 Author

**André Lopes**
- GitHub: [@andremlopesbr](https://github.com/andremlopesbr)

## 🙏 Acknowledgments

- Google Gemini AI for intelligent analysis
- Full Cycle architecture patterns
- Clean Architecture principles

---

⭐ Star this repo if useful!
