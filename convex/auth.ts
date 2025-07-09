import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

export const signup = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    role: v.union(v.literal('admin'), v.literal('hr')),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', args.email))
      .unique();

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    if (args.role === 'admin') {
      const existingAdmin = await ctx.db
        .query('users')
        .filter((q) => q.eq(q.field('role'), 'admin'))
        .first();

      if (existingAdmin) {
        throw new Error('An admin account already exists. Only one admin is allowed.');
      }
    }

    const userId = await ctx.db.insert('users', {
      ...args,
      createdAt: Date.now(),
    });

    return { userId, role: args.role };
  },
});

export const login = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', args.email))
      .unique();

    if (!user || user.password !== args.password) {
      throw new Error('Invalid email or password');
    }

    return {
      userId: user._id,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    };
  },
});

export const getCurrentUser = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    let profileImageUrl = null;
    if (user.profileImage) {
      profileImageUrl = `https://images.convex.cloud/${user.profileImage}`;
    }

    return {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      phone: user.phone,
      profileImage: profileImageUrl,
    };
  },
});

export const updateUser = mutation({
  args: {
    userId: v.id('users'),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    phone: v.optional(v.string()),
    profileImage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, ...updates } = args;

    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );

    await ctx.db.patch(userId, cleanUpdates);
    return userId;
  },
});
