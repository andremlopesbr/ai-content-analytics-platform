// Tipos específicos do domínio Dashboard
import { Stats } from '../entities/Stats';

export interface StatsCard {
    name: string;
    value: number;
    icon: React.ReactElement;
}

export interface ChartDataPoint {
    name: string;
    value: number;
}

export interface ReportItem {
    id: string;
    title: string;
    createdAt: string;
}

export interface DashboardData {
    stats: Stats;
    reports: ReportItem[];
}

// Constantes do domínio
export const CHART_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

// Tipos para gráficos
export type StatusData = ChartDataPoint[];
export type AnalysisStatusData = ChartDataPoint[];
export type ReportTypeData = ChartDataPoint[];