import { useQuery } from '@tanstack/react-query';
import { fetchReports, exportReportPdf, Report } from '../../api';
import { ReportItem } from '../../domain/types/dashboard';

// Hook personalizado para buscar relatórios
export const useReports = () => {
    const query = useQuery<Report[]>({
        queryKey: ['reports'],
        queryFn: fetchReports,
    });

    // Transforma os dados da API para o formato do domínio
    const reports: ReportItem[] = Array.isArray(query.data)
        ? query.data.map(report => ({
            id: report.id,
            title: report.title,
            createdAt: report.generatedAt, // Mapeia generatedAt para createdAt
        }))
        : [];

    return {
        ...query,
        data: reports,
    };
};

// Hook personalizado para exportar relatório como PDF
export const useExportReportPdf = () => {
    const exportPdf = async (reportId: string, title: string) => {
        try {
            const blob = await exportReportPdf(reportId);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Erro ao exportar PDF:', error);
            throw error;
        }
    };

    return { exportPdf };
};