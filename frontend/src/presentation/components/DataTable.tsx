import React, { useState, useMemo } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    TableSortLabel,
    Paper,
    TextField,
    InputAdornment,
    Box,
    Typography,
    CircularProgress,
} from '@mui/material';
import { Search } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';

export interface Column<T = any> {
    /**
     * Chave única da coluna
     */
    key: keyof T;

    /**
     * Título da coluna exibido no header
     */
    title: string;

    /**
     * Largura da coluna (opcional)
     */
    width?: string | number;

    /**
     * Se a coluna é ordenável
     */
    sortable?: boolean;

    /**
     * Função customizada para renderizar o valor da célula
     */
    render?: (value: any, row: T, index: number) => React.ReactNode;

    /**
     * Alinhamento do texto na célula
     */
    align?: 'left' | 'center' | 'right';
}

export interface DataTableProps<T = any> {
    /**
     * Dados da tabela
     */
    data: T[];

    /**
     * Configuração das colunas
     */
    columns: Column<T>[];

    /**
     * Chave única para cada linha
     */
    rowKey: keyof T;

    /**
     * Ações disponíveis para cada linha
     */
    actions?: (row: T, index: number) => React.ReactNode;

    /**
     * Se deve mostrar busca
     */
    searchable?: boolean;

    /**
     * Placeholder para o campo de busca
     */
    searchPlaceholder?: string;

    /**
     * Campos que serão pesquisados (chaves das colunas)
     */
    searchFields?: (keyof T)[];

    /**
     * Se deve mostrar paginação
     */
    pagination?: boolean;

    /**
     * Número de linhas por página
     */
    rowsPerPage?: number;

    /**
     * Opções de linhas por página
     */
    rowsPerPageOptions?: number[];

    /**
     * Estado de loading
     */
    loading?: boolean;

    /**
     * Mensagem quando não há dados
     */
    emptyMessage?: string;

    /**
     * Altura máxima da tabela
     */
    maxHeight?: string | number;

    /**
     * Props adicionais para o TableContainer
     */
    containerProps?: React.ComponentProps<typeof TableContainer>;
}

export interface DataTableWithQueryProps<T = any> extends Omit<DataTableProps<T>, 'data' | 'loading'> {
    /**
     * Query do React Query para buscar os dados
     */
    query: ReturnType<typeof useQuery<T[]>>;
}

/**
 * Componente DataTable - Tabela reutilizável com filtros, paginação e ações
 *
 * Suporte a busca, ordenação, paginação e ações customizadas por linha.
 *
 * @example
 * ```tsx
 * const columns = [
 *   { key: 'name', title: 'Nome', sortable: true },
 *   { key: 'email', title: 'Email' },
 * ];
 *
 * <DataTable
 *   data={users}
 *   columns={columns}
 *   rowKey="id"
 *   searchable
 *   pagination
 *   actions={(row) => <Button>Editar</Button>}
 * />
 * ```
 */
function DataTable<T = any>({
    data,
    columns,
    rowKey,
    actions,
    searchable = false,
    searchPlaceholder = 'Buscar...',
    searchFields,
    pagination = false,
    rowsPerPage = 10,
    rowsPerPageOptions = [5, 10, 25, 50],
    loading = false,
    emptyMessage = 'Nenhum dado encontrado',
    maxHeight,
    containerProps,
}: DataTableProps<T>) {
    const [searchTerm, setSearchTerm] = useState('');
    const [orderBy, setOrderBy] = useState<keyof T | ''>('');
    const [order, setOrder] = useState<'asc' | 'desc'>('asc');
    const [page, setPage] = useState(0);
    const [rowsPerPageState, setRowsPerPageState] = useState(rowsPerPage);

    // Filtragem dos dados
    const filteredData = useMemo(() => {
        if (!searchTerm) return data;

        const searchLower = searchTerm.toLowerCase();
        return data.filter((row) => {
            if (searchFields) {
                return searchFields.some((field) => {
                    const value = row[field];
                    return value?.toString().toLowerCase().includes(searchLower);
                });
            }

            // Busca em todas as colunas visíveis
            return columns.some((column) => {
                const value = row[column.key];
                return value?.toString().toLowerCase().includes(searchLower);
            });
        });
    }, [data, searchTerm, searchFields, columns]);

    // Ordenação dos dados
    const sortedData = useMemo(() => {
        if (!orderBy) return filteredData;

        return [...filteredData].sort((a, b) => {
            const aValue = a[orderBy];
            const bValue = b[orderBy];

            if (aValue < bValue) return order === 'asc' ? -1 : 1;
            if (aValue > bValue) return order === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filteredData, orderBy, order]);

    // Paginação dos dados
    const paginatedData = useMemo(() => {
        if (!pagination) return sortedData;

        const startIndex = page * rowsPerPageState;
        return sortedData.slice(startIndex, startIndex + rowsPerPageState);
    }, [sortedData, page, rowsPerPageState, pagination]);

    const handleRequestSort = (property: keyof T) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const handleChangePage = (_: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPageState(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value);
        setPage(0); // Reset page when searching
    };

    const renderCell = (column: Column<T>, row: T, rowIndex: number) => {
        const value = row[column.key];
        const content = column.render ? column.render(value, row, rowIndex) : String(value);

        return (
            <TableCell key={column.key as string} align={column.align || 'left'}>
                {content}
            </TableCell>
        );
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            {searchable && (
                <Box mb={2}>
                    <TextField
                        fullWidth
                        variant="outlined"
                        placeholder={searchPlaceholder}
                        value={searchTerm}
                        onChange={handleSearchChange}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search />
                                </InputAdornment>
                            ),
                        }}
                    />
                </Box>
            )}

            <TableContainer component={Paper} sx={{ maxHeight }} {...containerProps}>
                <Table stickyHeader>
                    <TableHead>
                        <TableRow>
                            {columns.map((column) => (
                                <TableCell
                                    key={column.key as string}
                                    align={column.align || 'left'}
                                    sx={{ width: column.width, fontWeight: 'bold' }}
                                >
                                    {column.sortable ? (
                                        <TableSortLabel
                                            active={orderBy === column.key}
                                            direction={orderBy === column.key ? order : 'asc'}
                                            onClick={() => handleRequestSort(column.key)}
                                        >
                                            {column.title}
                                        </TableSortLabel>
                                    ) : (
                                        column.title
                                    )}
                                </TableCell>
                            ))}
                            {actions && <TableCell>Ações</TableCell>}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {paginatedData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={columns.length + (actions ? 1 : 0)} align="center">
                                    <Typography variant="body2" color="textSecondary">
                                        {emptyMessage}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedData.map((row, index) => (
                                <TableRow key={row[rowKey] as string} hover>
                                    {columns.map((column) => renderCell(column, row, index))}
                                    {actions && (
                                        <TableCell align="right">
                                            {actions(row, index)}
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {pagination && (
                <TablePagination
                    rowsPerPageOptions={rowsPerPageOptions}
                    component="div"
                    count={sortedData.length}
                    rowsPerPage={rowsPerPageState}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    labelRowsPerPage="Linhas por página:"
                    labelDisplayedRows={({ from, to, count }) =>
                        `${from}-${to} de ${count}`
                    }
                />
            )}
        </Box>
    );
}

/**
 * Versão do DataTable que aceita uma query do React Query
 */
export function DataTableWithQuery<T = any>(props: DataTableWithQueryProps<T>) {
    const { query, ...tableProps } = props;

    return (
        <DataTable
            {...tableProps}
            data={query.data || []}
            loading={query.isLoading}
        />
    );
}

export default DataTable;