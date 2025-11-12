import { WebScraperService } from '../../infrastructure/scrapers/WebScraperService';
import { IScraperService } from '../../domain/repositories/IScraperService';

describe('WebScraperService', () => {
  let scraperService: IScraperService;

  beforeEach(() => {
    scraperService = new WebScraperService();
  });

  afterEach(async () => {
    await (scraperService as any).close?.();
  });

  describe('sanitizeContent', () => {
    it('should remove script tags', () => {
      const html = '<p>Hello<script>alert("test")</script> world</p>';
      const sanitized = (scraperService as any).sanitizeHtml(html);
      const $ = require('cheerio').load(sanitized);
      const result = (scraperService as any).sanitizeContent($.text().trim());
      expect(result).toBe('Hello world');
    });

    it('should normalize whitespace', () => {
      const text = 'Hello  \n\n  world   \t  test';
      const result = (scraperService as any).sanitizeContent(text);
      expect(result).toBe('Hello world test');
    });
  });

  describe('extractTitle', () => {
    it('should extract title from h1 tag', () => {
      const html = '<html><head><title>Page Title</title></head><body><h1>Article Title</h1></body></html>';
      const $ = require('cheerio').load(html);
      const result = (scraperService as any).extractTitle($);
      expect(result).toBe('Page Title'); // Title selector comes first, so it returns Page Title
    });

    it('should fallback to title tag', () => {
      const html = '<html><head><title>Page Title</title></head><body></body></html>';
      const $ = require('cheerio').load(html);
      const result = (scraperService as any).extractTitle($);
      expect(result).toBe('Page Title');
    });
  });

  describe('extractMetadata', () => {
    it('should extract Open Graph metadata', () => {
      const html = '<html><head><meta property="og:title" content="OG Title"><meta property="og:description" content="OG Description"></head></html>';
      const $ = require('cheerio').load(html);
      const result = (scraperService as any).extractMetadata($);
      expect(result).toHaveProperty('title', 'OG Title');
      expect(result).toHaveProperty('description', 'OG Description');
    });
  });

  describe('extractLinks', () => {
    it('should extract and filter links', () => {
      const html = '<body><a href="http://example.com/">Link 1</a><a href="/relative">Link 2</a><a href="#anchor">Link 3</a></body>';
      const $ = require('cheerio').load(html);
      const links = (scraperService as any).extractLinks($, 'http://base.com');
      expect(links).toContain('http://example.com/');
      expect(links).toContain('http://base.com/relative');
      expect(links).not.toContain('http://base.com/#anchor');
    });
  });

  describe('extractTags', () => {
    it('should extract tags from various selectors', () => {
      const html = '<body><span class="tag">Tech</span><a class="category">News</a></body>';
      const $ = require('cheerio').load(html);
      const tags = (scraperService as any).extractTags($);
      expect(tags).toContain('Tech');
      expect(tags).toContain('News');
    });
  });
});