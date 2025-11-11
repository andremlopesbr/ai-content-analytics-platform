import { Analysis, AnalysisStatus } from '../entities/Analysis';

export interface CreateAnalysisData {
  contentId: string;
  status?: AnalysisStatus;
  results?: Record<string, any>;
  error?: string;
  metadata?: Record<string, any>;
}

export interface UpdateAnalysisData {
  status?: AnalysisStatus;
  results?: Record<string, any>;
  error?: string;
  metadata?: Record<string, any>;
}

export interface AnalysisFilter {
  contentId?: string;
  status?: AnalysisStatus;
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface IAnalysisRepository {
  create(data: CreateAnalysisData): Promise<Analysis>;
  findById(id: string): Promise<Analysis | null>;
  findByContentId(contentId: string): Promise<Analysis[]>;
  findMany(filter?: AnalysisFilter, limit?: number, offset?: number): Promise<Analysis[]>;
  update(id: string, data: UpdateAnalysisData): Promise<Analysis | null>;
  delete(id: string): Promise<boolean>;
  exists(id: string): Promise<boolean>;
  count(filter?: AnalysisFilter): Promise<number>;
  findPending(): Promise<Analysis[]>;
  findByStatus(status: AnalysisStatus): Promise<Analysis[]>;
}