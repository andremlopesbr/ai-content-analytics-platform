import { ScrapeContentUseCase } from '../../application/use-cases/ScrapeContentUseCase';
import { IContentRepository } from '../../domain/repositories/IContentRepository';
import { IScraperService } from '../../domain/repositories/IScraperService';

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

class MockScraperService implements IScraperService {
  async scrape(url: string): Promise<any> {
    return {
      title: `Scraped content from ${url}`,
      content: `This is scraped content from ${url}. It contains text, links, and metadata.`,
      author: 'Test Author',
      publishedAt: new Date(),
      tags: ['test', 'scraped'],
      links: [`${url}/link1`, `${url}/link2`],
      metadata: {
        scrapedAt: new Date(),
        source: url,
        wordCount: 12,
        readingTime: 1
      }
    };
  }
}

describe('ScrapeContentUseCase', () => {
  let useCase: ScrapeContentUseCase;
  let mockContentRepository: MockContentRepository;
  let mockScraperService: MockScraperService;

  beforeEach(() => {
    mockContentRepository = new MockContentRepository();
    mockScraperService = new MockScraperService();
    useCase = new ScrapeContentUseCase(mockContentRepository, mockScraperService);
  });

  describe('execute', () => {
    it('should scrape new content successfully', async () => {
      const request = {
        url: 'http://example.com/article',
        title: 'Test Article'
      };

      const result = await useCase.execute(request);

      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('scraped', true);
      expect(result.content.title).toBe('Test Article');
      expect(result.content.url).toBe('http://example.com/article');
      expect(result.content.metadata).toHaveProperty('links');
    });

    it('should return existing content if already scraped', async () => {
      const request = {
        url: 'http://example.com/existing-article'
      };

      // First execution creates content
      const firstResult = await useCase.execute(request);
      expect(firstResult.scraped).toBe(true);

      // Second execution should return existing content
      const secondResult = await useCase.execute(request);
      expect(secondResult.scraped).toBe(false);
      expect(secondResult.content.id).toBe(firstResult.content.id);
    });

    it('should merge request data with scraped data', async () => {
      const request = {
        url: 'http://example.com/merge-test',
        title: 'Custom Title',
        author: 'Custom Author',
        tags: ['custom'],
        metadata: { customField: 'customValue' }
      };

      const result = await useCase.execute(request);

      expect(result.content.title).toBe('Custom Title');
      expect(result.content.author).toBe('Custom Author');
      expect(result.content.tags).toContain('custom');
      expect(result.content.metadata).toHaveProperty('customField', 'customValue');
      expect(result.content.metadata).toHaveProperty('links'); // From scraper
    });

    it('should prefer request data over scraped data', async () => {
      const request = {
        url: 'http://example.com/preference-test',
        title: 'Request Title',
        author: 'Request Author'
      };

      const result = await useCase.execute(request);

      expect(result.content.title).toBe('Request Title');
      expect(result.content.author).toBe('Request Author');
    });

    it('should handle scraping errors gracefully', async () => {
      const failingScraper = {
        scrape: jest.fn().mockRejectedValue(new Error('Scraping failed'))
      } as any;

      const failingUseCase = new ScrapeContentUseCase(mockContentRepository, failingScraper);

      const request = {
        url: 'http://example.com/failing-url'
      };

      await expect(failingUseCase.execute(request)).rejects.toThrow('Scraping failed');
    });
  });
});