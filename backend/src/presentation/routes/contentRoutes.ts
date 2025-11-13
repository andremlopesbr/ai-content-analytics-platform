/**
 * Content Routes
 *
 * Handles content-related API endpoints including scraping and retrieval.
 *
 * Endpoints:
 * - POST /api/scrape - Scrape content from a URL
 * - POST /api/scrape/blog - Scrape multiple posts from a blog
 * - POST /api/scrape/schedule - Schedule recurring scrapes
 * - GET /api/content/:id - Retrieve content by ID
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { container } from 'tsyringe';
import { ScrapeContentUseCase } from '../../application/use-cases/ScrapeContentUseCase';
import { ScrapeBlogUseCase } from '../../application/use-cases/ScrapeBlogUseCase';
import { ScheduleScrapeUseCase } from '../../application/use-cases/ScheduleScrapeUseCase';
import { IContentRepository } from '../../domain/repositories/IContentRepository';
import { AppError } from '../../shared/errors/AppError';

interface ScrapeContentBody {
  url: string;
  title?: string;
  author?: string;
  publishedAt?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

interface ScrapeBlogBody {
  blogUrl: string;
  postIdentifierPattern: string;
  options?: {
    maxPosts?: number;
    timeout?: number;
  };
}

interface ScheduleScrapeBody {
  cronExpression: string;
  scrapeType: 'blog' | 'content';
  scrapeRequest: ScrapeBlogBody | { url: string; title?: string; author?: string; publishedAt?: string; tags?: string[]; metadata?: Record<string, any> };
  jobName?: string;
}

interface GetContentParams {
  id: string;
}

export async function contentRoutes(fastify: FastifyInstance) {
  const scrapeContentUseCase = container.resolve(ScrapeContentUseCase);
  const scrapeBlogUseCase = container.resolve(ScrapeBlogUseCase);
  const scheduleScrapeUseCase = container.resolve(ScheduleScrapeUseCase);

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
      // Validate URL format
      const url = new URL(request.body.url);
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new AppError('Invalid URL protocol. Only HTTP and HTTPS are supported.', 400);
      }

      const { title, author, publishedAt, tags, metadata } = request.body;

      const result = await scrapeContentUseCase.execute({
        url: request.body.url,
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
      if (error instanceof AppError) {
        throw error; // Let error handler manage it
      }
      throw new AppError('Failed to scrape content', 500);
    }
  });

  fastify.post('/api/scrape/blog', {
    schema: {
      body: {
        type: 'object',
        required: ['blogUrl', 'postIdentifierPattern'],
        properties: {
          blogUrl: { type: 'string', format: 'uri' },
          postIdentifierPattern: { type: 'string', minLength: 1 },
          options: {
            type: 'object',
            properties: {
              maxPosts: { type: 'number', minimum: 1, maximum: 100 },
              timeout: { type: 'number', minimum: 1000, maximum: 300000 },
            },
          },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            contents: {
              type: 'array',
              items: {
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
            scrapedCount: { type: 'number' },
            skippedCount: { type: 'number' },
          },
        },
      },
    },
  }, async (request: FastifyRequest<{ Body: ScrapeBlogBody }>, reply: FastifyReply) => {
    try {
      // Validate blog URL format
      const blogUrl = new URL(request.body.blogUrl);
      if (!['http:', 'https:'].includes(blogUrl.protocol)) {
        throw new AppError('Invalid blog URL protocol. Only HTTP and HTTPS are supported.', 400);
      }

      // Validate post identifier pattern
      if (!request.body.postIdentifierPattern || request.body.postIdentifierPattern.trim().length === 0) {
        throw new AppError('Post identifier pattern is required and cannot be empty.', 400);
      }

      const result = await scrapeBlogUseCase.execute(request.body);

      return reply.send({
        contents: result.contents.map(content => content.toJSON()),
        scrapedCount: result.scrapedCount,
        skippedCount: result.skippedCount,
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error; // Let error handler manage it
      }
      throw new AppError('Failed to scrape blog posts', 500);
    }
  });

  fastify.post('/api/scrape/schedule', {
    schema: {
      body: {
        type: 'object',
        required: ['cronExpression', 'scrapeType', 'scrapeRequest'],
        properties: {
          cronExpression: { type: 'string', minLength: 1 },
          scrapeType: { type: 'string', enum: ['blog', 'content'] },
          scrapeRequest: {
            oneOf: [
              {
                type: 'object',
                required: ['blogUrl', 'postIdentifierPattern'],
                properties: {
                  blogUrl: { type: 'string', format: 'uri' },
                  postIdentifierPattern: { type: 'string', minLength: 1 },
                  options: {
                    type: 'object',
                    properties: {
                      maxPosts: { type: 'number', minimum: 1, maximum: 100 },
                      timeout: { type: 'number', minimum: 1000, maximum: 300000 },
                    },
                  },
                },
              },
              {
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
            ],
          },
          jobName: { type: 'string', minLength: 1 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            jobId: { type: 'string' },
            scheduled: { type: 'boolean' },
            nextRun: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  }, async (request: FastifyRequest<{ Body: ScheduleScrapeBody }>, reply: FastifyReply) => {
    try {
      const { cronExpression, scrapeType, scrapeRequest, jobName } = request.body;

      // Validate cron expression (basic validation)
      if (!cronExpression || cronExpression.trim().length === 0) {
        throw new AppError('Cron expression is required and cannot be empty.', 400);
      }

      // Validate scrape type
      if (!['blog', 'content'].includes(scrapeType)) {
        throw new AppError('Scrape type must be either "blog" or "content".', 400);
      }

      // Validate scrape request based on type
      if (scrapeType === 'blog') {
        const blogRequest = scrapeRequest as ScrapeBlogBody;
        if (!blogRequest.blogUrl || !blogRequest.postIdentifierPattern) {
          throw new AppError('Blog scraping requires blogUrl and postIdentifierPattern.', 400);
        }
        const blogUrl = new URL(blogRequest.blogUrl);
        if (!['http:', 'https:'].includes(blogUrl.protocol)) {
          throw new AppError('Invalid blog URL protocol. Only HTTP and HTTPS are supported.', 400);
        }
      } else if (scrapeType === 'content') {
        const contentRequest = scrapeRequest as { url: string };
        if (!contentRequest.url) {
          throw new AppError('Content scraping requires url.', 400);
        }
        const url = new URL(contentRequest.url);
        if (!['http:', 'https:'].includes(url.protocol)) {
          throw new AppError('Invalid URL protocol. Only HTTP and HTTPS are supported.', 400);
        }
      }

      const result = await scheduleScrapeUseCase.scheduleScrape({
        cronExpression,
        scrapeType,
        scrapeRequest,
        jobName,
      });

      return reply.send({
        jobId: result.jobId,
        scheduled: result.scheduled,
        nextRun: result.nextRun.toISOString(),
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error; // Let error handler manage it
      }
      throw new AppError('Failed to schedule scrape', 500);
    }
  });

  fastify.get('/api/contents', {
    schema: {
      response: {
        200: {
          type: 'array',
          items: {
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
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const contentRepository = container.resolve<IContentRepository>('IContentRepository');
      const contents = await contentRepository.findMany();

      return reply.send(contents.map(content => content.toJSON()));
    } catch (error) {
      if (error instanceof AppError) {
        throw error; // Let error handler manage it
      }
      throw new AppError('Failed to fetch contents', 500);
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

      // Validate ID format (assuming UUID or MongoDB ObjectId)
      if (!id || typeof id !== 'string' || id.length < 10) {
        throw new AppError('Invalid content ID format', 400);
      }

      const contentRepository = container.resolve<IContentRepository>('IContentRepository');
      const content = await contentRepository.findById(id);

      if (!content) {
        throw new AppError('Content not found', 404);
      }

      return reply.send(content.toJSON());
    } catch (error) {
      if (error instanceof AppError) {
        throw error; // Let error handler manage it
      }
      throw new AppError('Failed to fetch content', 500);
    }
  });
}