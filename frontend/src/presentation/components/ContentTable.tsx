import React, { useState } from 'react';
import {
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    Chip,
    IconButton,
    Collapse,
} from '@mui/material';
import {
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import StatusIndicator, { StatusType } from './StatusIndicators';
import AnalysisControls from './AnalysisControls';
import { Content } from '../../api';
import { useAnalyses } from '../../application/hooks/useAnalyses';

interface ContentTableProps {
    contents: Content[];
    total: number;
    loading?: boolean;
}

const ContentTable: React.FC<ContentTableProps> = ({
    contents,
    total,
    loading = false,
}) => {
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const { data: analyses } = useAnalyses();

    const toggleRowExpansion = (contentId: string) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(contentId)) {
            newExpanded.delete(contentId);
        } else {
            newExpanded.add(contentId);
        }
        setExpandedRows(newExpanded);
    };

    const getAnalysisStatus = (contentId: string): StatusType => {
        const analysis = analyses?.find(a => a.contentId === contentId);
        return analysis?.status || 'pending';
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" p={4}>
                <Typography>Carregando conteúdos...</Typography>
            </Box>
        );
    }

    return (
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
                    {contents.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={8} align="center">
                                <Typography color="text.secondary">
                                    Nenhum conteúdo encontrado
                                </Typography>
                            </TableCell>
                        </TableRow>
                    ) : (
                        contents.map((content) => (
                            <React.Fragment key={content.id}>
                                <TableRow hover>
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
                                        <StatusIndicator status={getAnalysisStatus(content.id)} size="small" />
                                        {getAnalysisStatus(content.id) === 'pending' && (
                                            <Typography variant="caption" color="text.secondary" display="block">
                                                Não analisado
                                            </Typography>
                                        )}
                                        {getAnalysisStatus(content.id) === 'failed' && (
                                            <Typography variant="caption" color="error" display="block">
                                                Clique em "Analisar" para tentar novamente
                                            </Typography>
                                        )}
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
                        ))
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default ContentTable;