import React from 'react';
import { Box, Chip, CircularProgress, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import PendingIcon from '@mui/icons-material/Pending';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

export type StatusType = 'pending' | 'processing' | 'completed' | 'failed';

interface StatusIndicatorProps {
    status: StatusType;
    size?: 'small' | 'medium';
    showLabel?: boolean;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({
    status,
    size = 'medium',
    showLabel = true,
}) => {
    const getStatusConfig = (status: StatusType) => {
        switch (status) {
            case 'pending':
                return {
                    icon: <PendingIcon fontSize={size} />,
                    color: 'warning' as const,
                    label: 'Pendente',
                };
            case 'processing':
                return {
                    icon: <CircularProgress size={size === 'small' ? 16 : 20} />,
                    color: 'info' as const,
                    label: 'Processando',
                };
            case 'completed':
                return {
                    icon: <CheckCircleIcon fontSize={size} />,
                    color: 'success' as const,
                    label: 'Concluído',
                };
            case 'failed':
                return {
                    icon: <ErrorIcon fontSize={size} />,
                    color: 'error' as const,
                    label: 'Falhou',
                };
            default:
                return {
                    icon: <PendingIcon fontSize={size} />,
                    color: 'default' as const,
                    label: 'Desconhecido',
                };
        }
    };

    const config = getStatusConfig(status);

    return (
        <Box display="flex" alignItems="center" gap={1}>
            <Chip
                icon={config.icon}
                label={showLabel ? config.label : undefined}
                color={config.color}
                size={size}
                variant={status === 'processing' ? 'outlined' : 'filled'}
            />
            {!showLabel && (
                <Typography variant="caption" color="text.secondary">
                    {config.label}
                </Typography>
            )}
        </Box>
    );
};

interface AnalysisStatusProps {
    hasAnalysis: boolean;
    isAnalyzing: boolean;
    analysisStatus?: StatusType;
}

export const AnalysisStatus: React.FC<AnalysisStatusProps> = ({
    hasAnalysis,
    isAnalyzing,
    analysisStatus,
}) => {
    if (!hasAnalysis && !isAnalyzing) {
        return (
            <Box display="flex" alignItems="center" gap={1}>
                <PlayArrowIcon color="action" fontSize="small" />
                <Typography variant="body2" color="text.secondary">
                    Não analisado
                </Typography>
            </Box>
        );
    }

    if (isAnalyzing) {
        return <StatusIndicator status="processing" showLabel={true} />;
    }

    if (analysisStatus) {
        return <StatusIndicator status={analysisStatus} showLabel={true} />;
    }

    return <StatusIndicator status="completed" showLabel={true} />;
};

export default StatusIndicator;