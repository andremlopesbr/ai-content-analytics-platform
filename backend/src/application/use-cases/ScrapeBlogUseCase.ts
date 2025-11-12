import { injectable, inject } from 'tsyringe';
import { Content } from '../../domain/entities/Content';
import { IContentRepository } from '../../domain/repositories/IContentRepository';
import { IScraperService } from '../../domain/repositories/IScraperService';

export interface ScrapeBlogRequest {
  blogUrl: string;
  postIdentifierPattern: string; // e.g., 'h2 a[href*="post"]' or any CSS selector
  options?: {
    maxPosts?: number;
    timeout?: number;
  };
}

export interface ScrapeBlogResponse {
  contents: Content[];
  scrapedCount: number;
  skippedCount: number;
}

@injectable()
export class ScrapeBlogUseCase {
  constructor(
    @inject('IContentRepository') private contentRepository: IContentRepository,
    @inject('IScraperService') private scraperService: IScraperService,
  ) { }

  async execute(request: ScrapeBlogRequest): Promise<ScrapeBlogResponse> {
    // First, scrape the main blog page to get post URLs
    const blogData = await this.scraperService.scrape(request.blogUrl);

    // Extract post URLs based on the pattern (this assumes the scraper can return links)
    // Note: This might need enhancement in the scraper service to extract elements by selector
    const postUrls = this.extractPostUrls(blogData.links || [], request.postIdentifierPattern);

    const contents: Content[] = [];
    let scrapedCount = 0;
    let skippedCount = 0;

    const maxPosts = request.options?.maxPosts || 10; // Default limit

    for (const postUrl of postUrls.slice(0, maxPosts)) {
      try {
        // Check if content already exists
        const existingContent = await this.contentRepository.findByUrl(postUrl);
        if (existingContent) {
          contents.push(existingContent);
          skippedCount++;
          continue;
        }

        // Scrape the individual post
        const scrapedData = await this.scraperService.scrape(postUrl);

        const content = await this.contentRepository.create({
          title: scrapedData.title,
          content: scrapedData.content,
          url: postUrl,
          author: scrapedData.author,
          publishedAt: scrapedData.publishedAt,
          tags: scrapedData.tags,
          metadata: { ...scrapedData.metadata, blogUrl: request.blogUrl, links: scrapedData.links },
        });

        contents.push(content);
        scrapedCount++;
      } catch (error) {
        console.error(`Error scraping post ${postUrl}:`, error);
        // Continue with other posts
      }
    }

    return { contents, scrapedCount, skippedCount };
  }

  private extractPostUrls(links: string[], pattern: string): string[] {
    // Simple implementation: filter links that match the pattern
    // This could be enhanced to use regex or more complex matching
    // For now, assume pattern is a simple string to match in URL
    return links.filter(link => link.includes(pattern));
  }
}