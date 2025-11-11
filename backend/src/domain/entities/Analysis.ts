import { v4 as uuidv4 } from 'uuid';

export enum AnalysisStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface AnalysisData {
  contentId: string;
  status: AnalysisStatus;
  results?: Record<string, any>;
  error?: string;
  metadata?: Record<string, any>;
}

export class Analysis {
  public readonly id: string;
  public readonly contentId: string;
  public readonly status: AnalysisStatus;
  public readonly results?: Record<string, any>;
  public readonly error?: string;
  public readonly metadata?: Record<string, any>;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(data: AnalysisData & { id?: string; createdAt?: Date; updatedAt?: Date }) {
    this.id = data.id || uuidv4();
    this.contentId = data.contentId;
    this.status = data.status;
    this.results = data.results;
    this.error = data.error;
    this.metadata = data.metadata;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  update(data: Partial<AnalysisData>): Analysis {
    return new Analysis({
      ...this,
      ...data,
      updatedAt: new Date(),
    });
  }

  markAsProcessing(): Analysis {
    return this.update({ status: AnalysisStatus.PROCESSING });
  }

  markAsCompleted(results: Record<string, any>): Analysis {
    return this.update({ status: AnalysisStatus.COMPLETED, results });
  }

  markAsFailed(error: string): Analysis {
    return this.update({ status: AnalysisStatus.FAILED, error });
  }

  toJSON() {
    return {
      id: this.id,
      contentId: this.contentId,
      status: this.status,
      results: this.results,
      error: this.error,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}