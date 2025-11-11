import { Report, ReportType } from '../entities/Report';

export interface CreateReportData {
  title: string;
  type: ReportType;
  contentIds?: string[];
  analysisIds?: string[];
  data: Record<string, any>;
  metadata?: Record<string, any>;
  generatedBy?: string;
}

export interface UpdateReportData {
  title?: string;
  data?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface ReportFilter {
  type?: ReportType;
  generatedBy?: string;
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface IReportRepository {
  create(data: CreateReportData): Promise<Report>;
  findById(id: string): Promise<Report | null>;
  findMany(filter?: ReportFilter, limit?: number, offset?: number): Promise<Report[]>;
  update(id: string, data: UpdateReportData): Promise<Report | null>;
  delete(id: string): Promise<boolean>;
  exists(id: string): Promise<boolean>;
  count(filter?: ReportFilter): Promise<number>;
  findByType(type: ReportType): Promise<Report[]>;
  findByGeneratedBy(generatedBy: string): Promise<Report[]>;
}