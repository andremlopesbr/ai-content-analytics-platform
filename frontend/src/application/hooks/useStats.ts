import { useQuery } from '@tanstack/react-query';
import { fetchStats } from '../../api';
import { Stats } from '../../domain/entities/Stats';

// Hook personalizado para buscar estatísticas
export const useStats = () => {
    return useQuery<Stats>({
        queryKey: ['stats'],
        queryFn: fetchStats,
    });
};