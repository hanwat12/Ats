
import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

export const uploadCandidate = mutation({
  args: {
    jobId: v.id('jobs'),
    name: v.string(),
    email: v.string(),
    experience: v.number(),
    resumeUrl: v.string(),
    fileName: v.string(),
    uploadedBy: v.id('users'),
  },
  handler: async (ctx, args) => {
    const candidateId = await ctx.db.insert('candidates', {
      ...args,
      status: 'uploaded',
      uploadedAt: Date.now(),
    });

    // Notify admin about new candidate upload
    const adminUser = await ctx.db
      .query('users')
      .filter((q) => q.eq(q.field('role'), 'admin'))
      .first();

    if (adminUser) {
      await ctx.db.insert('notifications', {
        userId: adminUser._id,
        title: 'New Candidate Uploaded',
        message: `${args.name} has been uploaded for review.`,
        type: 'candidate_uploaded',
        relatedId: candidateId,
        isRead: false,
        createdAt: Date.now(),
      });
    }

    return candidateId;
  },
});

export const getCandidatesByJob = query({
  args: { jobId: v.id('jobs') },
  handler: async (ctx, args) => {
    const candidates = await ctx.db
      .query('candidates')
      .filter((q) => q.eq(q.field('jobId'), args.jobId))
      .order('desc')
      .collect();

    const candidatesWithDetails = await Promise.all(
      candidates.map(async (candidate) => {
        const uploader = await ctx.db.get(candidate.uploadedBy);
        const job = await ctx.db.get(candidate.jobId);
        return {
          ...candidate,
          uploaderName: uploader ? `${uploader.firstName} ${uploader.lastName}` : 'Unknown',
          jobTitle: job?.title || 'Unknown',
        };
      })
    );

    return candidatesWithDetails;
  },
});

export const getAllCandidates = query({
  handler: async (ctx) => {
    const candidates = await ctx.db.query('candidates').order('desc').collect();

    const candidatesWithDetails = await Promise.all(
      candidates.map(async (candidate) => {
        const uploader = await ctx.db.get(candidate.uploadedBy);
        const job = await ctx.db.get(candidate.jobId);
        return {
          ...candidate,
          uploaderName: uploader ? `${uploader.firstName} ${uploader.lastName}` : 'Unknown',
          jobTitle: job?.title || 'Unknown',
        };
      })
    );

    return candidatesWithDetails;
  },
});

export const shortlistCandidate = mutation({
  args: {
    candidateId: v.id('candidates'),
    adminId: v.id('users'),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.candidateId, {
      status: 'shortlisted',
      shortlistedAt: Date.now(),
    });

    const candidate = await ctx.db.get(args.candidateId);
    if (candidate) {
      // Notify HR who uploaded this candidate
      await ctx.db.insert('notifications', {
        userId: candidate.uploadedBy,
        title: 'Candidate Shortlisted',
        message: `${candidate.name} has been shortlisted for review.`,
        type: 'candidate_shortlisted',
        relatedId: args.candidateId,
        isRead: false,
        createdAt: Date.now(),
      });
    }

    return args.candidateId;
  },
});

export const confirmCandidate = mutation({
  args: {
    candidateId: v.id('candidates'),
    hrId: v.id('users'),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.candidateId, {
      status: 'confirmed',
      confirmedAt: Date.now(),
    });

    const candidate = await ctx.db.get(args.candidateId);
    if (candidate) {
      // Notify admin about confirmation
      const adminUser = await ctx.db
        .query('users')
        .filter((q) => q.eq(q.field('role'), 'admin'))
        .first();

      if (adminUser) {
        await ctx.db.insert('notifications', {
          userId: adminUser._id,
          title: 'Candidate Confirmed',
          message: `${candidate.name} has been confirmed by HR.`,
          type: 'candidate_confirmed',
          relatedId: args.candidateId,
          isRead: false,
          createdAt: Date.now(),
        });
      }
    }

    return args.candidateId;
  },
});

export const getShortlistedCandidates = query({
  handler: async (ctx) => {
    const candidates = await ctx.db
      .query('candidates')
      .filter((q) => q.eq(q.field('status'), 'shortlisted'))
      .order('desc')
      .collect();

    const candidatesWithDetails = await Promise.all(
      candidates.map(async (candidate) => {
        const uploader = await ctx.db.get(candidate.uploadedBy);
        const job = await ctx.db.get(candidate.jobId);
        return {
          ...candidate,
          uploaderName: uploader ? `${uploader.firstName} ${uploader.lastName}` : 'Unknown',
          jobTitle: job?.title || 'Unknown',
        };
      })
    );

    return candidatesWithDetails;
  },
});
