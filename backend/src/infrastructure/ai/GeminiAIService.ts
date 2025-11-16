import { injectable } from 'tsyringe';
import { AppError } from '../../shared/errors/AppError';

export interface AIAnalysisRequest {
    content: string;
    analysisType?: string;
    title?: string;
    metadata?: Record<string, any>;
}

export interface AIAnalysisResponse {
    sentiment: 'positive' | 'negative' | 'neutral';
    topics: string[];
    keywords: string[];
    summary: string;
    entities: {
        people: string[];
        organizations: string[];
        locations: string[];
    };
    readabilityScore: number;
    wordCount: number;
    language: string;
    confidence: number;
}

@injectable()
export class GeminiAIService {
    private genAI: any;

    constructor() {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new AppError('GEMINI_API_KEY is required but not configured', 500);
        }

        // Use dynamic import for ES module
        const { GoogleGenAI } = require('@google/genai');
        this.genAI = new GoogleGenAI({ apiKey });
        console.log('Gemini AI initialized with new library');
    }

    async analyzeContent(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
        try {
            console.log('Starting Gemini AI analysis for content:', request.title || 'Untitled');
            const prompt = this.buildAnalysisPrompt(request);
            console.log('Prompt built, generating content...');

            // Use the new library API
            const response = await this.genAI.models.generateContent({
                model: 'gemini-2.0-flash-exp',
                contents: prompt,
            });

            console.log('Content generated, getting response...');

            let text = '';
            for await (const chunk of response) {
                text += chunk.text || '';
            }

            console.log('Response received, parsing...');

            const parsedResponse = this.parseAnalysisResponse(text, request.content);
            console.log('Analysis completed successfully');
            return parsedResponse;
        } catch (error: any) {
            console.error('Gemini AI analysis error:', error);
            console.error('Error details:', error.response?.data || error.message);
            throw new AppError(`AI analysis failed: ${error.message}`, 500);
        }
    }

    private buildAnalysisPrompt(request: AIAnalysisRequest): string {
        const { content, analysisType, title, metadata } = request;

        return `
Analyze the following content and provide a comprehensive analysis. Return the results in JSON format with the following structure:

{
  "sentiment": "positive|negative|neutral",
  "topics": ["topic1", "topic2", "topic3"],
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "summary": "brief summary of the content",
  "entities": {
    "people": ["person1", "person2"],
    "organizations": ["org1", "org2"],
    "locations": ["location1", "location2"]
  },
  "readabilityScore": 0-100,
  "wordCount": number,
  "language": "language-code",
  "confidence": 0-100
}

Content Title: ${title || 'Unknown'}
Content: ${content}

${analysisType ? `Analysis Type: ${analysisType}` : ''}
${metadata ? `Additional Context: ${JSON.stringify(metadata)}` : ''}

Please provide accurate and detailed analysis. Focus on:
- Sentiment analysis (positive/negative/neutral)
- Main topics/themes
- Key terms and phrases
- Concise summary
- Named entities (people, organizations, locations)
- Readability assessment
- Word count
- Language detection
- Confidence level of analysis
`;
    }

    private parseAnalysisResponse(responseText: string, originalContent: string): AIAnalysisResponse {
        try {
            // Try to extract JSON from the response
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No JSON found in AI response');
            }

            const parsed = JSON.parse(jsonMatch[0]);

            // Validate and provide defaults for missing fields
            return {
                sentiment: this.validateSentiment(parsed.sentiment) || 'neutral',
                topics: Array.isArray(parsed.topics) ? parsed.topics : [],
                keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
                summary: parsed.summary || 'No summary available',
                entities: {
                    people: Array.isArray(parsed.entities?.people) ? parsed.entities.people : [],
                    organizations: Array.isArray(parsed.entities?.organizations) ? parsed.entities.organizations : [],
                    locations: Array.isArray(parsed.entities?.locations) ? parsed.entities.locations : [],
                },
                readabilityScore: this.validateScore(parsed.readabilityScore) || this.calculateReadabilityScore(originalContent),
                wordCount: parsed.wordCount || originalContent.split(/\s+/).length,
                language: parsed.language || 'pt-BR',
                confidence: this.validateScore(parsed.confidence) || 85,
            };
        } catch (error) {
            console.error('Error parsing AI response:', error);
            // Fallback response
            return this.createFallbackResponse(originalContent);
        }
    }

    private validateSentiment(sentiment: any): AIAnalysisResponse['sentiment'] | null {
        if (typeof sentiment === 'string') {
            const valid = ['positive', 'negative', 'neutral'];
            return valid.includes(sentiment.toLowerCase()) ? sentiment.toLowerCase() as AIAnalysisResponse['sentiment'] : null;
        }
        return null;
    }

    private validateScore(score: any): number | null {
        if (typeof score === 'number' && score >= 0 && score <= 100) {
            return score;
        }
        return null;
    }

    private calculateReadabilityScore(content: string): number {
        // Simple readability calculation based on sentence and word complexity
        const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const words = content.split(/\s+/).filter(w => w.length > 0);
        const avgWordsPerSentence = words.length / sentences.length;

        // Very simple formula - can be improved
        const score = Math.max(0, Math.min(100, 100 - (avgWordsPerSentence - 15) * 2));
        return Math.round(score);
    }

    private createFallbackResponse(content: string): AIAnalysisResponse {
        const wordCount = content.split(/\s+/).length;

        return {
            sentiment: 'neutral',
            topics: ['general'],
            keywords: content.split(/\s+/).slice(0, 5), // First 5 words as fallback
            summary: content.length > 100 ? content.substring(0, 100) + '...' : content,
            entities: {
                people: [],
                organizations: [],
                locations: [],
            },
            readabilityScore: this.calculateReadabilityScore(content),
            wordCount,
            language: 'pt-BR',
            confidence: 50, // Lower confidence for fallback
        };
    }
}