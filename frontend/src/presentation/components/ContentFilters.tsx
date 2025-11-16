import React from 'react';
import {
    Box,
    TextField,
    Button,
    Grid,
    Chip,
    Collapse,
} from '@mui/material';
import {
    FilterList as FilterListIcon,
    Clear as ClearIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { useContentFilters } from '../../application/hooks/useContentFilters';

interface ContentFiltersProps {
    showFilters: boolean;
    onToggleFilters: () => void;
}

const ContentFiltersComponent: React.FC<ContentFiltersProps> = ({
    showFilters,
    onToggleFilters,
}) => {
    const {
        filters,
        updateFilter,
        clearFilters,
        getActiveFilterCount,
    } = useContentFilters();

    const activeFilterCount = getActiveFilterCount();

    const handleTagAdd = (tag: string) => {
        const currentTags = filters.tags || [];
        if (!currentTags.includes(tag)) {
            updateFilter('tags', [...currentTags, tag]);
        }
    };

    const handleTagRemove = (tag: string) => {
        const currentTags = filters.tags || [];
        updateFilter('tags', currentTags.filter(t => t !== tag));
    };

    const handleTagKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            const value = (event.target as HTMLInputElement).value.trim();
            if (value) {
                handleTagAdd(value);
                (event.target as HTMLInputElement).value = '';
            }
        }
    };

    return (
        <Box>
            {/* Filter Toggle Button */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Button
                    variant="outlined"
                    startIcon={<FilterListIcon />}
                    endIcon={showFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    onClick={onToggleFilters}
                >
                    Filtros {activeFilterCount > 0 && `(${activeFilterCount})`}
                </Button>

                {activeFilterCount > 0 && (
                    <Button
                        variant="text"
                        startIcon={<ClearIcon />}
                        onClick={clearFilters}
                        size="small"
                    >
                        Limpar Filtros
                    </Button>
                )}
            </Box>

            {/* Collapsible Filters */}
            <Collapse in={showFilters}>
                <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1, mb: 2 }}>
                    <Grid container spacing={2}>
                        {/* Search */}
                        <Grid item xs={12} sm={6} md={4}>
                            <TextField
                                fullWidth
                                label="Buscar"
                                placeholder="Título, URL ou conteúdo..."
                                value={filters.search || ''}
                                onChange={(e) => updateFilter('search', e.target.value)}
                                size="small"
                            />
                        </Grid>

                        {/* Author */}
                        <Grid item xs={12} sm={6} md={4}>
                            <TextField
                                fullWidth
                                label="Autor"
                                value={filters.author || ''}
                                onChange={(e) => updateFilter('author', e.target.value)}
                                size="small"
                            />
                        </Grid>

                        {/* Date Range */}
                        <Grid item xs={12} sm={6} md={2}>
                            <TextField
                                fullWidth
                                label="Publicado após"
                                type="date"
                                value={filters.publishedAfter?.toISOString().split('T')[0] || ''}
                                onChange={(e) => updateFilter('publishedAfter',
                                    e.target.value ? new Date(e.target.value) : undefined
                                )}
                                size="small"
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6} md={2}>
                            <TextField
                                fullWidth
                                label="Publicado antes"
                                type="date"
                                value={filters.publishedBefore?.toISOString().split('T')[0] || ''}
                                onChange={(e) => updateFilter('publishedBefore',
                                    e.target.value ? new Date(e.target.value) : undefined
                                )}
                                size="small"
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>

                        {/* Tags */}
                        <Grid item xs={12}>
                            <Box>
                                <TextField
                                    fullWidth
                                    label="Adicionar tag"
                                    placeholder="Digite uma tag e pressione Enter"
                                    onKeyPress={handleTagKeyPress}
                                    size="small"
                                    sx={{ mb: 1 }}
                                />
                                <Box display="flex" flexWrap="wrap" gap={1}>
                                    {(filters.tags || []).map((tag) => (
                                        <Chip
                                            key={tag}
                                            label={tag}
                                            onDelete={() => handleTagRemove(tag)}
                                            size="small"
                                            color="primary"
                                            variant="outlined"
                                        />
                                    ))}
                                </Box>
                            </Box>
                        </Grid>
                    </Grid>
                </Box>
            </Collapse>
        </Box>
    );
};

export default ContentFiltersComponent;