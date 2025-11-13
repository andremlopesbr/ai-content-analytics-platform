import React from 'react';
import { Grid, Paper, Typography } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Stats } from '../../domain/entities/Stats';
import { CHART_COLORS } from '../../domain/types/dashboard';

interface ChartsSectionProps {
    stats: Stats;
}

const ChartsSection: React.FC<ChartsSectionProps> = ({ stats }) => {
    const statusData = [
        { name: 'Analisados', value: stats.contentsByStatus.analyzed },
        { name: 'Pendentes', value: stats.contentsByStatus.pending },
    ];

    const analysisStatusData = [
        { name: 'Pendente', value: stats.analysesByStatus.pending },
        { name: 'Processando', value: stats.analysesByStatus.processing },
        { name: 'Concluído', value: stats.analysesByStatus.completed },
        { name: 'Falhou', value: stats.analysesByStatus.failed },
    ];

    const reportTypeData = [
        { name: 'Resumo', value: stats.reportsByType.content_summary },
        { name: 'Tendência', value: stats.reportsByType.trend_analysis },
        { name: 'Métricas', value: stats.reportsByType.performance_metrics },
        { name: 'Personalizado', value: stats.reportsByType.custom },
    ];

    return (
        <>
            {/* Gráfico de barras para status dos conteúdos */}
            <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                        Status dos Conteúdos
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={statusData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill="#8884d8" />
                        </BarChart>
                    </ResponsiveContainer>
                </Paper>
            </Grid>

            {/* Gráfico de pizza para status das análises */}
            <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                        Status das Análises
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={analysisStatusData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {analysisStatusData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </Paper>
            </Grid>

            {/* Gráfico de barras para tipos de relatório */}
            <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                        Tipos de Relatório
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={reportTypeData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill="#82ca9d" />
                        </BarChart>
                    </ResponsiveContainer>
                </Paper>
            </Grid>
        </>
    );
};

export default ChartsSection;