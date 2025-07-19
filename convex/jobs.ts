import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

export const createJob = mutation({
  args: {
    title: v.string(),
    role: v.string(),
    location: v.string(),
    description: v.string(),
    postedBy: v.id('users'),
  },
  handler: async (ctx, args) => {
    const jobId = await ctx.db.insert('jobs', {
      ...args,
      createdAt: Date.now(),
    });

    // Notify all HR users about new job posting
    const hrUsers = await ctx.db
      .query('users')
      .filter((q) => q.eq(q.field('role'), 'hr'))
      .collect();

    for (const hr of hrUsers) {
      await ctx.db.insert('notifications', {
        userId: hr._id,
        title: 'New Job Posted',
        message: `A new ${args.title} position has been posted.`,
        type: 'candidate_uploaded',
        relatedId: jobId,
        isRead: false,
        createdAt: Date.now(),
      });
    }

    return jobId;
  },
});

export const getAllJobs = query({
  handler: async (ctx) => {
    const jobs = await ctx.db.query('jobs').order('desc').collect();

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