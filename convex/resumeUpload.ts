import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

export const uploadCandidateResume = mutation({
  args: {
    candidateId: v.id('candidates'),
    fileName: v.string(),
    fileUrl: v.string(),
    fileSize: v.number(),
    uploadedBy: v.id('users'),
    jobId: v.optional(v.id('jobs')),
    requisitionId: v.optional(v.id('requisitions')),
    notes: v.optional(v.string()),
    uploadedAt: v.optional(v.number()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const uploadId = await ctx.db.insert('resume_uploads', {
      candidateId: args.candidateId,
      fileName: args.fileName,
      fileUrl: args.fileUrl,
      fileSize: args.fileSize,
      uploadedBy: args.uploadedBy,
      jobId: args.jobId,
      requisitionId: args.requisitionId,
      notes: args.notes,
      uploadedAt: args.uploadedAt || Date.now(),
      status: 'uploaded' as const,
      reviewedAt: undefined,
      reviewedBy: undefined,
      reviewNotes: undefined,
    });

    // Create notification for admin
    const job = args.jobId ? await ctx.db.get(args.jobId) : null;
    const candidate = await ctx.db.get(args.candidateId);
    const candidateUser = candidate ? await ctx.db.get(candidate.userId) : null;

    if (candidateUser) {
      // Get all admin users
      const adminUsers = await ctx.db
        .query('users')
        .filter((q) => q.eq(q.field('role'), 'admin'))
        .collect();

      // Create notifications for all admins
      for (const admin of adminUsers) {
        await ctx.db.insert('notifications', {
          userId: admin._id,
          title: 'New Resume Uploaded',
          message: `${candidateUser.firstName} ${candidateUser.lastName} resume uploaded for ${job?.title || 'General Application'}`,
          type: 'resume_upload' as const,
          relatedId: uploadId,
          isRead: false,
          createdAt: Date.now(),
        });
      }
    }

    return uploadId;
  },
});

// Get all resume uploads for HR dashboard
export const getAllResumeUploads = query({
  handler: async (ctx) => {
    const uploads = await ctx.db.query('resume_uploads').order('desc').collect();

    const uploadsWithDetails = await Promise.all(
      uploads.map(async (upload) => {
        const candidate = await ctx.db.get(upload.candidateId);
        const candidateUser = candidate ? await ctx.db.get(candidate.userId) : null;
        const uploader = await ctx.db.get(upload.uploadedBy);
        const job = upload.jobId ? await ctx.db.get(upload.jobId) : null;
        const reviewer = upload.reviewedBy ? await ctx.db.get(upload.reviewedBy) : null;

        return {
          ...upload,
          candidateName: candidateUser
            ? `${candidateUser.firstName} ${candidateUser.lastName}`
            : 'Unknown',
          candidateEmail: candidateUser?.email || '',
          uploaderName: uploader ? `${uploader.firstName} ${uploader.lastName}` : 'Unknown',
          jobTitle: job?.title || 'General Application',
          reviewerName: reviewer ? `${reviewer.firstName} ${reviewer.lastName}` : null,
        };
      })
    );

    return uploadsWithDetails;
  },
});

// Get resume uploads for admin review
export const getResumeUploadsForAdmin = query({
  handler: async (ctx) => {
    const uploads = await ctx.db.query('resume_uploads').order('desc').collect();

    const uploadsWithDetails = await Promise.all(
      uploads.map(async (upload) => {
        const candidate = await ctx.db.get(upload.candidateId);
        const candidateUser = candidate ? await ctx.db.get(candidate.userId) : null;
        const uploader = await ctx.db.get(upload.uploadedBy);
        const job = upload.jobId ? await ctx.db.get(upload.jobId) : null;

        return {
          ...upload,
          candidate: candidateUser,
          candidateProfile: candidate,
          uploaderName: uploader ? `${uploader.firstName} ${uploader.lastName}` : 'Unknown',
          job,
          uploadedDate: new Date(upload.uploadedAt || 0).toLocaleDateString(),
          uploadedTime: new Date(upload.uploadedAt || 0).toLocaleTimeString(),
        };
      })
    );

    return uploadsWithDetails;
  },
});

// Shortlist candidate for interview
export const shortlistCandidateForInterview = mutation({
  args: {
    uploadId: v.id('resume_uploads'),
    reviewedBy: v.id('users'),
    reviewNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Update resume upload status
    await ctx.db.patch(args.uploadId, {
      status: 'shortlisted' as const,
      reviewedBy: args.reviewedBy,
      reviewedAt: Date.now(),
      reviewNotes: args.reviewNotes,
    });

    const upload = await ctx.db.get(args.uploadId);
    if (!upload) throw new Error('Upload not found');

    const candidate = await ctx.db.get(upload.candidateId);
    if (!candidate) throw new Error('Candidate not found');

    // Create or update application
    let application = await ctx.db
      .query('applications')
      .filter((q) =>
        q.and(
          q.eq(q.field('candidateId'), candidate.userId),
          upload.jobId ? q.eq(q.field('jobId'), upload.jobId) : q.eq(q.field('jobId'), upload.jobId)
        )
      )
      .first();

    if (!application && upload.jobId) {
      const applicationId = await ctx.db.insert('applications', {
        jobId: upload.jobId,
        candidateId: candidate.userId,
        status: 'shortlisted' as const,
        appliedAt: Date.now(),
        coverLetter: 'Shortlisted from resume upload',
      });
      application = await ctx.db.get(applicationId);
    } else if (application) {
      await ctx.db.patch(application._id, {
        status: 'shortlisted' as const,
      });
    }

    // Create notification for HR
    const hrUsers = await ctx.db
      .query('users')
      .filter((q) => q.eq(q.field('role'), 'hr'))
      .collect();

    for (const hr of hrUsers) {
      await ctx.db.insert('notifications', {
        userId: hr._id,
        title: 'Candidate Shortlisted',
        message: `Candidate has been shortlisted for interview. Please proceed with interview scheduling.`,
        type: 'candidate_shortlisted' as const,
        relatedId: args.uploadId,
        isRead: false,
        createdAt: Date.now(),
      });
    }

    return { success: true };
  },
});
