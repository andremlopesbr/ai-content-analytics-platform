import { injectable, inject } from 'tsyringe';
import { Analysis, AnalysisStatus } from '../../domain/entities/Analysis';
import { IAnalysisRepository } from '../../domain/repositories/IAnalysisRepository';
import { IContentRepository } from '../../domain/repositories/IContentRepository';
import { AppError } from '../../shared/errors/AppError';

export interface AnalyzeContentRequest {
  contentId: string;
  analysisType?: string;
  metadata?: Record<string, any>;
}

export interface AnalyzeContentResponse {
  analysis: Analysis;
  queued: boolean;
}

@injectable()
export class AnalyzeContentUseCase {
  constructor(
    @inject('IAnalysisRepository') private analysisRepository: IAnalysisRepository,
    @inject('IContentRepository') private contentRepository: IContentRepository,
  ) { }

  async execute(request: AnalyzeContentRequest): Promise<AnalyzeContentResponse> {
    // Check if content exists
    const content = await this.contentRepository.findById(request.contentId);
    if (!content) {
      throw new AppError(`Content with ID ${request.contentId} not found`, 404);
    }

    // Check if analysis already exists and is completed
    const existingAnalyses = await this.analysisRepository.findByContentId(request.contentId);
    const completedAnalysis = existingAnalyses.find(a => a.status === AnalysisStatus.COMPLETED);
    if (completedAnalysis) {
      return { analysis: completedAnalysis, queued: false };
    }

    // Check if analysis is already pending/processing
    const pendingAnalysis = existingAnalyses.find(a =>
      a.status === AnalysisStatus.PENDING || a.status === AnalysisStatus.PROCESSING
    );
    if (pendingAnalysis) {
      return { analysis: pendingAnalysis, queued: false };
    }

    // Create new analysis
    const analysis = await this.analysisRepository.create({
      contentId: request.contentId,
      status: AnalysisStatus.PENDING,
      metadata: {
        analysisType: request.analysisType || 'general',
        ...request.metadata,
      },
    });

    // TODO: Queue analysis job for background processing
    // This would typically use Bull or similar queue system
    await this.queueAnalysis(analysis.id);

    return { analysis, queued: true };
  }

  private async queueAnalysis(analysisId: string): Promise<void> {
    // Execute immediately for debugging purposes
    console.log(`Analysis ${analysisId} queued for processing`);

    // Execute analysis immediately
    await this.performAnalysis(analysisId);
  }

  private async performAnalysis(analysisId: string): Promise<void> {
    try {
      const analysis = await this.analysisRepository.findById(analysisId);
      if (!analysis) return;

      // Mark as processing
      await this.analysisRepository.update(analysisId, { status: AnalysisStatus.PROCESSING });

      // TODO: Implement actual AI analysis using Google Generative AI
      const results = await this.performAIAnalysis(analysis.contentId);

      // Mark as completed
      await this.analysisRepository.update(analysisId, {
        status: AnalysisStatus.COMPLETED,
        results,
      });
    } catch (error) {
      // Mark as failed
      await this.analysisRepository.update(analysisId, {
        status: AnalysisStatus.FAILED,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private async performAIAnalysis(contentId: string): Promise<Record<string, any>> {
    // Placeholder AI analysis implementation
    // In a real implementation, this would use Google Generative AI

    const content = await this.contentRepository.findById(contentId);
    if (!content) {
      throw new Error('Content not found for analysis');
    }

    return {
      sentiment: 'positive',
      keywords: ['tecnologia', 'inovação', 'desenvolvimento'],
      summary: `Resumo do conteúdo: ${content.title}`,
      readabilityScore: 75,
      wordCount: content.content.split(' ').length,
      language: 'pt-BR',
      analyzedAt: new Date(),
    };
  }
}