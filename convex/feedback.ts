import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

export const submitFeedback = mutation({
  args: {
    name: v.string(),
    role: v.string(),
    message: v.string(),
    submittedBy: v.id('users'),
  },
  handler: async (ctx, args) => {
    const feedbackId = await ctx.db.insert('feedback', {
      ...args,
      createdAt: Date.now(),
    });

    // Notify admin about new feedback
    const adminUser = await ctx.db
      .query('users')
      .filter((q) => q.eq(q.field('role'), 'admin'))
      .first();

    if (adminUser) {
      await ctx.db.insert('notifications', {
        userId: adminUser._id,
        title: 'New Feedback Submitted',
        message: `${args.name} submitted feedback about the system.`,
        type: 'query_sent',
        relatedId: feedbackId,
        isRead: false,
        createdAt: Date.now(),
      });
    }

    return feedbackId;
  },
});

export const getAllFeedback = query({
  handler: async (ctx) => {
    const feedback = await ctx.db.query('feedback').order('desc').collect();

    const feedbackWithDetails = await Promise.all(
      feedback.map(async (fb) => {
        const submitter = await ctx.db.get(fb.submittedBy);
        return {
          ...fb,
          submitterName: submitter ? `${submitter.firstName} ${submitter.lastName}` : 'Unknown',
        };
      })
    );

    return feedbackWithDetails;
  },
});