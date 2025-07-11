import { mutation } from './_generated/server';
import { v } from 'convex/values';

export const seedDatabase = mutation({
  args: {},
  handler: async (ctx) => {
    // Clear existing data for fresh seeding
    const existingUsers = await ctx.db.query('users').collect();
    if (existingUsers.length > 0) {
      console.log('Database has existing data. Proceeding with seeding...');
    }

    const adminId = await ctx.db.insert('users', {
      email: 'admin@slrd.com',
      password: 'admin123',
      firstName: 'John',
      lastName: 'Admin',
      role: 'admin',
      phone: '+1-555-0101',
      createdAt: Date.now(),
    });

    // Create HR users
    const hrId1 = await ctx.db.insert('users', {
      email: 'sarah.hr@slrd.com',
      password: 'hr123',
      firstName: 'Sarah',
      lastName: 'Johnson',
      role: 'hr',
      phone: '+1-555-0102',
      createdAt: Date.now(),
    });

    const hrId2 = await ctx.db.insert('users', {
      email: 'mike.hr@slrd.com',
      password: 'hr123',
      firstName: 'Mike',
      lastName: 'Wilson',
      role: 'hr',
      phone: '+1-555-0103',
      createdAt: Date.now(),
    });

    // Create candidate users
    const candidateUsers = [
      {
        email: 'himanshu@email.com',
        password: '12345678',
        firstName: 'Himanshu',
        lastName: 'Hanwat',
        phone: '+91-1234567890',
      },
      {
        email: 'ritik@email.com',
        password: 'candidate123',
        firstName: 'ritik',
        lastName: 'hanwat',
        phone: '+91-1111111111',
      },
      {
        email: 'jatin@email.com',
        password: 'candidate124',
        firstName: 'Jatin',
        lastName: 'Sharma',
        phone: '+91-1234123412',
      },
      {
        email: 'radhika@email.com',
        password: 'candidate125',
        firstName: 'Radhika',
        lastName: 'Rajput',
        phone: '+91-1234567890',
      },
      {
        email: 'kapil@email.com',
        password: 'candidate126',
        firstName: 'kapil',
        lastName: 'kohli',
        phone: '+91-1234567890',
      },
    ];

    const candidateIds = [];
    for (const candidate of candidateUsers) {
      const candidateId = await ctx.db.insert('users', {
        ...candidate,
        role: 'candidate',
        createdAt: Date.now(),
      });
      candidateIds.push(candidateId);
    }

    // Create candidate profiles
    const candidateProfiles = [
      {
        userId: candidateIds[0],
        skills: ['React', 'TypeScript', 'Node.js', 'MongoDB', 'AWS'],
        experience: 5,
        education: "Bachelor's in Computer Science",
        location: 'San Francisco, CA',
        summary: 'Full-stack developer with 5 years of experience in modern web technologies.',
        linkedinUrl: 'https://linkedin.com/in/alicesmith',
        githubUrl: 'https://github.com/alicesmith',
      },
      {
        userId: candidateIds[1],
        skills: ['Python', 'Django', 'PostgreSQL', 'Docker', 'Kubernetes'],
        experience: 3,
        education: "Master's in Software Engineering",
        location: 'New York, NY',
        summary: 'Backend developer passionate about scalable systems and clean code.',
        linkedinUrl: 'https://linkedin.com/in/bobjones',
        githubUrl: 'https://github.com/bobjones',
      },
      {
        userId: candidateIds[2],
        skills: ['Java', 'Spring Boot', 'MySQL', 'Redis', 'Microservices'],
        experience: 7,
        education: "Bachelor's in Information Technology",
        location: 'Austin, TX',
        summary: 'Senior Java developer with expertise in enterprise applications.',
        linkedinUrl: 'https://linkedin.com/in/carolbrown',
      },
      {
        userId: candidateIds[3],
        skills: ['React Native', 'Flutter', 'iOS', 'Android', 'Firebase'],
        experience: 4,
        education: "Bachelor's in Computer Engineering",
        location: 'Seattle, WA',
        summary: 'Mobile app developer with cross-platform expertise.',
        linkedinUrl: 'https://linkedin.com/in/davidwilson',
        githubUrl: 'https://github.com/davidwilson',
      },
      {
        userId: candidateIds[4],
        skills: ['UI/UX Design', 'Figma', 'Adobe Creative Suite', 'HTML', 'CSS'],
        experience: 2,
        education: "Bachelor's in Graphic Design",
        location: 'Los Angeles, CA',
        summary: 'Creative designer transitioning into frontend development.',
        linkedinUrl: 'https://linkedin.com/in/emmadavis',
      },
    ];

    for (const profile of candidateProfiles) {
      await ctx.db.insert('candidates', profile);
    }

    // Create jobs
    const jobs = [
      {
        title: 'Senior Full Stack Developer',

        description:
          'We are looking for a Senior Full Stack Developer to join our engineering team. You will be responsible for developing and maintaining web applications using modern technologies. The ideal candidate has experience with React, Node.js, and cloud platforms.',
        department: 'Engineering',
        experienceRequired: 5,
        salaryMin: 120000,
        salaryMax: 160000,
        location: 'Bhopal , India/ Remote',
        status: 'active' as const,
        requiredSkills: ['React', 'Node.js', 'TypeScript', 'AWS', 'MongoDB'],
        postedBy: hrId1,
        createdAt: Date.now() - 86400000 * 7,
      },
      {
        title: 'Backend Engineer',
        description:
          "Join our backend team to build scalable microservices and APIs. You'll work with Python, Django, and cloud infrastructure to support our growing platform. Experience with containerization and CI/CD is a plus.",
        department: 'Engineering',
        experienceRequired: 3,
        salaryMin: 90000,
        salaryMax: 130000,
        location: 'Bhopal , India ',
        status: 'active' as const,
        requiredSkills: ['Python', 'Django', 'PostgreSQL', 'Docker', 'REST APIs'],
        postedBy: hrId2,
        createdAt: Date.now() - 86400000 * 5,
      },
      {
        title: 'Mobile App Developer',
        description:
          "We're seeking a talented Mobile App Developer to create amazing user experiences on iOS and Android platforms. You'll work with React Native and native technologies to build our mobile applications.",
        department: 'Engineering',
        experienceRequired: 3,
        salaryMin: 100000,
        salaryMax: 140000,
        location: 'Bhopal , India (remote)',
        status: 'active' as const,
        requiredSkills: ['React Native', 'iOS', 'Android', 'JavaScript', 'Firebase'],
        postedBy: hrId1,
        createdAt: Date.now() - 86400000 * 3, // 3 days ago
      },
      {
        title: 'UI/UX Designer',
        description:
          "Looking for a creative UI/UX Designer to help shape the user experience of our products. You'll collaborate with product managers and engineers to create intuitive and beautiful interfaces.",
        department: 'Design',
        experienceRequired: 2,
        salaryMin: 70000,
        salaryMax: 100000,
        location: 'Bhopal',
        status: 'active' as const,
        requiredSkills: [
          'Figma',
          'Adobe Creative Suite',
          'UI Design',
          'UX Research',
          'Prototyping',
        ],
        postedBy: hrId2,
        createdAt: Date.now() - 86400000 * 2,
      },
      {
        title: 'DevOps Engineer',
        description:
          'We need a DevOps Engineer to help us scale our infrastructure and improve our deployment processes. Experience with Kubernetes, AWS, and monitoring tools is essential.',
        department: 'Engineering',
        experienceRequired: 4,
        salaryMin: 110000,
        salaryMax: 150000,
        location: 'Bhopal / Remote',
        status: 'active' as const,
        requiredSkills: ['Kubernetes', 'AWS', 'Docker', 'Terraform', 'Monitoring'],
        postedBy: hrId1,
        createdAt: Date.now() - 86400000 * 1, // 1 day ago
      },
      {
        title: 'Junior Frontend Developer',
        description:
          "Great opportunity for a Junior Frontend Developer to grow their career. You'll work on our web applications using React and learn from senior developers in a supportive environment.",
        department: 'Engineering',
        experienceRequired: 1,
        salaryMin: 60000,
        salaryMax: 80000,
        location: 'Remote',
        status: 'closed' as const,
        requiredSkills: ['React', 'JavaScript', 'HTML', 'CSS', 'Git'],
        postedBy: hrId2,
        createdAt: Date.now() - 86400000 * 14,
      },
    ];

    const jobIds = [];
    for (const job of jobs) {
      const jobId = await ctx.db.insert('jobs', job);
      jobIds.push(jobId);
    }

    const applications = [
      {
        jobId: jobIds[0],
        candidateId: candidateIds[0],
        status: 'selected' as const,
        appliedAt: Date.now() - 86400000 * 6,
        coverLetter:
          "I'm excited about this opportunity to work as a Senior Full Stack Developer. My 5 years of experience with React and Node.js make me a perfect fit for this role.",
      },
      {
        jobId: jobIds[0], // Senior Full Stack Developer
        candidateId: candidateIds[1], // Bob Jones
        status: 'interviewed' as const,
        appliedAt: Date.now() - 86400000 * 5,
        coverLetter:
          "While my background is primarily in Python, I'm eager to expand my skills to include React and Node.js.",
      },
      {
        jobId: jobIds[1],
        candidateId: candidateIds[1],
        status: 'interview_scheduled' as const,
        appliedAt: Date.now() - 86400000 * 4,
        coverLetter:
          "This backend position aligns perfectly with my Python and Django expertise. I'm excited to contribute to your microservices architecture.",
      },
      {
        jobId: jobIds[1],
        candidateId: candidateIds[2],
        status: 'screening' as const,
        appliedAt: Date.now() - 86400000 * 3,
        coverLetter:
          "Although my experience is primarily in Java, I'm confident I can quickly adapt to Python and Django.",
      },
      {
        jobId: jobIds[2],
        candidateId: candidateIds[3],
        status: 'applied' as const,
        appliedAt: Date.now() - 86400000 * 2,
        coverLetter:
          "I'm passionate about mobile development and have extensive experience with React Native and native iOS/Android development.",
      },
      {
        jobId: jobIds[3],
        candidateId: candidateIds[4],
        status: 'applied' as const,
        appliedAt: Date.now() - 86400000 * 1,
        coverLetter:
          "I'm excited to bring my design skills to your team and help create amazing user experiences.",
      },
      {
        jobId: jobIds[0],
        candidateId: candidateIds[2],
        status: 'rejected' as const,
        appliedAt: Date.now() - 86400000 * 6,
        coverLetter:
          "I'm interested in transitioning from Java to full-stack development with React and Node.js.",
      },
    ];

    const applicationIds = [];
    for (const application of applications) {
      const applicationId = await ctx.db.insert('applications', application);
      applicationIds.push(applicationId);
    }

    // Create interviews
    const interviews = [
      {
        applicationId: applicationIds[1],
        scheduledDate: Date.now() + 86400000 * 2,
        interviewerName: 'Ayusi Jaishwal',
        interviewerEmail: 'sarah.hr@slrd.com',
        meetingLink: 'https://zoom.us/j/123456789',
        notes: 'Technical interview focusing on React and Node.js experience',
        status: 'scheduled' as const,
        createdAt: Date.now() - 86400000 * 1,
      },
      {
        applicationId: applicationIds[2],
        scheduledDate: Date.now() + 86400000 * 3,
        interviewerName: 'rishi Tiwari',
        interviewerEmail: 'rishi.hr@slrd.com',
        meetingLink: 'https://meet.google.com/abc-defg-hij',
        notes: 'Backend architecture and Python/Django discussion',
        status: 'scheduled' as const,
        createdAt: Date.now() - 86400000 * 1,
      },
      {
        applicationId: applicationIds[0],
        scheduledDate: Date.now() - 86400000 * 2,
        interviewerName: 'Ayushi jaishwal',
        interviewerEmail: 'ayushi.hr@slrd.com',
        meetingLink: 'https://zoom.us/j/987654321',
        notes: 'Excellent technical skills, great cultural fit. Recommended for hire.',
        status: 'completed' as const,
        createdAt: Date.now() - 86400000 * 5,
      },
    ];

    for (const interview of interviews) {
      await ctx.db.insert('interviews', interview);
    }

    return {
      message: 'Database seeded successfully!',
      stats: {
        users: candidateUsers.length + 3,
        candidates: candidateProfiles.length,
        jobs: jobs.length,
        applications: applications.length,
        interviews: interviews.length,
      },
    };
  },
});

export const clearDatabase = mutation({
  args: {},
  handler: async (ctx) => {
    // Delete all data in reverse order of dependencies
    const interviews = await ctx.db.query('interviews').collect();
    for (const interview of interviews) {
      await ctx.db.delete(interview._id);
    }

    const applications = await ctx.db.query('applications').collect();
    for (const application of applications) {
      await ctx.db.delete(application._id);
    }

    const jobs = await ctx.db.query('jobs').collect();
    for (const job of jobs) {
      await ctx.db.delete(job._id);
    }

    const candidates = await ctx.db.query('candidates').collect();
    for (const candidate of candidates) {
      await ctx.db.delete(candidate._id);
    }

    const users = await ctx.db.query('users').collect();
    for (const user of users) {
      await ctx.db.delete(user._id);
    }

    return { message: 'Database cleared successfully!' };
  },
});
