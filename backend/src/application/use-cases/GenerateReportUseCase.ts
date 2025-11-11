import { injectable, inject } from 'tsyringe';
import { Report, ReportType } from '../../domain/entities/Report';
import { IReportRepository } from '../../domain/repositories/IReportRepository';
import { IAnalysisRepository } from '../../domain/repositories/IAnalysisRepository';
import { IContentRepository } from '../../domain/repositories/IContentRepository';

export interface GenerateReportRequest {
  title: string;
  type: ReportType;
  contentIds?: string[];
  analysisIds?: string[];
  filters?: {
    dateRange?: { from: Date; to: Date };
    tags?: string[];
    authors?: string[];
  };
  generatedBy?: string;
}

export interface GenerateReportResponse {
  report: Report;
}

@injectable()
export class GenerateReportUseCase {
  constructor(
    @inject('IReportRepository') private reportRepository: IReportRepository,
    @inject('IAnalysisRepository') private analysisRepository: IAnalysisRepository,
    @inject('IContentRepository') private contentRepository: IContentRepository,
  ) {}

  async execute(request: GenerateReportRequest): Promise<GenerateReportResponse> {
    const { contentIds, analysisIds } = await this.collectDataIds(request);

    const reportData = await this.generateReportData(request.type, contentIds, analysisIds);

    const report = await this.reportRepository.create({
      title: request.title,
      type: request.type,
      contentIds,
      analysisIds,
      data: reportData,
      metadata: {
        filters: request.filters,
        generatedAt: new Date(),
      },
      generatedBy: request.generatedBy,
    });

    return { report };
  }

  private async collectDataIds(request: GenerateReportRequest): Promise<{
    contentIds: string[];
    analysisIds: string[];
  }> {
    let contentIds = request.contentIds || [];
    let analysisIds = request.analysisIds || [];

    // If no specific IDs provided, collect based on filters
    if (contentIds.length === 0 && analysisIds.length === 0 && request.filters) {
      const contents = await this.contentRepository.findMany({
        publishedAfter: request.filters.dateRange?.from,
        publishedBefore: request.filters.dateRange?.to,
        tags: request.filters.tags,
      });

      contentIds = contents.map(c => c.id);

      // Get analyses for these contents
      const allAnalyses = await Promise.all(
        contentIds.map(id => this.analysisRepository.findByContentId(id))
      );
      analysisIds = allAnalyses.flat().map(a => a.id);
    }

    return { contentIds, analysisIds };
  }

  private async generateReportData(
    type: ReportType,
    contentIds: string[],
    analysisIds: string[]
  ): Promise<Record<string, any>> {
    switch (type) {
      case ReportType.CONTENT_SUMMARY:
        return await this.generateContentSummary(contentIds);
      case ReportType.TREND_ANALYSIS:
        return await this.generateTrendAnalysis(contentIds, analysisIds);
      case ReportType.PERFORMANCE_METRICS:
        return await this.generatePerformanceMetrics(analysisIds);
      default:
        return await this.generateCustomReport(contentIds, analysisIds);
    }
  }

  private async generateContentSummary(contentIds: string[]): Promise<Record<string, any>> {
    const contents = await Promise.all(
      contentIds.map(id => this.contentRepository.findById(id))
    );
    const validContents = contents.filter(c => c !== null) as any[];

    const totalContents = validContents.length;
    const uniqueAuthors = new Set(validContents.map(c => c.author).filter(Boolean)).size;
    const allTags = validContents.flatMap(c => c.tags || []);
    const tagFrequency = allTags.reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      summary: {
        totalContents,
        uniqueAuthors,
        dateRange: {
          from: validContents.length > 0 ? Math.min(...validContents.map(c => c.createdAt.getTime())) : null,
          to: validContents.length > 0 ? Math.max(...validContents.map(c => c.createdAt.getTime())) : null,
        },
      },
      topTags: Object.entries(tagFrequency)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 10),
    };
  }

  private async generateTrendAnalysis(contentIds: string[], analysisIds: string[]): Promise<Record<string, any>> {
    const analyses = await Promise.all(
      analysisIds.map(id => this.analysisRepository.findById(id))
    );
    const validAnalyses = analyses.filter(a => a !== null && a.results) as any[];

    const sentiments = validAnalyses.map(a => a.results.sentiment);
    const sentimentDistribution = sentiments.reduce((acc, sentiment) => {
      acc[sentiment] = (acc[sentiment] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const keywords = validAnalyses.flatMap(a => a.results.keywords || []);
    const keywordFrequency = keywords.reduce((acc, keyword) => {
      acc[keyword] = (acc[keyword] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      trends: {
        sentimentDistribution,
        topKeywords: Object.entries(keywordFrequency)
          .sort(([, a], [, b]) => (b as number) - (a as number))
          .slice(0, 20),
        averageReadability: validAnalyses.reduce((sum, a) => sum + (a.results.readabilityScore || 0), 0) / validAnalyses.length,
      },
    };
  }

  private async generatePerformanceMetrics(analysisIds: string[]): Promise<Record<string, any>> {
    const analyses = await Promise.all(
      analysisIds.map(id => this.analysisRepository.findById(id))
    );
    const validAnalyses = analyses.filter(a => a !== null) as any[];

    const completedAnalyses = validAnalyses.filter(a => a.status === 'completed');
    const failedAnalyses = validAnalyses.filter(a => a.status === 'failed');

    const averageProcessingTime = completedAnalyses.length > 0
      ? completedAnalyses.reduce((sum, a) => sum + (a.updatedAt.getTime() - a.createdAt.getTime()), 0) / completedAnalyses.length
      : 0;

    return {
      metrics: {
        totalAnalyses: validAnalyses.length,
        completedAnalyses: completedAnalyses.length,
        failedAnalyses: failedAnalyses.length,
        successRate: validAnalyses.length > 0 ? (completedAnalyses.length / validAnalyses.length) * 100 : 0,
        averageProcessingTimeMs: averageProcessingTime,
      },
    };
  }

  private async generateCustomReport(contentIds: string[], analysisIds: string[]): Promise<Record<string, any>> {
    return {
      custom: {
        contentCount: contentIds.length,
        analysisCount: analysisIds.length,
        generatedAt: new Date(),
      },
    };
  }
}