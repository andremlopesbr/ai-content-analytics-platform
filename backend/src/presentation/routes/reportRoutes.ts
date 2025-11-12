/**
 * Report Routes
 *
 * Handles report generation and retrieval API endpoints.
 *
 * Endpoints:
 * - GET /api/reports - List reports with optional filters
 * - POST /api/reports/generate - Generate new reports
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { container } from 'tsyringe';
import { GenerateReportUseCase } from '../../application/use-cases/GenerateReportUseCase';
import { ExportReportPdfUseCase } from '../../application/use-cases/ExportReportPdfUseCase';
import { ReportType } from '../../domain/entities/Report';
import { IReportRepository } from '../../domain/repositories/IReportRepository';
import { AppError } from '../../shared/errors/AppError';

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
  const exportReportPdfUseCase = container.resolve(ExportReportPdfUseCase);

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

      // Validate report type if provided
      if (type && !Object.values(ReportType).includes(type)) {
        throw new AppError(`Invalid report type. Must be one of: ${Object.values(ReportType).join(', ')}`, 400);
      }

      // Validate pagination parameters
      if (limit < 1 || limit > 100) {
        throw new AppError('Limit must be between 1 and 100', 400);
      }
      if (offset < 0) {
        throw new AppError('Offset must be non-negative', 400);
      }

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
      if (error instanceof AppError) {
        throw error; // Let error handler manage it
      }
      throw new AppError('Failed to fetch reports', 500);
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

      // Validate required fields
      if (!title || title.trim().length === 0) {
        throw new AppError('Title is required and cannot be empty', 400);
      }

      // Validate report type
      if (!Object.values(ReportType).includes(type)) {
        throw new AppError(`Invalid report type. Must be one of: ${Object.values(ReportType).join(', ')}`, 400);
      }

      // Validate contentIds if provided
      if (contentIds && (!Array.isArray(contentIds) || contentIds.some(id => typeof id !== 'string' || id.length < 10))) {
        throw new AppError('Content IDs must be valid non-empty strings', 400);
      }

      // Validate analysisIds if provided
      if (analysisIds && (!Array.isArray(analysisIds) || analysisIds.some(id => typeof id !== 'string' || id.length < 10))) {
        throw new AppError('Analysis IDs must be valid non-empty strings', 400);
      }

      // Validate date range if provided
      if (filters?.dateRange) {
        const { from, to } = filters.dateRange;
        if (from && to && new Date(from) >= new Date(to)) {
          throw new AppError('Date range "from" must be before "to"', 400);
        }
      }

      const result = await generateReportUseCase.execute({
        title: title.trim(),
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
      if (error instanceof AppError) {
        throw error; // Let error handler manage it
      }
      throw new AppError('Failed to generate report', 500);
    }
  });

 fastify.get('/api/reports/:id/export/pdf', {
   schema: {
     params: {
       type: 'object',
       required: ['id'],
       properties: {
         id: { type: 'string' },
       },
     },
     response: {
       200: {
         type: 'string',
         format: 'binary',
       },
     },
   },
 }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
   try {
     const { id } = request.params;

     // Validate report ID
     if (!id || id.length < 10) {
       throw new AppError('Invalid report ID', 400);
     }

     const result = await exportReportPdfUseCase.execute({ reportId: id });

     return reply
       .header('Content-Type', 'application/pdf')
       .header('Content-Disposition', `attachment; filename="${result.filename}"`)
       .send(result.pdfBuffer);
   } catch (error) {
     if (error instanceof AppError) {
       throw error; // Let error handler manage it
     }
     throw new AppError('Failed to export report to PDF', 500);
   }
 });
}