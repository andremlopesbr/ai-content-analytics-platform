export interface ScrapedData {
  title: string;
  content: string;
  author?: string;
  publishedAt?: Date;
  tags?: string[];
  metadata: Record<string, any>;
  links?: string[];
}

export interface ScrapingOptions {
  timeout?: number;
  waitForSelector?: string;
  userAgent?: string;
  headless?: boolean;
  retryAttempts?: number;
}

export interface IScraperService {
  scrape(url: string, options?: ScrapingOptions): Promise<ScrapedData>;
}