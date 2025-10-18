using System;
using EvTap.Infrastructure.Jobs;
using Microsoft.Extensions.DependencyInjection;
using Quartz;

namespace EvTap.Infrastructure.Configurations
{
    public static class QuartzJobConfiguration
    {
        public static void AddQuartzJobs(this IServiceCollection services)
        {
            services.AddQuartz(q =>
            {
                q.UseMicrosoftDependencyInjectionJobFactory();

                var jobKey = new JobKey("ScraperJob");
                q.AddJob<ScraperJob>(opts => opts.WithIdentity(jobKey));

                // Trigger: 23:00-05:59 arası hər dəqiqədə 0,20,40 saniyələrdə
                q.AddTrigger(opts => opts
                    .ForJob(jobKey)
                    .WithIdentity("ScraperJob-trigger")
                    .WithCronSchedule("0,20,40 * 23-23,0-5 * * ?")
                );
            });

            services.AddQuartzHostedService(q => q.WaitForJobsToComplete = true);
        }
    }
}
