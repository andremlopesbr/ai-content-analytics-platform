import { v4 as uuidv4 } from 'uuid';

export interface ContentData {
  title: string;
  content: string;
  url: string;
  author?: string;
  publishedAt?: Date;
  tags?: string[];
  metadata?: Record<string, any>;
}

export class Content {
  public readonly id: string;
  public readonly title: string;
  public readonly content: string;
  public readonly url: string;
  public readonly author?: string;
  public readonly publishedAt?: Date;
  public readonly tags?: string[];
  public readonly metadata?: Record<string, any>;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(data: ContentData & { id?: string; createdAt?: Date; updatedAt?: Date }) {
    this.id = data.id || uuidv4();
    this.title = data.title;
    this.content = data.content;
    this.url = data.url;
    this.author = data.author;
    this.publishedAt = data.publishedAt;
    this.tags = data.tags;
    this.metadata = data.metadata;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  update(data: Partial<ContentData>): Content {
    return new Content({
      ...this,
      ...data,
      updatedAt: new Date(),
    });
  }

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      content: this.content,
      url: this.url,
      author: this.author,
      publishedAt: this.publishedAt,
      tags: this.tags,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}