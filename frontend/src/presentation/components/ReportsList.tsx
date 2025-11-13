import React from 'react';
import { Grid, Paper, Typography, List, ListItem, ListItemText, ListItemSecondaryAction, Button } from '@mui/material';
import { GetApp } from '@mui/icons-material';
import { Report } from '../../api';

interface ReportsListProps {
    reports: Report[];
    onExportPdf: (reportId: string) => void;
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
                                    secondary={
                                        <React.Fragment>
                                            <Typography variant="caption" display="block">
                                                Tipo: {report.type.replace('_', ' ').toUpperCase()}
                                            </Typography>
                                            <Typography variant="caption" display="block">
                                                Criado em: {new Date(report.createdAt).toLocaleDateString('pt-BR')}
                                            </Typography>
                                            {report.generatedBy && (
                                                <Typography variant="caption" display="block">
                                                    Por: {report.generatedBy}
                                                </Typography>
                                            )}
                                        </React.Fragment>
                                    }
                                />
                                <ListItemSecondaryAction>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        startIcon={<GetApp />}
                                        onClick={() => onExportPdf(report.id)}
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