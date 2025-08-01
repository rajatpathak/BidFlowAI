import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Filter, Eye, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";

export default function Tenders() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: tenders, isLoading } = useQuery({
    queryKey: ["/api/tenders"],
    queryFn: api.getTenders,
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteTender,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenders"] });
    },
  });

  const filteredTenders = tenders?.filter(tender =>
    tender.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tender.organization.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'submitted':
        return 'bg-green-100 text-green-800';
      case 'won':
        return 'bg-emerald-100 text-emerald-800';
      case 'lost':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Active Tenders</h1>
              <p className="text-gray-600">Manage and track all your tender opportunities</p>
            </div>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Add Tender
            </Button>
          </div>
        </div>
      </header>

      <main className="p-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>All Tenders</CardTitle>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Search tenders..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 w-64"
                  />
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading tenders...</div>
            ) : filteredTenders.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No tenders found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTenders.map((tender) => (
                  <Card key={tender.id} className="border border-gray-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 text-sm mb-1">
                            {tender.title}
                          </h3>
                          <p className="text-sm text-gray-600">{tender.organization}</p>
                        </div>
                        <Badge className={getStatusColor(tender.status)}>
                          {tender.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Value:</span>
                          <span className="font-medium">${(tender.value / 100).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Deadline:</span>
                          <span className="font-medium">
                            {format(new Date(tender.deadline), "MMM dd, yyyy")}
                          </span>
                        </div>
                        {tender.aiScore && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">AI Score:</span>
                            <span className={`font-medium ${
                              tender.aiScore >= 80 ? 'text-green-600' :
                              tender.aiScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {tender.aiScore}%
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => deleteMutation.mutate(tender.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
