import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { insertTenderSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Brain, Lightbulb, Calculator } from "lucide-react";

const formSchema = insertTenderSchema.extend({
  value: z.number().min(1, "Value must be greater than 0"),
  deadline: z.string().min(1, "Deadline is required"),
});

type FormData = z.infer<typeof formSchema>;

export default function CreateBid() {
  const [aiContent, setAiContent] = useState("");
  const [showAIPanel, setShowAIPanel] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      organization: "",
      description: "",
      value: 0,
      deadline: "",
      status: "draft",
      aiScore: 0,
      requirements: [],
      documents: [],
      bidContent: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: api.createTender,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenders"] });
      toast({
        title: "Success",
        description: "Tender created successfully",
      });
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create tender",
        variant: "destructive",
      });
    },
  });

  const generateBidMutation = useMutation({
    mutationFn: api.generateBid,
    onSuccess: (data) => {
      setAiContent(data.content);
      form.setValue("bidContent", data.content);
      toast({
        title: "AI Content Generated",
        description: "Bid content has been generated and added to your proposal",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate AI content",
        variant: "destructive",
      });
    },
  });

  const analyzeMutation = useMutation({
    mutationFn: api.analyzeTender,
    onSuccess: (data) => {
      form.setValue("aiScore", data.score);
      toast({
        title: "Analysis Complete",
        description: `AI compatibility score: ${data.score}%`,
      });
    },
  });

  const onSubmit = (data: FormData) => {
    const valueInCents = Math.round(data.value * 100);
    createMutation.mutate({
      ...data,
      value: valueInCents,
      deadline: new Date(data.deadline),
    });
  };

  const handleAIGenerate = () => {
    const values = form.getValues();
    if (!values.title || !values.description) {
      toast({
        title: "Missing Information",
        description: "Please fill in title and description before generating AI content",
        variant: "destructive",
      });
      return;
    }

    generateBidMutation.mutate({
      tenderDescription: `${values.title}: ${values.description}`,
      companyProfile: "Technology consulting company specializing in digital transformation and IT infrastructure",
      requirements: ["Technical expertise", "Project management", "Quality assurance"],
    });
  };

  const handleAnalyze = () => {
    const values = form.getValues();
    if (!values.description) {
      toast({
        title: "Missing Information",
        description: "Please fill in description before analyzing",
        variant: "destructive",
      });
      return;
    }

    analyzeMutation.mutate({
      tenderDescription: values.description,
      companyCapabilities: ["Software Development", "Cloud Computing", "Project Management", "Cybersecurity"],
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create New Bid</h1>
              <p className="text-gray-600">Add a new tender opportunity and create your proposal</p>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowAIPanel(!showAIPanel)}
              className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
            >
              <Brain className="h-4 w-4 mr-2" />
              AI Assistant
            </Button>
          </div>
        </div>
      </header>

      <main className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Tender Information</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tender Title</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter tender title" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="organization"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Organization</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter organization name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Enter tender description and requirements"
                              className="min-h-[100px]"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="value"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tender Value ($)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="deadline"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Deadline</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="submitted">Submitted</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="bidContent"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bid Proposal Content</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Enter your bid proposal content or generate with AI"
                              className="min-h-[200px]"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex items-center space-x-4">
                      <Button
                        type="submit"
                        disabled={createMutation.isPending}
                      >
                        {createMutation.isPending ? "Creating..." : "Create Tender"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleAnalyze}
                        disabled={analyzeMutation.isPending}
                      >
                        <Calculator className="h-4 w-4 mr-2" />
                        {analyzeMutation.isPending ? "Analyzing..." : "Analyze Compatibility"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {/* AI Assistant Panel */}
            <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
              <CardHeader>
                <CardTitle className="text-purple-900 flex items-center">
                  <Brain className="h-5 w-5 mr-2" />
                  AI Assistant
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  onClick={handleAIGenerate}
                  disabled={generateBidMutation.isPending}
                >
                  <Lightbulb className="h-4 w-4 mr-2" />
                  {generateBidMutation.isPending ? "Generating..." : "Generate Bid Content"}
                </Button>

                <div className="text-sm text-purple-700 space-y-2">
                  <p>• AI-powered bid writing</p>
                  <p>• Compatibility analysis</p>
                  <p>• Risk assessment</p>
                  <p>• Pricing suggestions</p>
                </div>
              </CardContent>
            </Card>

            {/* AI Score Display */}
            {(form.watch("aiScore") || 0) > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">AI Compatibility Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${
                      (form.watch("aiScore") || 0) >= 80 ? 'text-green-600' :
                      (form.watch("aiScore") || 0) >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {form.watch("aiScore") || 0}%
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {(form.watch("aiScore") || 0) >= 80 ? 'Excellent match' :
                       (form.watch("aiScore") || 0) >= 60 ? 'Good match' : 'Consider improvements'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
