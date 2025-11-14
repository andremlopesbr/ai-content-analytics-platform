import { useState, useCallback } from 'react';

export interface ContentFilters {
    search?: string;
    author?: string;
    tags?: string[];
    publishedAfter?: Date;
    publishedBefore?: Date;
}

export interface UseContentFiltersReturn {
    filters: ContentFilters;
    setFilters: (filters: ContentFilters) => void;
    updateFilter: <K extends keyof ContentFilters>(key: K, value: ContentFilters[K]) => void;
    clearFilters: () => void;
    hasActiveFilters: boolean;
    getActiveFilterCount: () => number;
    getApiFilters: () => {
        search?: string;
        author?: string;
        publishedAfter?: string;
        publishedBefore?: string;
    };
}

/**
 * Hook para gerenciar filtros de conteúdo
 * Centraliza toda a lógica de filtros seguindo DDD
 */
export const useContentFilters = (): UseContentFiltersReturn => {
    const [filters, setFilters] = useState<ContentFilters>({});

    const updateFilter = useCallback(<K extends keyof ContentFilters>(
        key: K,
        value: ContentFilters[K]
    ) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    }, []);

    const clearFilters = useCallback(() => {
        setFilters({});
    }, []);

    const hasActiveFilters = Object.values(filters).some(value =>
        value !== undefined && value !== null && value !== '' &&
        (!(Array.isArray(value)) || value.length > 0)
    );

    const getActiveFilterCount = useCallback(() => {
        return Object.values(filters).filter(value =>
            value !== undefined && value !== null && value !== '' &&
            (!(Array.isArray(value)) || value.length > 0)
        ).length;
    }, [filters]);

    const getApiFilters = useCallback(() => {
        return {
            search: filters.search || undefined,
            author: filters.author || undefined,
            publishedAfter: filters.publishedAfter?.toISOString(),
            publishedBefore: filters.publishedBefore?.toISOString(),
        };
    }, [filters]);

    return {
        filters,
        setFilters,
        updateFilter,
        clearFilters,
        hasActiveFilters,
        getActiveFilterCount,
        getApiFilters,
    };
};