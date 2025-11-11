import { container } from 'tsyringe';

// Repositories
import { IContentRepository } from './domain/repositories/IContentRepository';
import { IAnalysisRepository } from './domain/repositories/IAnalysisRepository';
import { IReportRepository } from './domain/repositories/IReportRepository';
import { IScraperService } from './domain/repositories/IScraperService';

import { MongoContentRepository } from './infrastructure/database/MongoContentRepository';
import { MongoAnalysisRepository } from './infrastructure/database/MongoAnalysisRepository';
import { MongoReportRepository } from './infrastructure/database/MongoReportRepository';
import { WebScraperService } from './infrastructure/scrapers/WebScraperService';

// Register repositories
container.registerSingleton<IContentRepository>('IContentRepository', MongoContentRepository);
container.registerSingleton<IAnalysisRepository>('IAnalysisRepository', MongoAnalysisRepository);
container.registerSingleton<IReportRepository>('IReportRepository', MongoReportRepository);

// Register services
container.registerSingleton<IScraperService>('IScraperService', WebScraperService);

// Use cases are registered with @injectable decorator
// Routes and services will resolve dependencies automatically