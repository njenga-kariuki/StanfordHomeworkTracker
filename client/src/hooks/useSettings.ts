import { Course, Settings } from "@/lib/constants";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";

export function useSettings() {
  const { toast } = useToast();
  const [driveFolderPath, setDriveFolderPath] = useState<string>('GSB/Course Summaries');
  const [fileNameFormat, setFileNameFormat] = useState<string>('[Course] - [Date] Summary');
  
  // Fetch settings
  const { 
    data: settings, 
    isLoading: loadingSettings,
    refetch: refetchSettings
  } = useQuery<Settings>({
    queryKey: ['/api/settings'],
    onSuccess: (data) => {
      setDriveFolderPath(data.driveFolderPath);
      setFileNameFormat(data.fileNameFormat);
    }
  });
  
  // Fetch courses
  const { 
    data: courses, 
    isLoading: loadingCourses,
    refetch: refetchCourses
  } = useQuery<Course[]>({
    queryKey: ['/api/canvas/courses'],
  });
  
  // Update settings mutation
  const { mutate: updateSettings, isPending: updatingSettings } = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/settings', {
        driveFolderPath,
        fileNameFormat
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      toast({
        title: "Settings Updated",
        description: "Your settings have been saved"
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update settings",
        variant: "destructive"
      });
    }
  });
  
  // Update courses mutation
  const { mutate: updateCourses, isPending: updatingCourses } = useMutation({
    mutationFn: async (updatedCourses: Course[]) => {
      const res = await apiRequest('POST', '/api/courses/update', {
        courses: updatedCourses.map(course => ({
          id: course.id,
          active: course.active
        }))
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/canvas/courses'] });
      toast({
        title: "Courses Updated",
        description: "Your course preferences have been saved"
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update courses",
        variant: "destructive"
      });
    }
  });
  
  // Refresh Canvas session
  const { mutate: refreshSession, isPending: refreshingSession } = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/auth/refresh');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      toast({
        title: "Session Refreshed",
        description: "Your Canvas session has been refreshed"
      });
    },
    onError: (error) => {
      toast({
        title: "Refresh Failed",
        description: error instanceof Error ? error.message : "Failed to refresh session",
        variant: "destructive"
      });
    }
  });
  
  // Toggle course active status
  const toggleCourse = (courseId: number) => {
    if (!courses) return;
    
    const updatedCourses = courses.map(course => 
      course.id === courseId ? { ...course, active: !course.active } : course
    );
    
    updateCourses(updatedCourses);
  };
  
  // Format session expiry date
  const formatExpiryDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown';
    
    const expiryDate = new Date(dateString);
    const now = new Date();
    
    // Calculate days remaining
    const diffTime = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) {
      return 'Expired';
    } else if (diffDays === 1) {
      return '1 day';
    } else {
      return `${diffDays} days`;
    }
  };
  
  const sessionExpiry = settings?.canvasSessionExpiry 
    ? formatExpiryDate(settings.canvasSessionExpiry)
    : 'Unknown';
  
  const lastScan = settings?.lastCanvasScan
    ? new Date(settings.lastCanvasScan).toLocaleString()
    : 'Never';
  
  return {
    settings,
    courses: courses || [],
    driveFolderPath,
    fileNameFormat,
    sessionExpiry,
    lastScan,
    isLoading: loadingSettings || loadingCourses,
    isUpdatingSettings: updatingSettings,
    isUpdatingCourses: updatingCourses,
    isRefreshingSession: refreshingSession,
    setDriveFolderPath,
    setFileNameFormat,
    updateSettings,
    toggleCourse,
    refreshSession,
    refetchSettings,
    refetchCourses
  };
}
