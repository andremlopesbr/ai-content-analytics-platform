import React from 'react';
import { Grid, Typography, Box } from '@mui/material';
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
    return <Typography>Carregando...</Typography>;
  }

  if (error) {
    return <Typography color="error">Erro ao carregar estatísticas</Typography>;
  }

  if (!stats) {
    return <Typography>Nenhum dado disponível</Typography>;
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