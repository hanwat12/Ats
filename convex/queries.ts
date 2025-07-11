import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

// Create a new query
export const createQuery = mutation({
  args: {
    fromUserId: v.id('users'),
    toUserId: v.id('users'),
    candidateId: v.optional(v.id('candidates')),
    jobId: v.optional(v.id('jobs')),
    interviewId: v.optional(v.id('interviews')),
    subject: v.string(),
    message: v.string(),
    priority: v.union(
      v.literal('low'),
      v.literal('medium'),
      v.literal('high'),
      v.literal('urgent')
    ),
    category: v.union(
      v.literal('candidate_selection'),
      v.literal('interview_scheduling'),
      v.literal('feedback_clarification'),
      v.literal('general')
    ),
  },
  handler: async (ctx, args) => {
    const queryId = await ctx.db.insert('queries', {
      ...args,
      status: 'open',
      createdAt: Date.now(),
    });

    // Create notification for recipient
    await ctx.db.insert('notifications', {
      userId: args.toUserId,
      title: 'New Query Received',
      message: `You have a new ${args.priority} priority query: ${args.subject}`,
      type: 'general',
      relatedId: queryId,
      isRead: false,
      createdAt: Date.now(),
    });

    return queryId;
  },
});

// Respond to a query
export const respondToQuery = mutation({
  args: {
    queryId: v.id('queries'),
    responderId: v.id('users'),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const responseId = await ctx.db.insert('query_responses', {
      queryId: args.queryId,
      responderId: args.responderId,
      message: args.message,
      isRead: false,
      createdAt: Date.now(),
    });

    // Update query status
    await ctx.db.patch(args.queryId, {
      status: 'in_progress',
      updatedAt: Date.now(),
    });

    // Get original query to notify sender
    const query = await ctx.db.get(args.queryId);
    if (query) {
      await ctx.db.insert('notifications', {
        userId: query.fromUserId,
        title: 'Query Response Received',
        message: `Your query "${query.subject}" has been responded to`,
        type: 'general',
        relatedId: args.queryId,
        isRead: false,
        createdAt: Date.now(),
      });
    }

    return responseId;
  },
});

// Get queries for a user
export const getQueriesForUser = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const queriesFromUser = await ctx.db
      .query('queries')
      .withIndex('by_from_user', (q) => q.eq('fromUserId', args.userId))
      .collect();

    const queriesToUser = await ctx.db
      .query('queries')
      .withIndex('by_to_user', (q) => q.eq('toUserId', args.userId))
      .collect();

    const allQueries = [...queriesFromUser, ...queriesToUser];

    const queriesWithDetails = await Promise.all(
      allQueries.map(async (query) => {
        const fromUser = await ctx.db.get(query.fromUserId);
        const toUser = await ctx.db.get(query.toUserId);
        const responses = await ctx.db
          .query('query_responses')
          .withIndex('by_query', (q) => q.eq('queryId', query._id))
          .collect();

        return {
          ...query,
          fromUserName: fromUser ? `${fromUser.firstName} ${fromUser.lastName}` : 'Unknown',
          toUserName: toUser ? `${toUser.firstName} ${toUser.lastName}` : 'Unknown',
          responses,
          isOwner: query.fromUserId === args.userId,
        };
      })
    );

    return queriesWithDetails.sort((a, b) => b.createdAt - a.createdAt);
  },
});

// Update query status
export const updateQueryStatus = mutation({
  args: {
    queryId: v.id('queries'),
    status: v.union(v.literal('open'), v.literal('in_progress'), v.literal('resolved')),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.queryId, {
      status: args.status,
      updatedAt: Date.now(),
    });
    return args.queryId;
  },
});

// Mark response as read
export const markResponseAsRead = mutation({
  args: { responseId: v.id('query_responses') },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.responseId, { isRead: true });
    return args.responseId;
  },
});

export const getUsersByRole = query({
  args: { role: v.union(v.literal('admin'), v.literal('hr'), v.literal('candidate')) },
  handler: async (ctx, args) => {
    const users = await ctx.db
      .query('users')
      .filter((q) => q.eq(q.field('role'), args.role))
      .collect();

    return users;
  },
});
