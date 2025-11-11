import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { container } from 'tsyringe';
import { AnalyzeContentUseCase } from '../../application/use-cases/AnalyzeContentUseCase';
import { IAnalysisRepository } from '../../domain/repositories/IAnalysisRepository';

interface AnalyzeContentBody {
  contentId: string;
  analysisType?: string;
  metadata?: Record<string, any>;
}

export async function analysisRoutes(fastify: FastifyInstance) {
  const analyzeContentUseCase = container.resolve(AnalyzeContentUseCase);

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
      const message = error instanceof Error ? error.message : 'Failed to analyze content';
      return reply.code(400).send({ error: message });
    }
  });
}