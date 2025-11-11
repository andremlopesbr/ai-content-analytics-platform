import { injectable } from 'tsyringe';
import { Analysis, AnalysisStatus } from '../../domain/entities/Analysis';
import { IAnalysisRepository, CreateAnalysisData, UpdateAnalysisData, AnalysisFilter } from '../../domain/repositories/IAnalysisRepository';
import AnalysisModel, { IAnalysisDocument } from './schemas/AnalysisSchema';
import { databaseConnection } from './connection';
import { AppError } from '../../shared/errors/AppError';

@injectable()
export class MongoAnalysisRepository implements IAnalysisRepository {
  constructor() {
    // Ensure database connection is established
    databaseConnection.connect().catch(error => {
      console.error('Failed to connect to MongoDB in AnalysisRepository:', error);
    });
  }

  private documentToEntity(doc: IAnalysisDocument): Analysis {
    return new Analysis({
      id: doc._id,
      contentId: doc.contentId,
      status: doc.status,
      results: doc.results,
      error: doc.error,
      metadata: doc.metadata,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  async create(data: CreateAnalysisData): Promise<Analysis> {
    try {
      const analysis = new Analysis({
        ...data,
        status: data.status || AnalysisStatus.PENDING,
      });

      const doc = new AnalysisModel({
        _id: analysis.id,
        contentId: analysis.contentId,
        status: analysis.status,
        results: analysis.results,
        error: analysis.error,
        metadata: analysis.metadata,
        createdAt: analysis.createdAt,
        updatedAt: analysis.updatedAt,
      });

      await doc.save();
      return analysis;
    } catch (error: any) {
      throw new AppError(`Failed to create analysis: ${error.message}`, 500);
    }
  }

  async findById(id: string): Promise<Analysis | null> {
    try {
      const doc = await AnalysisModel.findById(id);
      return doc ? this.documentToEntity(doc) : null;
    } catch (error: any) {
      throw new AppError(`Failed to find analysis by ID: ${error.message}`, 500);
    }
  }

  async findByContentId(contentId: string): Promise<Analysis[]> {
    try {
      const docs = await AnalysisModel.find({ contentId }).sort({ createdAt: -1 });
      return docs.map(doc => this.documentToEntity(doc));
    } catch (error: any) {
      throw new AppError(`Failed to find analyses by content ID: ${error.message}`, 500);
    }
  }

  async findMany(filter?: AnalysisFilter, limit?: number, offset?: number): Promise<Analysis[]> {
    try {
      let query: any = {};

      if (filter) {
        if (filter.contentId) query.contentId = filter.contentId;
        if (filter.status) query.status = filter.status;
        if (filter.createdAfter || filter.createdBefore) {
          query.createdAt = {};
          if (filter.createdAfter) query.createdAt.$gte = filter.createdAfter;
          if (filter.createdBefore) query.createdAt.$lte = filter.createdBefore;
        }
      }

      const docs = await AnalysisModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(offset || 0)
        .limit(limit || 50);

      return docs.map(doc => this.documentToEntity(doc));
    } catch (error: any) {
      throw new AppError(`Failed to find analyses: ${error.message}`, 500);
    }
  }

  async update(id: string, data: UpdateAnalysisData): Promise<Analysis | null> {
    try {
      const updateData: any = { ...data };
      updateData.updatedAt = new Date();

      const doc = await AnalysisModel.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );

      return doc ? this.documentToEntity(doc) : null;
    } catch (error: any) {
      throw new AppError(`Failed to update analysis: ${error.message}`, 500);
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const result = await AnalysisModel.findByIdAndDelete(id);
      return !!result;
    } catch (error: any) {
      throw new AppError(`Failed to delete analysis: ${error.message}`, 500);
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      const count = await AnalysisModel.countDocuments({ _id: id });
      return count > 0;
    } catch (error: any) {
      throw new AppError(`Failed to check analysis existence: ${error.message}`, 500);
    }
  }

  async count(filter?: AnalysisFilter): Promise<number> {
    try {
      let query: any = {};

      if (filter) {
        if (filter.contentId) query.contentId = filter.contentId;
        if (filter.status) query.status = filter.status;
        if (filter.createdAfter || filter.createdBefore) {
          query.createdAt = {};
          if (filter.createdAfter) query.createdAt.$gte = filter.createdAfter;
          if (filter.createdBefore) query.createdAt.$lte = filter.createdBefore;
        }
      }

      return await AnalysisModel.countDocuments(query);
    } catch (error: any) {
      throw new AppError(`Failed to count analyses: ${error.message}`, 500);
    }
  }

  async findPending(): Promise<Analysis[]> {
    try {
      const docs = await AnalysisModel.find({ status: AnalysisStatus.PENDING }).sort({ createdAt: 1 });
      return docs.map(doc => this.documentToEntity(doc));
    } catch (error: any) {
      throw new AppError(`Failed to find pending analyses: ${error.message}`, 500);
    }
  }

  async findByStatus(status: AnalysisStatus): Promise<Analysis[]> {
    try {
      const docs = await AnalysisModel.find({ status }).sort({ createdAt: -1 });
      return docs.map(doc => this.documentToEntity(doc));
    } catch (error: any) {
      throw new AppError(`Failed to find analyses by status: ${error.message}`, 500);
    }
  }
}