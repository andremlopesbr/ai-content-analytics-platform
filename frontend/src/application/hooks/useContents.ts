import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchContents, fetchContent, scrapeContent, Content } from '../../api';

// Hook para buscar todos os conteúdos
export const useContents = (filters?: {
    search?: string;
    author?: string;
    tags?: string[];
    publishedAfter?: string;
    publishedBefore?: string;
    limit?: number;
    offset?: number;
}) => {
    // Define limite padrão de 10 se não especificado
    const defaultFilters = { limit: 10, ...filters };
    return useQuery({
        queryKey: ['contents', defaultFilters],
        queryFn: () => fetchContents(defaultFilters),
    });
};

// Hook para buscar um conteúdo específico
export const useContent = (id: string) => {
    return useQuery<Content>({
        queryKey: ['contents', id],
        queryFn: () => fetchContent(id),
        enabled: !!id,
    });
};

// Hook para scraping de conteúdo
export const useScrapeContent = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (url: string) => scrapeContent(url),
        onSuccess: () => {
            // Invalidate queries para atualizar a lista de conteúdos
            queryClient.invalidateQueries({ queryKey: ['contents'] });
            queryClient.invalidateQueries({ queryKey: ['stats'] });
        },
    });
};