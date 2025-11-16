import React from 'react';
import { Grid, Typography, Box, CircularProgress } from '@mui/material';
import { useStats, useReports } from './application/hooks';
import { exportReportPdf } from './api';
import {
  StatsCards,
  ChartsSection,
  ReportsList,
  ScrapeForm,
  ContentList,
} from './presentation/components';

async function handleExportPdf(reportId: string) {
  try {
    const blob = await exportReportPdf(reportId);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${reportId}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Erro ao exportar relatório:', error);
  }
}

function Dashboard() {
  const { data: stats, isLoading, error } = useStats();
  const { data: reports } = useReports();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress size={60} sx={{ mb: 2 }} />
        <Typography variant="h6">Carregando dashboard...</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Buscando estatísticas do sistema
        </Typography>
      </Box>
    );
  }

  if (error) {
    console.error('Dashboard error:', error);
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error" variant="h6">
          Erro ao carregar estatísticas
        </Typography>
        <Typography color="text.secondary">
          Verifique se o backend está funcionando. Tente recarregar a página.
        </Typography>
      </Box>
    );
  }

  if (!stats) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">
          Nenhum dado disponível
        </Typography>
        <Typography color="text.secondary">
          Comece raspando algum conteúdo para ver as estatísticas.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom component="div">
        Dashboard de Analytics de Conteúdo
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <ScrapeForm />
        </Grid>

        <Grid item xs={12}>
          <ContentList />
        </Grid>

        <StatsCards stats={stats} />

        <ChartsSection stats={stats} />

        <ReportsList reports={reports || []} onExportPdf={handleExportPdf} />
      </Grid>
    </Box>
  );
}

export default Dashboard;