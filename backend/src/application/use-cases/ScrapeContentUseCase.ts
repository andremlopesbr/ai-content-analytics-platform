import { injectable, inject } from 'tsyringe';
import { Content } from '../../domain/entities/Content';
import { IContentRepository } from '../../domain/repositories/IContentRepository';
import { IScraperService } from '../../domain/repositories/IScraperService';

export interface ScrapeContentRequest {
  url: string;
  title?: string;
  author?: string;
  publishedAt?: Date;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface ScrapeContentResponse {
  content: Content;
  scraped: boolean;
}

@injectable()
export class ScrapeContentUseCase {
  constructor(
    @inject('IContentRepository') private contentRepository: IContentRepository,
    @inject('IScraperService') private scraperService: IScraperService,
  ) { }

  async execute(request: ScrapeContentRequest): Promise<ScrapeContentResponse> {
    // Check if content already exists
    const existingContent = await this.contentRepository.findByUrl(request.url);
    if (existingContent) {
      return { content: existingContent, scraped: false };
    }

    // Scrape the content using the scraper service
    const scrapedData = await this.scraperService.scrape(request.url);

    const content = await this.contentRepository.create({
      title: request.title || scrapedData.title,
      content: scrapedData.content,
      url: request.url,
      author: request.author || scrapedData.author,
      publishedAt: request.publishedAt || scrapedData.publishedAt,
      tags: request.tags || scrapedData.tags,
      metadata: { ...scrapedData.metadata, ...request.metadata, links: scrapedData.links },
    });

    return { content, scraped: true };
  }

  // The performScraping method is now replaced by the scraper service
}