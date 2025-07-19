import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

export const createQuery = mutation({
  args: {
    fromUserId: v.id('users'),
    toUserId: v.id('users'),
    jobId: v.optional(v.id('jobs')),
    candidateId: v.optional(v.id('candidates')),
    subject: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const queryId = await ctx.db.insert('queries', {
      ...args,
      createdAt: Date.now(),
    });

    // Create notification for recipient
    await ctx.db.insert('notifications', {
      userId: args.toUserId,
      title: 'New Query Received',
      message: `You have a new query: ${args.subject}`,
      type: 'query_sent',
      relatedId: queryId,
      isRead: false,
      createdAt: Date.now(),
    });

    return queryId;
  },
});

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
      createdAt: Date.now(),
    });

    // Get original query to notify sender
    const query = await ctx.db.get(args.queryId);
    if (query) {
      await ctx.db.insert('notifications', {
        userId: query.fromUserId,
        title: 'Query Response Received',
        message: `Your query "${query.subject}" has been responded to`,
        type: 'query_responded',
        relatedId: args.queryId,
        isRead: false,
        createdAt: Date.now(),
      });
    }

    return responseId;
  },
});

export const getQueriesForUser = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const queriesFromUser = await ctx.db
      .query('queries')
      .filter((q) => q.eq(q.field('fromUserId'), args.userId))
      .collect();

    const queriesToUser = await ctx.db
      .query('queries')
      .filter((q) => q.eq(q.field('toUserId'), args.userId))
      .collect();

    const allQueries = [...queriesFromUser, ...queriesToUser];

    const queriesWithDetails = await Promise.all(
      allQueries.map(async (query) => {
        const fromUser = await ctx.db.get(query.fromUserId);
        const toUser = await ctx.db.get(query.toUserId);
        const responses = await ctx.db
          .query('query_responses')
          .filter((q) => q.eq(q.field('queryId'), query._id))
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

export const getUsersByRole = query({
  args: { role: v.union(v.literal('admin'), v.literal('hr')) },
  handler: async (ctx, args) => {
    const users = await ctx.db
      .query('users')
      .filter((q) => q.eq(q.field('role'), args.role))
      .collect();

    return users;
  },
});