import React, { useState } from 'react';
import {
    Box,
    Button,
    TextField,
    Typography,
    Paper,
    Alert,
    CircularProgress,
    Snackbar,
} from '@mui/material';
import { useScrapeContent } from '../../application/hooks';

const ScrapeForm: React.FC = () => {
    const [url, setUrl] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const { mutate: scrape, isPending } = useScrapeContent();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url.trim()) return;

        try {
            await scrape(url);
            setSuccessMessage('Conteúdo raspado com sucesso!');
            setUrl('');
        } catch (error) {
            setErrorMessage('Erro ao raspar conteúdo. Tente novamente.');
        }
    };

    const handleCloseSnackbar = () => {
        setSuccessMessage('');
        setErrorMessage('');
    };

    return (
        <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
                Raspar Conteúdo
            </Typography>

            <Box component="form" onSubmit={handleSubmit}>
                <TextField
                    fullWidth
                    label="URL do conteúdo"
                    variant="outlined"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://exemplo.com/artigo"
                    disabled={isPending}
                    sx={{ mb: 2 }}
                />

                <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={isPending || !url.trim()}
                    startIcon={isPending ? <CircularProgress size={20} /> : null}
                >
                    {isPending ? 'Raspando...' : 'Iniciar Scraping'}
                </Button>
            </Box>

            <Snackbar
                open={!!successMessage}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
            >
                <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
                    {successMessage}
                </Alert>
            </Snackbar>

            <Snackbar
                open={!!errorMessage}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
            >
                <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
                    {errorMessage}
                </Alert>
            </Snackbar>
        </Paper>
    );
};

export default ScrapeForm;