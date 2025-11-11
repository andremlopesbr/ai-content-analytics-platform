import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { container } from 'tsyringe';
import { GenerateReportUseCase } from '../../application/use-cases/GenerateReportUseCase';
import { ReportType } from '../../domain/entities/Report';
import { IReportRepository } from '../../domain/repositories/IReportRepository';

interface GenerateReportBody {
  title: string;
  type: ReportType;
  contentIds?: string[];
  analysisIds?: string[];
  filters?: {
    dateRange?: { from: string; to: string };
    tags?: string[];
    authors?: string[];
  };
  generatedBy?: string;
}

interface GetReportsQuery {
  type?: ReportType;
  generatedBy?: string;
  limit?: number;
  offset?: number;
}

export async function reportRoutes(fastify: FastifyInstance) {
  const generateReportUseCase = container.resolve(GenerateReportUseCase);

  fastify.get('/api/reports', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['content_summary', 'trend_analysis', 'performance_metrics', 'custom'] },
          generatedBy: { type: 'string' },
          limit: { type: 'number', minimum: 1, maximum: 100 },
          offset: { type: 'number', minimum: 0 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            reports: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  title: { type: 'string' },
                  type: { type: 'string' },
                  contentIds: { type: 'array', items: { type: 'string' } },
                  analysisIds: { type: 'array', items: { type: 'string' } },
                  data: { type: 'object' },
                  metadata: { type: 'object' },
                  generatedBy: { type: 'string' },
                  createdAt: { type: 'string', format: 'date-time' },
                  updatedAt: { type: 'string', format: 'date-time' },
                },
              },
            },
            total: { type: 'number' },
          },
        },
      },
    },
  }, async (request: FastifyRequest<{ Querystring: GetReportsQuery }>, reply: FastifyReply) => {
    try {
      const { type, generatedBy, limit = 10, offset = 0 } = request.query;
      const reportRepository = container.resolve<IReportRepository>('IReportRepository');

      const filter = {
        type,
        generatedBy,
      };

      const [reports, total] = await Promise.all([
        reportRepository.findMany(filter, limit, offset),
        reportRepository.count(filter),
      ]);

      return reply.send({
        reports: reports.map(r => r.toJSON()),
        total,
      });
    } catch (error) {
      return reply.code(500).send({ error: 'Failed to fetch reports' });
    }
  });

  fastify.post('/api/reports/generate', {
    schema: {
      body: {
        type: 'object',
        required: ['title', 'type'],
        properties: {
          title: { type: 'string' },
          type: { type: 'string', enum: ['content_summary', 'trend_analysis', 'performance_metrics', 'custom'] },
          contentIds: { type: 'array', items: { type: 'string' } },
          analysisIds: { type: 'array', items: { type: 'string' } },
          filters: {
            type: 'object',
            properties: {
              dateRange: {
                type: 'object',
                properties: {
                  from: { type: 'string', format: 'date-time' },
                  to: { type: 'string', format: 'date-time' },
                },
              },
              tags: { type: 'array', items: { type: 'string' } },
              authors: { type: 'array', items: { type: 'string' } },
            },
          },
          generatedBy: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            report: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                title: { type: 'string' },
                type: { type: 'string' },
                contentIds: { type: 'array', items: { type: 'string' } },
                analysisIds: { type: 'array', items: { type: 'string' } },
                data: { type: 'object' },
                metadata: { type: 'object' },
                generatedBy: { type: 'string' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
      },
    },
  }, async (request: FastifyRequest<{ Body: GenerateReportBody }>, reply: FastifyReply) => {
    try {
      const { title, type, contentIds, analysisIds, filters, generatedBy } = request.body;

      const result = await generateReportUseCase.execute({
        title,
        type,
        contentIds,
        analysisIds,
        filters: filters ? {
          dateRange: filters.dateRange ? {
            from: new Date(filters.dateRange.from),
            to: new Date(filters.dateRange.to),
          } : undefined,
          tags: filters.tags,
          authors: filters.authors,
        } : undefined,
        generatedBy,
      });

      return reply.send({
        report: result.report.toJSON(),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate report';
      return reply.code(400).send({ error: message });
    }
  });
}