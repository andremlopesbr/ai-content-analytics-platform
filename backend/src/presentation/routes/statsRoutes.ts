/**
 * Statistics Routes
 *
 * Handles statistics and analytics API endpoints.
 *
 * Endpoints:
 * - GET /api/stats - Get platform statistics
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { container } from 'tsyringe';
import { IContentRepository } from '../../domain/repositories/IContentRepository';
import { IAnalysisRepository } from '../../domain/repositories/IAnalysisRepository';
import { IReportRepository } from '../../domain/repositories/IReportRepository';
import { AnalysisStatus, ReportType } from '../../domain/entities';
import { AppError } from '../../shared/errors/AppError';

export async function statsRoutes(fastify: FastifyInstance) {
  fastify.get('/api/stats', {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            totalContents: { type: 'number' },
            totalAnalyses: { type: 'number' },
            totalReports: { type: 'number' },
            contentsByStatus: {
              type: 'object',
              properties: {
                analyzed: { type: 'number' },
                pending: { type: 'number' },
              },
            },
            analysesByStatus: {
              type: 'object',
              properties: {
                pending: { type: 'number' },
                processing: { type: 'number' },
                completed: { type: 'number' },
                failed: { type: 'number' },
              },
            },
            reportsByType: {
              type: 'object',
              properties: {
                content_summary: { type: 'number' },
                trend_analysis: { type: 'number' },
                performance_metrics: { type: 'number' },
                custom: { type: 'number' },
              },
            },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const contentRepository = container.resolve<IContentRepository>('IContentRepository');
      const analysisRepository = container.resolve<IAnalysisRepository>('IAnalysisRepository');
      const reportRepository = container.resolve<IReportRepository>('IReportRepository');

      // Get basic counts with error handling
      let totalContents: number, totalAnalyses: number, totalReports: number;
      try {
        [totalContents, totalAnalyses, totalReports] = await Promise.all([
          contentRepository.count(),
          analysisRepository.count(),
          reportRepository.count(),
        ]);
      } catch (dbError) {
        throw new AppError('Database connection error', 503);
      }

      // Get analyses by status with fallback for missing methods
      let pendingAnalyses: any[] = [], processingAnalyses: any[] = [], completedAnalyses: any[] = [], failedAnalyses: any[] = [];
      try {
        [pendingAnalyses, processingAnalyses, completedAnalyses, failedAnalyses] = await Promise.all([
          analysisRepository.findByStatus?.(AnalysisStatus.PENDING) || Promise.resolve([]),
          analysisRepository.findByStatus?.(AnalysisStatus.PROCESSING) || Promise.resolve([]),
          analysisRepository.findByStatus?.(AnalysisStatus.COMPLETED) || Promise.resolve([]),
          analysisRepository.findByStatus?.(AnalysisStatus.FAILED) || Promise.resolve([]),
        ]);
      } catch (analysisError) {
        // Log warning but don't fail the entire request
        console.warn('Could not fetch analysis status counts:', analysisError);
      }

      // Get reports by type with fallback
      let contentSummaryReports: any[] = [], trendAnalysisReports: any[] = [], performanceReports: any[] = [], customReports: any[] = [];
      try {
        [contentSummaryReports, trendAnalysisReports, performanceReports, customReports] = await Promise.all([
          reportRepository.findByType?.(ReportType.CONTENT_SUMMARY) || Promise.resolve([]),
          reportRepository.findByType?.(ReportType.TREND_ANALYSIS) || Promise.resolve([]),
          reportRepository.findByType?.(ReportType.PERFORMANCE_METRICS) || Promise.resolve([]),
          reportRepository.findByType?.(ReportType.CUSTOM) || Promise.resolve([]),
        ]);
      } catch (reportError) {
        // Log warning but don't fail the entire request
        console.warn('Could not fetch report type counts:', reportError);
      }

      // Calculate contents with analyses with error handling
      let contentsWithAnalyses = new Set<string>();
      try {
        const allContents = await contentRepository.findMany();
        if (allContents.length > 0) {
          const analyses = await Promise.all(
            allContents.map(c => analysisRepository.findByContentId?.(c.id) || Promise.resolve([]))
          );
          contentsWithAnalyses = new Set(
            analyses.flat().map(a => a?.contentId).filter(Boolean)
          );
        }
      } catch (calcError) {
        // Log warning but continue with empty set
        console.warn('Could not calculate analyzed contents:', calcError);
      }

      return reply.send({
        totalContents,
        totalAnalyses,
        totalReports,
        contentsByStatus: {
          analyzed: contentsWithAnalyses.size,
          pending: Math.max(0, totalContents - contentsWithAnalyses.size),
        },
        analysesByStatus: {
          pending: Array.isArray(pendingAnalyses) ? pendingAnalyses.length : 0,
          processing: Array.isArray(processingAnalyses) ? processingAnalyses.length : 0,
          completed: Array.isArray(completedAnalyses) ? completedAnalyses.length : 0,
          failed: Array.isArray(failedAnalyses) ? failedAnalyses.length : 0,
        },
        reportsByType: {
          content_summary: Array.isArray(contentSummaryReports) ? contentSummaryReports.length : 0,
          trend_analysis: Array.isArray(trendAnalysisReports) ? trendAnalysisReports.length : 0,
          performance_metrics: Array.isArray(performanceReports) ? performanceReports.length : 0,
          custom: Array.isArray(customReports) ? customReports.length : 0,
        },
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error; // Let error handler manage it
      }
      throw new AppError('Failed to fetch statistics', 500);
    }
  });
}