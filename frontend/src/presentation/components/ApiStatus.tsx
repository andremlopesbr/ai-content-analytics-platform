import React from 'react';
import {
    Box,
    Alert,
    AlertTitle,
    CircularProgress,
    Typography,
    Collapse,
    IconButton,
} from '@mui/material';
import {
    CheckCircle,
    Error,
    Warning,
    Info,
    Close,
} from '@mui/icons-material';
import { UseQueryResult } from '@tanstack/react-query';

export type StatusType = 'idle' | 'loading' | 'success' | 'error' | 'warning' | 'info';

export interface ApiStatusProps {
    /**
     * Status atual da operação
     */
    status?: StatusType;

    /**
     * Mensagem a ser exibida
     */
    message?: string;

    /**
     * Título da mensagem (opcional)
     */
    title?: string;

    /**
     * Detalhes adicionais do erro ou sucesso
     */
    details?: string;

    /**
     * Se deve mostrar ícone
     */
    showIcon?: boolean;

    /**
     * Se o status deve desaparecer automaticamente após sucesso
     */
    autoHideSuccess?: boolean;

    /**
     * Tempo em ms para auto-hide (padrão: 5000)
     */
    autoHideDuration?: number;

    /**
     * Callback quando o status é fechado
     */
    onClose?: () => void;

    /**
     * Se deve permitir fechar manualmente
     */
    closable?: boolean;

    /**
     * Props adicionais para o container
     */
    containerProps?: React.ComponentProps<typeof Box>;

    /**
     * Variação do Alert (filled, outlined, standard)
     */
    variant?: 'filled' | 'outlined' | 'standard';

    /**
     * Severidade do Alert
     */
    severity?: 'success' | 'error' | 'warning' | 'info';
}

export interface ApiStatusFromQueryProps extends Omit<ApiStatusProps, 'status' | 'message'> {
    /**
     * Query do React Query para extrair status e mensagens
     */
    query: UseQueryResult<any, any>;

    /**
     * Mensagem de sucesso customizada
     */
    successMessage?: string;

    /**
     * Mensagem de erro customizada
     */
    errorMessage?: string;

    /**
     * Mensagem de loading customizada
     */
    loadingMessage?: string;
}

/**
 * Componente ApiStatus - Exibe status de operações assíncronas
 *
 * Suporte a diferentes tipos de status com ícones apropriados,
 * mensagens customizáveis e auto-hide para sucessos.
 *
 * @example
 * ```tsx
 * <ApiStatus
 *   status="loading"
 *   message="Salvando dados..."
 *   showIcon
 * />
 *
 * // Com query do React Query
 * <ApiStatusFromQuery
 *   query={myQuery}
 *   successMessage="Dados carregados!"
 * />
 * ```
 */
function ApiStatus({
    status = 'idle',
    message,
    title,
    details,
    showIcon = true,
    autoHideSuccess = false,
    autoHideDuration = 5000,
    onClose,
    closable = false,
    containerProps,
    variant = 'standard',
    severity,
}: ApiStatusProps) {
    const [visible, setVisible] = React.useState(true);

    React.useEffect(() => {
        if (status === 'success' && autoHideSuccess && visible) {
            const timer = setTimeout(() => {
                setVisible(false);
                onClose?.();
            }, autoHideDuration);

            return () => clearTimeout(timer);
        }
    }, [status, autoHideSuccess, autoHideDuration, onClose, visible]);

    React.useEffect(() => {
        setVisible(true);
    }, [status, message]);

    if (!visible || status === 'idle') {
        return null;
    }

    const getSeverity = (): 'success' | 'error' | 'warning' | 'info' => {
        if (severity) return severity;

        switch (status) {
            case 'success':
                return 'success';
            case 'error':
                return 'error';
            case 'warning':
                return 'warning';
            case 'info':
                return 'info';
            default:
                return 'info';
        }
    };

    const getIcon = () => {
        if (!showIcon) return undefined;

        switch (status) {
            case 'loading':
                return <CircularProgress size={20} color="inherit" />;
            case 'success':
                return <CheckCircle />;
            case 'error':
                return <Error />;
            case 'warning':
                return <Warning />;
            case 'info':
                return <Info />;
            default:
                return undefined;
        }
    };

    const handleClose = () => {
        setVisible(false);
        onClose?.();
    };

    const renderContent = () => {
        if (status === 'loading') {
            return (
                <Box display="flex" alignItems="center" gap={2}>
                    {showIcon && <CircularProgress size={20} />}
                    <Box>
                        {title && <Typography variant="subtitle2">{title}</Typography>}
                        {message && <Typography variant="body2">{message}</Typography>}
                    </Box>
                </Box>
            );
        }

        return (
            <Alert
                severity={getSeverity()}
                variant={variant}
                icon={getIcon()}
                action={
                    closable ? (
                        <IconButton
                            aria-label="close"
                            color="inherit"
                            size="small"
                            onClick={handleClose}
                        >
                            <Close fontSize="inherit" />
                        </IconButton>
                    ) : undefined
                }
                sx={{ mb: 0 }}
            >
                {title && <AlertTitle>{title}</AlertTitle>}
                {message}
                {details && (
                    <Typography variant="body2" sx={{ mt: 1, opacity: 0.8 }}>
                        {details}
                    </Typography>
                )}
            </Alert>
        );
    };

    return (
        <Collapse in={visible}>
            <Box {...containerProps}>
                {renderContent()}
            </Box>
        </Collapse>
    );
}

/**
 * Versão do ApiStatus que extrai status de uma query do React Query
 */
export function ApiStatusFromQuery({
    query,
    successMessage,
    errorMessage,
    loadingMessage = 'Carregando...',
    ...props
}: ApiStatusFromQueryProps) {
    const getStatusFromQuery = (): StatusType => {
        if (query.isLoading || query.isFetching) return 'loading';
        if (query.isError) return 'error';
        if (query.isSuccess) return 'success';
        return 'idle';
    };

    const getMessageFromQuery = (): string | undefined => {
        if (query.isLoading || query.isFetching) return loadingMessage;
        if (query.isError) {
            return errorMessage || (query.error && typeof query.error === 'object' && 'message' in query.error
                ? (query.error as Error).message
                : 'Erro desconhecido');
        }
        if (query.isSuccess && successMessage) return successMessage;
        return undefined;
    };

    return (
        <ApiStatus
            {...props}
            status={getStatusFromQuery()}
            message={getMessageFromQuery()}
        />
    );
}

export default ApiStatus;