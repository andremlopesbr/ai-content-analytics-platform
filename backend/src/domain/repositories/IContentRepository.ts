import { Content } from '../entities/Content';

export interface CreateContentData {
  title: string;
  content: string;
  url: string;
  author?: string;
  publishedAt?: Date;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface UpdateContentData {
  title?: string;
  content?: string;
  author?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface ContentFilter {
  url?: string;
  author?: string;
  tags?: string[];
  publishedAfter?: Date;
  publishedBefore?: Date;
}

export interface IContentRepository {
  create(data: CreateContentData): Promise<Content>;
  findById(id: string): Promise<Content | null>;
  findByUrl(url: string): Promise<Content | null>;
  findMany(filter?: ContentFilter, limit?: number, offset?: number): Promise<Content[]>;
  update(id: string, data: UpdateContentData): Promise<Content | null>;
  delete(id: string): Promise<boolean>;
  exists(id: string): Promise<boolean>;
  count(filter?: ContentFilter): Promise<number>;
}