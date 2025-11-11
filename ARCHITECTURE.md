# 🏗️ Arquitetura da AI Content Analytics Platform

## 📋 Visão Geral

Este documento detalha a arquitetura hexagonal proposta para o protótipo da AI Content Analytics Platform, baseada nos requisitos descritos no README.md. A arquitetura segue princípios de Clean Architecture e Hexagonal Architecture para garantir separação de responsabilidades, testabilidade e escalabilidade.

## 🏛️ Princípios da Arquitetura Hexagonal

A arquitetura hexagonal (Ports and Adapters) organiza o código em camadas concêntricas onde:
- **Domínio (Centro)**: Regras de negócio puras, independentes de tecnologia
- **Aplicação**: Casos de uso que orquestram operações do domínio
- **Infraestrutura (Adaptadores)**: Interfaces com tecnologias externas (DB, APIs, etc.)

**Benefícios:**
- Independência tecnológica
- Facilidade de testes (mocks para adaptadores)
- Separação clara de responsabilidades
- Escalabilidade através de isolamento de mudanças

## 📁 Estrutura de Diretórios

```
ai-content-analytics-platform/
├── frontend/
│   ├── src/
│   │   ├── components/          # Componentes React
│   │   ├── pages/               # Páginas do dashboard
│   │   ├── hooks/               # Custom hooks
│   │   ├── services/            # Chamadas para API
│   │   └── utils/               # Utilitários
│   ├── package.json
│   └── Dockerfile
│
├── backend/
│   ├── src/
│   │   ├── domain/
│   │   │   ├── entities/         # Content, Analysis, Report
│   │   │   │   ├── Content.ts
│   │   │   │   ├── Analysis.ts
│   │   │   │   └── Report.ts
│   │   │   └── repositories/     # Interfaces de repositórios
│   │   │       ├── IContentRepository.ts
│   │   │       ├── IAnalysisRepository.ts
│   │   │       └── IReportRepository.ts
│   │   │
│   │   ├── application/
│   │   │   ├── use-cases/        # Casos de uso
│   │   │   │   ├── ScrapeContentUseCase.ts
│   │   │   │   ├── AnalyzeContentUseCase.ts
│   │   │   │   └── GenerateReportUseCase.ts
│   │   │   ├── services/         # Serviços de aplicação
│   │   │   │   ├── QueueService.ts
│   │   │   │   └── AIService.ts
│   │   │   └── ports/            # Portos de entrada/saída
│   │   │       ├── input/
│   │   │       └── output/
│   │   │
│   │   ├── infrastructure/
│   │   │   ├── database/         # Adaptadores de banco
│   │   │   │   ├── mongo/
│   │   │   │   │   ├── ContentRepository.ts
│   │   │   │   │   ├── AnalysisRepository.ts
│   │   │   │   │   └── ReportRepository.ts
│   │   │   │   └── redis/        # Cache
│   │   │   │       └── CacheService.ts
│   │   │   ├── web-scraping/    # Scrapers
│   │   │   │   ├── CheerioScraper.ts
│   │   │   │   └── PuppeteerScraper.ts
│   │   │   ├── ai/               # Integração com IA
│   │   │   │   └── GeminiAIService.ts
│   │   │   ├── queue/            # Sistema de filas
│   │   │   │   └── BullQueueService.ts
│   │   │   ├── http/             # Camada HTTP
│   │   │   │   ├── controllers/
│   │   │   │   ├── routes/
│   │   │   │   ├── middlewares/
│   │   │   │   └── server.ts
│   │   │   └── config/           # Configurações
│   │   │       ├── database.ts
│   │   │       └── environment.ts
│   │   │
│   │   ├── shared/               # Código compartilhado
│   │   │   ├── errors/
│   │   │   ├── types/
│   │   │   └── utils/
│   │   │
│   │   └── index.ts              # Ponto de entrada
│   │
│   ├── tests/
│   │   ├── unit/                 # Testes unitários
│   │   ├── integration/          # Testes de integração
│   │   └── e2e/                  # Testes end-to-end
│   │
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
│
├── docker-compose.yml
├── .env.example
├── README.md
└── ARCHITECTURE.md
```

## 🎯 Entidades do Domínio

### Content (Conteúdo)
Representa o conteúdo extraído de páginas web.

```typescript
interface Content {
  id: string;
  url: string;
  title: string;
  body: string;
  metadata: {
    author?: string;
    publishedDate?: Date;
    tags?: string[];
    wordCount: number;
  };
  scrapedAt: Date;
  status: 'pending' | 'processed' | 'failed';
}
```

### Analysis (Análise)
Resultado da análise de IA aplicada ao conteúdo.

```typescript
interface Analysis {
  id: string;
  contentId: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  sentimentScore: number; // -1 a 1
  topics: string[];
  summary: string;
  entities: {
    persons: string[];
    organizations: string[];
    locations: string[];
  };
  keywords: string[];
  analyzedAt: Date;
  aiModel: string;
  confidence: number; // 0-1
}
```

### Report (Relatório)
Agregação de análises para insights consolidados.

```typescript
interface Report {
  id: string;
  title: string;
  description?: string;
  contentIds: string[];
  analysisIds: string[];
  summary: {
    totalContents: number;
    avgSentiment: number;
    topTopics: string[];
    trendData: Array<{
      date: Date;
      sentiment: number;
      contentCount: number;
    }>;
  };
  generatedAt: Date;
  filters?: {
    dateRange?: { start: Date; end: Date };
    topics?: string[];
    sentiment?: string;
  };
}
```

## 🔌 Interfaces de Repositórios

```typescript
// domain/repositories/IContentRepository.ts
interface IContentRepository {
  save(content: Content): Promise<Content>;
  findById(id: string): Promise<Content | null>;
  findByUrl(url: string): Promise<Content | null>;
  findAll(options?: {
    limit?: number;
    offset?: number;
    status?: string;
  }): Promise<Content[]>;
  update(id: string, content: Partial<Content>): Promise<Content>;
  delete(id: string): Promise<void>;
}

// domain/repositories/IAnalysisRepository.ts
interface IAnalysisRepository {
  save(analysis: Analysis): Promise<Analysis>;
  findById(id: string): Promise<Analysis | null>;
  findByContentId(contentId: string): Promise<Analysis[]>;
  findAll(options?: {
    limit?: number;
    offset?: number;
    sentiment?: string;
  }): Promise<Analysis[]>;
  update(id: string, analysis: Partial<Analysis>): Promise<Analysis>;
  delete(id: string): Promise<void>;
}

// domain/repositories/IReportRepository.ts
interface IReportRepository {
  save(report: Report): Promise<Report>;
  findById(id: string): Promise<Report | null>;
  findAll(options?: {
    limit?: number;
    offset?: number;
  }): Promise<Report[]>;
  update(id: string, report: Partial<Report>): Promise<Report>;
  delete(id: string): Promise<void>;
}
```

## ⚡ Casos de Uso Principais

### ScrapeContentUseCase
Orquestra o processo de scraping de conteúdo.

```typescript
class ScrapeContentUseCase {
  constructor(
    private contentRepo: IContentRepository,
    private scraperService: IScraperService,
    private queueService: IQueueService
  ) {}

  async execute(url: string): Promise<string> {
    // Validação de URL
    // Enfileiramento do job
    // Retorno do jobId
  }
}
```

### AnalyzeContentUseCase
Coordena a análise de IA do conteúdo.

```typescript
class AnalyzeContentUseCase {
  constructor(
    private contentRepo: IContentRepository,
    private analysisRepo: IAnalysisRepository,
    private aiService: IAIService
  ) {}

  async execute(contentId: string): Promise<Analysis> {
    // Busca conteúdo
    // Executa análise com IA
    // Salva resultado
  }
}
```

### GenerateReportUseCase
Gera relatórios consolidados.

```typescript
class GenerateReportUseCase {
  constructor(
    private reportRepo: IReportRepository,
    private analysisRepo: IAnalysisRepository,
    private contentRepo: IContentRepository
  ) {}

  async execute(filters: ReportFilters): Promise<Report> {
    // Busca análises por filtros
    // Agrega dados
    // Gera relatório
  }
}
```

## 🔧 Adaptadores de Infraestrutura

### MongoDB Adapters
```typescript
// infrastructure/database/mongo/ContentRepository.ts
class ContentRepository implements IContentRepository {
  constructor(private model: Model<ContentDocument>) {}

  async save(content: Content): Promise<Content> {
    const doc = new this.model(content);
    const saved = await doc.save();
    return this.toDomain(saved);
  }

  // ... outros métodos
}
```

### Redis Cache Service
```typescript
// infrastructure/database/redis/CacheService.ts
class CacheService implements ICacheService {
  constructor(private client: Redis) {}

  async get<T>(key: string): Promise<T | null> {
    const data = await this.client.get(key);
    return data ? JSON.parse(data) : null;
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    const data = JSON.stringify(value);
    if (ttl) {
      await this.client.setex(key, ttl, data);
    } else {
      await this.client.set(key, data);
    }
  }
}
```

### Gemini AI Service
```typescript
// infrastructure/ai/GeminiAIService.ts
class GeminiAIService implements IAIService {
  constructor(private apiKey: string) {}

  async analyzeContent(content: string): Promise<AnalysisResult> {
    const response = await this.gemini.generateContent({
      contents: [{ parts: [{ text: `Analyze this content: ${content}` }] }],
    });

    return this.parseResponse(response);
  }
}
```

### Web Scraping Services
```typescript
// infrastructure/web-scraping/CheerioScraper.ts
class CheerioScraper implements IScraperService {
  async scrape(url: string): Promise<ScrapedContent> {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    return {
      title: $('title').text(),
      body: $('article, .content, .post').text(),
      // ... extração de metadados
    };
  }
}
```

### Queue Service (Bull)
```typescript
// infrastructure/queue/BullQueueService.ts
class BullQueueService implements IQueueService {
  constructor(private queue: Queue) {}

  async addJob(jobType: string, data: any): Promise<string> {
    const job = await this.queue.add(jobType, data);
    return job.id;
  }

  async getJobStatus(jobId: string): Promise<JobStatus> {
    const job = await this.queue.getJob(jobId);
    return {
      id: jobId,
      status: await job.getState(),
      progress: job.progress(),
    };
  }
}
```

### HTTP Layer (Fastify)
```typescript
// infrastructure/http/controllers/ContentController.ts
class ContentController {
  constructor(private scrapeUseCase: ScrapeContentUseCase) {}

  async scrape(request: FastifyRequest, reply: FastifyReply) {
    const { url } = request.body as { url: string };

    try {
      const jobId = await this.scrapeUseCase.execute(url);
      return reply.code(202).send({ jobId });
    } catch (error) {
      return reply.code(400).send({ error: error.message });
    }
  }
}
```

## 📊 Diagramas ASCII

### Arquitetura Geral
```
┌─────────────────────────────────────────────────────────────┐
│                    EXTERNAL ACTORS                          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│  │   Frontend  │ │   Queues   │ │   APIs      │            │
│  │   (React)   │ │   (Bull)   │ │   (Gemini)  │            │
│  └─────────────┘ └─────────────┘ └─────────────┘            │
└─────────────────────────────────────────────────────────────┘
                                 │
┌─────────────────────────────────────────────────────────────┐
│                   INFRASTRUCTURE LAYER                      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│  │  Controllers│ │  Repositories│ │   Services  │            │
│  │  (Fastify)  │ │  (MongoDB)  │ │ (AI, Queue) │            │
│  └─────────────┘ └─────────────┘ └─────────────┘            │
└─────────────────────────────────────────────────────────────┘
                                 │
┌─────────────────────────────────────────────────────────────┐
│                  APPLICATION LAYER                          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│  │Use Cases    │ │Application  │ │   Ports     │            │
│  │(Scrape,     │ │Services     │ │(Input/Output│            │
│  │Analyze,     │ │(Queue, AI)  │ │Interfaces)  │            │
│  │Generate)    │ └─────────────┘ └─────────────┘            │
│  └─────────────┘                                             │
└─────────────────────────────────────────────────────────────┘
                                 │
┌─────────────────────────────────────────────────────────────┐
│                     DOMAIN LAYER                            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│  │  Entities   │ │ Repository  │ │Business     │            │
│  │ (Content,   │ │ Interfaces  │ │Logic        │            │
│  │ Analysis,   │ │             │ │             │            │
│  │ Report)     │ └─────────────┘ └─────────────┘            │
│  └─────────────┘                                             │
└─────────────────────────────────────────────────────────────┘
```

### Fluxo de Scraping e Análise
```
User Request ──► Controller ──► Use Case ──► Repository
      │                │            │            │
      │                │            │            │
      ▼                ▼            ▼            ▼
   HTTP Response  Orchestration  Domain Rules  Persistence
      ▲                ▲            ▲            ▲
      │                │            │            │
      │                │            │            │
Queue Job ◄─── Queue Service ◄─── AI Service ◄─── Cache
```

### Dependências Injetadas
```
UseCase
├── Repository Interface ◄─── MongoDB Repository
├── AI Service Interface ◄─── Gemini AI Service
├── Queue Service Interface ◄─── Bull Queue Service
└── Cache Service Interface ◄─── Redis Cache Service
```

## ⚙️ Decisões Técnicas

### Escalabilidade
- **Microsserviços Potenciais**: Separar scraping, análise e geração de relatórios
- **Bancos Distribuídos**: MongoDB para dados não-estruturados, Redis para cache
- **Filas Assíncronas**: BullMQ para processamento em background
- **Balanceamento de Carga**: Kubernetes para orquestração de containers

### Testabilidade
- **Mocks para Adaptadores**: Interfaces permitem testes unitários puros
- **Testes de Integração**: Docker Compose para ambiente de teste
- **Testes E2E**: Cypress para frontend, Supertest para API
- **Cobertura de Testes**: Jest com mínimo 80% de cobertura

### Separação de Responsabilidades
- **Entidades Anêmicas**: Lógica de negócio pura, sem dependências externas
- **Casos de Uso**: Orquestração de operações complexas
- **Adaptadores**: Isolamento de tecnologias específicas
- **Injeção de Dependência**: Facilita troca de implementações

### Segurança
- **JWT Authentication**: Tokens assíncronos para sessões
- **Rate Limiting**: Proteção contra abuso de API
- **Input Validation**: Sanitização e validação de dados
- **CORS**: Controle de origens permitidas

### Performance
- **Cache Estratégico**: Redis para resultados de análise frequentes
- **Lazy Loading**: Carregamento sob demanda de dados pesados
- **Compressão**: Gzip para respostas HTTP
- **CDN**: Distribuição de assets estáticos

### Manutenibilidade
- **TypeScript**: Tipagem estática para reduzir bugs
- **SOLID Principles**: Princípios para código limpo e extensível
- **Documentação**: README, API docs (Swagger), comentários
- **Versionamento**: SemVer para APIs e pacotes

---

**Próximos Passos:**
1. Implementar entidades do domínio e interfaces
2. Criar casos de uso com lógica de negócio
3. Desenvolver adaptadores de infraestrutura
4. Configurar testes unitários e de integração
5. Containerização com Docker
6. Deploy em ambiente de desenvolvimento