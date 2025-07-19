import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  users: defineTable({
    email: v.string(),
    password: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    role: v.union(v.literal('admin'), v.literal('hr')),
    phone: v.optional(v.string()),
    createdAt: v.number(),
  }).index('by_email', ['email']),

  jobs: defineTable({
    title: v.string(),
    role: v.string(),
    location: v.string(),
    description: v.string(),
    postedBy: v.id('users'),
    createdAt: v.number(),
  }),

  candidates: defineTable({
    jobId: v.id('jobs'),
    name: v.string(),
    email: v.string(),
    experience: v.number(),
    resumeUrl: v.string(),
    fileName: v.string(),
    uploadedBy: v.id('users'),
    status: v.union(
      v.literal('uploaded'),
      v.literal('shortlisted'),
      v.literal('confirmed')
    ),
    uploadedAt: v.number(),
    shortlistedAt: v.optional(v.number()),
    confirmedAt: v.optional(v.number()),
  }),

  queries: defineTable({
    fromUserId: v.id('users'),
    toUserId: v.id('users'),
    jobId: v.optional(v.id('jobs')),
    candidateId: v.optional(v.id('candidates')),
    subject: v.string(),
    message: v.string(),
    createdAt: v.number(),
  }),

  query_responses: defineTable({
    queryId: v.id('queries'),
    responderId: v.id('users'),
    message: v.string(),
    createdAt: v.number(),
  }),

  notifications: defineTable({
    userId: v.id('users'),
    title: v.string(),
    message: v.string(),
    type: v.union(
      v.literal('candidate_uploaded'),
      v.literal('candidate_shortlisted'),
      v.literal('candidate_confirmed'),
      v.literal('query_sent'),
      v.literal('query_responded')
    ),
    relatedId: v.optional(v.string()),
    isRead: v.boolean(),
    createdAt: v.number(),
  }).index('by_user', ['userId']),

  feedback: defineTable({
    name: v.string(),
    role: v.string(),
    message: v.string(),
    submittedBy: v.id('users'),
    createdAt: v.number(),
  }),
});