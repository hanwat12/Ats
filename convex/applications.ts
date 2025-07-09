import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { uploadResume } from './files';

export const applyToJob = mutation({
  args: {
    jobId: v.id('jobs'),
    candidateId: v.id('users'),
    coverLetter: v.optional(v.string()),
    uploadResume: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if already applied
    const existingApplication = await ctx.db
      .query('applications')
      .withIndex('by_job', (q) => q.eq('jobId', args.jobId))
      .filter((q) => q.eq(q.field('candidateId'), args.candidateId))
      .unique();

    if (existingApplication) {
      throw new Error('You have already applied to this job');
    }

    const applicationId = await ctx.db.insert('applications', {
      jobId: args.jobId,
      candidateId: args.candidateId,
      status: 'applied',
      appliedAt: Date.now(),
      coverLetter: args.coverLetter,
    });

    // Get job and candidate details for notification
    const job = await ctx.db.get(args.jobId);
    const candidate = await ctx.db.get(args.candidateId);

    if (job && candidate) {
      const hrUser = await ctx.db.get(job.postedBy);
      if (hrUser) {
        await ctx.db.insert('notifications', {
          userId: job.postedBy,
          title: 'New Job Application',
          message: `${candidate.firstName} ${candidate.lastName} applied for ${job.title}`,
          type: 'application_status',
          relatedId: applicationId,
          isRead: false,
          createdAt: Date.now(),
        });
      }
    }

    return applicationId;
  },
});

export const getApplicationsByJob = query({
  args: { jobId: v.id('jobs') },
  handler: async (ctx, args) => {
    const applications = await ctx.db
      .query('applications')
      .withIndex('by_job', (q) => q.eq('jobId', args.jobId))
      .order('desc')
      .collect();

    // Get candidate details for each application
    const applicationsWithCandidates = await Promise.all(
      applications.map(async (app) => {
        const candidate = await ctx.db.get(app.candidateId);
        const candidateProfile = await ctx.db
          .query('candidates')
          .withIndex('by_user', (q) => q.eq('userId', app.candidateId))
          .unique();

        return {
          ...app,
          candidateName: candidate ? `${candidate.firstName} ${candidate.lastName}` : 'Unknown',
          candidateEmail: candidate?.email,
          candidatePhone: candidate?.phone,
          candidateProfile,
        };
      })
    );

    return applicationsWithCandidates;
  },
});

// export const getApplicationsByCandidate = query({
//   args: { candidateId: v.id("users") },
//   handler: async (ctx, args) => {
//     const applications = await ctx.db
//       .query("applications")
//       .withIndex("by_candidate", (q) => q.eq("candidateId", args.candidateId))
//       .order("desc")
//       .collect();

//     // Get job details for each application
//     const applicationsWithJobs = await Promise.all(
//       applications.map(async (app) => {
//         const job = await ctx.db.get(app.jobId);
//         return {
//           ...app,
//           jobTitle: job?.title || "Unknown",
//           jobDepartment: job?.department || "Unknown",
//           jobLocation: job?.location || "Unknown",
//           jobSalaryMin: job?.salaryMin || 0,
//           jobSalaryMax: job?.salaryMax || 0,
//           jobCurrency: job?.currency || "INR",
//         };
//       })
//     );

export const getApplicationsByCandidate = query({
  args: {
    jobId: v.id('jobs'),
    candidateId: v.id('users'),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('applications')
      .withIndex('by_job', (q) => q.eq('jobId', args.jobId))
      .filter((q) => q.eq(q.field('candidateId'), args.candidateId))
      .collect();
  },
});

// return applicationsWithJobs;

export const updateApplicationStatus = mutation({
  args: {
    applicationId: v.id('applications'),
    status: v.union(
      v.literal('applied'),
      v.literal('screening'),
      v.literal('interview_scheduled'),
      v.literal('interviewed'),
      v.literal('selected'),
      v.literal('rejected')
    ),
    reviewedBy: v.id('users'),
    reviewNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { applicationId, status, reviewedBy, reviewNotes } = args;

    // Update application status
    await ctx.db.patch(applicationId, {
      status,
      reviewedBy,
      reviewedAt: Date.now(),
      reviewNotes,
    });

    // Get application details for notification
    const application = await ctx.db.get(applicationId);
    if (application) {
      const job = await ctx.db.get(application.jobId);
      const reviewer = await ctx.db.get(reviewedBy);

      if (job && reviewer) {
        // Create notification for candidate
        let notificationTitle = '';
        let notificationMessage = '';

        switch (status) {
          case 'screening':
            notificationTitle = 'Application Under Review';
            notificationMessage = `Your application for ${job.title} is now under review.`;
            break;
          case 'interview_scheduled':
            notificationTitle = 'Interview Scheduled';
            notificationMessage = `Congratulations! An interview has been scheduled for ${job.title}.`;
            break;
          case 'interviewed':
            notificationTitle = 'Interview Completed';
            notificationMessage = `Thank you for interviewing for ${job.title}. We'll be in touch soon.`;
            break;
          case 'selected':
            notificationTitle = "🎉 Congratulations! You're Selected";
            notificationMessage = `Great news! You have been selected for the ${job.title} position. HR will contact you soon with next steps.`;
            break;
          case 'rejected':
            notificationTitle = 'Application Update';
            notificationMessage = `Thank you for your interest in ${job.title}. We've decided to move forward with other candidates.`;
            break;
        }

        if (notificationTitle) {
          await ctx.db.insert('notifications', {
            userId: application.candidateId,
            title: notificationTitle,
            message: notificationMessage,
            type: 'application_status',
            relatedId: applicationId,
            isRead: false,
            createdAt: Date.now(),
          });
        }
      }
    }

    return applicationId;
  },
});

export const getAllApplicationsForHR = query({
  args: {},
  handler: async (ctx) => {
    const applications = await ctx.db.query('applications').order('desc').collect();

    // Get job and candidate details for each application
    const applicationsWithDetails = await Promise.all(
      applications.map(async (app) => {
        const job = await ctx.db.get(app.jobId);
        const candidate = await ctx.db.get(app.candidateId);
        const candidateProfile = await ctx.db
          .query('candidates')
          .withIndex('by_user', (q) => q.eq('userId', app.candidateId))
          .unique();

        return {
          ...app,
          jobTitle: job?.title || 'Unknown',
          jobDepartment: job?.department || 'Unknown',
          jobLocation: job?.location || 'Unknown',
          candidateName: candidate ? `${candidate.firstName} ${candidate.lastName}` : 'Unknown',
          candidateEmail: candidate?.email,
          candidatePhone: candidate?.phone,
          candidateProfile,
        };
      })
    );

    return applicationsWithDetails;
  },
});

export const getDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    const totalJobs = await ctx.db.query('jobs').collect();
    const activeJobs = totalJobs.filter((job) => job.status === 'active');
    const totalApplications = await ctx.db.query('applications').collect();
    const selectedCandidates = totalApplications.filter((app) => app.status === 'selected');
    const pendingApplications = totalApplications.filter((app) => app.status === 'applied');

    return {
      totalJobs: totalJobs.length,
      activeJobs: activeJobs.length,
      totalApplications: totalApplications.length,
      selectedCandidates: selectedCandidates.length,
      pendingApplications: pendingApplications.length,
    };
  },
});

export const getAllApplications = query({
  handler: async (ctx) => {
    const applications = await ctx.db.query('applications').collect();
    // Populate candidate and job details for each application
    return Promise.all(
      applications.map(async (app) => {
        const candidate = await ctx.db.get(app.candidateId);
        const job = await ctx.db.get(app.jobId);
        return {
          ...app,
          candidate,
          job,
        };
      })
    );
  },
});
