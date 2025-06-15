
// Demo data to replace database connections
export const demoUsers = [
  {
    _id: '1',
    name: 'John Smith',
    email: 'john.smith@company.com',
    role: 'employee',
    department: 'Engineering',
    position: 'Senior Developer',
    avatar: '/placeholder.svg',
    status: 'active',
    joinDate: '2023-01-15',
    phone: '+1 (555) 123-4567',
    address: '123 Main St, City, State 12345'
  },
  {
    _id: '2',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@company.com',
    role: 'manager',
    department: 'Marketing',
    position: 'Marketing Manager',
    avatar: '/placeholder.svg',
    status: 'active',
    joinDate: '2022-08-20',
    phone: '+1 (555) 234-5678',
    address: '456 Oak Ave, City, State 12345'
  },
  {
    _id: '3',
    name: 'Mike Wilson',
    email: 'mike.wilson@company.com',
    role: 'employee',
    department: 'Sales',
    position: 'Sales Representative',
    avatar: '/placeholder.svg',
    status: 'active',
    joinDate: '2023-03-10',
    phone: '+1 (555) 345-6789',
    address: '789 Pine St, City, State 12345'
  },
  {
    _id: '4',
    name: 'Emily Davis',
    email: 'emily.davis@company.com',
    role: 'admin',
    department: 'HR',
    position: 'HR Director',
    avatar: '/placeholder.svg',
    status: 'active',
    joinDate: '2021-11-05',
    phone: '+1 (555) 456-7890',
    address: '321 Elm St, City, State 12345'
  }
];

export const demoGoals = [
  {
    _id: '1',
    title: 'Complete Q1 Development Tasks',
    description: 'Finish all assigned development tasks for Q1',
    type: 'quarterly',
    status: 'in-progress',
    progress: 75,
    targetDate: '2024-03-31',
    userId: '1',
    createdAt: '2024-01-01'
  },
  {
    _id: '2',
    title: 'Attend 2 Training Sessions',
    description: 'Complete professional development training',
    type: 'monthly',
    status: 'completed',
    progress: 100,
    targetDate: '2024-06-30',
    userId: '1',
    createdAt: '2024-06-01'
  },
  {
    _id: '3',
    title: 'Increase Sales by 20%',
    description: 'Achieve 20% increase in monthly sales',
    type: 'monthly',
    status: 'in-progress',
    progress: 60,
    targetDate: '2024-07-31',
    userId: '3',
    createdAt: '2024-07-01'
  }
];

export const demoTasks = [
  {
    _id: '1',
    title: 'Review Code for New Feature',
    description: 'Review and test the new user authentication feature',
    status: 'pending',
    priority: 'high',
    dueDate: '2024-06-20',
    assignedTo: '1',
    assignedBy: '2',
    createdAt: '2024-06-15'
  },
  {
    _id: '2',
    title: 'Update Documentation',
    description: 'Update API documentation for recent changes',
    status: 'in-progress',
    priority: 'medium',
    dueDate: '2024-06-25',
    assignedTo: '1',
    assignedBy: '4',
    createdAt: '2024-06-10'
  },
  {
    _id: '3',
    title: 'Prepare Sales Report',
    description: 'Prepare monthly sales report for management',
    status: 'completed',
    priority: 'high',
    dueDate: '2024-06-18',
    assignedTo: '3',
    assignedBy: '2',
    createdAt: '2024-06-08'
  }
];

export const demoAttendance = [
  {
    _id: '1',
    userId: '1',
    date: '2024-06-15',
    clockIn: '09:00',
    clockOut: '17:30',
    status: 'present',
    workingHours: 8.5
  },
  {
    _id: '2',
    userId: '1',
    date: '2024-06-14',
    clockIn: '08:45',
    clockOut: '17:15',
    status: 'present',
    workingHours: 8.5
  },
  {
    _id: '3',
    userId: '2',
    date: '2024-06-15',
    clockIn: '09:15',
    clockOut: '18:00',
    status: 'present',
    workingHours: 8.75
  },
  {
    _id: '4',
    userId: '3',
    date: '2024-06-15',
    status: 'absent',
    workingHours: 0
  }
];

export const demoNotifications = [
  {
    _id: '1',
    userId: '1',
    title: 'New Task Assigned',
    message: 'You have been assigned a new task: Review Code for New Feature',
    type: 'task',
    read: false,
    createdAt: '2024-06-15T10:00:00Z'
  },
  {
    _id: '2',
    userId: '1',
    title: 'Goal Progress Update',
    message: 'Your Q1 Development Tasks goal is 75% complete',
    type: 'goal',
    read: true,
    createdAt: '2024-06-14T15:30:00Z'
  },
  {
    _id: '3',
    userId: '2',
    title: 'Team Meeting',
    message: 'Weekly team meeting scheduled for tomorrow at 2 PM',
    type: 'meeting',
    read: false,
    createdAt: '2024-06-15T09:00:00Z'
  }
];

export const demoOccasions = [
  {
    _id: '1',
    title: 'Company Anniversary',
    description: 'Celebrating 10 years of excellence',
    date: '2024-07-01',
    type: 'celebration',
    isPublic: true
  },
  {
    _id: '2',
    title: 'John Smith Birthday',
    description: 'Happy Birthday to John!',
    date: '2024-06-25',
    type: 'birthday',
    isPublic: true
  },
  {
    _id: '3',
    title: 'Team Building Event',
    description: 'Annual team building activities',
    date: '2024-08-15',
    type: 'event',
    isPublic: true
  }
];

export const demoLeaveRequests = [
  {
    _id: '1',
    userId: '1',
    startDate: '2024-07-01',
    endDate: '2024-07-05',
    reason: 'Vacation',
    status: 'pending',
    type: 'vacation',
    requestedAt: '2024-06-15T10:00:00Z'
  },
  {
    _id: '2',
    userId: '3',
    startDate: '2024-06-20',
    endDate: '2024-06-20',
    reason: 'Medical appointment',
    status: 'approved',
    type: 'sick',
    requestedAt: '2024-06-10T14:30:00Z'
  }
];

// Current logged in user (demo)
export const currentUser = demoUsers[0]; // John Smith as the logged in user
