import { IconCalendarEvent, IconClock, IconUsers } from "@tabler/icons-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function MobileQuickActions() {
  const actions = [
    {
      title: "Take Attendance",
      description: "Start face recognition for current class",
      icon: IconUsers,
      color: "bg-blue-600 hover:bg-blue-700",
      action: "primary",
    },
    {
      title: "View Today's Schedule",
      description: "Check your class timings",
      icon: IconCalendarEvent,
      color: "bg-gray-100 hover:bg-gray-200 text-gray-700",
      action: "secondary",
    },
    {
      title: "Quick Report",
      description: "Generate attendance summary",
      icon: IconClock,
      color: "bg-gray-100 hover:bg-gray-200 text-gray-700",
      action: "secondary",
    },
  ];

  return (
    <div className="px-4 space-y-3">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">
        Quick Actions
      </h3>
      {actions.map((action, index) => (
        <Card
          key={index}
          className="p-0 border-0 shadow-sm bg-white overflow-hidden"
        >
          <Button
            className={`w-full h-auto p-4 justify-start gap-4 rounded-xl min-h-[44px] transition-transform duration-150 active:scale-95 ${
              action.action === "primary"
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-white hover:bg-gray-50 text-gray-700 border border-gray-200"
            }`}
            variant="ghost"
          >
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center ${
                action.action === "primary" ? "bg-white/20" : "bg-gray-100"
              }`}
            >
              <action.icon
                className={`h-6 w-6 ${
                  action.action === "primary" ? "text-white" : "text-gray-600"
                }`}
              />
            </div>
            <div className="flex-1 text-left">
              <div
                className={`font-medium ${
                  action.action === "primary" ? "text-white" : "text-gray-900"
                }`}
              >
                {action.title}
              </div>
              <div
                className={`text-sm ${
                  action.action === "primary"
                    ? "text-white/80"
                    : "text-gray-500"
                }`}
              >
                {action.description}
              </div>
            </div>
          </Button>
        </Card>
      ))}
    </div>
  );
}
