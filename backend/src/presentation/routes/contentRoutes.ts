import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { container } from 'tsyringe';
import { ScrapeContentUseCase } from '../../application/use-cases/ScrapeContentUseCase';
import { IContentRepository } from '../../domain/repositories/IContentRepository';

interface ScrapeContentBody {
  url: string;
  title?: string;
  author?: string;
  publishedAt?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

interface GetContentParams {
  id: string;
}

export async function contentRoutes(fastify: FastifyInstance) {
  const scrapeContentUseCase = container.resolve(ScrapeContentUseCase);

  fastify.post('/api/scrape', {
    schema: {
      body: {
        type: 'object',
        required: ['url'],
        properties: {
          url: { type: 'string', format: 'uri' },
          title: { type: 'string' },
          author: { type: 'string' },
          publishedAt: { type: 'string', format: 'date-time' },
          tags: { type: 'array', items: { type: 'string' } },
          metadata: { type: 'object' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            content: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                title: { type: 'string' },
                content: { type: 'string' },
                url: { type: 'string' },
                author: { type: 'string' },
                publishedAt: { type: 'string', format: 'date-time' },
                tags: { type: 'array', items: { type: 'string' } },
                metadata: { type: 'object' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
              },
            },
            scraped: { type: 'boolean' },
          },
        },
      },
    },
  }, async (request: FastifyRequest<{ Body: ScrapeContentBody }>, reply: FastifyReply) => {
    try {
      const { url, title, author, publishedAt, tags, metadata } = request.body;

      const result = await scrapeContentUseCase.execute({
        url,
        title,
        author,
        publishedAt: publishedAt ? new Date(publishedAt) : undefined,
        tags,
        metadata,
      });

      return reply.send({
        content: result.content.toJSON(),
        scraped: result.scraped,
      });
    } catch (error) {
      return reply.code(400).send({ error: 'Failed to scrape content' });
    }
  });

  fastify.get('/api/content/:id', {
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
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            content: { type: 'string' },
            url: { type: 'string' },
            author: { type: 'string' },
            publishedAt: { type: 'string', format: 'date-time' },
            tags: { type: 'array', items: { type: 'string' } },
            metadata: { type: 'object' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  }, async (request: FastifyRequest<{ Params: GetContentParams }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const contentRepository = container.resolve<IContentRepository>('IContentRepository');

      const content = await contentRepository.findById(id);

      if (!content) {
        return reply.code(404).send({ error: 'Content not found' });
      }

      return reply.send(content.toJSON());
    } catch (error) {
      return reply.code(500).send({ error: 'Failed to fetch content' });
    }
  });
}