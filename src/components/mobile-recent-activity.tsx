import { IconArrowRight, IconCalendar, IconUsers } from "@tabler/icons-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function MobileRecentActivity() {
  const activities = [
    {
      course: "CS 101",
      title: "Introduction to Programming",
      time: "2 hours ago",
      attendance: "45/50",
      attendanceRate: 90,
      status: "completed",
    },
    {
      course: "CS 201",
      title: "Data Structures",
      time: "1 day ago",
      attendance: "38/42",
      attendanceRate: 86,
      status: "completed",
    },
    {
      course: "CS 301",
      title: "Algorithms Design",
      time: "2 days ago",
      attendance: "25/30",
      attendanceRate: 83,
      status: "completed",
    },
  ];

  const getAttendanceColor = (rate: number) => {
    if (rate >= 90) return "bg-green-50 text-green-700 border-green-200";
    if (rate >= 80) return "bg-yellow-50 text-yellow-700 border-yellow-200";
    return "bg-red-50 text-red-700 border-red-200";
  };

  return (
    <div className="px-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Recent Classes</h3>
        <button className="text-blue-600 text-sm font-medium flex items-center gap-1">
          View All
          <IconArrowRight className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-3">
        {activities.map((activity, index) => (
          <Card
            key={index}
            className="p-4 border-0 shadow-sm bg-white transition-transform duration-150 hover:scale-[0.98] active:scale-95"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-xs font-medium">
                    {activity.course}
                  </Badge>
                  <span className="text-xs text-gray-500">{activity.time}</span>
                </div>
                <h4 className="font-medium text-gray-900 text-sm line-clamp-1 mb-2">
                  {activity.title}
                </h4>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IconUsers className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {activity.attendance}
                </span>
              </div>
              <Badge
                variant="outline"
                className={`text-xs ${getAttendanceColor(
                  activity.attendanceRate
                )}`}
              >
                {activity.attendanceRate}%
              </Badge>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
