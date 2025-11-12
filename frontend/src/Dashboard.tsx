import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Grid, Paper, Typography, Card, CardContent, Box, Button, List, ListItem, ListItemText, ListItemSecondaryAction } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Analytics, ContentPaste, Report, GetApp } from '@mui/icons-material';
import { fetchStats, Stats, fetchReports, exportReportPdf } from './api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

function Dashboard() {
  const { data: stats, isLoading, error } = useQuery<Stats>({
    queryKey: ['stats'],
    queryFn: fetchStats,
  });

  const { data: reports } = useQuery({
    queryKey: ['reports'],
    queryFn: fetchReports,
  });

  const handleExportPdf = async (reportId: string, title: string) => {
    try {
      const blob = await exportReportPdf(reportId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
    }
  };

  if (isLoading) {
    return <Typography>Carregando...</Typography>;
  }

  if (error) {
    return <Typography color="error">Erro ao carregar estatísticas</Typography>;
  }

  if (!stats) {
    return <Typography>Nenhum dado disponível</Typography>;
  }

  const chartData = [
    { name: 'Conteúdos', value: stats.totalContents, icon: <ContentPaste /> },
    { name: 'Análises', value: stats.totalAnalyses, icon: <Analytics /> },
    { name: 'Relatórios', value: stats.totalReports, icon: <Report /> },
  ];

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
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom component="div">
        Dashboard de Estatísticas
      </Typography>

      <Grid container spacing={3}>
        {/* Cards de resumo */}
        {chartData.map((item) => (
          <Grid item xs={12} sm={6} md={4} key={item.name}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  {item.icon}
                  <Typography variant="h6" component="div" sx={{ ml: 1 }}>
                    {item.name}
                  </Typography>
                </Box>
                <Typography variant="h4" component="div">
                  {item.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}

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
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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

        {/* Lista de relatórios recentes com botão de export */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Relatórios Recentes
            </Typography>
            {reports && reports.length > 0 ? (
              <List>
                {reports.slice(0, 5).map((report: any) => (
                  <ListItem key={report.id}>
                    <ListItemText
                      primary={report.title}
                      secondary={`Criado em: ${new Date(report.createdAt).toLocaleDateString()}`}
                    />
                    <ListItemSecondaryAction>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<GetApp />}
                        onClick={() => handleExportPdf(report.id, report.title)}
                      >
                        PDF
                      </Button>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography>Nenhum relatório encontrado</Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard;