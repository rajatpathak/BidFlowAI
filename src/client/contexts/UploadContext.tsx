import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UploadTask {
  id: string;
  fileName: string;
  type: 'tenders' | 'results';
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  progress: number;
  startTime: Date;
  result?: any;
  error?: string;
}

interface UploadContextType {
  activeTasks: UploadTask[];
  startUpload: (file: File, type: 'tenders' | 'results') => string;
  getTaskStatus: (taskId: string) => UploadTask | undefined;
  clearCompletedTasks: () => void;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

export function UploadProvider({ children }: { children: React.ReactNode }) {
  const [activeTasks, setActiveTasks] = useState<UploadTask[]>([]);
  const { toast } = useToast();

  const startUpload = (file: File, type: 'tenders' | 'results'): string => {
    const taskId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newTask: UploadTask = {
      id: taskId,
      fileName: file.name,
      type,
      status: 'uploading',
      progress: 0,
      startTime: new Date(),
    };

    setActiveTasks(prev => [...prev, newTask]);

    // Show initial notification
    toast({
      title: "Upload Started",
      description: `${file.name} is being processed in the background`,
      duration: 3000,
    });

    // Start the actual upload process
    processUpload(taskId, file, type);

    return taskId;
  };

  const processUpload = async (taskId: string, file: File, type: 'tenders' | 'results') => {
    const updateTask = (updates: Partial<UploadTask>) => {
      setActiveTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, ...updates } : task
      ));
    };

    try {
      // Update to processing status
      updateTask({ status: 'processing', progress: 10 });

      const formData = new FormData();
      formData.append('file', file);
      
      const endpoint = type === 'tenders' ? '/api/upload-tenders' : '/api/upload-results';

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        updateTask({ 
          progress: prev => Math.min(90, (prev || 0) + Math.random() * 15)
        });
      }, 1000);

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();

      // Update to completed
      updateTask({ 
        status: 'completed', 
        progress: 100, 
        result 
      });

      // Show success notification
      toast({
        title: "Upload Completed",
        description: `${file.name} processed successfully. ${result.tendersImported || result.resultsImported || 0} items imported.`,
        duration: 5000,
      });

    } catch (error) {
      updateTask({ 
        status: 'failed', 
        error: error instanceof Error ? error.message : 'Upload failed'
      });

      // Show error notification
      toast({
        title: "Upload Failed",
        description: `Failed to process ${file.name}. ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  const getTaskStatus = (taskId: string): UploadTask | undefined => {
    return activeTasks.find(task => task.id === taskId);
  };

  const clearCompletedTasks = () => {
    setActiveTasks(prev => prev.filter(task => 
      task.status === 'uploading' || task.status === 'processing'
    ));
  };

  // Auto-cleanup completed tasks after 5 minutes
  useEffect(() => {
    const cleanup = setInterval(() => {
      setActiveTasks(prev => prev.filter(task => {
        if (task.status === 'completed' || task.status === 'failed') {
          const age = Date.now() - task.startTime.getTime();
          return age < 5 * 60 * 1000; // Keep for 5 minutes
        }
        return true;
      }));
    }, 60 * 1000); // Check every minute

    return () => clearInterval(cleanup);
  }, []);

  const value: UploadContextType = {
    activeTasks,
    startUpload,
    getTaskStatus,
    clearCompletedTasks,
  };

  return (
    <UploadContext.Provider value={value}>
      {children}
    </UploadContext.Provider>
  );
}

export function useUpload() {
  const context = useContext(UploadContext);
  if (context === undefined) {
    throw new Error('useUpload must be used within an UploadProvider');
  }
  return context;
}