import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

export const submitFeedback = mutation({
  args: {
    interviewId: v.id('interviews'),
    candidateId: v.id('candidates'),
    jobId: v.id('jobs'),
    interviewerId: v.id('users'),
    interviewerName: v.string(),
    overallRating: v.number(),
    technicalSkills: v.number(),
    communicationSkills: v.number(),
    problemSolving: v.number(),
    culturalFit: v.number(),
    strengths: v.string(),
    weaknesses: v.string(),
    recommendation: v.string(),
    additionalComments: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const feedbackId = await ctx.db.insert('feedback', {
      ...args,
      submittedAt: new Date().toISOString(),
    });
    return feedbackId;
  },
});

export const getFeedbackByInterview = query({
  args: { interviewId: v.id('interviews') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('feedback')
      .filter((q) => q.eq(q.field('interviewId'), args.interviewId))
      .collect();
  },
});

export const getFeedbackByCandidate = query({
  args: { candidateId: v.id('candidates') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('feedback')
      .filter((q) => q.eq(q.field('candidateId'), args.candidateId))
      .collect();
  },
});

export const getFeedbackByJob = query({
  args: { jobId: v.id('jobs') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('feedback')
      .filter((q) => q.eq(q.field('jobId'), args.jobId))
      .collect();
  },
});

export const getAllFeedback = query({
  handler: async (ctx) => {
    const feedback = await ctx.db.query('feedback').collect();

    const feedbackWithDetails = await Promise.all(
      feedback.map(async (fb) => {
        const interview = await ctx.db.get(fb.interviewId);
        const candidate = await ctx.db.get(fb.candidateId);
        const job = await ctx.db.get(fb.jobId);

        // Get user details from candidate
        let user = null;
        if (candidate) {
          user = await ctx.db.get(candidate.userId);
        }

        let application = null;
        if (interview) {
          application = await ctx.db.get(interview.applicationId);
        }

        return {
          ...fb,
          interview,
          candidate:
            candidate && user
              ? {
                  ...candidate,
                  firstName: user.firstName,
                  lastName: user.lastName,
                  email: user.email,
                }
              : null,
          job,
          application,
        };
      })
    );

    return feedbackWithDetails;
  },
});

export const updateFeedback = mutation({
  args: {
    feedbackId: v.id('feedback'),
    overallRating: v.optional(v.number()),
    technicalSkills: v.optional(v.number()),
    communicationSkills: v.optional(v.number()),
    problemSolving: v.optional(v.number()),
    culturalFit: v.optional(v.number()),
    strengths: v.optional(v.string()),
    weaknesses: v.optional(v.string()),
    recommendation: v.optional(v.string()),
    additionalComments: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { feedbackId, ...updates } = args;
    await ctx.db.patch(feedbackId, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  },
});

export const deleteFeedback = mutation({
  args: { feedbackId: v.id('feedback') },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.feedbackId);
  },
});

export const getFeedbackById = query({
  args: { feedbackId: v.id('feedback') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.feedbackId);
  },
});
