/**
 * Analysis Routes
 *
 * Handles content analysis API endpoints using AI.
 *
 * Endpoints:
 * - POST /api/analyze - Analyze content with AI
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { container } from 'tsyringe';
import { AnalyzeContentUseCase } from '../../application/use-cases/AnalyzeContentUseCase';
import { IAnalysisRepository } from '../../domain/repositories/IAnalysisRepository';
import { AppError } from '../../shared/errors/AppError';

/**
 * Analysis Routes
 *
 * Handles content analysis API endpoints using AI.
 *
 * Endpoints:
 * - GET /api/analyses - List all analyses
 * - POST /api/analyze - Analyze content with AI
 */

interface AnalyzeContentBody {
  contentId: string;
  analysisType?: string;
  metadata?: Record<string, any>;
}

export async function analysisRoutes(fastify: FastifyInstance) {
  const analyzeContentUseCase = container.resolve(AnalyzeContentUseCase);

  fastify.get('/api/analyses', {
    schema: {
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              contentId: { type: 'string' },
              status: { type: 'string', enum: ['pending', 'processing', 'completed', 'failed'] },
              results: { type: 'object' },
              error: { type: 'string' },
              metadata: { type: 'object' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const analysisRepository = container.resolve<IAnalysisRepository>('IAnalysisRepository');
      const analyses = await analysisRepository.findMany();

      return reply.send(analyses.map(analysis => analysis.toJSON()));
    } catch (error) {
      if (error instanceof AppError) {
        throw error; // Let error handler manage it
      }
      throw new AppError('Failed to fetch analyses', 500);
    }
  });

  fastify.post('/api/analyze', {
    schema: {
      body: {
        type: 'object',
        required: ['contentId'],
        properties: {
          contentId: { type: 'string' },
          analysisType: { type: 'string' },
          metadata: { type: 'object' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            analysis: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                contentId: { type: 'string' },
                status: { type: 'string', enum: ['pending', 'processing', 'completed', 'failed'] },
                results: { type: 'object' },
                error: { type: 'string' },
                metadata: { type: 'object' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
              },
            },
            queued: { type: 'boolean' },
          },
        },
      },
    },
  }, async (request: FastifyRequest<{ Body: AnalyzeContentBody }>, reply: FastifyReply) => {
    try {
      const { contentId, analysisType, metadata } = request.body;

      // Validate contentId format
      if (!contentId || typeof contentId !== 'string' || contentId.length < 10) {
        throw new AppError('Invalid content ID format', 400);
      }

      // Validate analysisType if provided
      const validAnalysisTypes = ['sentiment', 'topics', 'keywords', 'summary', 'entities'];
      if (analysisType && !validAnalysisTypes.includes(analysisType)) {
        throw new AppError(`Invalid analysis type. Must be one of: ${validAnalysisTypes.join(', ')}`, 400);
      }

      const result = await analyzeContentUseCase.execute({
        contentId,
        analysisType,
        metadata,
      });

      return reply.send({
        analysis: result.analysis.toJSON(),
        queued: result.queued,
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error; // Let error handler manage it
      }
      throw new AppError('Failed to analyze content', 500);
    }
  });
}