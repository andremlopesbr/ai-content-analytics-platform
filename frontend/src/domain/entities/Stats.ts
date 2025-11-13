// Entidade de domínio para Estatísticas
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