import React, { useState, useMemo } from 'react';
import {
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    InputAdornment,
    Typography,
    Chip,
    IconButton,
    Collapse,
    CircularProgress,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useContents, useAnalyses } from '../../application/hooks';
import AnalysisControls from './AnalysisControls';
import StatusIndicator from './StatusIndicators';

const ContentList: React.FC = () => {
    const { data: contents, isLoading, error } = useContents();
    const { data: analyses } = useAnalyses();
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    const filteredContents = useMemo(() => {
        if (!contents) return [];

        return contents.filter(content =>
            content.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            content.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
            content.content.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [contents, searchTerm]);

    const toggleRowExpansion = (contentId: string) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(contentId)) {
            newExpanded.delete(contentId);
        } else {
            newExpanded.add(contentId);
        }
        setExpandedRows(newExpanded);
    };

    const getAnalysisStatus = (contentId: string) => {
        const analysis = analyses?.find(a => a.contentId === contentId);
        return analysis ? analysis.status : 'pending';
    };

    if (isLoading) {
        return (
            <Paper sx={{ p: 3 }}>
                <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                    <CircularProgress />
                    <Typography sx={{ ml: 2 }}>Carregando conteúdos...</Typography>
                </Box>
            </Paper>
        );
    }

    if (error) {
        return (
            <Paper sx={{ p: 3 }}>
                <Typography color="error">Erro ao carregar conteúdos</Typography>
            </Paper>
        );
    }

    return (
        <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
                Conteúdos Raspados
            </Typography>

            <Box mb={2}>
                <TextField
                    fullWidth
                    placeholder="Buscar por título, URL ou conteúdo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        ),
                    }}
                    variant="outlined"
                />
            </Box>

            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Título</TableCell>
                            <TableCell>Autor</TableCell>
                            <TableCell>Publicado</TableCell>
                            <TableCell>Tags</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Criado</TableCell>
                            <TableCell>Ações</TableCell>
                            <TableCell width="50px"></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredContents.map((content) => (
                            <React.Fragment key={content.id}>
                                <TableRow>
                                    <TableCell>
                                        <Box>
                                            <Typography variant="body2" noWrap sx={{ maxWidth: 250, fontWeight: 'bold' }}>
                                                {content.title}
                                            </Typography>
                                            <Typography
                                                variant="caption"
                                                color="primary"
                                                sx={{
                                                    maxWidth: 250,
                                                    cursor: 'pointer',
                                                    textDecoration: 'underline',
                                                    '&:hover': { color: 'primary.dark' }
                                                }}
                                                onClick={() => window.open(content.url, '_blank')}
                                            >
                                                {content.url}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {content.author || '-'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {content.publishedAt ? new Date(content.publishedAt).toLocaleDateString('pt-BR') : '-'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {(content.tags || []).slice(0, 3).map((tag, index) => (
                                                <Chip
                                                    key={index}
                                                    label={tag}
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{ fontSize: '0.7rem', height: '20px' }}
                                                />
                                            ))}
                                            {(content.tags || []).length > 3 && (
                                                <Typography variant="caption" color="text.secondary">
                                                    +{(content.tags || []).length - 3}
                                                </Typography>
                                            )}
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <StatusIndicator status={getAnalysisStatus(content.id)} />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {new Date(content.createdAt).toLocaleDateString('pt-BR')}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <AnalysisControls content={content} />
                                    </TableCell>
                                    <TableCell>
                                        <IconButton
                                            size="small"
                                            onClick={() => toggleRowExpansion(content.id)}
                                        >
                                            {expandedRows.has(content.id) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
                                        <Collapse in={expandedRows.has(content.id)} timeout="auto" unmountOnExit>
                                            <Box sx={{ margin: 1 }}>
                                                <Typography variant="body2" gutterBottom>
                                                    <strong>Conteúdo:</strong>
                                                </Typography>
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        mt: 0.5,
                                                        maxHeight: 150,
                                                        overflow: 'auto',
                                                        backgroundColor: 'grey.50',
                                                        p: 1,
                                                        borderRadius: 1,
                                                    }}
                                                >
                                                    {content.content}
                                                </Typography>
                                                {content.metadata && Object.keys(content.metadata).length > 0 && (
                                                    <>
                                                        <Typography variant="body2" sx={{ mt: 1 }}>
                                                            <strong>Metadados:</strong>
                                                        </Typography>
                                                        <Typography
                                                            variant="body2"
                                                            sx={{
                                                                mt: 0.5,
                                                                maxHeight: 100,
                                                                overflow: 'auto',
                                                                backgroundColor: 'grey.100',
                                                                p: 1,
                                                                borderRadius: 1,
                                                                fontFamily: 'monospace',
                                                                fontSize: '0.8rem'
                                                            }}
                                                        >
                                                            {JSON.stringify(content.metadata, null, 2)}
                                                        </Typography>
                                                    </>
                                                )}
                                            </Box>
                                        </Collapse>
                                    </TableCell>
                                </TableRow>
                            </React.Fragment>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {filteredContents.length === 0 && (
                <Box textAlign="center" py={4}>
                    <Typography color="text.secondary">
                        {searchTerm ? 'Nenhum conteúdo encontrado para a busca.' : 'Nenhum conteúdo raspado ainda.'}
                    </Typography>
                </Box>
            )}
        </Paper>
    );
};

export default ContentList;