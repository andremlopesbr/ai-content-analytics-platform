import { injectable } from 'tsyringe';
import puppeteer, { Browser, Page } from 'puppeteer';
import * as cheerio from 'cheerio';
import { IScraperService, ScrapedData, ScrapingOptions } from '../../domain/repositories/IScraperService';
import { AppError } from '../../shared/errors/AppError';

type CheerioAPI = ReturnType<typeof cheerio.load>;

@injectable()
export class WebScraperService implements IScraperService {
  private browser: Browser | null = null;
  private rateLimiter = new Map<string, number>();
  private readonly MAX_CONCURRENT_REQUESTS = 5;
  private activeRequests = 0;

  private readonly DEFAULT_OPTIONS: ScrapingOptions = {
    timeout: 30000,
    headless: true,
    retryAttempts: 3,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  };

  private async initBrowser(): Promise<void> {
    if (!this.browser || this.browser.isConnected() === false) {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });
    }
  }

  private async checkRateLimit(domain: string): Promise<void> {
    const now = Date.now();
    const lastRequest = this.rateLimiter.get(domain) || 0;
    const timeDiff = now - lastRequest;

    // Rate limit: 1 request per second per domain
    if (timeDiff < 1000) {
      await new Promise(resolve => setTimeout(resolve, 1000 - timeDiff));
    }

    this.rateLimiter.set(domain, now);
  }

  private async waitForSlot(): Promise<void> {
    while (this.activeRequests >= this.MAX_CONCURRENT_REQUESTS) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    this.activeRequests++;
  }

  private sanitizeHtml(html: string): string {
    // Remove script and style tags
    html = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    html = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

    // Remove comments
    html = html.replace(/<!--[\s\S]*?-->/g, '');

    // Remove excessive whitespace
    html = html.replace(/\s+/g, ' ').trim();

    return html;
  }

  private extractText($: CheerioAPI): string {
    // Remove unwanted elements
    $('script, style, nav, header, footer, aside, .ad, .advertisement, .sidebar').remove();

    // Extract main content
    const contentSelectors = ['article', '.content', '.post', '.entry', '[role="main"]', 'main'];
    let content = '';

    for (const selector of contentSelectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        content = element.text().trim();
        break;
      }
    }

    if (!content) {
      // Fallback to body text
      content = $('body').text().trim();
    }

    return this.sanitizeContent(content);
  }

  private sanitizeContent(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\n\s*\n/g, '\n') // Remove empty lines
      .replace(/[^\x20-\x7E\n]/g, '') // Remove non-printable characters
      .trim();
  }

  private extractTitle($: ReturnType<typeof cheerio.load>): string {
    const titleSelectors = [
      'title',
      'h1',
      '[property="og:title"]',
      '[name="title"]',
      '.title',
      '.headline'
    ];

    for (const selector of titleSelectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        const title = element.attr('content') || element.text().trim();
        if (title) return title;
      }
    }

    return 'Untitled';
  }

  private extractMetadata($: ReturnType<typeof cheerio.load>): Record<string, any> {
    const metadata: Record<string, any> = {
      scrapedAt: new Date(),
      wordCount: 0,
      readingTime: 0
    };

    // Open Graph metadata
    $('meta[property^="og:"]').each((_, el) => {
      const property = $(el).attr('property')?.replace('og:', '');
      const content = $(el).attr('content');
      if (property && content) {
        metadata[property] = content;
      }
    });

    // Twitter Card metadata
    $('meta[name^="twitter:"]').each((_, el) => {
      const name = $(el).attr('name')?.replace('twitter:', '');
      const content = $(el).attr('content');
      if (name && content) {
        metadata[name] = content;
      }
    });

    // Standard meta tags
    $('meta[name="description"]').each((_, el) => {
      metadata.description = $(el).attr('content');
    });

    $('meta[name="author"]').each((_, el) => {
      metadata.author = $(el).attr('content');
    });

    $('meta[name="keywords"]').each((_, el) => {
      metadata.keywords = $(el).attr('content')?.split(',').map(k => k.trim());
    });

    return metadata;
  }

  private extractLinks($: ReturnType<typeof cheerio.load>, baseUrl: string): string[] {
    const links: string[] = [];
    const seen = new Set<string>();

    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      if (href) {
        try {
          const absoluteUrl = new URL(href, baseUrl).toString();
          if (!seen.has(absoluteUrl) && absoluteUrl.startsWith('http') && !absoluteUrl.includes('#')) {
            links.push(absoluteUrl);
            seen.add(absoluteUrl);
          }
        } catch {
          // Invalid URL, skip
        }
      }
    });

    return links.slice(0, 50); // Limit to 50 links
  }

  private extractAuthor($: ReturnType<typeof cheerio.load>): string | undefined {
    const authorSelectors = [
      '[rel="author"]',
      '.author',
      '.byline',
      '[property="article:author"]',
      '[name="author"]'
    ];

    for (const selector of authorSelectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        const author = element.attr('content') || element.text().trim();
        if (author && author.length > 0) {
          return author;
        }
      }
    }

    return undefined;
  }

  private extractPublishedDate($: ReturnType<typeof cheerio.load>): Date | undefined {
    const dateSelectors = [
      '[property="article:published_time"]',
      '[property="og:published_time"]',
      'time[datetime]',
      '.published',
      '.date'
    ];

    for (const selector of dateSelectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        const dateStr = element.attr('datetime') || element.attr('content') || element.text().trim();
        if (dateStr) {
          try {
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
              return date;
            }
          } catch {
            // Invalid date, continue
          }
        }
      }
    }

    return undefined;
  }

  private extractTags($: ReturnType<typeof cheerio.load>): string[] {
    const tags: string[] = [];

    // Common tag selectors
    const tagSelectors = [
      '.tag',
      '.category',
      '[rel="tag"]',
      '.label'
    ];

    tagSelectors.forEach(selector => {
      $(selector).each((_, el) => {
        const tag = $(el).text().trim();
        if (tag && !tags.includes(tag)) {
          tags.push(tag);
        }
      });
    });

    return tags.slice(0, 10); // Limit to 10 tags
  }

  async scrape(url: string, options: ScrapingOptions = {}): Promise<ScrapedData> {
    const mergedOptions = { ...this.DEFAULT_OPTIONS, ...options };
    const { timeout, retryAttempts = 3 } = mergedOptions;

    await this.initBrowser();
    await this.checkRateLimit(new URL(url).hostname);
    await this.waitForSlot();

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retryAttempts; attempt++) {
      let page: Page | null = null;

      try {
        if (!this.browser) throw new Error('Browser not initialized');

        page = await this.browser.newPage();

        // Set user agent
        if (mergedOptions.userAgent) {
          await page.setUserAgent(mergedOptions.userAgent);
        }

        // Set viewport
        await page.setViewport({ width: 1366, height: 768 });

        // Navigate with timeout
        await page.goto(url, {
          waitUntil: 'networkidle2',
          timeout: timeout
        });

        // Wait for selector if specified
        if (mergedOptions.waitForSelector) {
          await page.waitForSelector(mergedOptions.waitForSelector, { timeout: timeout });
        }

        // Get HTML content
        const html = await page.content();
        const sanitizedHtml = this.sanitizeHtml(html);
        const $ = cheerio.load(sanitizedHtml);

        // Extract data
        const title = this.extractTitle($);
        const content = this.extractText($);
        const author = this.extractAuthor($);
        const publishedAt = this.extractPublishedDate($);
        const tags = this.extractTags($);
        const links = this.extractLinks($, url);
        const metadata = this.extractMetadata($);

        // Calculate additional metadata
        metadata.wordCount = content.split(/\s+/).length;
        metadata.readingTime = Math.ceil(metadata.wordCount / 200); // Assuming 200 words per minute

        this.activeRequests--;

        return {
          title,
          content,
          author,
          publishedAt,
          tags,
          links,
          metadata
        };

      } catch (error: any) {
        lastError = error;
        console.warn(`Scraping attempt ${attempt} failed for ${url}:`, error.message);

        if (page) {
          try {
            await page.close();
          } catch {
            // Ignore cleanup errors
          }
        }

        // Wait before retry
        if (attempt < retryAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }

    this.activeRequests--;
    throw new AppError(`Failed to scrape ${url} after ${retryAttempts} attempts: ${lastError?.message}`, 500);
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}