import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Container, Typography, Box, Paper } from '@mui/material';
import { Analytics } from '@mui/icons-material';

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
            <Typography variant="body1" sx={{ mt: 2 }}>
              Plataforma completa para extração, análise e visualização de dados de conteúdo web
              utilizando inteligência artificial do Google Gemini.
            </Typography>
          </Paper>
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default App;