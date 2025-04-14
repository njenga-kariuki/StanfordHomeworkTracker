import { Assignment, Course, CourseTask, DateGroup } from "@/lib/constants";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";

interface AssignmentsByDateResponse {
  assignmentsByDate: {
    date: string;
    dateObj: string;
    assignments: {
      courseName: string;
      assignments: Assignment[];
    }[];
  }[];
  lastUpdated: string;
}

export function useCanvasData() {
  const { toast } = useToast();
  
  // Fetch courses
  const { 
    data: courses, 
    isLoading: loadingCourses,
    refetch: refetchCourses
  } = useQuery<Course[]>({
    queryKey: ['/api/canvas/courses'],
  });
  
  // Fetch homework data
  const { 
    data: homeworkData, 
    isLoading: loadingHomework,
    refetch: refetchHomework,
    isError: homeworkError
  } = useQuery<AssignmentsByDateResponse>({
    queryKey: ['/api/canvas/homework'],
    retry: false, // Don't keep retrying if unauthorized
    refetchOnWindowFocus: false, // Don't refetch on window focus to avoid constant 401s
  });
  
  // Update courses (enable/disable)
  const { mutate: updateCourses, isPending: updatingCourses } = useMutation({
    mutationFn: async (courses: {id: number, active: boolean}[]) => {
      const res = await apiRequest('POST', '/api/courses/update', { courses });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/canvas/courses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/canvas/homework'] });
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
  
  // Scan Canvas for homework
  const { mutate: scanHomework, isPending: scanning } = useMutation({
    mutationFn: async () => {
      await apiRequest('GET', '/api/canvas/homework');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/canvas/homework'] });
      toast({
        title: "Canvas Scan Complete",
        description: "Homework data has been updated"
      });
    },
    onError: (error) => {
      toast({
        title: "Scan Failed",
        description: error instanceof Error ? error.message : "Failed to scan Canvas",
        variant: "destructive"
      });
    }
  });
  
  // Process homework data into formatted groups
  const formatHomeworkData = (): DateGroup[] => {
    if (!homeworkData?.assignmentsByDate) return [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return homeworkData.assignmentsByDate.map(dateGroup => {
      const dateObj = new Date(dateGroup.date);
      
      // Determine date status (today, tomorrow, upcoming)
      let status: 'today' | 'tomorrow' | 'upcoming' | 'past' = 'upcoming';
      
      if (dateObj.getTime() === today.getTime()) {
        status = 'today';
      } else if (dateObj.getTime() === tomorrow.getTime()) {
        status = 'tomorrow';
      } else if (dateObj < today) {
        status = 'past';
      }
      
      // Format the display date
      const options: Intl.DateTimeFormatOptions = { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric' 
      };
      const dateDisplay = dateObj.toLocaleDateString('en-US', options);
      
      // Create course tasks
      const courseTasks: CourseTask[] = dateGroup.assignments.map(course => ({
        id: Math.random(), // This would ideally be a real ID
        courseName: course.courseName,
        assignments: course.assignments
      }));
      
      return {
        date: dateGroup.date,
        dateDisplay,
        status,
        courseTasks
      };
    });
  };
  
  const formattedData = formatHomeworkData();
  const lastUpdated = homeworkData?.lastUpdated 
    ? new Date(homeworkData.lastUpdated).toLocaleString() 
    : null;
  
  return {
    courses,
    dateGroups: formattedData,
    lastUpdated,
    isLoading: loadingCourses || loadingHomework,
    isError: homeworkError,
    isUpdating: updatingCourses,
    isScanning: scanning,
    updateCourses,
    scanHomework,
    refetchCourses,
    refetchHomework
  };
}
