
import React, { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import axios from 'axios';
import { useAuth } from '../components/auth/AuthContext';
import { Calendar } from "../components/ui/calendar";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Calendar as CalendarIcon, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Skeleton } from '../components/ui/skeleton'; // Import Skeleton

// Use environment variable for API base URL with fallback
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ? 
  `${import.meta.env.VITE_API_BASE_URL}/api` : 
  'http://localhost:5000/api';

// Configure axios defaults
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const Occasions = () => {
  const { hasRole, currentUser } = useAuth();
  const isAdmin = hasRole('admin');
  
  const [occasions, setOccasions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [newOccasionForm, setNewOccasionForm] = useState({
    name: "",
    startDate: "",
    endDate: "",
    isShortOccasion: false,
    shortOccasionStartTime: ""
  });
  
  // Fetch occasions on component mount
  useEffect(() => {
    const fetchOccasions = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/occasions`);
        setOccasions(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching occasions:', error);
        toast({
          title: "Failed to fetch occasions",
          description: "There was an error loading company occasions.",
          variant: "destructive"
        });
        setLoading(false);
      }
    };

    fetchOccasions();
  }, []); // Empty dependency array means this effect runs once on mount
  
  const handleDeleteOccasion = async (occasionId) => {
    try {
      await axios.delete(`${API_BASE_URL}/occasions/${occasionId}`);
      setOccasions(occasions.filter(occasion => occasion._id !== occasionId));
      toast({
        title: "Occasion Deleted",
        description: "The occasion has been removed.",
      });
    } catch (error) {
      console.error('Error deleting occasion:', error);
      toast({
        title: "Failed to Delete Occasion",
        description: error.response?.data?.msg || "There was an error deleting the occasion.",
        variant: "destructive",
      });
    }
  };
  
  const handleInputChange = (field, value) => {
    setNewOccasionForm({
      ...newOccasionForm,
      [field]: value
    });
  };
  
  const handleAddOccasion = async () => {
    if (!newOccasionForm.name) {
      toast({
        title: "Missing information",
        description: "Please provide a name for the occasion",
        variant: "destructive"
      });
      return;
    }
    
    if (newOccasionForm.isShortOccasion) {
      if (!newOccasionForm.shortOccasionStartTime) {
        toast({
          title: "Missing information",
          description: "Please provide a start time for the short occasion",
          variant: "destructive"
        });
        return;
      }
    } else {
      if (!newOccasionForm.startDate || !newOccasionForm.endDate) {
        toast({
          title: "Missing information",
          description: "Please provide start and end dates",
          variant: "destructive"
        });
        return;
      }
    }
    
    const occasionData = {
      name: newOccasionForm.name,
      isShortOccasion: newOccasionForm.isShortOccasion, // Include isShortOccasion
      date: newOccasionForm.isShortOccasion ? new Date().toISOString().split('T')[0] : newOccasionForm.startDate, // Use current date for short occasion
      type: newOccasionForm.isShortOccasion ? 'event' : 'holiday', // Assuming short occasions are events, others are holidays
      shortOccasionStartTime: newOccasionForm.isShortOccasion ? newOccasionForm.shortOccasionStartTime : undefined,
      startDate: newOccasionForm.isShortOccasion ? undefined : newOccasionForm.startDate,
      endDate: newOccasionForm.isShortOccasion ? undefined : newOccasionForm.endDate,
      createdBy: currentUser ? currentUser._id : undefined // Include creator ID if available
    };
    
    try {
      const response = await axios.post(`${API_BASE_URL}/occasions`, occasionData);
      setOccasions([...occasions, response.data]);
      
      // Reset form
      setNewOccasionForm({
        name: "",
        startDate: "",
        endDate: "",
        isShortOccasion: false,
        shortOccasionStartTime: ""
      });
      
      toast({
        title: "Occasion Added",
        description: `${response.data.name} has been added successfully.`,
      });
    } catch (error) {
      console.error('Error adding occasion:', error);
      toast({
        title: "Failed to Add Occasion",
        description: error.response?.data?.msg || "There was an error adding the occasion.",
        variant: "destructive",
      });
    }
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Company Occasions</h1>
        <p className="text-gray-600">View upcoming company events and occasions</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Occasions</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="border rounded-lg p-4 bg-white shadow-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <Skeleton className="h-6 w-48 mb-2" />
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-4 w-40 mt-1" />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Skeleton className="h-5 w-5 rounded-full" />
                          <Skeleton className="h-8 w-8 rounded-full" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : occasions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No occasions scheduled at this time.
                </div>
              ) : (
                <div className="space-y-4">
                  {occasions.map((occasion) => (
                    <div key={occasion._id} className="border rounded-lg p-4 bg-white shadow-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg">{occasion.name}</h3>
                          {occasion.isShortOccasion ? (
                            <div className="mt-2 text-sm text-gray-600">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                                Short Occasion
                              </span>
                              <p className="mt-1">Office starts at: {occasion.shortOccasionStartTime}</p>
                            </div>
                          ) : (
                            <div className="mt-2 text-sm text-gray-600">
                              <p>From: {formatDate(occasion.startDate)}</p>
                              <p>To: {formatDate(occasion.endDate)}</p>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <CalendarIcon className="h-5 w-5 text-gray-400" />
                          {(isAdmin || hasRole('manager')) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteOccasion(occasion._id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {isAdmin && (
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Add New Occasion</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Occasion Name</label>
                    <Input
                      type="text"
                      value={newOccasionForm.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="e.g. Company Holiday"
                    />
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      id="shortOccasion"
                      type="checkbox"
                      className="h-4 w-4 text-ems-primary focus:ring-ems-primary border-gray-300 rounded"
                      checked={newOccasionForm.isShortOccasion}
                      onChange={(e) => handleInputChange('isShortOccasion', e.target.checked)}
                    />
                    <label htmlFor="shortOccasion" className="ml-2 block text-sm text-gray-900">
                      Short Occasion (Single day with special time)
                    </label>
                  </div>

                  {newOccasionForm.isShortOccasion ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Office Start Time</label>
                      <Input
                        type="time"
                        value={newOccasionForm.shortOccasionStartTime}
                        onChange={(e) => handleInputChange('shortOccasionStartTime', e.target.value)}
                      />
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !newOccasionForm.startDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {newOccasionForm.startDate ? format(new Date(newOccasionForm.startDate), "PPP") : <span>Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={newOccasionForm.startDate ? new Date(newOccasionForm.startDate) : undefined}
                              onSelect={(date) => handleInputChange('startDate', date ? date.toISOString().split('T')[0] : '')}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !newOccasionForm.endDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {newOccasionForm.endDate ? format(new Date(newOccasionForm.endDate), "PPP") : <span>Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={newOccasionForm.endDate ? new Date(newOccasionForm.endDate) : undefined}
                              onSelect={(date) => handleInputChange('endDate', date ? date.toISOString().split('T')[0] : '')}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </>
                  )}
                  
                  <Button
                    className="w-full bg-ems-primary hover:bg-ems-primary/90"
                    onClick={handleAddOccasion}
                  >
                    Add Occasion
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Occasions;
