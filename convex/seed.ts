
import { mutation } from './_generated/server';

export const createTestData = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if data already exists
    const existingUsers = await ctx.db.query('users').collect();
    if (existingUsers.length > 0) {
      return { message: 'Test data already exists' };
    }

    // Create admin user
    const adminId = await ctx.db.insert('users', {
      email: 'admin@slrd.com',
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      phone: '+1-555-0001',
      createdAt: Date.now(),
    });

    // Create HR user
    const hrId = await ctx.db.insert('users', {
      email: 'hr@slrd.com',
      password: 'hr123',
      firstName: 'HR',
      lastName: 'Manager',
      role: 'hr',
      phone: '+1-555-0002',
      createdAt: Date.now(),
    });

    // Create sample job
    const jobId = await ctx.db.insert('jobs', {
      title: 'Senior Developer',
      role: 'Full Stack Developer',
      location: 'Remote',
      description: 'We are looking for a senior developer with React and Node.js experience.',
      postedBy: adminId,
      createdAt: Date.now(),
    });

    return {
      message: 'Test data created successfully',
      adminId,
      hrId,
      jobId,
    };
  },
});
