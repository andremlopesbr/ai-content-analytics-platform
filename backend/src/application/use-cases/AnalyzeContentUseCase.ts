import { injectable, inject } from 'tsyringe';
import { Analysis, AnalysisStatus } from '../../domain/entities/Analysis';
import { IAnalysisRepository } from '../../domain/repositories/IAnalysisRepository';
import { IContentRepository } from '../../domain/repositories/IContentRepository';
import { GeminiAIService, AIAnalysisRequest } from '../../infrastructure/ai/GeminiAIService';
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
    @inject(GeminiAIService) private geminiAIService: GeminiAIService,
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

      // Perform actual AI analysis using Google Gemini AI
      const results = await this.performAIAnalysis(analysis.contentId);

      // Mark as completed
      await this.analysisRepository.update(analysisId, {
        status: AnalysisStatus.COMPLETED,
        results,
      });
    } catch (error) {
      // Log detailed error for debugging
      console.error(`Analysis ${analysisId} failed:`, error);

      // Mark as failed with truncated error message (max 500 chars)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const truncatedError = errorMessage.length > 500 ?
        errorMessage.substring(0, 500) + '...' : errorMessage;

      await this.analysisRepository.update(analysisId, {
        status: AnalysisStatus.FAILED,
        error: truncatedError,
      });
    }
  }

  private async performAIAnalysis(contentId: string): Promise<Record<string, any>> {
    const content = await this.contentRepository.findById(contentId);
    if (!content) {
      throw new Error('Content not found for analysis');
    }

    // Prepare request for Gemini AI
    const aiRequest: AIAnalysisRequest = {
      content: content.content,
      title: content.title,
      analysisType: 'comprehensive', // Can be made configurable later
      metadata: {
        author: content.author,
        publishedAt: content.publishedAt,
        tags: content.tags,
      },
    };

    // Call Gemini AI service
    const aiResponse = await this.geminiAIService.analyzeContent(aiRequest);

    // Return standardized response format
    return {
      sentiment: aiResponse.sentiment,
      topics: aiResponse.topics,
      keywords: aiResponse.keywords,
      summary: aiResponse.summary,
      entities: aiResponse.entities,
      readabilityScore: aiResponse.readabilityScore,
      wordCount: aiResponse.wordCount,
      language: aiResponse.language,
      confidence: aiResponse.confidence,
      analyzedAt: new Date(),
    };
  }
}