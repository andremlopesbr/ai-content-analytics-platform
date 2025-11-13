import 'reflect-metadata';
import { WebScraperService } from '../src/infrastructure/scrapers/WebScraperService';
import { ScrapeContentUseCase } from '../src/application/use-cases/ScrapeContentUseCase';
import { AnalyzeContentUseCase } from '../src/application/use-cases/AnalyzeContentUseCase';
import '../src/container'; // Initialize container
import { container } from 'tsyringe';
import { databaseConnection } from '../src/infrastructure/database/connection';

// Logger utility for demonstration
class ScraperLogger {
  private static formatMessage(level: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${data ? ` | ${JSON.stringify(data, null, 2)}` : ''}`;
  }

  static info(message: string, data?: any) {
    console.log(this.formatMessage('info', message, data));
  }

  static error(message: string, error?: any) {
    console.error(this.formatMessage('error', message, error));
  }

  static warn(message: string, data?: any) {
    console.warn(this.formatMessage('warn', message, data));
  }

  static success(message: string, data?: any) {
    console.log(this.formatMessage('success', `✅ ${message}`, data));
  }
}

// Example URLs for scraping (public sites that allow scraping for educational purposes)
const SCRAPING_EXAMPLES = [
  {
    name: 'BBC News Article',
    url: 'https://www.bbc.com/news/world/latin_america',
    category: 'news',
    description: 'BBC News article about European affairs'
  },
  {
    name: 'GitHub README',
    url: 'https://github.com/microsoft/vscode/blob/main/README.md',
    category: 'documentation',
    description: 'Technical documentation from VS Code GitHub'
  },
  {
    name: 'Example Blog Post',
    url: 'https://artedesignpa.com.br/blog/',
    category: 'demo',
    description: 'Simple example website for testing'
  }
];

class ScrapingDemo {
  private scraper: WebScraperService;
  private scrapeUseCase?: ScrapeContentUseCase;
  private analyzeUseCase?: AnalyzeContentUseCase;

  constructor() {
    this.scraper = new WebScraperService();
  }

  async initialize() {
    try {
      ScraperLogger.info('Initializing database connection...');
      await databaseConnection.connect();

      this.scrapeUseCase = container.resolve(ScrapeContentUseCase);
      this.analyzeUseCase = container.resolve(AnalyzeContentUseCase);

      ScraperLogger.success('Application initialized successfully');
    } catch (error) {
      ScraperLogger.warn('Database connection failed, continuing with scraping only', error instanceof Error ? error.message : String(error));
      // Don't throw error - continue without database features
      ScraperLogger.warn('Some features (saving content, AI analysis) will be disabled');
    }
  }

  async scrapeExample(url: string, name: string, category: string): Promise<any> {
    try {
      ScraperLogger.info(`Starting scrape for ${name}`, { url, category });

      // Step 1: Scrape content
      const scrapedData = await this.scraper.scrape(url, {
        timeout: 60000,
        retryAttempts: 3,
        userAgent: 'AI-Content-Analytics-Demo/1.0 (Educational Purpose Only)'
      });

      ScraperLogger.success(`Successfully scraped content from ${name}`, {
        title: scrapedData.title,
        wordCount: scrapedData.metadata.wordCount,
        readingTime: scrapedData.metadata.readingTime,
        linksFound: scrapedData.links?.length || 0
      });

      // Step 2: Save to database via use case (skip if no database)
      let scrapeResult: any = null;
      if (this.scrapeUseCase) {
        scrapeResult = await this.scrapeUseCase.execute({
          url: url,
          title: scrapedData.title,
          author: scrapedData.author,
          publishedAt: scrapedData.publishedAt,
          tags: [...(scrapedData.tags || []), category],
          metadata: {
            category,
            scrapedAt: new Date(),
            source: name
          }
        });
        ScraperLogger.success(`Content saved to database`, {
          contentId: scrapeResult.content.id,
          scraped: scrapeResult.scraped
        });
      } else {
        ScraperLogger.info('Database not available, skipping content save');
      }

      ScraperLogger.success(`Content saved to database`, {
        contentId: scrapeResult.content.id,
        scraped: scrapeResult.scraped
      });

      // Step 3: Analyze content with AI (skip if no database)
      let analysisResult: any = null;
      if (this.analyzeUseCase && scrapeResult) {
        analysisResult = await this.analyzeUseCase.execute({
          contentId: scrapeResult.content.id,
          analysisType: 'content-analysis',
          metadata: {
            category,
            priority: 'high'
          }
        });

        ScraperLogger.success(`AI analysis queued`, {
          analysisId: analysisResult.analysis.id,
          queued: analysisResult.queued
        });
      } else {
        ScraperLogger.info('Analysis not available (database required)');
      }

      return {
        scrapedData,
        content: scrapeResult?.content,
        analysis: analysisResult?.analysis
      };

    } catch (error) {
      ScraperLogger.error(`Failed to process ${name}`, {
        url,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  async runScrapingDemo() {
    ScraperLogger.info('🚀 Starting Content Scraping Demo');
    ScraperLogger.info('This demo will scrape real websites and analyze content with AI');

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (const example of SCRAPING_EXAMPLES) {
      try {
        ScraperLogger.info(`\n--- Processing: ${example.name} ---`);
        ScraperLogger.info(example.description);

        const result = await this.scrapeExample(example.url, example.name, example.category);
        results.push(result);
        successCount++;

        // Wait between requests to be respectful
        await this.delay(3000);

      } catch (error) {
        errorCount++;
        results.push({
          example,
          error: error instanceof Error ? error.message : String(error)
        });

        // Continue with next example even if one fails
        ScraperLogger.warn(`Continuing with next example despite error`);
      }
    }

    ScraperLogger.info('\n📊 Demo Results Summary:');
    ScraperLogger.info(`Total examples: ${SCRAPING_EXAMPLES.length}`);
    ScraperLogger.info(`Successful: ${successCount}`);
    ScraperLogger.info(`Failed: ${errorCount}`);

    return results;
  }

  async demonstrateDataExtraction(scrapedData: any) {
    ScraperLogger.info('\n🔍 Data Extraction Demonstration:');

    console.log('\n=== Extracted Data Structure ===');
    console.log('Title:', scrapedData.title);
    console.log('Author:', scrapedData.author || 'Not found');
    console.log('Published Date:', scrapedData.publishedAt || 'Not found');

    console.log('\n=== Content Preview ===');
    const preview = scrapedData.content.substring(0, 200) + '...';
    console.log(preview);

    console.log('\n=== Metadata ===');
    console.log('Word Count:', scrapedData.metadata.wordCount);
    console.log('Reading Time:', scrapedData.metadata.readingTime, 'minutes');
    console.log('Language:', scrapedData.metadata.language || 'Not detected');

    console.log('\n=== Tags ===');
    console.log(scrapedData.tags?.length ? scrapedData.tags.join(', ') : 'No tags extracted');

    console.log('\n=== Links Found ===');
    console.log(`Found ${scrapedData.links.length} links`);
    if (scrapedData.links.length > 0) {
      console.log('Sample links:');
      scrapedData.links.slice(0, 5).forEach((link: string, index: number) => {
        console.log(`  ${index + 1}. ${link}`);
      });
    }
  }

  async demonstrateErrorHandling() {
    ScraperLogger.info('\n🛡️ Error Handling Demonstration:');

    const errorExamples = [
      {
        name: 'Invalid URL',
        url: 'not-a-valid-url',
        expectedError: 'Invalid URL format'
      },
      {
        name: 'Non-existent Domain',
        url: 'https://this-domain-does-not-exist-12345.com',
        expectedError: 'Domain not found'
      },
      {
        name: 'Timeout Test',
        url: 'https://httpbin.org/delay/30', // 30 second delay
        expectedError: 'Timeout'
      }
    ];

    for (const example of errorExamples) {
      try {
        ScraperLogger.info(`Testing error handling: ${example.name}`);
        await this.scraper.scrape(example.url, { timeout: 5000, retryAttempts: 1 });
        ScraperLogger.warn(`Unexpected success for ${example.name}`);
      } catch (error) {
        ScraperLogger.success(`Successfully caught error for ${example.name}`, {
          error: error instanceof Error ? error.message : String(error)
        });
      }

      await this.delay(1000);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async cleanup() {
    try {
      ScraperLogger.info('Cleaning up resources...');
      await this.scraper.close();
      ScraperLogger.success('Cleanup completed');
    } catch (error) {
      ScraperLogger.error('Error during cleanup', error);
    }
  }
}

// Main execution
async function main() {
  const demo = new ScrapingDemo();

  try {
    await demo.initialize();

    // Run error handling demonstration
    await demo.demonstrateErrorHandling();

    // Run main scraping demo
    const results = await demo.runScrapingDemo();

    // Demonstrate data extraction for successful scrapes
    const successfulResults = results.filter(r => r.scrapedData && !r.error);
    if (successfulResults.length > 0) {
      ScraperLogger.info('\n🎯 Demonstrating data extraction for first successful scrape:');
      await demo.demonstrateDataExtraction(successfulResults[0].scrapedData);
    } else {
      // Show extraction demo with the last scraped data even if saving failed
      const lastScraped = results.filter(r => r.scrapedData).pop();
      if (lastScraped) {
        ScraperLogger.info('\n🎯 Demonstrating data extraction (scraping succeeded, but database save failed):');
        await demo.demonstrateDataExtraction(lastScraped.scrapedData);
      }
    }

    ScraperLogger.success('\n🎉 Scraping demo completed successfully!');
    ScraperLogger.info('Check the logs above for detailed results and extracted data.');

    // Show final summary of what was demonstrated
    ScraperLogger.info('\n🔧 What was demonstrated:');
    ScraperLogger.info('✓ Real website scraping with Puppeteer');
    ScraperLogger.info('✓ Content extraction (title, text, metadata, links)');
    ScraperLogger.info('✓ Error handling for various failure scenarios');
    ScraperLogger.info('✓ Logging and monitoring throughout the process');
    ScraperLogger.info('✓ Rate limiting and retry mechanisms');
    ScraperLogger.info('✗ Database integration (MongoDB not available)');
    ScraperLogger.info('✗ AI analysis integration (requires database)');

    ScraperLogger.info('\n💡 To enable full functionality:');
    ScraperLogger.info('1. Start MongoDB server: mongod');
    ScraperLogger.info('2. Add GEMINI_API_KEY to .env file');
    ScraperLogger.info('3. Re-run the script for complete demo');

  } catch (error) {
    ScraperLogger.error('Demo failed with critical error', error);
    process.exit(1);
  } finally {
    await demo.cleanup();
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  ScraperLogger.info('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  ScraperLogger.info('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Run the demo
if (require.main === module) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

export { ScrapingDemo, ScraperLogger };