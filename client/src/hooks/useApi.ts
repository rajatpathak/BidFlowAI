import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface ApiError {
  message: string;
  status?: number;
}

// Generic hook for GET requests
export function useApiQuery<T>(
  queryKey: string | string[],
  options?: Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'>
) {
  const { isAuthenticated } = useAuth();
  const key = Array.isArray(queryKey) ? queryKey : [queryKey];
  
  return useQuery<T>({
    queryKey: key,
    enabled: isAuthenticated && (options?.enabled !== false),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    ...options,
  });
}

// Generic hook for mutations
export function useApiMutation<TData = any, TVariables = any>(
  mutationFn: (variables: TVariables) => Promise<Response>,
  options?: UseMutationOptions<TData, ApiError, TVariables>
) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<TData, ApiError, TVariables>({
    mutationFn: async (variables) => {
      const response = await mutationFn(variables);
      return response.json();
    },
    onError: (error) => {
      toast({
        title: "Operation Failed",
        description: error.message || 'An unexpected error occurred',
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Optionally refetch related queries
      queryClient.invalidateQueries();
    },
    ...options,
  });
}

// Specific hooks for common operations
export function useTenders(filters?: Record<string, any>) {
  const queryKey = filters ? ['/api/tenders', 'with-filters', JSON.stringify(filters)] : ['/api/tenders'];
  
  return useApiQuery<any[]>(queryKey, {
    queryFn: async () => {
      let url = '/api/tenders';
      if (filters) {
        const searchParams = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value && value !== '') {
            searchParams.append(key, value);
          }
        });
        if (searchParams.toString()) {
          url += '?' + searchParams.toString();
        }
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch tenders');
      }
      return response.json();
    }
  });
}

export function useTender(id: string) {
  return useApiQuery<any>(['/api/tenders', id], {
    enabled: !!id,
    queryFn: async () => {
      const response = await fetch(`/api/tenders/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch tender');
      }
      return response.json();
    }
  });
}

export function useCreateTender() {
  const queryClient = useQueryClient();
  
  return useApiMutation(
    async (tenderData: any) => 
      apiRequest('/api/tenders', {
        method: 'POST',
        body: JSON.stringify(tenderData),
      }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/tenders'] });
      },
    }
  );
}

export function useUpdateTender(id: string) {
  const queryClient = useQueryClient();
  
  return useApiMutation(
    async (updates: any) =>
      apiRequest(`/api/tenders/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/tenders'] });
        queryClient.invalidateQueries({ queryKey: ['/api/tenders', id] });
      },
    }
  );
}

export function useDeleteTender() {
  const queryClient = useQueryClient();
  
  return useApiMutation(
    async (id: string) =>
      apiRequest(`/api/tenders/${id}`, {
        method: 'DELETE',
      }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/tenders'] });
      },
    }
  );
}

export function useAssignTender() {
  const queryClient = useQueryClient();
  
  return useApiMutation(
    async ({ tenderId, assignmentData }: { tenderId: string; assignmentData: any }) =>
      apiRequest(`/api/tenders/${tenderId}/assign`, {
        method: 'POST',
        body: JSON.stringify(assignmentData),
      }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/tenders'] });
      },
    }
  );
}

export function useUploadDocuments(tenderId: string) {
  const queryClient = useQueryClient();
  
  return useApiMutation(
    async (formData: FormData) =>
      apiRequest(`/api/tenders/${tenderId}/documents`, {
        method: 'POST',
        body: formData,
      }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/tenders', tenderId, 'documents'] });
        queryClient.invalidateQueries({ queryKey: ['/api/tenders', tenderId, 'activity-logs'] });
      },
    }
  );
}

export function useDashboardStats() {
  return useApiQuery<any>('/api/dashboard/stats');
}

export function useFinanceRequests() {
  return useApiQuery<any[]>('/api/finance/requests');
}

export function useMeetings() {
  return useApiQuery<any[]>('/api/meetings');
}