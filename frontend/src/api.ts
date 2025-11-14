import axios, { AxiosError } from 'axios';
import { toast } from 'react-toastify';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor para tratamento de erros centralizado
api.interceptors.response.use(
    (response) => response, // Sucesso: apenas repassa a resposta
    (error: AxiosError) => {
        // Lógica para lidar com erros de API
        console.error('API Error:', error.response?.data || error.message);

        // Exemplo de notificação para o usuário
        const errorMessage = (error.response?.data as { message?: string })?.message || 'Ocorreu um erro inesperado. Tente novamente mais tarde.';
        toast.error(errorMessage);

        // Rejeita a promessa para que o erro possa ser tratado no local da chamada, se necessário
        return Promise.reject(error);
    }
);


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
export const fetchContents = async (params?: {
    search?: string;
    author?: string;
    tags?: string[];
    publishedAfter?: string;
    publishedBefore?: string;
    limit?: number;
    offset?: number;
}): Promise<{ contents: Content[], total: number }> => {
    const response = await api.get('/contents', { params });
    return response.data;
};

export const fetchContent = async (id: string): Promise<Content> => {
    // Sugestão: Usar o endpoint no plural para consistência com REST
    const response = await api.get(`/contents/${id}`);
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

export const analyzeContent = async (params: { contentId: string; analysisType?: string }): Promise<Analysis> => {
    const response = await api.post('/analyze', params);
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