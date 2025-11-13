import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  IconButton,
  Box,
  Typography,
} from '@mui/material';
import {
  Warning,
  Error,
  Info,
  Close,
} from '@mui/icons-material';

export type ConfirmDialogVariant = 'default' | 'danger' | 'warning' | 'info';

export interface ConfirmDialogProps {
  /**
   * Se o dialog está aberto
   */
  open: boolean;

  /**
   * Título do dialog
   */
  title: string;

  /**
   * Mensagem de confirmação
   */
  message?: string;

  /**
   * Conteúdo adicional (React node)
   */
  children?: React.ReactNode;

  /**
   * Texto do botão de confirmação
   */
  confirmText?: string;

  /**
   * Texto do botão de cancelamento
   */
  cancelText?: string;

  /**
   * Variação visual do dialog
   */
  variant?: ConfirmDialogVariant;

  /**
   * Ícone customizado
   */
  icon?: React.ReactNode;

  /**
   * Se deve mostrar ícone
   */
  showIcon?: boolean;

  /**
   * Callback quando confirmado
   */
  onConfirm: () => void | Promise<void>;

  /**
   * Callback quando cancelado
   */
  onCancel: () => void;

  /**
   * Callback quando fechado (X ou backdrop)
   */
  onClose?: () => void;

  /**
   * Se o botão de confirmação está desabilitado
   */
  confirmDisabled?: boolean;

  /**
   * Se deve mostrar o botão de fechar (X)
   */
  closable?: boolean;

  /**
   * Estado de loading da confirmação
   */
  loading?: boolean;

  /**
   * Props adicionais para o Dialog
   */
  dialogProps?: Partial<React.ComponentProps<typeof Dialog>>;

  /**
   * Props adicionais para o botão de confirmar
   */
  confirmButtonProps?: Partial<React.ComponentProps<typeof Button>>;

  /**
   * Props adicionais para o botão de cancelar
   */
  cancelButtonProps?: Partial<React.ComponentProps<typeof Button>>;
}

/**
 * Componente ConfirmDialog - Dialog de confirmação genérico para ações destrutivas
 *
 * Suporte a diferentes variações visuais e estados de loading,
 * ideal para confirmações de delete, ações irreversíveis, etc.
 *
 * @example
 * ```tsx
 * <ConfirmDialog
 *   open={showDialog}
 *   title="Deletar Item"
 *   message="Tem certeza que deseja deletar este item?"
 *   variant="danger"
 *   onConfirm={handleDelete}
 *   onCancel={() => setShowDialog(false)}
 * />
 * ```
 */
function ConfirmDialog({
  open,
  title,
  message,
  children,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'default',
  icon,
  showIcon = true,
  onConfirm,
  onCancel,
  onClose,
  confirmDisabled = false,
  closable = true,
  loading = false,
  dialogProps,
  confirmButtonProps,
  cancelButtonProps,
}: ConfirmDialogProps) {
  const getVariantConfig = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: <Error color="error" />,
          confirmColor: 'error' as const,
          titleColor: 'error.main',
        };
      case 'warning':
        return {
          icon: <Warning color="warning" />,
          confirmColor: 'warning' as const,
          titleColor: 'warning.main',
        };
      case 'info':
        return {
          icon: <Info color="info" />,
          confirmColor: 'primary' as const,
          titleColor: 'info.main',
        };
      default:
        return {
          icon: <Info color="primary" />,
          confirmColor: 'primary' as const,
          titleColor: 'text.primary',
        };
    }
  };

  const config = getVariantConfig();
  const displayIcon = icon || config.icon;

  const handleConfirm = async () => {
    try {
      await onConfirm();
    } catch (error) {
      // Erro será tratado pelo componente pai
      console.error('Confirmation error:', error);
    }
  };

  const handleCancel = () => {
    onCancel();
    onClose?.();
  };

  const handleClose = () => {
    onClose?.();
  };

  return (
    <Dialog
      open={open}
      onClose={closable ? handleClose : undefined}
      maxWidth="sm"
      fullWidth
      {...dialogProps}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={2}>
          {showIcon && displayIcon}
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, color: config.titleColor }}
          >
            {title}
          </Typography>
          {closable && (
            <IconButton
              aria-label="close"
              onClick={handleClose}
              size="small"
            >
              <Close />
            </IconButton>
          )}
        </Box>
      </DialogTitle>

      <DialogContent>
        {message && (
          <DialogContentText sx={{ mb: children ? 2 : 0 }}>
            {message}
          </DialogContentText>
        )}
        {children}
      </DialogContent>

      <DialogActions>
        <Button
          onClick={handleCancel}
          disabled={loading}
          color="inherit"
          {...cancelButtonProps}
        >
          {cancelText}
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={confirmDisabled || loading}
          color={config.confirmColor}
          variant="contained"
          {...confirmButtonProps}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// Hook personalizado para facilitar o uso do ConfirmDialog
export interface UseConfirmDialogOptions {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmDialogVariant;
}

export interface UseConfirmDialogReturn {
  /**
   * Props para passar ao ConfirmDialog
   */
  dialogProps: ConfirmDialogProps;

  /**
   * Função para abrir o dialog e retornar uma Promise
   */
  confirm: () => Promise<boolean>;
}

/**
 * Hook para facilitar o uso do ConfirmDialog
 *
 * @example
 * ```tsx
 * const { confirm, dialogProps } = useConfirmDialog({
 *   title: 'Deletar Item',
 *   message: 'Tem certeza?',
 *   variant: 'danger',
 * });
 *
 * const handleDelete = async () => {
 *   const confirmed = await confirm();
 *   if (confirmed) {
 *     // deletar item
 *   }
 * };
 *
 * return (
 *   <>
 *     <Button onClick={handleDelete}>Delete</Button>
 *     <ConfirmDialog {...dialogProps} />
 *   </>
 * );
 * ```
 */
export function useConfirmDialog(options: UseConfirmDialogOptions): UseConfirmDialogReturn {
  const [open, setOpen] = React.useState(false);
  const [resolvePromise, setResolvePromise] = React.useState<((value: boolean) => void) | null>(null);

  const confirm = (): Promise<boolean> => {
    return new Promise((resolve) => {
      setResolvePromise(() => resolve);
      setOpen(true);
    });
  };

  const handleConfirm = () => {
    setOpen(false);
    resolvePromise?.(true);
    setResolvePromise(null);
  };

  const handleCancel = () => {
    setOpen(false);
    resolvePromise?.(false);
    setResolvePromise(null);
  };

  const handleClose = () => {
    setOpen(false);
    resolvePromise?.(false);
    setResolvePromise(null);
  };

  return {
    confirm,
    dialogProps: {
      open,
      onClose: handleClose,
      onCancel: handleCancel,
      onConfirm: handleConfirm,
      ...options,
    },
  };
}

export default ConfirmDialog;