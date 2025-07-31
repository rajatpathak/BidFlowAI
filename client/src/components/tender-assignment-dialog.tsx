import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const assignmentSchema = z.object({
  bidderId: z.string().min(1, "Please select a bidder"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  budget: z.string().optional(),
});

type AssignmentFormData = z.infer<typeof assignmentSchema>;

interface TenderAssignmentDialogProps {
  tenderId: string;
  tenderTitle: string;
  currentAssignment?: {
    bidderName: string;
    priority: string;
  };
  onAssignmentChange?: () => void;
}

export function TenderAssignmentDialog({ 
  tenderId, 
  tenderTitle, 
  currentAssignment,
  onAssignmentChange 
}: TenderAssignmentDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      priority: "medium",
      budget: "",
    },
  });

  // Fetch all users with bidder roles
  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
  });

  const bidders = (users as any[]).filter((user: any) => 
    user.role === 'senior_bidder' || user.role === 'admin'
  );

  const assignTenderMutation = useMutation({
    mutationFn: async (data: AssignmentFormData) => {
      const response = await fetch(`/api/tenders/${tenderId}/assign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bidderId: data.bidderId,
          priority: data.priority,
          budget: data.budget ? parseFloat(data.budget) : null,
          assignedBy: "current-user-id", // This should come from auth context
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to assign tender");
      }

      return await response.json();
    },
    onSuccess: (response: any) => {
      toast({
        title: "Assignment Successful",
        description: `Tender assigned to ${response.bidderName}`,
      });
      
      // Invalidate and refetch tender data
      queryClient.invalidateQueries({ queryKey: ["/api/tenders"] });
      
      setOpen(false);
      form.reset();
      onAssignmentChange?.();
    },
    onError: (error: any) => {
      toast({
        title: "Assignment Failed",
        description: error.message || "Failed to assign tender",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AssignmentFormData) => {
    assignTenderMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant={currentAssignment ? "outline" : "default"} 
          size="sm"
          className="flex items-center gap-2"
        >
          <UserPlus className="h-4 w-4" />
          {currentAssignment ? "Reassign" : "Assign"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign Tender to Bidder</DialogTitle>
        </DialogHeader>
        
        <div className="mb-4 p-3 bg-muted rounded-lg">
          <p className="font-medium text-sm">{tenderTitle}</p>
          {currentAssignment && (
            <p className="text-sm text-muted-foreground mt-1">
              Currently assigned to: <span className="font-medium">{currentAssignment.bidderName}</span>
              {" "}(Priority: {currentAssignment.priority})
            </p>
          )}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="bidderId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Bidder</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a bidder" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {bidders.map((bidder: any) => (
                        <SelectItem key={bidder.id} value={bidder.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{bidder.name}</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              ({bidder.role.replace('_', ' ')})
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority Level</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          Low Priority
                        </div>
                      </SelectItem>
                      <SelectItem value="medium">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-yellow-500" />
                          Medium Priority
                        </div>
                      </SelectItem>
                      <SelectItem value="high">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-red-500" />
                          High Priority
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="budget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Budget (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Enter budget amount (can be filled later in finance)"
                      {...field}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground mt-1">
                    Budget can be left blank and filled later in the finance profile
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={assignTenderMutation.isPending}
              >
                {assignTenderMutation.isPending ? "Assigning..." : "Assign Tender"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}