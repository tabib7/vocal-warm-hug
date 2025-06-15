
import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import MainLayout from '../components/layout/MainLayout';
import { useAuth } from '../components/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'; // Import Select components
import { Plus, Italic, Link, Trash2, CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Skeleton } from '../components/ui/skeleton'; // Import Skeleton

// API base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

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

const Goals = () => {
  const { currentUser, hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [createGoalOpen, setCreateGoalOpen] = useState(false);
  const [updateGoalOpen, setUpdateGoalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [currentGoal, setCurrentGoal] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState('all'); // Change to 'all' for initial state
  const [goals, setGoals] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState(null);
  
  // Effect to handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  // Fetch goals
  useEffect(() => {
    const fetchGoals = async () => {
      try {
        let url = `${API_BASE_URL}/api/goals`;
        
        if (selectedEmployee !== 'all' && hasRole(['admin', 'manager'])) {
          url = `${API_BASE_URL}/api/goals/employee/${selectedEmployee}`;
        } else if (!hasRole(['admin', 'manager']) && currentUser) {
          url = `${API_BASE_URL}/api/goals/employee/${currentUser._id}`;
        }
        
        const response = await axios.get(url);
        setGoals(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching goals:', error);
        toast.error('Failed to fetch goals');
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchGoals();
    }
  }, [currentUser, hasRole, selectedEmployee]);

  // Handle form submission for creating a goal
  const handleCreateGoal = async (newGoalData) => {
    if (!currentUser) {
      toast.error('You must be logged in to create a goal.');
      return;
    }
    
    const goalToCreate = {
      ...newGoalData,
      employeeId: selectedEmployee !== 'all' && hasRole(['admin', 'manager']) ? selectedEmployee : currentUser._id
    };
    
    try {
      const response = await axios.post(`${API_BASE_URL}/api/goals`, goalToCreate);
      
      // Update goals state
      setGoals([response.data, ...goals]);
      
      toast.success('Goal created successfully');
      // setCreateGoalOpen(false); // This is now handled by CreateGoalForm
    } catch (error) {
      console.error('Error creating goal:', error);
      toast.error('Failed to create goal');
    }
  };

  // Handle form submission for updating a goal
  const handleUpdateGoal = async (e) => {
    e.preventDefault();
    
    if (!currentGoal) return;
    
    const updateFormData = new FormData(e.target);
    const updateTitle = updateFormData.get('title');
    const updateDescription = updateFormData.get('description');
    const updateType = updateFormData.get('type');
    const updatePriority = updateFormData.get('priority');
    const updateDeadline = updateFormData.get('deadline');
    const updateProgress = parseInt(updateFormData.get('progress'));
    
    // Determine status based on progress
    let status = currentGoal.status;
    if (updateProgress === 100) {
      status = 'completed';
    } else if (updateProgress > 0) {
      status = 'in-progress';
    } else if (updateProgress === 0) {
      status = 'not-started';
    }
    
    const updatedGoal = {
      title: updateTitle,
      description: updateDescription,
      type: updateType,
      priority: updatePriority,
      deadline: updateDeadline,
      progress: updateProgress,
      status
    };
    
    try {
      const response = await axios.put(`${API_BASE_URL}/api/goals/${currentGoal._id}`, updatedGoal);
      
      // Update goals state
      setGoals(goals.map(goal => goal._id === currentGoal._id ? response.data : goal));
      
      toast.success('Goal updated successfully');
      setUpdateGoalOpen(false);
    } catch (error) {
      console.error('Error updating goal:', error);
      toast.error('Failed to update goal');
    }
  };

  // Function to open the update goal dialog/sheet
  const openUpdateGoal = (goal) => {
    setCurrentGoal(goal);
    // setDescriptionText(goal.description); // This state is no longer in Goals
    setUpdateGoalOpen(true);
  };

  // Function to handle goal deletion
  const openDeleteDialog = (goal) => {
    setGoalToDelete(goal);
    setDeleteDialogOpen(true);
  };

  const handleDeleteGoal = async () => {
    if (!goalToDelete) return;
    
    try {
      await axios.delete(`${API_BASE_URL}/api/goals/${goalToDelete._id}`);
      
      // Update goals state
      setGoals(goals.filter(goal => goal._id !== goalToDelete._id));
      
      toast.success('Goal deleted successfully');
      setDeleteDialogOpen(false);
      setGoalToDelete(null);
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast.error('Failed to delete goal');
    }
  };
  
  // Filter goals based on active tab
  const filteredGoals = goals.filter(goal => {
    if (activeTab === 'all') return true;
    if (activeTab === 'monthly') return goal.type === 'monthly';
    if (activeTab === 'weekly') return goal.type === 'weekly';
    if (activeTab === 'daily') return goal.type === 'daily';
    if (activeTab === 'completed') return goal.status === 'completed';
    if (activeTab === 'inProgress') return goal.status === 'in-progress';
    return true;
  });

  // Calculate progress summary
  const calculateProgressSummary = () => {
    const summary = {
      monthly: { total: 0, completed: 0 },
      weekly: { total: 0, completed: 0 },
      daily: { total: 0, completed: 0 },
      overall: { total: 0, completed: 0, progress: 0 }
    };
    
    goals.forEach(goal => {
      const type = goal.type;
      if (type) {
        summary[type].total += 1;
        summary.overall.total += 1;
        
        if (goal.status === 'completed') {
          summary[type].completed += 1;
          summary.overall.completed += 1;
        }
      }
      });
      
      // Calculate percentages
      summary.overall.progress = summary.overall.total > 0
      ? Math.round((summary.overall.completed / summary.overall.total) * 100)
      : 0;
      
      return summary;
    };
    
    const progressSummary = calculateProgressSummary();
    
    // Create Goal Form
    const CreateGoalForm = ({ onCreateGoalSubmit, setCreateGoalOpen }) => {
      const [descriptionText, setDescriptionText] = useState('');
      const [isItalic, setIsItalic] = useState(false);
      const [showLinkInput, setShowLinkInput] = useState(false);
      const [linkUrl, setLinkUrl] = useState('');
      const [selectionStart, setSelectionStart] = useState(0);
      const [selectionEnd, setSelectionEnd] = useState(0);
      const [deadline, setDeadline] = useState(''); // Add deadline state
      const textareaRef = useRef(null);
    
      const handleTextareaSelect = () => {
        if (textareaRef.current) {
          setSelectionStart(textareaRef.current.selectionStart);
          setSelectionEnd(textareaRef.current.selectionEnd);
        }
      };
    
      const insertLink = () => {
        if (!linkUrl) return;
        
        const beforeText = descriptionText.substring(0, selectionStart);
        const selectedText = descriptionText.substring(selectionStart, selectionEnd);
        const afterText = descriptionText.substring(selectionEnd);
        
        const textToInsert = selectedText.length > 0 
          ? `[${selectedText}](${linkUrl})` 
          : linkUrl;
          
        const newText = beforeText + textToInsert + afterText;
        setDescriptionText(newText);
        setLinkUrl('');
        setShowLinkInput(false);
        
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.focus();
          }
        }, 0);
      };
    
      const handleSubmit = (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const title = formData.get('title');
        const type = formData.get('type');
        const priority = formData.get('priority');
        const progress = formData.get('progress');
        
        const newGoal = {
          title,
          description: descriptionText,
          type,
          priority,
          deadline, // Use the state variable here
          progress: parseInt(progress),
          status: progress > 0 ? 'in-progress' : 'not-started',
        };
        
        onCreateGoalSubmit(newGoal);
        setCreateGoalOpen(false);
        setDescriptionText('');
      };
    
      return (
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div>
            <label className="form-label">Goal Title</label>
            <input name="title" type="text" className="form-input" placeholder="E.g., Complete project documentation" required />
          </div>
    
          <div>
            <label className="form-label">Description</label>
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
                    className="form-input text-sm"
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
              <textarea
                ref={textareaRef}
                name="description"
                className={`form-input min-h-[100px] border-none ${isItalic ? 'italic' : ''}`}
                placeholder="Describe your goal..."
                value={descriptionText}
                onChange={(e) => setDescriptionText(e.target.value)}
                onSelect={handleTextareaSelect}
                onMouseUp={handleTextareaSelect}
                onKeyUp={handleTextareaSelect}
                required
              ></textarea>
            </div>
          </div>
    
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Type</label>
              <select name="type" className="form-input" required>
                <option value="">Select a type</option>
                <option value="daily">Today</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
    
            <div>
              <label className="form-label">Priority</label>
              <select name="priority" className="form-input" required>
                <option value="">Select priority</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
    
            <div>
              <label className="form-label">Deadline</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !deadline && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {deadline ? format(new Date(deadline), "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={deadline ? new Date(deadline) : undefined}
                    onSelect={(date) => setDeadline(date ? date.toISOString().split('T')[0] : '')} // Update state
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
    
            <div>
              <label className="form-label">Initial Progress (%)</label>
              <input name="progress" type="number" min="0" max="100" className="form-input" defaultValue="0" required />
            </div>
          </div>
    
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCreateGoalOpen(false)}>Cancel</Button>
            <Button type="submit">Create Goal</Button>
          </DialogFooter>
        </form>
      );
    };
    
    // Update Goal Form
    const UpdateGoalForm = () => {
      if (!currentGoal) return null;
      const updateTextareaRef = useRef(null);
      const [updateDescription, setUpdateDescription] = useState(currentGoal.description);
      const [updateSelectionStart, setUpdateSelectionStart] = useState(0);
      const [updateSelectionEnd, setUpdateSelectionEnd] = useState(0);
      const [updateIsItalic, setUpdateIsItalic] = useState(false);
      const [updateShowLinkInput, setUpdateShowLinkInput] = useState(false);
      const [updateLinkUrl, setUpdateLinkUrl] = useState('');
    
      const handleUpdateTextareaSelect = () => {
        if (updateTextareaRef.current) {
          setUpdateSelectionStart(updateTextareaRef.current.selectionStart);
          setUpdateSelectionEnd(updateTextareaRef.current.selectionEnd);
        }
      };
    
      const insertUpdateLink = () => {
        if (!updateLinkUrl) return;
        
        const beforeText = updateDescription.substring(0, updateSelectionStart);
        const selectedText = updateDescription.substring(updateSelectionStart, updateSelectionEnd);
        const afterText = updateDescription.substring(updateSelectionEnd);
        
        const textToInsert = selectedText.length > 0 
          ? `[${selectedText}](${updateLinkUrl})` 
          : updateLinkUrl;
          
        const newText = beforeText + textToInsert + afterText;
        setUpdateDescription(newText);
        setUpdateLinkUrl('');
        setUpdateShowLinkInput(false);
        
        setTimeout(() => {
          if (updateTextareaRef.current) {
            updateTextareaRef.current.focus();
          }
        }, 0);
      };
      
      return (
        <form onSubmit={handleUpdateGoal} className="space-y-4 pt-4">
          <div>
            <label className="form-label">Goal Title</label>
            <input 
              name="title"
              type="text" 
              className="form-input" 
              defaultValue={currentGoal.title} 
              required 
            />
          </div>
    
          <div>
            <label className="form-label">Description</label>
            <div className="border border-gray-200 rounded-md">
              <div className="flex items-center border-b border-gray-200 p-2">
                <button
                  type="button"
                  onClick={() => setUpdateIsItalic(!updateIsItalic)}
                  className={`p-1 rounded ${updateIsItalic ? 'bg-gray-200' : ''}`}
                >
                  <Italic className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setUpdateShowLinkInput(!updateShowLinkInput)}
                  className={`p-1 rounded ml-2 ${updateShowLinkInput ? 'bg-gray-200' : ''}`}
                >
                  <Link className="h-4 w-4" />
                </button>
              </div>
              {updateShowLinkInput && (
                <div className="p-2 border-b border-gray-200">
                  <input
                    type="url"
                    placeholder="Enter URL"
                    className="form-input text-sm"
                    value={updateLinkUrl}
                    onChange={(e) => setUpdateLinkUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        insertUpdateLink();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={insertUpdateLink}
                    className="ml-2 text-xs bg-blue-500 text-white px-2 py-1 rounded"
                  >
                    Insert
                  </button>
                </div>
              )}
              <textarea
                ref={updateTextareaRef}
                name="description"
                className={`form-input min-h-[100px] border-none ${updateIsItalic ? 'italic' : ''}`}
                value={updateDescription}
                onChange={(e) => setUpdateDescription(e.target.value)}
                onSelect={handleUpdateTextareaSelect}
                onMouseUp={handleUpdateTextareaSelect}
                onKeyUp={handleUpdateTextareaSelect}
                required
              ></textarea>
            </div>
          </div>
    
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Type</label>
              <select name="type" className="form-input" defaultValue={currentGoal.type} required>
                <option value="daily">Today</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
    
            <div>
              <label className="form-label">Priority</label>
              <select name="priority" className="form-input" defaultValue={currentGoal.priority} required>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
    
            <div>
              <label className="form-label">Deadline</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !currentGoal.deadline && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {currentGoal.deadline ? format(new Date(currentGoal.deadline), "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={currentGoal.deadline ? new Date(currentGoal.deadline) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        const formattedDate = date.toISOString().split('T')[0];
                        // Update the currentGoal state with the new deadline
                        setCurrentGoal(prevGoal => ({
                          ...prevGoal,
                          deadline: formattedDate
                        }));
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
    
            <div>
              <label className="form-label">Progress (%)</label>
              <input 
                name="progress"
                type="number" 
                min="0" 
                max="100" 
                className="form-input" 
                defaultValue={currentGoal.progress} 
                required 
              />
            </div>
          </div>
    
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setUpdateGoalOpen(false)}>Cancel</Button>
            <Button type="submit">Update Goal</Button>
          </DialogFooter>
        </form>
      );
    };

  return (
    <MainLayout>
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Goals Management</h1>
            <p className="text-gray-600">Track, manage and update your goals</p>
          </div>
          
          <div className="flex gap-2">
            {/* Employee Goals Selector for Admin/Manager */}
            {hasRole(['admin', 'manager']) && (
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select Employee" />
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
            )}
            
            <Button 
              onClick={() => setCreateGoalOpen(true)} 
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create New Goal
            </Button>
          </div>
        </div>
        
        {/* Filter Tabs */}
        <div className="border-b border-gray-200 mt-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('all')}
              className={`py-4 px-1 text-center border-b-2 font-medium text-sm ${activeTab === 'all' 
                ? 'border-ems-primary text-ems-primary' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              All Goals
            </button>
            <button
              onClick={() => setActiveTab('monthly')}
              className={`py-4 px-1 text-center border-b-2 font-medium text-sm ${activeTab === 'monthly' 
                ? 'border-ems-primary text-ems-primary' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setActiveTab('weekly')}
              className={`py-4 px-1 text-center border-b-2 font-medium text-sm ${activeTab === 'weekly' 
                ? 'border-ems-primary text-ems-primary' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              Weekly
            </button>
            <button
              onClick={() => setActiveTab('daily')}
              className={`py-4 px-1 text-center border-b-2 font-medium text-sm ${activeTab === 'daily' 
                ? 'border-ems-primary text-ems-primary' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              Today
            </button>
            <button
              onClick={() => setActiveTab('inProgress')}
              className={`py-4 px-1 text-center border-b-2 font-medium text-sm ${activeTab === 'inProgress' 
                ? 'border-ems-primary text-ems-primary' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              In Progress
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`py-4 px-1 text-center border-b-2 font-medium text-sm ${activeTab === 'completed' 
                ? 'border-ems-primary text-ems-primary' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              Completed
            </button>
          </nav>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Goal Cards */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="card border border-gray-200">
                  <div className="flex justify-between">
                    <Skeleton className="h-5 w-20 rounded-full" />
                    <Skeleton className="h-5 w-24 rounded-full" />
                  </div>
                  <Skeleton className="h-6 w-3/4 mt-2" />
                  <Skeleton className="h-4 w-1/2 mt-1" />
                  <Skeleton className="h-16 w-full mt-2" />
                  <div className="mt-4">
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-2 w-full rounded-full" />
                  </div>
                  <div className="mt-4 flex justify-between items-center">
                    <Skeleton className="h-4 w-32" />
                    <div className="flex space-x-2">
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredGoals.length > 0 ? (
                filteredGoals.map(goal => (
                  <div key={goal._id} className="card border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex justify-between">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        goal.type === 'monthly' ? 'bg-purple-100 text-purple-800' : 
                        goal.type === 'weekly' ? 'bg-blue-100 text-blue-800' : 
                        'bg-green-100 text-green-800'
                      }`}>
                        {goal.type === 'daily' ? 'Today' : goal.type.charAt(0).toUpperCase() + goal.type.slice(1)}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        goal.priority === 'high' ? 'bg-red-100 text-red-800' : 
                        goal.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-green-100 text-green-800'
                      }`}>
                        {goal.priority.charAt(0).toUpperCase() + goal.priority.slice(1)} Priority
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-semibold mt-2">{goal.title}</h3>
                    
                    {/* Display employee name when viewing all employees' goals or a specific employee's goals as admin/manager */}
                    {(hasRole(['admin', 'manager']) && selectedEmployee === 'all') && (
                      <div className="text-sm text-gray-600 mt-1">
                        <span className="font-medium">Employee:</span> {goal.employeeName}
                      </div>
                    )}
                    
                    <div className="text-gray-600 text-sm mt-2">
                      {formatDescription(goal.description)}
                    </div>
                    
                    <div className="mt-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>{goal.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            goal.status === 'completed' ? 'bg-green-500' :
                            goal.progress < 25 ? 'bg-red-500' : 
                            goal.progress < 75 ? 'bg-yellow-500' : 
                            'bg-blue-500'
                          }`}
                          style={{ width: `${goal.progress}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex justify-between items-center text-sm">
                      <div className="text-gray-600">
                        Deadline: <span className="font-medium">{new Date(goal.deadline).toLocaleDateString()}</span>
                      </div>
                      <div className="flex space-x-2">
                        <button 
                          className="text-ems-accent hover:underline"
                          onClick={() => openUpdateGoal(goal)}
                        >
                          Update
                        </button>
                        <button 
                          className="text-red-600 hover:underline flex items-center"
                          onClick={() => openDeleteDialog(goal)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    
                    {goal.status === 'completed' && (
                      <div className="mt-2 flex items-center text-green-600 text-xs">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Completed on {goal.completedAt ? new Date(goal.completedAt).toLocaleDateString() : 'Unknown'}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center p-8 border border-dashed border-gray-300 rounded-lg bg-gray-50">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-gray-600 mb-2">No goals found in this category</p>
                  <button 
                    onClick={() => {
                      setCreateGoalOpen(true);
                    }}
                    className="btn-primary text-sm"
                  >
                    Create Your First Goal
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Goal Progress Summary */}
          <div className="card border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Your Goal Progress</h3>
            
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Monthly Goals</span>
                    <span className="font-medium">
                      {progressSummary.monthly.completed}/{progressSummary.monthly.total}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 bg-purple-500 rounded-full" 
                      style={{ 
                        width: `${progressSummary.monthly.total > 0 ? 
                          (progressSummary.monthly.completed / progressSummary.monthly.total) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Weekly Goals</span>
                    <span className="font-medium">
                      {progressSummary.weekly.completed}/{progressSummary.weekly.total}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 bg-blue-500 rounded-full" 
                      style={{ 
                        width: `${progressSummary.weekly.total > 0 ? 
                          (progressSummary.weekly.completed / progressSummary.weekly.total) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Today's Tasks</span>
                    <span className="font-medium">
                      {progressSummary.daily.completed}/{progressSummary.daily.total}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 bg-green-500 rounded-full" 
                      style={{ 
                        width: `${progressSummary.daily.total > 0 ? 
                          (progressSummary.daily.completed / progressSummary.daily.total) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-semibold mb-2">Overall Progress</h4>
              {loading ? (
                <Skeleton className="h-4 w-full" />
              ) : (
                <div className="flex items-center">
                  <div className="w-full bg-gray-200 rounded-full h-4 mr-2">
                    <div 
                      className="h-4 bg-ems-primary rounded-full" 
                      style={{ width: `${progressSummary.overall.progress}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{progressSummary.overall.progress}%</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Goal Dialog/Sheet (responsive) */}
      {/* Create Goal Dialog/Sheet (responsive) */}
      {isMobile ? (
        <Sheet open={createGoalOpen} onOpenChange={setCreateGoalOpen}>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Create New Goal</SheetTitle>
            </SheetHeader>
            <DialogDescription className="sr-only">
              Form to create a new goal with title, description, type, priority, deadline, and initial progress.
            </DialogDescription>
            <CreateGoalForm onCreateGoalSubmit={handleCreateGoal} setCreateGoalOpen={setCreateGoalOpen} />
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={createGoalOpen} onOpenChange={setCreateGoalOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Goal</DialogTitle>
            </DialogHeader>
            <DialogDescription className="sr-only">
              Form to create a new goal with title, description, type, priority, deadline, and initial progress.
            </DialogDescription>
            <CreateGoalForm onCreateGoalSubmit={handleCreateGoal} setCreateGoalOpen={setCreateGoalOpen} />
          </DialogContent>
        </Dialog>
      )}

      {/* Update Goal Dialog/Sheet (responsive) */}
      {isMobile ? (
        <Sheet open={updateGoalOpen} onOpenChange={setUpdateGoalOpen}>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Update Goal</SheetTitle>
            </SheetHeader>
            <DialogDescription className="sr-only">
              Form to update an existing goal with title, description, type, priority, deadline, and progress.
            </DialogDescription>
            <UpdateGoalForm />
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={updateGoalOpen} onOpenChange={setUpdateGoalOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Update Goal</DialogTitle>
            </DialogHeader>
            <DialogDescription className="sr-only">
              Form to update an existing goal with title, description, type, priority, deadline, and progress.
            </DialogDescription>
            <UpdateGoalForm />
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this goal?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the goal.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteGoal} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
};

export default Goals;
