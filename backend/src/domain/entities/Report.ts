import { v4 as uuidv4 } from 'uuid';

export enum ReportType {
  CONTENT_SUMMARY = 'content_summary',
  TREND_ANALYSIS = 'trend_analysis',
  PERFORMANCE_METRICS = 'performance_metrics',
  CUSTOM = 'custom',
}

export interface ReportData {
  title: string;
  type: ReportType;
  contentIds?: string[];
  analysisIds?: string[];
  data: Record<string, any>;
  metadata?: Record<string, any>;
  generatedBy?: string;
}

export class Report {
  public readonly id: string;
  public readonly title: string;
  public readonly type: ReportType;
  public readonly contentIds?: string[];
  public readonly analysisIds?: string[];
  public readonly data: Record<string, any>;
  public readonly metadata?: Record<string, any>;
  public readonly generatedBy?: string;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(data: ReportData & { id?: string; createdAt?: Date; updatedAt?: Date }) {
    this.id = data.id || uuidv4();
    this.title = data.title;
    this.type = data.type;
    this.contentIds = data.contentIds;
    this.analysisIds = data.analysisIds;
    this.data = data.data;
    this.metadata = data.metadata;
    this.generatedBy = data.generatedBy;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  update(data: Partial<ReportData>): Report {
    return new Report({
      ...this,
      ...data,
      updatedAt: new Date(),
    });
  }

  addContentId(contentId: string): Report {
    const contentIds = this.contentIds ? [...this.contentIds, contentId] : [contentId];
    return this.update({ contentIds });
  }

  addAnalysisId(analysisId: string): Report {
    const analysisIds = this.analysisIds ? [...this.analysisIds, analysisId] : [analysisId];
    return this.update({ analysisIds });
  }

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      type: this.type,
      contentIds: this.contentIds,
      analysisIds: this.analysisIds,
      data: this.data,
      metadata: this.metadata,
      generatedBy: this.generatedBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}