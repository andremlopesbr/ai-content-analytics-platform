import { FastifyInstance, FastifyError } from 'fastify';
import { AppError } from '../../shared/errors/AppError';

export function errorHandler(fastify: FastifyInstance) {
  fastify.setErrorHandler((error: FastifyError, request, reply) => {
    // Log error for debugging
    fastify.log.error(error);

    // Handle custom AppError instances
    if (error instanceof AppError) {
      return reply.code(error.statusCode).send({
        error: {
          message: error.message,
          statusCode: error.statusCode,
        },
      });
    }

    // Handle Fastify validation errors
    if (error.validation) {
      return reply.code(400).send({
        error: {
          message: 'Validation error',
          statusCode: 400,
          details: error.validation,
        },
      });
    }

    // Handle other errors
    const statusCode = error.statusCode || 500;
    const message = statusCode === 500 ? 'Internal server error' : error.message;

    return reply.code(statusCode).send({
      error: {
        message,
        statusCode,
      },
    });
  });
}