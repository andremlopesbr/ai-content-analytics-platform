import React from 'react';
import { Box, Button, CircularProgress } from '@mui/material';
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

    const contentAnalysis = analyses?.find(a => a.contentId === content.id);

    const handleAnalyze = () => {
        analyze(content.id);
    };

    return (
        <Box display="flex" alignItems="center" justifyContent="space-between" gap={2}>
            <Box flex={1}>
                <AnalysisStatus
                    hasAnalysis={!!contentAnalysis}
                    isAnalyzing={isPending}
                    analysisStatus={contentAnalysis?.sentiment ? 'completed' : undefined}
                />
            </Box>

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
    );
};

export default AnalysisControls;