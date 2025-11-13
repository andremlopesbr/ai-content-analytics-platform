import React from 'react';
import { Button, CircularProgress, ButtonProps } from '@mui/material';
import { useMutation, UseMutationOptions } from '@tanstack/react-query';

export interface ApiButtonProps<TData = any, TError = any, TVariables = any, TContext = any> extends Omit<ButtonProps, 'onClick' | 'onError'> {
    /**
     * Função de mutação que será executada ao clicar no botão
     */
    mutationFn: (variables: TVariables) => Promise<TData>;

    /**
     * Variáveis para passar para a função de mutação
     */
    variables?: TVariables;

    /**
     * Opções adicionais para a mutação React Query
     */
    mutationOptions?: Omit<UseMutationOptions<TData, TError, TVariables, TContext>, 'mutationFn'>;

    /**
     * Texto do botão quando não está carregando
     */
    children: React.ReactNode;

    /**
     * Texto alternativo durante o loading (opcional)
     */
    loadingText?: string;

    /**
     * Ícone personalizado para o estado de loading
     */
    loadingIcon?: React.ReactNode;

    /**
     * Callback chamado quando a mutação é bem-sucedida
     */
    onSuccess?: (data: TData) => void;

    /**
     * Callback chamado quando a mutação falha
     */
    onError?: (error: TError) => void;
}

/**
 * Componente ApiButton - Botão genérico para operações de API
 *
 * Suporta operações POST, PUT, DELETE com estados de loading integrados
 * e tratamento automático de erros via React Query.
 *
 * @example
 * ```tsx
 * <ApiButton
 *   mutationFn={(id: string) => api.delete(`/items/${id}`)}
 *   variables="item-123"
 *   onSuccess={() => console.log('Item deletado')}
 * >
 *   Deletar Item
 * </ApiButton>
 * ```
 */
function ApiButton<
    TData = any,
    TError = any,
    TVariables = any,
    TContext = any
>({
    mutationFn,
    variables,
    mutationOptions,
    children,
    loadingText,
    loadingIcon,
    onSuccess,
    onError,
    disabled,
    startIcon,
    endIcon,
    ...buttonProps
}: ApiButtonProps<TData, TError, TVariables, TContext>) {
    const mutation = useMutation({
        mutationFn,
        ...mutationOptions,
        onSuccess: (data, _variables, _context) => {
            onSuccess?.(data);
        },
        onError: (error, _variables, _context) => {
            onError?.(error);
        },
    });

    const isLoading = mutation.isPending;
    const isDisabled = disabled || isLoading;

    const displayText = isLoading && loadingText ? loadingText : children;
    const defaultLoadingIcon = <CircularProgress size={20} color="inherit" />;
    const currentLoadingIcon = loadingIcon || defaultLoadingIcon;

    return (
        <Button
            {...buttonProps}
            disabled={isDisabled}
            startIcon={isLoading ? currentLoadingIcon : startIcon}
            endIcon={!isLoading ? endIcon : undefined}
            onClick={() => mutation.mutate(variables!)}
        >
            {displayText}
        </Button>
    );
}

export default ApiButton;