import { injectable } from 'tsyringe';
import mongoose from 'mongoose';
import { Content } from '../../domain/entities/Content';
import { IContentRepository, CreateContentData, UpdateContentData, ContentFilter } from '../../domain/repositories/IContentRepository';
import ContentModel, { IContentDocument } from './schemas/ContentSchema';
import { databaseConnection } from './connection';
import { AppError } from '../../shared/errors/AppError';

@injectable()
export class MongoContentRepository implements IContentRepository {
  constructor() {
    // Ensure database connection is established
    databaseConnection.connect().catch(error => {
      console.error('Failed to connect to MongoDB in ContentRepository:', error);
    });
  }

  private documentToEntity(doc: IContentDocument): Content {
    return new Content({
      id: doc._id,
      title: doc.title,
      content: doc.content,
      url: doc.url,
      author: doc.author,
      publishedAt: doc.publishedAt,
      tags: doc.tags,
      metadata: doc.metadata,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  async create(data: CreateContentData): Promise<Content> {
    try {
      const content = new Content(data);
      const doc = new ContentModel({
        _id: content.id,
        title: content.title,
        content: content.content,
        url: content.url,
        author: content.author,
        publishedAt: content.publishedAt,
        tags: content.tags,
        metadata: content.metadata,
        createdAt: content.createdAt,
        updatedAt: content.updatedAt,
      });

      await doc.save();
      return content;
    } catch (error: any) {
      if (error.code === 11000) { // Duplicate key error
        throw new AppError('Content with this URL already exists', 409);
      }
      throw new AppError(`Failed to create content: ${error.message}`, 500);
    }
  }

  async findById(id: string): Promise<Content | null> {
    try {
      const doc = await ContentModel.findById(id);
      return doc ? this.documentToEntity(doc) : null;
    } catch (error: any) {
      throw new AppError(`Failed to find content by ID: ${error.message}`, 500);
    }
  }

  async findByUrl(url: string): Promise<Content | null> {
    try {
      const doc = await ContentModel.findOne({ url });
      return doc ? this.documentToEntity(doc) : null;
    } catch (error: any) {
      throw new AppError(`Failed to find content by URL: ${error.message}`, 500);
    }
  }

  async findMany(filter?: ContentFilter, limit?: number, offset?: number): Promise<Content[]> {
    try {
      let query: any = {};

      if (filter) {
        if (filter.url) query.url = filter.url;
        if (filter.author) query.author = filter.author;
        if (filter.tags && filter.tags.length > 0) {
          query.tags = { $in: filter.tags };
        }
        if (filter.publishedAfter || filter.publishedBefore) {
          query.publishedAt = {};
          if (filter.publishedAfter) query.publishedAt.$gte = filter.publishedAfter;
          if (filter.publishedBefore) query.publishedAt.$lte = filter.publishedBefore;
        }
      }

      const docs = await ContentModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(offset || 0)
        .limit(limit || 50);

      return docs.map(doc => this.documentToEntity(doc));
    } catch (error: any) {
      throw new AppError(`Failed to find contents: ${error.message}`, 500);
    }
  }

  async update(id: string, data: UpdateContentData): Promise<Content | null> {
    try {
      const updateData: any = { ...data };
      updateData.updatedAt = new Date();

      const doc = await ContentModel.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );

      return doc ? this.documentToEntity(doc) : null;
    } catch (error: any) {
      if (error.code === 11000) {
        throw new AppError('URL already exists', 409);
      }
      throw new AppError(`Failed to update content: ${error.message}`, 500);
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const result = await ContentModel.findByIdAndDelete(id);
      return !!result;
    } catch (error: any) {
      throw new AppError(`Failed to delete content: ${error.message}`, 500);
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      const count = await ContentModel.countDocuments({ _id: id });
      return count > 0;
    } catch (error: any) {
      throw new AppError(`Failed to check content existence: ${error.message}`, 500);
    }
  }

  async count(filter?: ContentFilter): Promise<number> {
    try {
      let query: any = {};

      if (filter) {
        if (filter.url) query.url = filter.url;
        if (filter.author) query.author = filter.author;
        if (filter.tags && filter.tags.length > 0) {
          query.tags = { $in: filter.tags };
        }
        if (filter.publishedAfter || filter.publishedBefore) {
          query.publishedAt = {};
          if (filter.publishedAfter) query.publishedAt.$gte = filter.publishedAfter;
          if (filter.publishedBefore) query.publishedAt.$lte = filter.publishedBefore;
        }
      }

      return await ContentModel.countDocuments(query);
    } catch (error: any) {
      throw new AppError(`Failed to count contents: ${error.message}`, 500);
    }
  }
}