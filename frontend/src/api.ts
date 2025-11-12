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
    createdAt: string;
}

export interface Analysis {
    id: string;
    contentId: string;
    sentiment: string;
    keywords: string[];
    summary: string;
    createdAt: string;
}

export interface Report {
    id: string;
    title: string;
    content: string;
    generatedAt: string;
}

// Funções de API simplificadas
export const fetchContents = async (): Promise<Content[]> => {
    const response = await api.get('/contents');
    return response.data;
};

export const fetchContent = async (id: string): Promise<Content> => {
    const response = await api.get(`/contents/${id}`);
    return response.data;
};

export const scrapeContent = async (url: string): Promise<Content> => {
    const response = await api.post('/contents/scrape', { url });
    return response.data;
};

export const fetchAnalyses = async (): Promise<Analysis[]> => {
    const response = await api.get('/analyses');
    return response.data;
};

export const analyzeContent = async (contentId: string): Promise<Analysis> => {
    const response = await api.post('/analyses', { contentId });
    return response.data;
};

export const fetchReports = async (): Promise<Report[]> => {
    const response = await api.get('/reports');
    return response.data;
};

export const generateReport = async (data: { title: string }): Promise<Report> => {
    const response = await api.post('/reports', data);
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