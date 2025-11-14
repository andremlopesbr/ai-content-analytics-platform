import React, { useState } from 'react';
import { Box, Button, CircularProgress, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import { useAnalyzeContent, useAnalyses } from '../../application/hooks';
import { AnalysisStatus } from './StatusIndicators';
import { Content } from '../../api';

interface AnalysisControlsProps {
    content: Content;
}

const AnalysisControls: React.FC<AnalysisControlsProps> = ({ content }) => {
    const { data: analyses } = useAnalyses();
    const { mutate: analyze, isPending } = useAnalyzeContent();
    const [analysisType, setAnalysisType] = useState<string>('all');

    const contentAnalysis = analyses?.find(a => a.contentId === content.id);

    const handleAnalyze = () => {
        const type = analysisType === 'all' ? undefined : analysisType;
        analyze({ contentId: content.id, analysisType: type });
    };

    const getAnalysisDetails = () => {
        if (!contentAnalysis?.results) return null;
        const results = contentAnalysis.results;
        return {
            sentiment: results.sentiment,
            keywords: results.keywords,
            summary: results.summary,
            topics: results.topics,
            entities: results.entities
        };
    };

    const analysisDetails = getAnalysisDetails();

    return (
        <Box display="flex" flexDirection="column" gap={1}>
            <Box display="flex" alignItems="center" gap={1}>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Tipo</InputLabel>
                    <Select
                        value={analysisType}
                        label="Tipo"
                        onChange={(e) => setAnalysisType(e.target.value)}
                    >
                        <MenuItem value="all">Todos</MenuItem>
                        <MenuItem value="sentiment">Sentimento</MenuItem>
                        <MenuItem value="topics">Tópicos</MenuItem>
                        <MenuItem value="keywords">Palavras-chave</MenuItem>
                        <MenuItem value="summary">Resumo</MenuItem>
                        <MenuItem value="entities">Entidades</MenuItem>
                    </Select>
                </FormControl>

                <Button
                    variant="outlined"
                    startIcon={
                        isPending ? (
                            <CircularProgress size={16} />
                        ) : (
                            <AnalyticsIcon />
                        )
                    }
                    onClick={handleAnalyze}
                    disabled={isPending}
                    size="small"
                >
                    {isPending ? 'Analisando...' : 'Analisar'}
                </Button>
            </Box>

            <Box>
                <AnalysisStatus
                    hasAnalysis={!!contentAnalysis}
                    isAnalyzing={isPending}
                    analysisStatus={contentAnalysis?.status}
                />
            </Box>

            {analysisDetails && (
                <Box sx={{ mt: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1, fontSize: '0.8rem' }}>
                    {analysisDetails.sentiment && (
                        <div><strong>Sentimento:</strong> {analysisDetails.sentiment}</div>
                    )}
                    {analysisDetails.keywords && analysisDetails.keywords.length > 0 && (
                        <div><strong>Palavras-chave:</strong> {analysisDetails.keywords.join(', ')}</div>
                    )}
                    {analysisDetails.summary && (
                        <div><strong>Resumo:</strong> {analysisDetails.summary}</div>
                    )}
                    {analysisDetails.topics && analysisDetails.topics.length > 0 && (
                        <div><strong>Tópicos:</strong> {analysisDetails.topics.join(', ')}</div>
                    )}
                    {analysisDetails.entities && analysisDetails.entities.length > 0 && (
                        <div><strong>Entidades:</strong> {analysisDetails.entities.map(e => `${e.name} (${e.type})`).join(', ')}</div>
                    )}
                </Box>
            )}
        </Box>
    );
};

export default AnalysisControls;