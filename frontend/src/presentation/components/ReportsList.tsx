import React from 'react';
import { Grid, Paper, Typography, List, ListItem, ListItemText, ListItemSecondaryAction, Button } from '@mui/material';
import { GetApp } from '@mui/icons-material';
import { ReportItem } from '../../domain/types/dashboard';

interface ReportsListProps {
    reports: ReportItem[];
    onExportPdf: (reportId: string, title: string) => void;
}

const ReportsList: React.FC<ReportsListProps> = ({ reports, onExportPdf }) => {
    return (
        <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                    Relatórios Recentes
                </Typography>
                {reports && reports.length > 0 ? (
                    <List>
                        {reports.slice(0, 5).map((report) => (
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
                                        onClick={() => onExportPdf(report.id, report.title)}
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
    );
};

export default ReportsList;