import mongoose from 'mongoose';
import User from './models/User.js';
import Client from './models/Client.js';
import Sale from './models/Sale.js';
import Stock from './models/Stock.js';
import dotenv from 'dotenv';

dotenv.config();

const createDefaultData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Create default admin
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      const admin = await User.create({
        name: 'System Administrator',
        email: 'xtreative@crm.com',
        password: 'admin123',
        role: 'admin',
        isFirstLogin: false
      });
      
    }

    // Create sample agents
    const agent1Exists = await User.findOne({ email: 'agent1@crm.com' });
    let agent1;
    if (!agent1Exists) {
      agent1 = await User.create({
        name: 'John Smith',
        email: 'agent1@crm.com',
        password: 'agent123',
        role: 'agent',
        phone: '+256700123456',
        nin: 'CM123456789',
        isFirstLogin: false
      });
    } else {
      agent1 = agent1Exists;
    }

    const agent2Exists = await User.findOne({ email: 'agent2@crm.com' });
    let agent2;
    if (!agent2Exists) {
      agent2 = await User.create({
        name: 'Sarah Johnson',
        email: 'agent2@crm.com',
        password: 'agent123',
        role: 'agent',
        phone: '+256700234567',
        nin: 'CM987654321',
        isFirstLogin: false
      });
    } else {
      agent2 = agent2Exists;
    }

    // Create sample clients for agents
    const sampleClients = [
      {
        name: 'Florence Namukisa',
        email: 'florence@example.com',
        phone: '+256700345678',
        nin: 'CM111222333',
        company: 'Tech Solutions Ltd',
        position: 'CEO',
        industry: 'Technology',
        address: 'Plot 45, Kampala Road',
        city: 'Kampala',
        country: 'Uganda',
        status: 'active',
        priority: 'high',
        agent: agent1._id
      },
      {
        name: 'Michael Okello',
        email: 'michael@example.com',
        phone: '+256700456789',
        nin: 'CM444555666',
        company: 'Construction Co.',
        position: 'Project Manager',
        industry: 'Construction',
        address: 'Plot 78, Entebbe Road',
        city: 'Kampala',
        country: 'Uganda',
        status: 'active',
        priority: 'medium',
        agent: agent1._id
      },
      {
        name: 'Grace Nakato',
        email: 'grace@example.com',
        phone: '+256700567890',
        nin: 'CM777888999',
        company: 'Fashion Boutique',
        position: 'Owner',
        industry: 'Retail',
        address: 'Plot 12, Jinja Road',
        city: 'Kampala',
        country: 'Uganda',
        status: 'prospect',
        priority: 'low',
        agent: agent2._id
      }
    ];

    for (const clientData of sampleClients) {
      const existingClient = await Client.findOne({ email: clientData.email });
      if (!existingClient) {
        await Client.create(clientData);
      }
    }

    // Create sample sales
    const clients = await Client.find();
    const sampleSales = [
      {
        customerName: 'Florence Namukisa',
        customerEmail: 'florence@example.com',
        customerPhone: '+256700345678',
        client: clients.find(c => c.email === 'florence@example.com')?._id,
        items: [
          {
            itemName: 'Laptop Computer',
            quantity: 1,
            unitPrice: 1200.00,
            discount: 5
          }
        ],
        paymentMethod: 'cash',
        status: 'completed',
        agent: agent1._id,
        saleDate: new Date('2024-12-01'),
        notes: 'Office laptop purchase'
      },
      {
        customerName: 'Michael Okello',
        customerEmail: 'michael@example.com',
        customerPhone: '+256700456789',
        client: clients.find(c => c.email === 'michael@example.com')?._id,
        items: [
          {
            itemName: 'Office Chair',
            quantity: 2,
            unitPrice: 350.00,
            discount: 0
          },
          {
            itemName: 'Wireless Mouse',
            quantity: 1,
            unitPrice: 25.00,
            discount: 0
          }
        ],
        paymentMethod: 'credit',
        status: 'completed',
        agent: agent1._id,
        saleDate: new Date('2024-12-05'),
        dueDate: new Date('2025-01-05'),
        notes: 'Office furniture setup'
      },
      {
        customerName: 'Grace Nakato',
        customerEmail: 'grace@example.com',
        customerPhone: '+256700567890',
        client: clients.find(c => c.email === 'grace@example.com')?._id,
        items: [
          {
            itemName: 'Coffee Machine',
            quantity: 1,
            unitPrice: 180.00,
            discount: 10
          }
        ],
        paymentMethod: 'cash',
        status: 'completed',
        agent: agent2._id,
        saleDate: new Date('2024-12-03'),
        notes: 'Cafe equipment'
      },
      {
        customerName: 'David Muwanguzi',
        customerEmail: 'david@example.com',
        customerPhone: '+256700678901',
        items: [
          {
            itemName: 'Projector Screen',
            quantity: 1,
            unitPrice: 450.00,
            discount: 0
          },
          {
            itemName: 'Whiteboard Markers (Pack of 4)',
            quantity: 3,
            unitPrice: 12.00,
            discount: 0
          }
        ],
        paymentMethod: 'credit',
        status: 'completed',
        agent: agent1._id,
        saleDate: new Date('2024-12-07'),
        dueDate: new Date('2025-01-07'),
        notes: 'Conference room setup'
      }
    ];

    for (const saleData of sampleSales) {
      // Check if sale already exists (by customer email and sale date)
      const existingSale = await Sale.findOne({
        customerEmail: saleData.customerEmail,
        saleDate: saleData.saleDate
      });
      if (!existingSale) {
        await Sale.create(saleData);
      }
    }

    // Create sample stock items
    const sampleStockItems = [
      {
        itemName: 'Laptop Computer',
        description: 'High-performance laptop for business use',
        category: 'Electronics',
        unitPrice: 1200.00,
        currentStock: 15,
        minimumStock: 5,
        supplier: 'TechCorp Inc.'
      },
      {
        itemName: 'Office Chair',
        description: 'Ergonomic office chair with lumbar support',
        category: 'Furniture',
        unitPrice: 350.00,
        currentStock: 25,
        minimumStock: 8,
        supplier: 'OfficeFurnish Ltd.'
      },
      {
        itemName: 'Wireless Mouse',
        description: 'Bluetooth wireless mouse with USB receiver',
        category: 'Electronics',
        unitPrice: 25.00,
        currentStock: 50,
        minimumStock: 10,
        supplier: 'TechCorp Inc.'
      },
      {
        itemName: 'Printer Paper (500 sheets)',
        description: 'A4 size printer paper, 80gsm',
        category: 'Office Supplies',
        unitPrice: 8.50,
        currentStock: 100,
        minimumStock: 20,
        supplier: 'PaperWorks Co.'
      },
      {
        itemName: 'Coffee Machine',
        description: 'Automatic coffee maker for office use',
        category: 'Appliances',
        unitPrice: 180.00,
        currentStock: 8,
        minimumStock: 3,
        supplier: 'HomeBrew Ltd.'
      },
      {
        itemName: 'Projector Screen',
        description: '120-inch projection screen with stand',
        category: 'Electronics',
        unitPrice: 450.00,
        currentStock: 6,
        minimumStock: 2,
        supplier: 'AV Solutions Inc.'
      },
      {
        itemName: 'Whiteboard Markers (Pack of 4)',
        description: 'Dry-erase markers in assorted colors',
        category: 'Office Supplies',
        unitPrice: 12.00,
        currentStock: 30,
        minimumStock: 10,
        supplier: 'OfficeMart'
      },
      {
        itemName: 'External Hard Drive 1TB',
        description: 'USB 3.0 external hard drive for data backup',
        category: 'Electronics',
        unitPrice: 85.00,
        currentStock: 20,
        minimumStock: 5,
        supplier: 'TechCorp Inc.'
      }
    ];

    for (const item of sampleStockItems) {
      const existingItem = await Stock.findOne({ itemName: item.itemName });
      if (!existingItem) {
        await Stock.create(item);
      }
    }

    console.log('Setup completed successfully!');

  } catch (error) {
    console.error('Error setting up data:', error);
  } finally {
    await mongoose.connection.close();
  }
};

createDefaultData();