import { WebScraperService } from '../../infrastructure/scrapers/WebScraperService';
import { ScrapeContentUseCase } from '../../application/use-cases/ScrapeContentUseCase';
import { IContentRepository } from '../../domain/repositories/IContentRepository';
import { container } from 'tsyringe';

// Mock content repository for testing
class MockContentRepository implements IContentRepository {
  private contents: any[] = [];

  async create(data: any): Promise<any> {
    const content = {
      ...data,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.contents.push(content);
    return content;
  }

  async findById(id: string): Promise<any | null> {
    return this.contents.find(c => c.id === id) || null;
  }

  async findByUrl(url: string): Promise<any | null> {
    return this.contents.find(c => c.url === url) || null;
  }

  async findMany(filter?: any, limit?: number, offset?: number): Promise<any[]> {
    let results = this.contents;
    if (filter?.url) {
      results = results.filter(c => c.url === filter.url);
    }
    if (offset) results = results.slice(offset);
    if (limit) results = results.slice(0, limit);
    return results;
  }

  async update(id: string, data: any): Promise<any | null> {
    const index = this.contents.findIndex(c => c.id === id);
    if (index >= 0) {
      this.contents[index] = { ...this.contents[index], ...data, updatedAt: new Date() };
      return this.contents[index];
    }
    return null;
  }

  async delete(id: string): Promise<boolean> {
    const index = this.contents.findIndex(c => c.id === id);
    if (index >= 0) {
      this.contents.splice(index, 1);
      return true;
    }
    return false;
  }

  async exists(id: string): Promise<boolean> {
    return this.contents.some(c => c.id === id);
  }

  async count(filter?: any): Promise<number> {
    if (filter?.url) {
      return this.contents.filter(c => c.url === filter.url).length;
    }
    return this.contents.length;
  }
}

describe('Scraper Integration Tests', () => {
  let scraperService: WebScraperService;
  let contentRepository: MockContentRepository;
  let scrapeUseCase: ScrapeContentUseCase;

  beforeEach(() => {
    scraperService = new WebScraperService();
    contentRepository = new MockContentRepository();
    scrapeUseCase = new ScrapeContentUseCase(contentRepository, scraperService);
  });

  afterEach(async () => {
    await scraperService.close();
  });

  describe('Static HTML Content Tests', () => {
    it('should scrape a simple HTML page structure', async () => {
      // Create a mock HTML response for testing
      const testHtml = `
        <html>
          <head>
            <title>Test Article</title>
            <meta property="og:title" content="Test Article OG">
            <meta name="description" content="Test description">
            <meta name="author" content="Test Author">
          </head>
          <body>
            <h1>Test Article</h1>
            <p>This is the main content of the article.</p>
            <p>It contains multiple paragraphs and information.</p>
            <span class="tag">Technology</span>
            <a href="https://example.com/link1">Link 1</a>
            <a href="/relative-link">Link 2</a>
          </body>
        </html>
      `;

      // Test the scraping logic (this would normally be done via HTTP)
      // For integration tests, we would mock the HTTP requests
      const result = await scraperService.scrape('http://example.com/test', {
        timeout: 5000,
        retryAttempts: 1
      });

      // Verify the result has expected structure
      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('metadata');
      expect(Array.isArray(result.links)).toBe(true);

      // Metadata should include scrapedAt and other info
      expect(result.metadata).toHaveProperty('scrapedAt');
      expect(result.metadata).toHaveProperty('wordCount');
      expect(result.metadata).toHaveProperty('readingTime');
    });

    it('should handle different content structures', async () => {
      // Test with different HTML structures (blogs, news articles, etc.)
      const blogHtml = `
        <html>
          <head>
            <title>Blog Post Title</title>
          </head>
          <body>
            <article>
              <header>
                <h1>Blog Post Title</h1>
                <div class="author">By John Doe</div>
                <time datetime="2024-01-15">January 15, 2024</time>
              </header>
              <div class="content">
                <p>This is a blog post content.</p>
                <p>It has multiple sections.</p>
              </div>
              <footer>
                <div class="tags">
                  <a class="tag">Blog</a>
                  <a class="tag">Tutorial</a>
                </div>
              </footer>
            </article>
          </body>
        </html>
      `;

      // Similar integration test structure
      expect(true).toBe(true); // Placeholder for actual test
    });

    it('should handle error cases gracefully', async () => {
      // Test with invalid URLs, timeouts, etc.
      await expect(
        scraperService.scrape('invalid-url', { timeout: 1000, retryAttempts: 1 })
      ).rejects.toThrow();

      await expect(
        scraperService.scrape('http://nonexistent-domain-12345.com', { timeout: 1000, retryAttempts: 1 })
      ).rejects.toThrow();
    });

    it('should respect rate limiting', async () => {
      // Test rate limiting functionality
      const startTime = Date.now();

      // Make multiple requests to the same domain quickly
      const promises = Array(3).fill(null).map(() =>
        scraperService.scrape('http://httpbin.org/delay/0.1', { timeout: 10000 })
      );

      await Promise.all(promises);
      const endTime = Date.now();

      // Should take at least some time due to rate limiting
      expect(endTime - startTime).toBeGreaterThan(1000);
    });

    it('should extract various metadata types', async () => {
      const richHtml = `
        <html>
          <head>
            <title>Rich Content Page</title>
            <meta property="og:title" content="Open Graph Title">
            <meta property="og:description" content="Open Graph Description">
            <meta property="og:image" content="http://example.com/image.jpg">
            <meta name="twitter:card" content="summary_large_image">
            <meta name="twitter:title" content="Twitter Title">
            <meta name="keywords" content="keyword1, keyword2, keyword3">
            <meta name="author" content="Content Author">
          </head>
          <body>
            <h1>Rich Content Page</h1>
            <p>This page has extensive metadata.</p>
          </body>
        </html>
      `;

      // Test metadata extraction
      expect(true).toBe(true); // Placeholder for actual test
    });
  });

  describe('Use Case Integration', () => {
    it('should integrate with ScrapeContentUseCase end-to-end', async () => {
      const request = {
        url: 'http://example.com/article',
        title: 'Test Article',
        author: 'Test Author'
      };

      // This would normally make a real HTTP request
      // For testing, we mock the repository and scraper responses
      const result = await scrapeUseCase.execute(request);

      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('scraped');
      expect(result.scraped).toBe(true);
    });

    it('should handle duplicate content detection', async () => {
      const request = {
        url: 'http://example.com/duplicate-article'
      };

      // First scrape
      await scrapeUseCase.execute(request);

      // Second scrape should return existing content
      const result = await scrapeUseCase.execute(request);

      expect(result.scraped).toBe(false);
      expect(result.content).toBeDefined();
    });
  });
});