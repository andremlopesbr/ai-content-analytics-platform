import React, { useState, FormEvent } from 'react';
import { Box, Button, CircularProgress, Alert, FormHelperText } from '@mui/material';
import { useMutation, UseMutationOptions } from '@tanstack/react-query';

export interface ApiFormProps<TData = any, TError = any, TVariables = any, TContext = any> {
    /**
     * Função de mutação que será executada no submit do form
     */
    mutationFn: (variables: TVariables) => Promise<TData>;

    /**
     * Opções adicionais para a mutação React Query
     */
    mutationOptions?: Omit<UseMutationOptions<TData, TError, TVariables, TContext>, 'mutationFn'>;

    /**
     * Children do form (campos de entrada)
     */
    children: React.ReactNode;

    /**
     * Texto do botão de submit
     */
    submitText?: string;

    /**
     * Texto do botão durante loading
     */
    loadingText?: string;

    /**
     * Callback chamado quando a mutação é bem-sucedida
     */
    onSuccess?: (data: TData) => void;

    /**
     * Callback chamado quando a mutação falha
     */
    onError?: (error: TError) => void;

    /**
     * Função para validar os dados antes do submit
     */
    validate?: (data: TVariables) => string | null;

    /**
     * Valores iniciais do form
     */
    initialValues?: Partial<TVariables>;

    /**
     * Função customizada para transformar os dados do form antes do submit
     */
    transformData?: (formData: any) => TVariables;

    /**
     * Props adicionais para o container Box
     */
    containerProps?: React.ComponentProps<typeof Box>;

    /**
     * Props adicionais para o botão de submit
     */
    submitButtonProps?: React.ComponentProps<typeof Button>;
}

/**
 * Componente ApiForm - Form genérico para submissão de dados via API
 *
 * Suporta validação, transformação de dados e estados de loading integrados.
 * Integra com React Query para tratamento automático de mutações.
 *
 * @example
 * ```tsx
 * <ApiForm
 *   mutationFn={(data: { title: string }) => api.post('/reports', data)}
 *   onSuccess={() => console.log('Relatório criado')}
 *   validate={(data) => !data.title ? 'Título é obrigatório' : null}
 * >
 *   <TextField name="title" label="Título" />
 * </ApiForm>
 * ```
 */
function ApiForm<
    TData = any,
    TError = any,
    TVariables = any,
    TContext = any
>({
    mutationFn,
    mutationOptions,
    children,
    submitText = 'Salvar',
    loadingText = 'Salvando...',
    onSuccess,
    onError,
    validate,
    initialValues,
    transformData,
    containerProps,
    submitButtonProps,
}: ApiFormProps<TData, TError, TVariables, TContext>) {
    const [formData, setFormData] = useState<Partial<TVariables>>(initialValues || {});
    const [validationError, setValidationError] = useState<string | null>(null);

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

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setValidationError(null);

        // Validação local
        if (validate) {
            const error = validate(formData as TVariables);
            if (error) {
                setValidationError(error);
                return;
            }
        }

        // Transformação de dados
        const dataToSubmit = transformData ? transformData(formData) : formData;

        mutation.mutate(dataToSubmit as TVariables);
    };

    const handleInputChange = (field: keyof TVariables, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const isLoading = mutation.isPending;
    const error = mutation.error;

    // Função helper para passar para os filhos
    const formContext = {
        values: formData,
        onChange: handleInputChange,
        isLoading,
    };

    return (
        <Box
            component="form"
            onSubmit={handleSubmit}
            {...containerProps}
        >
            {React.Children.map(children, (child) =>
                React.isValidElement(child)
                    ? React.cloneElement(child, { formContext })
                    : child
            )}

            {validationError && (
                <FormHelperText error sx={{ mb: 2 }}>
                    {validationError}
                </FormHelperText>
            )}

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error instanceof Error ? error.message : 'Erro desconhecido'}
                </Alert>
            )}

            <Button
                type="submit"
                variant="contained"
                disabled={isLoading}
                startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : undefined}
                {...submitButtonProps}
            >
                {isLoading ? loadingText : submitText}
            </Button>
        </Box>
    );
}

export default ApiForm;