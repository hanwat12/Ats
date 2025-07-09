import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  users: defineTable({
    email: v.string(),
    password: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    role: v.union(v.literal('admin'), v.literal('hr'), v.literal('candidate')),
    phone: v.optional(v.string()),
    profileImage: v.optional(v.string()),
    createdAt: v.number(),
  }).index('by_email', ['email']),

  candidates: defineTable({
    userId: v.id('users'),
    skills: v.optional(v.array(v.string())),
    experience: v.optional(v.number()),
    education: v.optional(v.string()),
    location: v.optional(v.string()),
    resumeId: v.optional(v.string()),
    summary: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    githubUrl: v.optional(v.string()),
    portfolioUrl: v.optional(v.string()),
    currentJobTitle: v.optional(v.string()),
    currentCompany: v.optional(v.string()),
    expectedSalary: v.optional(v.number()),
    noticePeriod: v.optional(v.number()), // in days
    availability: v.optional(v.string()), // 'immediately', 'within_month', 'negotiable'
    workPreference: v.optional(v.string()), // 'remote', 'onsite', 'hybrid'
    isProfileComplete: v.optional(v.boolean()),
    profileCompletionPercentage: v.optional(v.number()),
    lastUpdated: v.optional(v.number()),
    isActivelyLooking: v.optional(v.boolean()),
    preferredLocations: v.optional(v.array(v.string())),
    certifications: v.optional(v.array(v.string())),
    languages: v.optional(v.array(v.string())),
    projectsCount: v.optional(v.number()),
    achievementsCount: v.optional(v.number()),
  })
    .index('by_user', ['userId'])
    .index('by_location', ['location'])
    .index('by_experience', ['experience'])
    .index('by_active_status', ['isActivelyLooking']),

  jobs: defineTable({
    title: v.string(),
    description: v.string(),
    department: v.string(),
    experienceRequired: v.number(),
    salaryMin: v.number(),
    salaryMax: v.number(),
    location: v.string(),
    status: v.union(v.literal('active'), v.literal('closed')),
    requiredSkills: v.array(v.string()),
    postedBy: v.id('users'),
    createdAt: v.number(),
    deadline: v.optional(v.number()),
    currency: v.optional(v.string()), // "USD", "INR", etc.
  })
    .index('by_status', ['status'])
    .index('by_department', ['department'])
    .index('by_posted_by', ['postedBy']),

  applications: defineTable({
    jobId: v.id('jobs'),
    candidateId: v.id('users'),
    status: v.union(
      v.literal('applied'),
      v.literal('screening'),
      v.literal('interview_scheduled'),
      v.literal('interviewed'),
      v.literal('selected'),
      v.literal('rejected')
    ),
    appliedAt: v.number(),
    coverLetter: v.optional(v.string()),
    matchPercentage: v.optional(v.number()),
    reviewedBy: v.optional(v.id('users')), // HR/Admin who reviewed
    reviewedAt: v.optional(v.number()),
    reviewNotes: v.optional(v.string()),
  })
    .index('by_job', ['jobId'])
    .index('by_candidate', ['candidateId'])
    .index('by_status', ['status']),

  interviews: defineTable({
    applicationId: v.id('applications'),
    scheduledDate: v.number(),
    interviewerName: v.string(),
    interviewerEmail: v.string(),
    meetingLink: v.optional(v.string()),
    notes: v.optional(v.string()),
    status: v.union(
      v.literal('scheduled'),
      v.literal('completed'),
      v.literal('cancelled'),
      v.literal('rescheduled')
    ),
    createdAt: v.number(),
  })
    .index('by_application', ['applicationId'])
    .index('by_status', ['status']),

  notifications: defineTable({
    userId: v.id('users'),
    title: v.string(),
    message: v.string(),
    type: v.union(
      v.literal('application_status'),
      v.literal('interview_scheduled'),
      v.literal('job_posted'),
      v.literal('general')
    ),
    relatedId: v.optional(v.string()),
    isRead: v.boolean(),
    createdAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_type', ['type']),

  requisitions: defineTable({
    department: v.string(),
    jobRole: v.string(),
    experienceRequired: v.number(),
    numberOfPositions: v.number(),
    skillsRequired: v.array(v.string()),
    jdFileUrl: v.optional(v.string()),
    status: v.union(v.literal('pending'), v.literal('approved'), v.literal('closed')),
    createdBy: v.id('users'),
    approvedBy: v.optional(v.id('users')),
    createdAt: v.number(),
    approvedAt: v.optional(v.number()),
    description: v.optional(v.string()),
  })
    .index('by_status', ['status'])
    .index('by_created_by', ['createdBy'])
    .index('by_department', ['department']),

  requisition_candidates: defineTable({
    requisitionId: v.id('requisitions'),
    candidateName: v.string(),
    candidateEmail: v.optional(v.string()),
    candidatePhone: v.optional(v.string()),
    skills: v.array(v.string()),
    experience: v.number(),
    resumeUrl: v.string(),
    status: v.union(
      v.literal('submitted'),
      v.literal('shortlisted'),
      v.literal('interviewed'),
      v.literal('selected'),
      v.literal('rejected')
    ),
    uploadedBy: v.id('users'),
    createdAt: v.number(),
    reviewedBy: v.optional(v.id('users')),
    reviewedAt: v.optional(v.number()),
    notes: v.optional(v.string()),
  })
    .index('by_requisition', ['requisitionId'])
    .index('by_status', ['status'])
    .index('by_uploaded_by', ['uploadedBy']),

  master_departments: defineTable({
    name: v.string(),
    isActive: v.boolean(),
  }).index('by_name', ['name']),

  master_job_roles: defineTable({
    title: v.string(),
    department: v.string(),
    isActive: v.boolean(),
  })
    .index('by_department', ['department'])
    .index('by_title', ['title']),

  feedback: defineTable({
    interviewId: v.id('interviews'),
    candidateId: v.id('candidates'),
    jobId: v.id('jobs'),
    interviewerName: v.string(),
    overallRating: v.number(), // 1-5 scale
    technicalSkills: v.number(), // 1-5 scale
    communicationSkills: v.number(), // 1-5 scale
    problemSolving: v.number(), // 1-5 scale
    culturalFit: v.number(), // 1-5 scale
    strengths: v.string(),
    weaknesses: v.string(),
    recommendation: v.string(), // "hire", "no-hire", "maybe"
    additionalComments: v.optional(v.string()),
    submittedAt: v.string(),
    updatedAt: v.optional(v.string()),
  })
    .index('by_interview', ['interviewId'])
    .index('by_candidate', ['candidateId'])
    .index('by_job', ['jobId'])
    .index('by_recommendation', ['recommendation']),

  candidate_projects: defineTable({
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
    createdAt: v.number(),
  }).index('by_candidate', ['candidateId']),

  candidate_achievements: defineTable({
    candidateId: v.id('users'),
    title: v.string(),
    description: v.string(),
    achievementType: v.string(),
    issuedBy: v.optional(v.string()),
    issuedDate: v.optional(v.string()),
    credentialId: v.optional(v.string()),
    credentialUrl: v.optional(v.string()),
    expiryDate: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index('by_candidate', ['candidateId'])
    .index('by_type', ['achievementType']),

  candidate_education: defineTable({
    candidateId: v.id('users'),
    degree: v.string(),
    fieldOfStudy: v.string(),
    institution: v.string(),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    isOngoing: v.optional(v.boolean()),
    grade: v.optional(v.string()),
    activities: v.optional(v.string()),
    description: v.optional(v.string()),
    createdAt: v.number(),
  }).index('by_candidate', ['candidateId']),

  candidate_work_experience: defineTable({
    candidateId: v.id('users'),
    jobTitle: v.string(),
    company: v.string(),
    location: v.optional(v.string()),
    startDate: v.string(),
    endDate: v.optional(v.string()),
    isCurrentJob: v.optional(v.boolean()),
    description: v.string(),
    responsibilities: v.optional(v.array(v.string())),
    achievements: v.optional(v.array(v.string())),
    technologies: v.optional(v.array(v.string())),
    createdAt: v.number(),
  })
    .index('by_candidate', ['candidateId'])
    .index('by_company', ['company']),
});
