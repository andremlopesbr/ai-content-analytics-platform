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
        return analysis ? 'analyzed' : 'pending';
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
                            <TableCell>Status</TableCell>
                            <TableCell>Data</TableCell>
                            <TableCell>Ações</TableCell>
                            <TableCell width="50px"></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredContents.map((content) => (
                            <React.Fragment key={content.id}>
                                <TableRow>
                                    <TableCell>
                                        <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                                            {content.title}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={getAnalysisStatus(content.id) === 'analyzed' ? 'Analisado' : 'Pendente'}
                                            color={getAnalysisStatus(content.id) === 'analyzed' ? 'success' : 'default'}
                                            size="small"
                                        />
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
                                    <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={5}>
                                        <Collapse in={expandedRows.has(content.id)} timeout="auto" unmountOnExit>
                                            <Box sx={{ margin: 1 }}>
                                                <Typography variant="body2" gutterBottom>
                                                    <strong>URL:</strong> {content.url}
                                                </Typography>
                                                <Typography variant="body2" sx={{ mt: 1 }}>
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