import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

export const createJob = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    department: v.string(),
    experienceRequired: v.number(),
    salaryMin: v.number(),
    salaryMax: v.number(),
    location: v.string(),
    requiredSkills: v.array(v.string()),
    postedBy: v.id('users'),
    deadline: v.optional(v.number()),
    currency: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const jobId = await ctx.db.insert('jobs', {
      ...args,
      status: 'active',
      createdAt: Date.now(),
      currency: args.currency || 'INR',
    });

    // Get all candidates for notification
    const candidates = await ctx.db.query('candidates').collect();
    const job = await ctx.db.get(jobId);

    if (job) {
      // Notify all candidates about new job posting
      for (const candidate of candidates) {
        await ctx.db.insert('notifications', {
          userId: candidate.userId,
          title: 'New Job Posted',
          message: `A new ${job.title} position has been posted in ${job.department}. Check it out!`,
          type: 'job_posted',
          relatedId: jobId,
          isRead: false,
          createdAt: Date.now(),
        });
      }
    }

    return jobId;
  },
});

export const getAllJobs = query({
  args: {},
  handler: async (ctx) => {
    const jobs = await ctx.db.query('jobs').order('desc').collect();

    // Get poster details for each job
    const jobsWithPoster = await Promise.all(
      jobs.map(async (job) => {
        const poster = await ctx.db.get(job.postedBy);
        return {
          ...job,
          posterName: poster ? `${poster.firstName} ${poster.lastName}` : 'Unknown',
        };
      })
    );

    return jobsWithPoster;
  },
});

export const getActiveJobs = query({
  handler: async (ctx) => {
    return await ctx.db
      .query('jobs')
      .withIndex('by_status', (q) => q.eq('status', 'active'))
      .collect();
  },
});

export const getJobById = query({
  args: { jobId: v.id('jobs') },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job) return null;

    const poster = await ctx.db.get(job.postedBy);
    return {
      ...job,
      posterName: poster ? `${poster.firstName} ${poster.lastName}` : 'Unknown',
    };
  },
});

export const updateJob = mutation({
  args: {
    jobId: v.id('jobs'),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    department: v.optional(v.string()),
    experienceRequired: v.optional(v.number()),
    salaryMin: v.optional(v.number()),
    salaryMax: v.optional(v.number()),
    location: v.optional(v.string()),
    status: v.optional(v.union(v.literal('active'), v.literal('closed'))),
    requiredSkills: v.optional(v.array(v.string())),
    deadline: v.optional(v.number()),
    currency: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { jobId, ...updates } = args;
    await ctx.db.patch(jobId, updates);
    return jobId;
  },
});

export const deleteJob = mutation({
  args: { jobId: v.id('jobs') },
  handler: async (ctx, args) => {
    // First, get all applications for this job
    const applications = await ctx.db
      .query('applications')
      .withIndex('by_job', (q) => q.eq('jobId', args.jobId))
      .collect();

    // Delete all applications for this job
    for (const application of applications) {
      await ctx.db.delete(application._id);
    }

    // Delete the job
    await ctx.db.delete(args.jobId);

    return { success: true, deletedApplications: applications.length };
  },
});

export const convertCurrency = query({
  args: {
    amount: v.number(),
    fromCurrency: v.string(),
    toCurrency: v.string(),
  },
  handler: async (ctx, args) => {
    const exchangeRates: Record<string, Record<string, number>> = {
      USD: { INR: 83.0, USD: 1.0 },
      INR: { USD: 0.012, INR: 1.0 },
    };

    const rate = exchangeRates[args.fromCurrency]?.[args.toCurrency] || 1;
    return {
      originalAmount: args.amount,
      convertedAmount: Math.round(args.amount * rate),
      fromCurrency: args.fromCurrency,
      toCurrency: args.toCurrency,
      exchangeRate: rate,
    };
  },
});

// Search jobs with advanced filtering for Indian market
export const searchJobs = query({
  args: {
    searchQuery: v.optional(v.string()),
    location: v.optional(v.string()),
    experienceLevel: v.optional(v.string()),
    salaryRange: v.optional(
      v.object({
        min: v.number(),
        max: v.number(),
      })
    ),
    skills: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    let jobs = await ctx.db
      .query('jobs')
      .withIndex('by_status', (q) => q.eq('status', 'active'))
      .collect();

    // Apply search filters
    if (args.searchQuery) {
      const query = args.searchQuery.toLowerCase();
      jobs = jobs.filter(
        (job) =>
          job.title.toLowerCase().includes(query) ||
          job.description.toLowerCase().includes(query) ||
          job.department.toLowerCase().includes(query) ||
          job.requiredSkills.some((skill) => skill.toLowerCase().includes(query))
      );
    }

    if (args.location) {
      jobs = jobs.filter((job) =>
        job.location.toLowerCase().includes(args.location!.toLowerCase())
      );
    }

    if (args.experienceLevel) {
      const level = args.experienceLevel;
      jobs = jobs.filter((job) => {
        if (level === 'fresher') return job.experienceRequired === 0;
        if (level === 'junior') return job.experienceRequired >= 1 && job.experienceRequired <= 3;
        if (level === 'mid') return job.experienceRequired >= 4 && job.experienceRequired <= 7;
        if (level === 'senior') return job.experienceRequired >= 8;
        return true;
      });
    }

    if (args.salaryRange) {
      jobs = jobs.filter(
        (job) => job.salaryMin >= args.salaryRange!.min && job.salaryMax <= args.salaryRange!.max
      );
    }

    if (args.skills && args.skills.length > 0) {
      jobs = jobs.filter((job) =>
        args.skills!.some((skill) =>
          job.requiredSkills.some((jobSkill) =>
            jobSkill.toLowerCase().includes(skill.toLowerCase())
          )
        )
      );
    }

    return jobs;
  },
});
