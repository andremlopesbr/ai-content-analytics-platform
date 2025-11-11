import { injectable } from 'tsyringe';
import { Report, ReportType } from '../../domain/entities/Report';
import { IReportRepository, CreateReportData, UpdateReportData, ReportFilter } from '../../domain/repositories/IReportRepository';
import ReportModel, { IReportDocument } from './schemas/ReportSchema';
import { databaseConnection } from './connection';
import { AppError } from '../../shared/errors/AppError';

@injectable()
export class MongoReportRepository implements IReportRepository {
  constructor() {
    // Ensure database connection is established
    databaseConnection.connect().catch(error => {
      console.error('Failed to connect to MongoDB in ReportRepository:', error);
    });
  }

  private documentToEntity(doc: IReportDocument): Report {
    return new Report({
      id: doc._id,
      title: doc.title,
      type: doc.type,
      contentIds: doc.contentIds,
      analysisIds: doc.analysisIds,
      data: doc.data,
      metadata: doc.metadata,
      generatedBy: doc.generatedBy,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  async create(data: CreateReportData): Promise<Report> {
    try {
      const report = new Report(data);

      const doc = new ReportModel({
        _id: report.id,
        title: report.title,
        type: report.type,
        contentIds: report.contentIds,
        analysisIds: report.analysisIds,
        data: report.data,
        metadata: report.metadata,
        generatedBy: report.generatedBy,
        createdAt: report.createdAt,
        updatedAt: report.updatedAt,
      });

      await doc.save();
      return report;
    } catch (error: any) {
      throw new AppError(`Failed to create report: ${error.message}`, 500);
    }
  }

  async findById(id: string): Promise<Report | null> {
    try {
      const doc = await ReportModel.findById(id);
      return doc ? this.documentToEntity(doc) : null;
    } catch (error: any) {
      throw new AppError(`Failed to find report by ID: ${error.message}`, 500);
    }
  }

  async findMany(filter?: ReportFilter, limit?: number, offset?: number): Promise<Report[]> {
    try {
      let query: any = {};

      if (filter) {
        if (filter.type) query.type = filter.type;
        if (filter.generatedBy) query.generatedBy = filter.generatedBy;
        if (filter.createdAfter || filter.createdBefore) {
          query.createdAt = {};
          if (filter.createdAfter) query.createdAt.$gte = filter.createdAfter;
          if (filter.createdBefore) query.createdAt.$lte = filter.createdBefore;
        }
      }

      const docs = await ReportModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(offset || 0)
        .limit(limit || 50);

      return docs.map(doc => this.documentToEntity(doc));
    } catch (error: any) {
      throw new AppError(`Failed to find reports: ${error.message}`, 500);
    }
  }

  async update(id: string, data: UpdateReportData): Promise<Report | null> {
    try {
      const updateData: any = { ...data };
      updateData.updatedAt = new Date();

      const doc = await ReportModel.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );

      return doc ? this.documentToEntity(doc) : null;
    } catch (error: any) {
      throw new AppError(`Failed to update report: ${error.message}`, 500);
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const result = await ReportModel.findByIdAndDelete(id);
      return !!result;
    } catch (error: any) {
      throw new AppError(`Failed to delete report: ${error.message}`, 500);
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      const count = await ReportModel.countDocuments({ _id: id });
      return count > 0;
    } catch (error: any) {
      throw new AppError(`Failed to check report existence: ${error.message}`, 500);
    }
  }

  async count(filter?: ReportFilter): Promise<number> {
    try {
      let query: any = {};

      if (filter) {
        if (filter.type) query.type = filter.type;
        if (filter.generatedBy) query.generatedBy = filter.generatedBy;
        if (filter.createdAfter || filter.createdBefore) {
          query.createdAt = {};
          if (filter.createdAfter) query.createdAt.$gte = filter.createdAfter;
          if (filter.createdBefore) query.createdAt.$lte = filter.createdBefore;
        }
      }

      return await ReportModel.countDocuments(query);
    } catch (error: any) {
      throw new AppError(`Failed to count reports: ${error.message}`, 500);
    }
  }

  async findByType(type: ReportType): Promise<Report[]> {
    try {
      const docs = await ReportModel.find({ type }).sort({ createdAt: -1 });
      return docs.map(doc => this.documentToEntity(doc));
    } catch (error: any) {
      throw new AppError(`Failed to find reports by type: ${error.message}`, 500);
    }
  }

  async findByGeneratedBy(generatedBy: string): Promise<Report[]> {
    try {
      const docs = await ReportModel.find({ generatedBy }).sort({ createdAt: -1 });
      return docs.map(doc => this.documentToEntity(doc));
    } catch (error: any) {
      throw new AppError(`Failed to find reports by generatedBy: ${error.message}`, 500);
    }
  }
}