import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

export const updateCandidateProfile = mutation({
  args: {
    userId: v.id('users'),
    skills: v.optional(v.array(v.string())),
    experience: v.optional(v.number()),
    education: v.optional(v.string()),
    location: v.optional(v.string()),
    summary: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    githubUrl: v.optional(v.string()),
    portfolioUrl: v.optional(v.string()),
    currentJobTitle: v.optional(v.string()),
    currentCompany: v.optional(v.string()),
    expectedSalary: v.optional(v.number()),
    noticePeriod: v.optional(v.number()),
    availability: v.optional(v.string()),
    workPreference: v.optional(v.string()),
    isActivelyLooking: v.optional(v.boolean()),
    preferredLocations: v.optional(v.array(v.string())),
    certifications: v.optional(v.array(v.string())),
    languages: v.optional(v.array(v.string())),
    preferredSalaryMin: v.optional(v.number()),
    preferredSalaryMax: v.optional(v.number()),
  },

  handler: async (ctx, args) => {
    const { userId, ...updates } = args;

    const candidateProfile = await ctx.db
      .query('candidates')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .unique();

    if (!candidateProfile) {
      throw new Error('Candidate profile not found');
    }

    await ctx.db.patch(candidateProfile._id, updates);
    return candidateProfile._id;
  },
});

export const getCandidateProfile = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    try {
      const candidate = await ctx.db
        .query('candidates')
        .withIndex('by_user', (q) => q.eq('userId', args.userId))
        .unique();

      if (!candidate) {
        // Return null if no profile exists
        return null;
      }

      const user = await ctx.db.get(candidate.userId);
      return {
        ...candidate,
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        email: user?.email || '',
        phone: user?.phone || '',
      };
    } catch (error) {
      console.error('Error fetching candidate profile:', error);
      return null;
    }
  },
});

export const createCandidateProfile = mutation({
  args: {
    userId: v.id('users'),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    skills: v.optional(v.array(v.string())),
    experience: v.optional(v.number()),
    education: v.optional(v.string()),
    location: v.optional(v.string()),
    summary: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    githubUrl: v.optional(v.string()),
    portfolioUrl: v.optional(v.string()),
    workPreference: v.optional(v.string()),
    isActivelyLooking: v.optional(v.boolean()),
    preferredSalaryMin: v.optional(v.number()),
    preferredSalaryMax: v.optional(v.number()),
    availability: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // If user info is provided, update the user record
    if (args.firstName || args.lastName || args.email || args.phone) {
      const updateData: any = {};
      if (args.firstName) updateData.firstName = args.firstName;
      if (args.lastName) updateData.lastName = args.lastName;
      if (args.email) updateData.email = args.email;
      if (args.phone) updateData.phone = args.phone;

      await ctx.db.patch(args.userId, updateData);
    }

    // Convert string userId to proper ID format
    const userIdAsId = args.userId as any;

    // Check if candidate profile already exists
    const existingProfile = await ctx.db
      .query('candidates')
      .withIndex('by_user', (q) => q.eq('userId', userIdAsId))
      .unique();

    if (existingProfile) {
      throw new Error('Candidate profile already exists');
    }

    // Create new profile with defaults
    const newProfile = await ctx.db.insert('candidates', {
      userId: userIdAsId,
      skills: args.skills || [],
      experience: args.experience || 0,
      education: args.education || '',
      location: args.location || '',
      summary: args.summary || '',
      linkedinUrl: args.linkedinUrl || '',
      githubUrl: args.githubUrl || '',
      portfolioUrl: args.portfolioUrl || '',
      workPreference: args.workPreference || 'hybrid',
      isActivelyLooking: args.isActivelyLooking || true,
      preferredSalaryMin: args.preferredSalaryMin || 0,
      preferredSalaryMax: args.preferredSalaryMax || 0,
      availability: args.availability || 'negotiable',
      isProfileComplete: false,
      profileCompletionPercentage: 0,
      lastUpdated: Date.now(),
      projectsCount: 0,
      achievementsCount: 0,
    });

    return newProfile;
  },
});

export const getAllCandidates = query({
  handler: async (ctx) => {
    const candidates = await ctx.db.query('candidates').collect();

    const candidatesWithUserInfo = await Promise.all(
      candidates.map(async (candidate) => {
        const user = await ctx.db.get(candidate.userId);
        return {
          ...candidate,
          firstName: user?.firstName || '',
          lastName: user?.lastName || '',
          email: user?.email || '',
        };
      })
    );

    return candidatesWithUserInfo;
  },
});

export const getPendingInterviewsForHR = query({
  handler: async (ctx) => {
    const interviews = await ctx.db
      .query('interviews')
      .withIndex('by_status', (q) => q.eq('status', 'scheduled'))
      .collect();

    const interviewsWithDetails = await Promise.all(
      interviews.map(async (interview) => {
        const application = await ctx.db.get(interview.applicationId);
        if (!application) return null;

        const candidate = await ctx.db.get(application.candidateId);
        const job = await ctx.db.get(application.jobId);

        return {
          ...interview,
          candidate: candidate
            ? {
                firstName: candidate.firstName || '',
                lastName: candidate.lastName || '',
                email: candidate.email || '',
              }
            : null,
          job: job
            ? {
                title: job.title,
                department: job.department,
              }
            : null,
        };
      })
    );

    return interviewsWithDetails.filter((interview) => interview !== null);
  },
});

export const matchCandidatesForJob = query({
  args: { jobId: v.id('jobs') },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job) return [];

    const candidates = await ctx.db.query('candidates').collect();

    // Simple matching algorithm based on skills and experience
    const matchedCandidates = await Promise.all(
      candidates.map(async (candidate) => {
        const user = await ctx.db.get(candidate.userId);

        // Calculate skill match percentage
        const jobSkills = job.requiredSkills.map((skill) => skill.toLowerCase());
        const candidateSkills = (candidate.skills || []).map((skill) => skill.toLowerCase());
        const matchingSkills = candidateSkills.filter((skill) =>
          jobSkills.some((jobSkill) => jobSkill.includes(skill) || skill.includes(jobSkill))
        );
        const skillMatchPercentage =
          jobSkills.length > 0 ? (matchingSkills.length / jobSkills.length) * 100 : 0;

        // Calculate experience match
        const candidateExperience = candidate.experience || 0;
        const experienceMatch =
          candidateExperience >= job.experienceRequired
            ? 100
            : (candidateExperience / job.experienceRequired) * 100;

        // Overall match percentage (weighted: 70% skills, 30% experience)
        const overallMatch = Math.round(skillMatchPercentage * 0.7 + experienceMatch * 0.3);

        return {
          ...candidate,
          firstName: user?.firstName || '',
          lastName: user?.lastName || '',
          email: user?.email || '',
          matchPercentage: overallMatch,
          matchingSkills,
        };
      })
    );

    // Sort by match percentage and return top matches
    return matchedCandidates
      .filter((candidate) => candidate.matchPercentage > 20) // Only show candidates with >20% match
      .sort((a, b) => b.matchPercentage - a.matchPercentage)
      .slice(0, 10); // Top 10 matches
  },
});

export const listAllCandidates = query({
  args: {},
  handler: async (ctx) => {
    const candidates = await ctx.db.query('candidates').collect();
    return candidates;
  },
});

// Candidate Projects Management
export const addCandidateProject = mutation({
  args: {
    candidateId: v.id('users'),
    title: v.string(),
    description: v.string(),
    technologies: v.array(v.string()),
    projectUrl: v.optional(v.string()),
    githubUrl: v.optional(v.string()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    isOngoing: v.optional(v.boolean()),
    teamSize: v.optional(v.number()),
    role: v.optional(v.string()),
    achievements: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { candidateId, ...projectData } = args;

    const projectId = await ctx.db.insert('candidate_projects', {
      candidateId,
      ...projectData,
      createdAt: Date.now(),
    });

    // Update projects count
    const candidate = await ctx.db
      .query('candidates')
      .withIndex('by_user', (q) => q.eq('userId', candidateId))
      .unique();

    if (candidate) {
      await ctx.db.patch(candidate._id, {
        projectsCount: (candidate.projectsCount || 0) + 1,
        lastUpdated: Date.now(),
      });
    }

    return projectId;
  },
});

export const getCandidateProjects = query({
  args: { candidateId: v.id('users') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('candidate_projects')
      .withIndex('by_candidate', (q) => q.eq('candidateId', args.candidateId))
      .collect();
  },
});

export const updateCandidateProject = mutation({
  args: {
    projectId: v.id('candidate_projects'),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    technologies: v.optional(v.array(v.string())),
    projectUrl: v.optional(v.string()),
    githubUrl: v.optional(v.string()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    isOngoing: v.optional(v.boolean()),
    teamSize: v.optional(v.number()),
    role: v.optional(v.string()),
    achievements: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { projectId, ...updates } = args;
    await ctx.db.patch(projectId, updates);
    return projectId;
  },
});

export const deleteCandidateProject = mutation({
  args: { projectId: v.id('candidate_projects') },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error('Project not found');

    await ctx.db.delete(args.projectId);

    // Update projects count
    const candidate = await ctx.db
      .query('candidates')
      .withIndex('by_user', (q) => q.eq('userId', project.candidateId))
      .unique();

    if (candidate) {
      await ctx.db.patch(candidate._id, {
        projectsCount: Math.max(0, (candidate.projectsCount || 0) - 1),
        lastUpdated: Date.now(),
      });
    }

    return args.projectId;
  },
});

// Candidate Achievements Management
export const addCandidateAchievement = mutation({
  args: {
    candidateId: v.id('users'),
    title: v.string(),
    description: v.string(),
    achievementType: v.string(),
    issuedBy: v.optional(v.string()),
    issuedDate: v.optional(v.string()),
    credentialId: v.optional(v.string()),
    credentialUrl: v.optional(v.string()),
    expiryDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { candidateId, ...achievementData } = args;

    const achievementId = await ctx.db.insert('candidate_achievements', {
      candidateId,
      ...achievementData,
      createdAt: Date.now(),
    });

    // Update achievements count
    const candidate = await ctx.db
      .query('candidates')
      .withIndex('by_user', (q) => q.eq('userId', candidateId))
      .unique();

    if (candidate) {
      await ctx.db.patch(candidate._id, {
        achievementsCount: (candidate.achievementsCount || 0) + 1,
        lastUpdated: Date.now(),
      });
    }

    return achievementId;
  },
});

export const getCandidateAchievements = query({
  args: { candidateId: v.id('users') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('candidate_achievements')
      .withIndex('by_candidate', (q) => q.eq('candidateId', args.candidateId))
      .collect();
  },
});

// Profile Completion Calculation
export const calculateProfileCompletion = mutation({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const candidate = await ctx.db
      .query('candidates')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .unique();

    if (!candidate) return 0;

    let completionScore = 0;
    const fields = [
      { field: 'skills', weight: 15, condition: candidate.skills && candidate.skills.length > 0 },
      {
        field: 'experience',
        weight: 10,
        condition: candidate.experience !== undefined && candidate.experience > 0,
      },
      {
        field: 'education',
        weight: 10,
        condition: candidate.education && candidate.education.length > 0,
      },
      {
        field: 'location',
        weight: 10,
        condition: candidate.location && candidate.location.length > 0,
      },
      {
        field: 'summary',
        weight: 15,
        condition: candidate.summary && candidate.summary.length > 0,
      },
      {
        field: 'linkedinUrl',
        weight: 5,
        condition: candidate.linkedinUrl && candidate.linkedinUrl.length > 0,
      },
      {
        field: 'githubUrl',
        weight: 5,
        condition: candidate.githubUrl && candidate.githubUrl.length > 0,
      },
      {
        field: 'portfolioUrl',
        weight: 5,
        condition: candidate.portfolioUrl && candidate.portfolioUrl.length > 0,
      },
      {
        field: 'currentJobTitle',
        weight: 5,
        condition: candidate.currentJobTitle && candidate.currentJobTitle.length > 0,
      },
      {
        field: 'resumeId',
        weight: 20,
        condition: candidate.resumeId && candidate.resumeId.length > 0,
      },
    ];

    fields.forEach(({ weight, condition }) => {
      if (condition) completionScore += weight;
    });

    const isComplete = completionScore >= 90;

    await ctx.db.patch(candidate._id, {
      profileCompletionPercentage: completionScore,
      isProfileComplete: isComplete,
      lastUpdated: Date.now(),
    });

    return completionScore;
  },
});

// Interview Scheduling
export const scheduleInterviewForCandidate = mutation({
  args: {
    candidateId: v.id('users'),
    jobId: v.id('jobs'),
    scheduledDate: v.number(),
    scheduledTime: v.string(),
    interviewerName: v.string(),
    interviewerEmail: v.string(),
    meetingLink: v.optional(v.string()),
    notes: v.optional(v.string()),
    scheduledBy: v.id('users'), // Admin who scheduled
  },
  handler: async (ctx, args) => {
    const { candidateId, jobId, scheduledBy, ...interviewData } = args;

    // First create or get application
    let application = await ctx.db
      .query('applications')
      .withIndex('by_candidate', (q) => q.eq('candidateId', candidateId))
      .filter((q) => q.eq(q.field('jobId'), jobId))
      .unique();

    if (!application) {
      // Create application if it doesn't exist
      const applicationId = await ctx.db.insert('applications', {
        jobId,
        candidateId,
        status: 'interview_scheduled',
        appliedAt: Date.now(),
        coverLetter: 'Shortlisted by admin for interview',
      });
      application = await ctx.db.get(applicationId);
    } else {
      // Update existing application status
      await ctx.db.patch(application._id, {
        status: 'interview_scheduled',
      });
    }

    // Create interview
    const interviewId = await ctx.db.insert('interviews', {
      applicationId: application!._id,
      scheduledDate: interviewData.scheduledDate,
      interviewerName: interviewData.interviewerName,
      interviewerEmail: interviewData.interviewerEmail,
      meetingLink: interviewData.meetingLink,
      notes: `${interviewData.notes || ''}\nScheduled Time: ${interviewData.scheduledTime}`,
      status: 'scheduled',
      createdAt: Date.now(),
    });

    // Create notification for HR
    await ctx.db.insert('notifications', {
      userId: scheduledBy, // For now, notify the admin who scheduled
      title: 'Interview Scheduled',
      message: `Interview scheduled for candidate on ${new Date(interviewData.scheduledDate).toDateString()} at ${interviewData.scheduledTime}`,
      type: 'interview_scheduled',
      relatedId: interviewId,
      isRead: false,
      createdAt: Date.now(),
    });

    // Create notification for candidate
    await ctx.db.insert('notifications', {
      userId: candidateId,
      title: 'Interview Scheduled',
      message: `Your interview has been scheduled for ${new Date(interviewData.scheduledDate).toDateString()} at ${interviewData.scheduledTime}`,
      type: 'interview_scheduled',
      relatedId: interviewId,
      isRead: false,
      createdAt: Date.now(),
    });

    return interviewId;
  },
});

export const getInterviewById = query({
  args: { interviewId: v.id('interviews') },
  handler: async (ctx, args) => {
    const interview = await ctx.db.get(args.interviewId);
    if (!interview) return null;

    const application = await ctx.db.get(interview.applicationId);
    if (!application) return null;

    const job = await ctx.db.get(application.jobId);
    const candidate = await ctx.db.get(application.candidateId);
    const candidateProfile = await ctx.db
      .query('candidates')
      .withIndex('by_user', (q) => q.eq('userId', application.candidateId))
      .unique();

    return {
      ...interview,
      candidateName: `${candidate?.firstName || ''} ${candidate?.lastName || ''}`.trim(),
      candidateEmail: candidate?.email || '',
      jobTitle: job?.title || '',
      jobDepartment: job?.department || '',
      interviewerName: interview.interviewerName,
      scheduledDate: interview.scheduledDate,
      scheduledTime: new Date(interview.scheduledDate).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
      notes: interview.notes,
    };
  },
});

export const confirmInterviewByHR = mutation({
  args: {
    interviewId: v.id('interviews'),
    confirmedBy: v.id('users'),
    meetingLink: v.optional(v.string()),
    additionalNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { interviewId, confirmedBy, meetingLink, additionalNotes } = args;

    const interview = await ctx.db.get(interviewId);
    if (!interview) throw new Error('Interview not found');

    // Update interview with confirmation
    await ctx.db.patch(interviewId, {
      meetingLink: meetingLink || interview.meetingLink,
      notes: `${interview.notes || ''}\n\nHR Confirmation: ${additionalNotes || 'Confirmed'}`,
      status: 'scheduled',
    });

    // Get application details
    const application = await ctx.db.get(interview.applicationId);
    if (application) {
      // Create notification for candidate
      await ctx.db.insert('notifications', {
        userId: application.candidateId,
        title: 'Interview Confirmed',
        message: `Your interview has been confirmed by HR. ${meetingLink ? `Meeting link: ${meetingLink}` : ''}`,
        type: 'interview_scheduled',
        relatedId: interviewId,
        isRead: false,
        createdAt: Date.now(),
      });

      // Create notification for interviewer (admin who scheduled)
      await ctx.db.insert('notifications', {
        userId: confirmedBy,
        title: 'Interview Confirmed',
        message: `Interview has been confirmed and candidate notified.`,
        type: 'interview_scheduled',
        relatedId: interviewId,
        isRead: false,
        createdAt: Date.now(),
      });
    }

    return { success: true };
  },
});

// Advanced Candidate Search
export const searchCandidates = query({
  args: {
    skills: v.optional(v.array(v.string())),
    location: v.optional(v.string()),
    minExperience: v.optional(v.number()),
    maxExperience: v.optional(v.number()),
    workPreference: v.optional(v.string()),
    isActivelyLooking: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let candidates = await ctx.db.query('candidates').collect();

    // Filter by skills
    if (args.skills && args.skills.length > 0) {
      candidates = candidates.filter(
        (candidate) =>
          candidate.skills &&
          candidate.skills.some((skill) =>
            args.skills!.some((searchSkill) =>
              skill.toLowerCase().includes(searchSkill.toLowerCase())
            )
          )
      );
    }

    // Filter by location
    if (args.location) {
      candidates = candidates.filter(
        (candidate) =>
          candidate.location &&
          candidate.location.toLowerCase().includes(args.location!.toLowerCase())
      );
    }

    // Filter by experience range
    if (args.minExperience !== undefined) {
      candidates = candidates.filter(
        (candidate) => (candidate.experience || 0) >= args.minExperience!
      );
    }

    if (args.maxExperience !== undefined) {
      candidates = candidates.filter(
        (candidate) => (candidate.experience || 0) <= args.maxExperience!
      );
    }

    // Filter by work preference
    if (args.workPreference) {
      candidates = candidates.filter(
        (candidate) => candidate.workPreference === args.workPreference
      );
    }

    // Filter by active status
    if (args.isActivelyLooking !== undefined) {
      candidates = candidates.filter(
        (candidate) => candidate.isActivelyLooking === args.isActivelyLooking
      );
    }

    // Get user details for each candidate
    const candidatesWithUsers = await Promise.all(
      candidates.map(async (candidate) => {
        const user = await ctx.db.get(candidate.userId);
        return {
          ...candidate,
          firstName: user?.firstName || '',
          lastName: user?.lastName || '',
          email: user?.email || '',
          phone: user?.phone || '',
        };
      })
    );

    return candidatesWithUsers;
  },
});
