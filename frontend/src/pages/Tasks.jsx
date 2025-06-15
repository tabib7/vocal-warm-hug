import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import MainLayout from '../components/layout/MainLayout';
import { useAuth } from '../components/auth/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../components/ui/dialog';
import { Plus, CheckCircle, Clock, AlertCircle, User, Calendar, Target, Search, Italic, Link, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Skeleton } from '../components/ui/skeleton'; // Import Skeleton

// API base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const Tasks = () => {
  const { currentUser, hasRole } = useAuth();
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [showAddTask, setShowAddTask] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [descriptionText, setDescriptionText] = useState('');
  const [isItalic, setIsItalic] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [selectionStart, setSelectionStart] = useState(0);
  const [selectionEnd, setSelectionEnd] = useState(0);
  const [newTask, setNewTask] = useState({
    title: '',
    description: ''
  });
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const textareaRef = useRef(null);

  // Fetch employees
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/employees`);
        setEmployees(response.data);
      } catch (error) {
        console.error('Error fetching employees:', error);
        toast.error('Failed to fetch employees');
      }
    };

    if (hasRole(['admin', 'manager'])) {
      fetchEmployees();
    }
  }, [hasRole]);

  // Fetch tasks
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        let url = `${API_BASE_URL}/api/tasks`;
        
        if (selectedEmployee !== 'all' && hasRole(['admin', 'manager'])) {
          url = `${API_BASE_URL}/api/tasks/employee/${selectedEmployee}`;
        } else if (!hasRole(['admin', 'manager']) && currentUser) {
          url = `${API_BASE_URL}/api/tasks/employee/${currentUser._id}`;
        }
        
        const response = await axios.get(url);
        setTasks(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching tasks:', error);
        toast.error('Failed to fetch tasks');
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchTasks();
    }
  }, [currentUser, hasRole, selectedEmployee]);

  // Function to handle text selection in textarea
  const handleTextareaSelect = () => {
    if (textareaRef.current) {
      setSelectionStart(textareaRef.current.selectionStart);
      setSelectionEnd(textareaRef.current.selectionEnd);
    }
  };

  // Function to insert link at selected text
  const insertLink = () => {
    if (!linkUrl) return;
    
    const beforeText = descriptionText.substring(0, selectionStart);
    const selectedText = descriptionText.substring(selectionStart, selectionEnd);
    const afterText = descriptionText.substring(selectionEnd);
    
    // If text is selected, make it a link, otherwise just insert the URL
    const textToInsert = selectedText.length > 0 
      ? `[${selectedText}](${linkUrl})` 
      : linkUrl;
      
    const newText = beforeText + textToInsert + afterText;
    setDescriptionText(newText);
    setLinkUrl('');
    setShowLinkInput(false);
    
    // Focus back on textarea after link insertion
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 0);
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) {
      toast.error('Task title cannot be empty.');
      return;
    }

    if (!currentUser) {
      toast.error('You must be logged in to create a task.');
      return;
    }

    const taskToCreate = {
      title: newTask.title,
      description: descriptionText,
      employeeId: selectedEmployee !== 'all' && hasRole(['admin', 'manager']) ? selectedEmployee : currentUser._id
    };

    try {
      const response = await axios.post(`${API_BASE_URL}/api/tasks`, taskToCreate);
      setTasks([response.data, ...tasks]);
      setNewTask({
        title: '',
        description: ''
      });
      setDescriptionText('');
      setShowAddTask(false);
      toast.success('Task created successfully!');
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task.');
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/api/tasks/${taskId}`, { status: newStatus });
      setTasks(tasks.map(task => 
        task._id === taskId ? response.data : task
      ));
      toast.success('Task status updated successfully!');
    } catch (error) {
      console.error('Error updating task status:', error);
      toast.error('Failed to update task status.');
    }
  };

  const openDeleteDialog = (task) => {
    setTaskToDelete(task);
    setDeleteDialogOpen(true);
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;
    
    try {
      await axios.delete(`${API_BASE_URL}/api/tasks/${taskToDelete._id}`);
      setTasks(tasks.filter(task => task._id !== taskToDelete._id));
      toast.success('Task deleted successfully!');
      setDeleteDialogOpen(false);
      setTaskToDelete(null);
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task.');
    }
  };

  // Filter tasks based on search, employee, and status
  const filteredTasks = tasks.filter(task => {
    const matchesEmployee = selectedEmployee === 'all' || task.employeeId === selectedEmployee;
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    
    return matchesEmployee && matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in-progress': return <Clock className="h-4 w-4 text-blue-600" />;
      case 'pending': return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get task counts for overview
  const taskCounts = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    completed: tasks.filter(t => t.status === 'completed').length
  };

  // Helper function for parsing markdown-style links in descriptions
  const formatDescription = (description) => {
    if (!description) return '';
    
    // Regular expression to match [text](url) format
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let formattedText = description;
    
    // Replace markdown links with anchor tags
    formattedText = formattedText.replace(linkRegex, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">$1</a>');
    
    return <div dangerouslySetInnerHTML={{ __html: formattedText }} />;
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Daily Tasks</h1>
            <p className="text-gray-600 mt-1">Manage and track team productivity</p>
          </div>
          <Button 
            onClick={() => setShowAddTask(true)} 
            className="bg-ems-primary hover:bg-ems-primary/90 shadow-md"
            size="lg"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add New Task
          </Button>
        </div>

        {/* Overview Stats - Dashboard Style */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                <p className="text-3xl font-bold text-gray-900">{taskCounts.total}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-3xl font-bold text-gray-900">{taskCounts.pending}</p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-3xl font-bold text-gray-900">{taskCounts.inProgress}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-3xl font-bold text-gray-900">{taskCounts.completed}</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center text-lg">
              <Search className="h-5 w-5 mr-2" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Search Tasks</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by title or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Employee</label>
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Employees</SelectItem>
                    {employees.map(employee => (
                      <SelectItem key={employee._id} value={employee._id}>
                        {employee.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tasks Grid - Like Goals Page */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loading ? (
            <>
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="border border-gray-200">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center space-x-3">
                        <Skeleton className="h-4 w-4 rounded-full" />
                        <Skeleton className="h-6 w-48" />
                      </div>
                      <Skeleton className="h-6 w-24 rounded-full" />
                    </div>
                    <Skeleton className="h-16 w-full mb-4" />
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-sm text-gray-500 mb-4">
                      <div className="flex items-center">
                        <Skeleton className="h-4 w-4 mr-2 rounded-full" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <div className="flex items-center">
                        <Skeleton className="h-4 w-4 mr-2 rounded-full" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Skeleton className="h-9 w-28" />
                      <Skeleton className="h-9 w-24" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          ) : filteredTasks.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center p-8 border border-dashed border-gray-300 rounded-lg bg-gray-50">
              <Target className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg">No tasks found</p>
              <p className="text-gray-400 text-sm mt-1">
                {searchTerm || statusFilter !== 'all' || selectedEmployee !== 'all' 
                  ? 'Try adjusting your filters' 
                  : 'Start by adding your first task'}
              </p>
            </div>
          ) : (
            filteredTasks.map(task => (
              <Card key={task._id} className="border border-gray-200">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(task.status)}
                      <h3 className="font-semibold text-lg text-gray-900">{task.title}</h3>
                    </div>
                    <Badge className={`${getStatusColor(task.status)} border font-medium`}>
                      {task.status.replace('-', ' ')}
                    </Badge>
                  </div>
                  
                  <div className="text-gray-600 mb-4 leading-relaxed">
                    {formatDescription(task.description)}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-sm text-gray-500 mb-4">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      <span className="font-medium">{task.employeeName}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>Created: {new Date(task.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  {task.employeeId === currentUser._id && task.status !== 'completed' && (
                    <div className="flex flex-col sm:flex-row gap-2">
                      {task.status === 'pending' && (
                        <Button 
                          size="sm" 
                          onClick={() => updateTaskStatus(task._id, 'in-progress')}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Clock className="h-4 w-4 mr-2" />
                          Start Task
                        </Button>
                      )}
                      {task.status === 'in-progress' && (
                        <Button 
                          size="sm" 
                          onClick={() => updateTaskStatus(task._id, 'completed')}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Complete
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => openDeleteDialog(task)}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  )}
                  {task.employeeId === currentUser._id && task.status === 'completed' && (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => openDeleteDialog(task)}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Add Task Dialog - Like Goals Page */}
      <Dialog open={showAddTask} onOpenChange={setShowAddTask}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Daily Task</DialogTitle>
            <DialogDescription className="sr-only">
              Form to create a new task with title and description.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddTask} className="space-y-4 pt-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Task Title *</label>
              <Input
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                placeholder="Enter a clear and concise task title"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Description</label>
              <div className="border border-gray-200 rounded-md">
                <div className="flex items-center border-b border-gray-200 p-2">
                  <button
                    type="button"
                    onClick={() => setIsItalic(!isItalic)}
                    className={`p-1 rounded ${isItalic ? 'bg-gray-200' : ''}`}
                  >
                    <Italic className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowLinkInput(!showLinkInput)}
                    className={`p-1 rounded ml-2 ${showLinkInput ? 'bg-gray-200' : ''}`}
                  >
                    <Link className="h-4 w-4" />
                  </button>
                </div>
                {showLinkInput && (
                  <div className="p-2 border-b border-gray-200">
                    <input
                      type="url"
                      placeholder="Enter URL"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          insertLink();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={insertLink}
                      className="ml-2 text-xs bg-blue-500 text-white px-2 py-1 rounded"
                    >
                      Insert
                    </button>
                  </div>
                )}
                <Textarea
                  ref={textareaRef}
                  className={`min-h-[100px] border-none ${isItalic ? 'italic' : ''}`}
                  placeholder="Describe your task..."
                  value={descriptionText}
                  onChange={(e) => setDescriptionText(e.target.value)}
                  onSelect={handleTextareaSelect}
                  onMouseUp={handleTextareaSelect}
                  onKeyUp={handleTextareaSelect}
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddTask(false)}>Cancel</Button>
              <Button type="submit">Add Task</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this task?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the task.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTask} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
};

export default Tasks;
