import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Tipos comuns
export interface Content {
    id: string;
    url: string;
    title: string;
    content: string;
    author?: string;
    publishedAt?: string;
    tags?: string[];
    metadata?: Record<string, any>;
    createdAt: string;
    updatedAt: string;
}

export interface Analysis {
    id: string;
    contentId: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    results?: {
        sentiment?: string;
        keywords?: string[];
        summary?: string;
        topics?: string[];
        entities?: Array<{ name: string; type: string; }>;
    };
    error?: string;
    metadata?: Record<string, any>;
    createdAt: string;
    updatedAt: string;
}

export interface Report {
    id: string;
    title: string;
    type: 'content_summary' | 'trend_analysis' | 'performance_metrics' | 'custom';
    contentIds?: string[];
    analysisIds?: string[];
    data?: Record<string, any>;
    metadata?: Record<string, any>;
    generatedBy?: string;
    createdAt: string;
    updatedAt: string;
}

// Funções de API simplificadas
export const fetchContents = async (): Promise<Content[]> => {
    const response = await api.get('/contents');
    return response.data;
};

export const fetchContent = async (id: string): Promise<Content> => {
    const response = await api.get(`/content/${id}`);
    return response.data;
};

export const scrapeContent = async (url: string): Promise<Content> => {
    const response = await api.post('/scrape', { url });
    return response.data;
};

export const fetchAnalyses = async (): Promise<Analysis[]> => {
    const response = await api.get('/analyses');
    return response.data;
};

export const analyzeContent = async (contentId: string): Promise<Analysis> => {
    const response = await api.post('/analyze', { contentId });
    return response.data;
};

export const fetchReports = async (): Promise<Report[]> => {
    const response = await api.get('/reports');
    return response.data;
};

export const generateReport = async (data: { title: string }): Promise<Report> => {
    const response = await api.post('/reports/generate', data);
    return response.data;
};

export const exportReportPdf = async (reportId: string): Promise<Blob> => {
    const response = await api.get(`/reports/${reportId}/export/pdf`, {
        responseType: 'blob',
    });
    return response.data;
};

export interface Stats {
    totalContents: number;
    totalAnalyses: number;
    totalReports: number;
    contentsByStatus: {
        analyzed: number;
        pending: number;
    };
    analysesByStatus: {
        pending: number;
        processing: number;
        completed: number;
        failed: number;
    };
    reportsByType: {
        content_summary: number;
        trend_analysis: number;
        performance_metrics: number;
        custom: number;
    };
}

export const fetchStats = async (): Promise<Stats> => {
    const response = await api.get('/stats');
    return response.data;
};