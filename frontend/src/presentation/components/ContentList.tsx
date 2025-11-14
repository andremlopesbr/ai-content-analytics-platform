import React, { useState } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { useContents } from '../../application/hooks';
import { useContentFilters } from '../../application/hooks/useContentFilters';
import ContentFilters from './ContentFilters';
import ContentTable from './ContentTable';

/**
 * ContentList - Componente principal para listar conteúdos
 *
 * Segue os princípios DDD separando responsabilidades:
 * - useContentFilters: Gerencia estado dos filtros
 * - useContents: Busca dados da API
 * - ContentFilters: UI dos filtros
 * - ContentTable: Renderização da tabela
 */
const ContentList: React.FC = () => {
    const [showFilters, setShowFilters] = useState(false);

    // Hook para gerenciar filtros
    const { getApiFilters } = useContentFilters();

    // Hook para buscar conteúdos com filtros
    const { data: contentsData, isLoading } = useContents(getApiFilters());

    const contents = contentsData?.contents || [];
    const total = contentsData?.total || 0;

    return (
        <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
                Conteúdos Raspados ({total} total)
            </Typography>

            {/* Componente de Filtros */}
            <ContentFilters
                showFilters={showFilters}
                onToggleFilters={() => setShowFilters(!showFilters)}
            />

            {/* Componente de Tabela */}
            <ContentTable
                contents={contents}
                total={total}
                loading={isLoading}
            />
        </Paper>
    );
};

export default ContentList;