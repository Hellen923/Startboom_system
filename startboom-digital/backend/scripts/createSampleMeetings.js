import mongoose from 'mongoose';
import Meeting from '../models/Meeting.js';
import Client from '../models/Client.js';
import User from '../models/User.js';

// Sample meeting data
const sampleMeetings = [
  {
    title: 'Product Demo',
    notes: 'Demonstrate the new CRM features',
    location: 'Conference Room A',
    status: 'completed'
  },
  {
    title: 'Contract Review',
    notes: 'Review and sign the service agreement',
    location: 'Office',
    status: 'scheduled'
  },
  {
    title: 'Follow-up Call',
    notes: 'Discuss implementation timeline',
    location: 'Virtual',
    status: 'scheduled'
  },
  {
    title: 'Requirements Gathering',
    notes: 'Collect client requirements for customization',
    location: 'Client Office',
    status: 'completed'
  },
  {
    title: 'Training Session',
    notes: 'Train team on new software',
    location: 'Training Room',
    status: 'scheduled'
  }
];

async function createSampleMeetings() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crm-dbs');
    console.log('Connected to MongoDB');

    // Get existing clients and agents
    const clients = await Client.find().limit(10);
    const agents = await User.find({ role: 'agent' }).limit(5);

    if (clients.length === 0 || agents.length === 0) {
      console.log('No clients or agents found. Please create some first.');
      return;
    }

    console.log(`Found ${clients.length} clients and ${agents.length} agents`);

    // Create meetings with random assignments
    const meetingsToCreate = [];
    const now = new Date();

    for (let i = 0; i < sampleMeetings.length; i++) {
      const sample = sampleMeetings[i];
      const client = clients[Math.floor(Math.random() * clients.length)];
      const agent = agents[Math.floor(Math.random() * agents.length)];
      
      // Create scheduled times ranging from past to future
      const daysOffset = Math.floor(Math.random() * 60) - 30; // -30 to +30 days
      const scheduledTime = new Date(now.getTime() + (daysOffset * 24 * 60 * 60 * 1000));

      meetingsToCreate.push({
        ...sample,
        client: client._id,
        agent: agent._id,
        scheduledTime
      });
    }

    // Insert meetings
    const insertedMeetings = await Meeting.insertMany(meetingsToCreate);
    console.log(`Created ${insertedMeetings.length} sample meetings`);

    // Populate and display created meetings
    const populatedMeetings = await Meeting.find(insertedMeetings.map(m => m._id))
      .populate('client', 'name')
      .populate('agent', 'name');

    console.log('\nCreated meetings:');
    populatedMeetings.forEach(meeting => {
      console.log(`- ${meeting.title} with ${meeting.client?.name} by ${meeting.agent?.name} on ${meeting.scheduledTime.toDateString()}`);
    });

  } catch (error) {
    console.error('Error creating sample meetings:', error);
  } finally {
    await mongoose.disconnect();
  }
}

createSampleMeetings();
