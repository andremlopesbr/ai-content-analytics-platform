import React from 'react';
import { Grid, Card, CardContent, Typography, Box } from '@mui/material';
import { Analytics, ContentPaste, Report } from '@mui/icons-material';
import { StatsCard } from '../../domain/types/dashboard';

interface StatsCardsProps {
    stats: {
        totalContents: number;
        totalAnalyses: number;
        totalReports: number;
    };
}

const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
    const chartData: StatsCard[] = [
        { name: 'Conteúdos', value: stats.totalContents, icon: <ContentPaste /> },
        { name: 'Análises', value: stats.totalAnalyses, icon: <Analytics /> },
        { name: 'Relatórios', value: stats.totalReports, icon: <Report /> },
    ];

    return (
        <>
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
        </>
    );
};

export default StatsCards;