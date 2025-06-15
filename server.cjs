
require('dotenv').config();
const express = require('express');
const http = require('http'); // Import http module
const { Server } = require('socket.io'); // Import Server from socket.io
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const httpServer = http.createServer(app); // Create http server

console.log('NODE_ENV:', process.env.NODE_ENV);
const io = new Server(httpServer, { // Initialize Socket.IO server
  cors: {
    origin: [
      'https://stat-harassment-valves-boy.trycloudflare.com',
      'http://localhost:3000',
      'http://localhost:5000',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5000'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
    credentials: true
  }
});
const PORT = process.env.PORT || 5000;

// CORS configuration
const corsOptions = {
  origin: [
    'https://stat-harassment-valves-boy.trycloudflare.com',
    'http://localhost:3000',
    'http://localhost:5000',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5000'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
  credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Enable pre-flight for all routes
app.use(express.json());

// Request logging disabled as per user preference
// app.use((req, res, next) => {
//   console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
//   next();
// });

console.log('Attempting to connect to MongoDB...');
console.log('MongoDB URI:', process.env.MONGODB_URI);

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// Make io accessible to routes
app.set('socketio', io);

// Define models and routes
(async () => {
  app.use('/api/auth', (await import('./server/routes/auth.routes.js')).default);
  app.use('/api/goals', (await import('./server/routes/goals.routes.js')).default);
  app.use('/api/tasks', (await import('./server/routes/tasks.routes.js')).default);
  app.use('/api/employees', (await import('./server/routes/employees.routes.js')).default);
  app.use('/api/attendance', (await import('./server/routes/attendance.routes.js')).default);
  app.use('/api/settings', (await import('./server/routes/settings.routes.js')).default);
  app.use('/api/occasions', (await import('./server/routes/occasions.routes.js')).default);
  app.use('/api/leave', (await import('./server/routes/leave.routes.js')).default);
  app.use('/api/notifications', (await import('./server/routes/notifications.routes.js')).default); // Add notifications route
  app.use('/api/push', (await import('./server/routes/push.routes.js')).default); // Add push notifications route
})();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('join_room', (roomName) => {
    socket.join(roomName);
    console.log(`Socket ${socket.id} joined room: ${roomName}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('dist'));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

// Create a setup route to initialize demo accounts
app.get('/api/setup', async (req, res) => {
  try {
    // Dynamically import User model as it's now an ES module
    const { default: User } = await import('./server/models/User.js');
    
    // Check if demo accounts already exist
    const adminExists = await User.findOne({ email: 'admin@example.com' });
    const managerExists = await User.findOne({ email: 'manager@example.com' });
    const employeeExists = await User.findOne({ email: 'employee@example.com' });
    
    // If all demo accounts exist, return success
    if (adminExists && managerExists && employeeExists) {
      return res.status(200).json({ message: 'Demo accounts already set up' });
    }
    
    // Create demo accounts if they don't exist
    if (!adminExists) {
      const admin = new User({
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'admin123',
        role: 'admin',
        department: 'Management',
        position: 'System Administrator',
        joinDate: new Date('2020-01-15'),
        profileImage: 'https://i.pravatar.cc/150?img=68',
      });
      await admin.save();
      console.log('Admin demo account created');
    }
    
    if (!managerExists) {
      const manager = new User({
        name: 'Manager User',
        email: 'manager@example.com',
        password: 'manager123',
        role: 'manager',
        department: 'Development',
        position: 'Team Lead',
        joinDate: new Date('2021-03-10'),
        profileImage: 'https://i.pravatar.cc/150?img=33',
      });
      await manager.save();
      console.log('Manager demo account created');
    }
    
    if (!employeeExists) {
      const employee = new User({
        name: 'Employee User',
        email: 'employee@example.com',
        password: 'employee123',
        role: 'employee',
        department: 'Development',
        position: 'Software Developer',
        joinDate: new Date('2022-05-20'),
        profileImage: 'https://i.pravatar.cc/150?img=11',
      });
      await employee.save();
      console.log('Employee demo account created');
    }
    
    res.status(201).json({ message: 'Demo accounts created successfully' });
  } catch (error) {
    console.error('Error setting up demo accounts:', error);
    res.status(500).json({ message: 'Error setting up demo accounts', error: error.message });
  }
});

// Start the server and listen on all network interfaces
httpServer.listen(PORT, '0.0.0.0', async () => { // Listen on all interfaces for Cloudflare tunnel
  console.log(`Server running on http://0.0.0.0:${PORT} and accessible via Cloudflare tunnel`);
  console.log('CORS allowed origins:', ['https://emission-hero-equations-leaf.trycloudflare.com', 'http://localhost:3000']);
  
  try {
    // Dynamically import User model as it's now an ES module
    const { default: User } = await import('./server/models/User.js');
    
    // Check if demo accounts already exist
    const adminExists = await User.findOne({ email: 'admin@example.com' });
    const managerExists = await User.findOne({ email: 'manager@example.com' });
    const employeeExists = await User.findOne({ email: 'employee@example.com' });
    
    // Create demo accounts if they don't exist
    if (!adminExists) {
      const admin = new User({
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'admin123',
        role: 'admin',
        department: 'Management',
        position: 'System Administrator',
        joinDate: new Date('2020-01-15'),
        profileImage: 'https://i.pravatar.cc/150?img=68',
      });
      await admin.save();
      console.log('Admin demo account created on startup');
    }
    
    if (!managerExists) {
      const manager = new User({
        name: 'Manager User',
        email: 'manager@example.com',
        password: 'manager123',
        role: 'manager',
        department: 'Development',
        position: 'Team Lead',
        joinDate: new Date('2021-03-10'),
        profileImage: 'https://i.pravatar.cc/150?img=33',
      });
      await manager.save();
      console.log('Manager demo account created on startup');
    }
    
    if (!employeeExists) {
      const employee = new User({
        name: 'Employee User',
        email: 'employee@example.com',
        password: 'employee123',
        role: 'employee',
        department: 'Development',
        position: 'Software Developer',
        joinDate: new Date('2022-05-20'),
        profileImage: 'https://i.pravatar.cc/150?img=11',
      });
      await employee.save();
      console.log('Employee demo account created on startup');
    }
    
    console.log('Demo accounts setup checked and initialized if needed');
  } catch (error) {
    console.error('Error initializing demo accounts:', error);
  }
});
