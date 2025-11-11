import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { container } from 'tsyringe';
import { IContentRepository } from '../../domain/repositories/IContentRepository';
import { IAnalysisRepository } from '../../domain/repositories/IAnalysisRepository';
import { IReportRepository } from '../../domain/repositories/IReportRepository';
import { AnalysisStatus, ReportType } from '../../domain/entities';

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

      // Get basic counts
      const [totalContents, totalAnalyses, totalReports] = await Promise.all([
        contentRepository.count(),
        analysisRepository.count(),
        reportRepository.count(),
      ]);

      // Get analyses by status
      const [pendingAnalyses, processingAnalyses, completedAnalyses, failedAnalyses] = await Promise.all([
        analysisRepository.findByStatus(AnalysisStatus.PENDING),
        analysisRepository.findByStatus(AnalysisStatus.PROCESSING),
        analysisRepository.findByStatus(AnalysisStatus.COMPLETED),
        analysisRepository.findByStatus(AnalysisStatus.FAILED),
      ]);

      // Get reports by type
      const [contentSummaryReports, trendAnalysisReports, performanceReports, customReports] = await Promise.all([
        reportRepository.findByType(ReportType.CONTENT_SUMMARY),
        reportRepository.findByType(ReportType.TREND_ANALYSIS),
        reportRepository.findByType(ReportType.PERFORMANCE_METRICS),
        reportRepository.findByType(ReportType.CUSTOM),
      ]);

      // Calculate contents with analyses
      const allContents = await contentRepository.findMany();
      const contentsWithAnalyses = new Set(
        (await Promise.all(
          allContents.map(c => analysisRepository.findByContentId(c.id))
        ))
        .flat()
        .map(a => a.contentId)
      );

      return reply.send({
        totalContents,
        totalAnalyses,
        totalReports,
        contentsByStatus: {
          analyzed: contentsWithAnalyses.size,
          pending: totalContents - contentsWithAnalyses.size,
        },
        analysesByStatus: {
          pending: pendingAnalyses.length,
          processing: processingAnalyses.length,
          completed: completedAnalyses.length,
          failed: failedAnalyses.length,
        },
        reportsByType: {
          content_summary: contentSummaryReports.length,
          trend_analysis: trendAnalysisReports.length,
          performance_metrics: performanceReports.length,
          custom: customReports.length,
        },
      });
    } catch (error) {
      return reply.code(500).send({ error: 'Failed to fetch statistics' });
    }
  });
}