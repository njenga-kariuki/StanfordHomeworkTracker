import { Summary, UploadFile } from "@/lib/constants";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { v4 as uuidv4 } from 'uuid';

export function usePdfSummarize() {
  const { toast } = useToast();
  const [uploadedFiles, setUploadedFiles] = useState<UploadFile[]>([]);
  const [courseName, setCourseName] = useState<string>('');
  const [readingDate, setReadingDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // Fetch summaries
  const { 
    data: summaries, 
    isLoading: loadingSummaries,
    refetch: refetchSummaries
  } = useQuery<Summary[]>({
    queryKey: ['/api/pdf/summaries'],
  });
  
  // Handle file uploads
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    // Process each file
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const fileId = uuidv4();
        const base64content = e.target?.result as string;
        
        setUploadedFiles(prev => [...prev, {
          id: fileId,
          name: file.name,
          content: base64content,
          status: 'uploading',
          progress: 0
        }]);
        
        // Simulate progress
        let progress = 0;
        const interval = setInterval(() => {
          progress += 20;
          if (progress <= 100) {
            setUploadedFiles(prev => 
              prev.map(f => f.id === fileId ? { ...f, progress } : f)
            );
          } else {
            clearInterval(interval);
            setUploadedFiles(prev => 
              prev.map(f => f.id === fileId ? { ...f, status: 'completed', progress: 100 } : f)
            );
          }
        }, 500);
      };
      
      reader.onerror = () => {
        toast({
          title: "Upload Failed",
          description: `Failed to read file: ${file.name}`,
          variant: "destructive"
        });
      };
      
      reader.readAsDataURL(file);
    });
    
    // Reset the input
    event.target.value = '';
  };
  
  // Process files mutation
  const { mutate: processPdfs, isPending: processing } = useMutation({
    mutationFn: async () => {
      // Update file status to processing
      setUploadedFiles(prev => 
        prev.map(f => ({ ...f, status: 'processing', progress: 0 }))
      );
      
      // Prepare files for API
      const files = uploadedFiles.map(file => ({
        name: file.name,
        content: file.content
      }));
      
      const res = await apiRequest('POST', '/api/pdf/summarize', {
        courseName,
        readingDate,
        files
      });
      
      return res.json();
    },
    onSuccess: (data) => {
      // Update file status based on results
      setUploadedFiles(prev => {
        return prev.map(file => {
          const result = data.results.find(r => r.fileName === file.name);
          if (result) {
            return {
              ...file,
              status: result.success ? 'completed' : 'failed',
              progress: 100,
              error: result.error
            };
          }
          return file;
        });
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/pdf/summaries'] });
      
      toast({
        title: "Processing Complete",
        description: "PDF summaries have been created"
      });
    },
    onError: (error) => {
      // Mark all files as failed
      setUploadedFiles(prev => 
        prev.map(f => ({ 
          ...f, 
          status: 'failed', 
          error: error instanceof Error ? error.message : "Processing failed" 
        }))
      );
      
      toast({
        title: "Processing Failed",
        description: error instanceof Error ? error.message : "Failed to process PDFs",
        variant: "destructive"
      });
    }
  });
  
  // Clear uploaded files
  const clearFiles = () => {
    setUploadedFiles([]);
  };
  
  return {
    summaries: summaries || [],
    uploadedFiles,
    courseName,
    readingDate,
    isLoading: loadingSummaries,
    isProcessing: processing,
    handleFileUpload,
    setCourseName,
    setReadingDate,
    processPdfs,
    clearFiles,
    refetchSummaries
  };
}
