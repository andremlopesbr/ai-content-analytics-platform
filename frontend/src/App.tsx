import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Container, Typography, Box, Paper, Button } from '@mui/material';
import { Analytics, Dashboard as DashboardIcon } from '@mui/icons-material';
import Dashboard from './Dashboard';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        <Route path="/" element={
          <Container maxWidth="lg">
            <Box sx={{ my: 4 }}>
              <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
                <Analytics sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
                <Typography variant="h3" component="h1" gutterBottom>
                  AI Content Analytics Platform
                </Typography>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Análise Inteligente de Conteúdo Web
                </Typography>
                <Typography variant="body1" sx={{ mt: 2, mb: 3 }}>
                  Plataforma completa para extração, análise e visualização de dados de conteúdo web
                  utilizando inteligência artificial do Google Gemini.
                </Typography>
                <Button
                  component={Link}
                  to="/dashboard"
                  variant="contained"
                  size="large"
                  startIcon={<DashboardIcon />}
                  sx={{ mt: 2 }}
                >
                  Acessar Dashboard
                </Button>
              </Paper>
            </Box>
          </Container>
        } />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;