import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAnalyses, analyzeContent, Analysis } from '../../api';

// Hook para buscar todas as análises
export const useAnalyses = () => {
    return useQuery<Analysis[]>({
        queryKey: ['analyses'],
        queryFn: fetchAnalyses,
    });
};

// Hook para analisar conteúdo
export const useAnalyzeContent = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (contentId: string) => analyzeContent(contentId),
        onSuccess: () => {
            // Invalidate queries para atualizar listas
            queryClient.invalidateQueries({ queryKey: ['analyses'] });
            queryClient.invalidateQueries({ queryKey: ['contents'] });
            queryClient.invalidateQueries({ queryKey: ['stats'] });
        },
    });
};