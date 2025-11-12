import { injectable, inject } from 'tsyringe';
import * as schedule from 'node-schedule';
import { ScrapeBlogUseCase, ScrapeBlogRequest } from './ScrapeBlogUseCase';
import { ScrapeContentUseCase } from './ScrapeContentUseCase';

export interface ScheduleScrapeRequest {
    cronExpression: string; // e.g., '0 */1 * * *' for every hour
    scrapeType: 'blog' | 'content';
    scrapeRequest: ScrapeBlogRequest | { url: string; options?: any };
    jobName?: string; // Optional name for the job
}

export interface ScheduleScrapeResponse {
    jobId: string;
    scheduled: boolean;
    nextRun: Date;
}

export interface CancelScrapeJobRequest {
    jobId: string;
}

export interface CancelScrapeJobResponse {
    cancelled: boolean;
    jobId: string;
}

export interface ListScrapeJobsResponse {
    jobs: Array<{
        jobId: string;
        cronExpression: string;
        scrapeType: 'blog' | 'content';
        nextRun: Date;
        running: boolean;
    }>;
}

@injectable()
export class ScheduleScrapeUseCase {
    private scheduledJobs: Map<string, schedule.Job> = new Map();

    constructor(
        @inject(ScrapeBlogUseCase) private scrapeBlogUseCase: ScrapeBlogUseCase,
        @inject(ScrapeContentUseCase) private scrapeContentUseCase: ScrapeContentUseCase,
    ) { }

    async scheduleScrape(request: ScheduleScrapeRequest): Promise<ScheduleScrapeResponse> {
        const jobId = request.jobName || `scrape-${request.scrapeType}-${Date.now()}`;

        // Cancel existing job if it exists
        if (this.scheduledJobs.has(jobId)) {
            this.scheduledJobs.get(jobId)!.cancel();
        }

        const job = schedule.scheduleJob(jobId, request.cronExpression, async () => {
            try {
                console.log(`Executing scheduled scrape job: ${jobId}`);

                if (request.scrapeType === 'blog') {
                    const result = await this.scrapeBlogUseCase.execute(request.scrapeRequest as ScrapeBlogRequest);
                    console.log(`Scheduled blog scrape completed: ${result.scrapedCount} posts scraped`);
                } else if (request.scrapeType === 'content') {
                    const result = await this.scrapeContentUseCase.execute(request.scrapeRequest as { url: string; options?: any });
                    console.log(`Scheduled content scrape completed for URL: ${(request.scrapeRequest as any).url}`);
                }
            } catch (error) {
                console.error(`Error in scheduled scrape job ${jobId}:`, error);
            }
        });

        if (job) {
            this.scheduledJobs.set(jobId, job);
            return {
                jobId,
                scheduled: true,
                nextRun: job.nextInvocation().toDate(),
            };
        } else {
            throw new Error('Failed to schedule job - invalid cron expression');
        }
    }

    async cancelScrapeJob(request: CancelScrapeJobRequest): Promise<CancelScrapeJobResponse> {
        const job = this.scheduledJobs.get(request.jobId);

        if (job) {
            job.cancel();
            this.scheduledJobs.delete(request.jobId);
            return {
                cancelled: true,
                jobId: request.jobId,
            };
        } else {
            return {
                cancelled: false,
                jobId: request.jobId,
            };
        }
    }

    listScrapeJobs(): ListScrapeJobsResponse {
        const jobs = Array.from(this.scheduledJobs.entries()).map(([jobId, job]) => ({
            jobId,
            cronExpression: (job as any).cronExpression || 'unknown', // node-schedule doesn't expose cron expression directly
            scrapeType: jobId.includes('blog') ? 'blog' as const : 'content' as const,
            nextRun: job.nextInvocation().toDate(),
            running: job.running,
        }));

        return { jobs };
    }

    // Graceful shutdown method to cancel all jobs
    shutdown(): void {
        for (const [jobId, job] of this.scheduledJobs) {
            job.cancel();
            console.log(`Cancelled scheduled job: ${jobId}`);
        }
        this.scheduledJobs.clear();
    }
}