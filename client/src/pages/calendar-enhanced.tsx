import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Plus, Search, Clock } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

type CalendarEvent = {
  id: string;
  title: string;
  time: string;
  date: string;
  type: string;
};

type CalendarView = "day" | "week" | "month" | "year";

export default function CalendarEnhanced() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>("month");
  const [searchQuery, setSearchQuery] = useState("");
  const [scheduleCallOpen, setScheduleCallOpen] = useState(false);

  const { data: events = [] } = useQuery<CalendarEvent[]>({
    queryKey: ["/api/calendar/events", currentDate.toISOString(), view],
  });

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ).getDay();

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const isToday = (day: number | null) => {
    if (!day) return false;
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const handleScheduleCall = () => {
    toast({
      title: "Meeting Scheduled",
      description: "Your meeting has been successfully scheduled.",
    });
    setScheduleCallOpen(false);
  };

  const actions = (
    <div className="flex items-center gap-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search events..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 w-64"
          data-testid="input-search-calendar"
        />
      </div>
      <Dialog open={scheduleCallOpen} onOpenChange={setScheduleCallOpen}>
        <DialogTrigger asChild>
          <Button className="bg-gradient-primary" data-testid="button-schedule-call">
            <Plus className="h-4 w-4 mr-2" />
            Schedule Call
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]" data-testid="dialog-schedule-call">
          <DialogHeader>
            <DialogTitle>Schedule Call</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="meeting-title">Meeting Title</Label>
              <Input
                id="meeting-title"
                placeholder="Enter meeting title"
                data-testid="input-meeting-title"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="meeting-date">Date</Label>
                <Input
                  id="meeting-date"
                  type="date"
                  data-testid="input-meeting-date"
                />
              </div>
              <div>
                <Label htmlFor="meeting-time">Time</Label>
                <Input
                  id="meeting-time"
                  type="time"
                  data-testid="input-meeting-time"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="participants">Participants</Label>
              <Select>
                <SelectTrigger id="participants" data-testid="select-participants">
                  <SelectValue placeholder="Select participants" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="john">John Doe</SelectItem>
                  <SelectItem value="jane">Jane Smith</SelectItem>
                  <SelectItem value="bob">Bob Wilson</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Add meeting description..."
                data-testid="textarea-description"
              />
            </div>
            <Button
              onClick={handleScheduleCall}
              className="w-full"
              data-testid="button-submit-schedule"
            >
              Schedule Meeting
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );

  const breadcrumbs = [
    { label: "Tender Management" },
    { label: "Schedule Call" },
  ];

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Tender Management"
        description="Schedule and manage meetings and calls"
        breadcrumbs={breadcrumbs}
        actions={actions}
      />
      <main className="flex-1 overflow-auto p-6 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* View Selector and Navigation */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={previousMonth} data-testid="button-prev-month">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <h2 className="text-xl font-semibold min-w-[200px] text-center">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </h2>
                  <Button variant="outline" onClick={nextMonth} data-testid="button-next-month">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={view === "day" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setView("day")}
                    data-testid="button-view-day"
                  >
                    Day
                  </Button>
                  <Button
                    variant={view === "week" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setView("week")}
                    data-testid="button-view-week"
                  >
                    Week
                  </Button>
                  <Button
                    variant={view === "month" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setView("month")}
                    data-testid="button-view-month"
                  >
                    Month
                  </Button>
                  <Button
                    variant={view === "year" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setView("year")}
                    data-testid="button-view-year"
                  >
                    Year
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Calendar Grid */}
          <Card data-testid="calendar-grid">
            <CardContent className="p-6">
              <div className="grid grid-cols-7 gap-1">
                {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => (
                  <div
                    key={day}
                    className="text-center text-sm font-semibold text-gray-600 dark:text-gray-400 py-3 border-b"
                  >
                    {day}
                  </div>
                ))}
                {days.map((day, index) => (
                  <div
                    key={index}
                    className={`
                      min-h-[100px] p-2 border border-gray-200 dark:border-gray-700
                      ${day ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'}
                      ${isToday(day) ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700' : ''}
                    `}
                    data-testid={day ? `calendar-cell-${day}` : undefined}
                  >
                    {day && (
                      <>
                        <div className={`text-sm font-medium ${isToday(day) ? 'text-blue-600' : 'text-gray-700 dark:text-gray-300'}`}>
                          {day}
                        </div>
                        {isToday(day) && (
                          <div className="mt-1 text-xs">
                            <Badge className="bg-blue-100 text-blue-800 text-xs">Today</Badge>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Time Slots (for day/week view) */}
          {(view === "day" || view === "week") && (
            <Card data-testid="time-slots">
              <CardHeader>
                <CardTitle>Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[...Array(12)].map((_, hour) => (
                    <div
                      key={hour}
                      className="flex items-center gap-4 py-2 border-b border-gray-200 dark:border-gray-700"
                      data-testid={`time-slot-${hour + 7}`}
                    >
                      <div className="w-20 text-sm text-gray-600 dark:text-gray-400">
                        {hour + 7} AM
                      </div>
                      <div className="flex-1 min-h-[40px] bg-gray-50 dark:bg-gray-800 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"></div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
