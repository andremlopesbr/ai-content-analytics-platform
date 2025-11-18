import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { GeminiAIService, AIAnalysisRequest, AIAnalysisResponse } from '../../infrastructure/ai/GeminiAIService';
import { AppError } from '../../shared/errors/AppError';

// Mock do @google/genai
jest.mock('@google/genai', () => ({
    GoogleGenAI: jest.fn().mockImplementation(() => ({
        models: {
            generateContent: jest.fn()
        }
    }))
}), { virtual: true });

describe('GeminiAIService', () => {
    let service: GeminiAIService;
    let mockGenAI: any;

    beforeEach(() => {
        // Reset environment variables
        process.env.GEMINI_API_KEY = 'test-api-key';

        // Clear all mocks
        jest.clearAllMocks();

        service = new GeminiAIService();

        // Get the mocked instance
        const { GoogleGenAI } = require('@google/genai');
        mockGenAI = GoogleGenAI.mock.results[GoogleGenAI.mock.calls.length - 1]?.value;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('constructor', () => {
        it('should initialize successfully with valid API key', () => {
            expect(service).toBeDefined();
            expect(mockGenAI).toBeDefined();
        });

        it('should throw error when GEMINI_API_KEY is not configured', () => {
            delete process.env.GEMINI_API_KEY;

            expect(() => new GeminiAIService()).toThrow(AppError);
            expect(() => new GeminiAIService()).toThrow('GEMINI_API_KEY is required but not configured');
        });
    });

    describe('analyzeContent', () => {
        const mockRequest: AIAnalysisRequest = {
            content: 'This is a test article about artificial intelligence and machine learning.',
            title: 'Test Article',
            metadata: { source: 'test' }
        };

        const mockResponse = {
            text: `{
        "sentiment": "neutral",
        "topics": ["artificial intelligence", "machine learning"],
        "keywords": ["artificial intelligence", "machine learning", "test"],
        "summary": "This is a test article about AI and ML.",
        "entities": {
          "people": [],
          "organizations": [],
          "locations": []
        },
        "readabilityScore": 75,
        "wordCount": 12,
        "language": "pt-BR",
        "confidence": 85
      }`
        };

        it('should analyze content successfully', async () => {
            mockGenAI.models.generateContent.mockResolvedValue(mockResponse);

            const result = await service.analyzeContent(mockRequest);

            expect(result).toBeDefined();
            expect(result.sentiment).toBe('neutral');
            expect(result.topics).toContain('artificial intelligence');
            expect(result.keywords).toContain('test');
            expect(result.summary).toBe('This is a test article about AI and ML.');
            expect(result.wordCount).toBe(12);
        });

        it('should handle markdown code blocks in response', async () => {
            const markdownResponse = {
                text: `\`\`\`json
        {
          "sentiment": "positive",
          "topics": ["technology"],
          "keywords": ["tech"],
          "summary": "Positive tech article",
          "entities": {
            "people": [],
            "organizations": [],
            "locations": []
          },
          "readabilityScore": 80,
          "wordCount": 5,
          "language": "pt-BR",
          "confidence": 90
        }
        \`\`\``
            };

            mockGenAI.models.generateContent.mockResolvedValue(markdownResponse);

            const result = await service.analyzeContent(mockRequest);

            expect(result.sentiment).toBe('positive');
            expect(result.topics).toContain('technology');
            expect(result.keywords).toContain('tech');
        });

        it('should handle API errors gracefully', async () => {
            const apiError = new Error('API request failed');
            mockGenAI.models.generateContent.mockRejectedValue(apiError);

            await expect(service.analyzeContent(mockRequest)).rejects.toThrow('AI analysis failed: API request failed');
        });

        it('should validate sentiment values', async () => {
            const invalidSentimentResponse = {
                text: `{
          "sentiment": "invalid_sentiment",
          "topics": ["test"],
          "keywords": ["test"],
          "summary": "Test summary",
          "entities": {
            "people": [],
            "organizations": [],
            "locations": []
          },
          "readabilityScore": 70,
          "wordCount": 3,
          "language": "en",
          "confidence": 80
        }`
            };

            mockGenAI.models.generateContent.mockResolvedValue(invalidSentimentResponse);

            const result = await service.analyzeContent(mockRequest);

            expect(result.sentiment).toBe('neutral'); // Should default to neutral for invalid sentiment
        });

        it('should provide fallback response when JSON parsing fails', async () => {
            const invalidJsonResponse = {
                text: 'Invalid JSON response from AI'
            };

            mockGenAI.models.generateContent.mockResolvedValue(invalidJsonResponse);

            const result = await service.analyzeContent({
                content: 'Short content',
                title: 'Test'
            });

            expect(result).toBeDefined();
            expect(result.sentiment).toBe('neutral');
            expect(result.confidence).toBe(50); // Lower confidence for fallback
            expect(result.keywords).toBeDefined();
        });

        it('should calculate readability score when not provided', async () => {
            const noReadabilityResponse = {
                text: `{
          "sentiment": "neutral",
          "topics": ["test"],
          "keywords": ["test"],
          "summary": "Test summary",
          "entities": {
            "people": [],
            "organizations": [],
            "locations": []
          },
          "wordCount": 10,
          "language": "en",
          "confidence": 80
        }`
            };

            mockGenAI.models.generateContent.mockResolvedValue(noReadabilityResponse);

            const result = await service.analyzeContent(mockRequest);

            expect(result.readabilityScore).toBeDefined();
            expect(typeof result.readabilityScore).toBe('number');
            expect(result.readabilityScore).toBeGreaterThanOrEqual(0);
            expect(result.readabilityScore).toBeLessThanOrEqual(100);
        });

        it('should handle empty entities gracefully', async () => {
            const emptyEntitiesResponse = {
                text: `{
          "sentiment": "neutral",
          "topics": ["test"],
          "keywords": ["test"],
          "summary": "Test summary",
          "entities": null,
          "readabilityScore": 70,
          "wordCount": 5,
          "language": "en",
          "confidence": 80
        }`
            };

            mockGenAI.models.generateContent.mockResolvedValue(emptyEntitiesResponse);

            const result = await service.analyzeContent(mockRequest);

            expect(result.entities).toBeDefined();
            expect(result.entities.people).toEqual([]);
            expect(result.entities.organizations).toEqual([]);
            expect(result.entities.locations).toEqual([]);
        });
    });

    describe('buildAnalysisPrompt', () => {
        it('should build correct prompt structure', () => {
            const privateMethod = (service as any).buildAnalysisPrompt.bind(service);

            const request: AIAnalysisRequest = {
                content: 'Test content',
                title: 'Test Title',
                analysisType: 'sentiment',
                metadata: { source: 'test' }
            };

            const prompt = privateMethod(request);

            expect(prompt).toContain('Content Title: Test Title');
            expect(prompt).toContain('Content: Test content');
            expect(prompt).toContain('Analysis Type: sentiment');
            expect(prompt).toContain('Additional Context: {"source":"test"}');
            expect(prompt).toContain('JSON format');
        });

        it('should handle request without optional fields', () => {
            const privateMethod = (service as any).buildAnalysisPrompt.bind(service);

            const minimalRequest: AIAnalysisRequest = {
                content: 'Minimal content'
            };

            const prompt = privateMethod(minimalRequest);

            expect(prompt).toContain('Content Title: Unknown');
            expect(prompt).toContain('Content: Minimal content');
            expect(prompt).not.toContain('Analysis Type:');
            expect(prompt).not.toContain('Additional Context:');
        });
    });

    describe('validateScore', () => {
        it('should validate score within range', () => {
            const privateMethod = (service as any).validateScore.bind(service);

            expect(privateMethod(50)).toBe(50);
            expect(privateMethod(0)).toBe(0);
            expect(privateMethod(100)).toBe(100);
            expect(privateMethod(-1)).toBeNull();
            expect(privateMethod(101)).toBeNull();
            expect(privateMethod('not-a-number')).toBeNull();
        });
    });

    describe('validateSentiment', () => {
        it('should validate sentiment values', () => {
            const privateMethod = (service as any).validateSentiment.bind(service);

            expect(privateMethod('positive')).toBe('positive');
            expect(privateMethod('negative')).toBe('negative');
            expect(privateMethod('neutral')).toBe('neutral');
            expect(privateMethod('POSITIVE')).toBe('positive');
            expect(privateMethod('invalid')).toBeNull();
            expect(privateMethod(123)).toBeNull();
        });
    });

    describe('calculateReadabilityScore', () => {
        it('should calculate readability based on word count and sentence complexity', () => {
            const privateMethod = (service as any).calculateReadabilityScore.bind(service);

            // Simple content (few sentences, many words per sentence)
            const complexContent = 'This is a very long sentence with many words that makes it complex to read and understand because it has so much information in one single sentence.';
            const complexScore = privateMethod(complexContent);
            expect(complexScore).toBeGreaterThanOrEqual(0);
            expect(complexScore).toBeLessThanOrEqual(100);

            // Complex content (many short sentences)
            const simpleContent = 'This is simple. It has short sentences. Each sentence is clear. The content is easy to read.';
            const simpleScore = privateMethod(simpleContent);
            expect(simpleScore).toBeGreaterThanOrEqual(0);
            expect(simpleScore).toBeLessThanOrEqual(100);
        });
    });
});