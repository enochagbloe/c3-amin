import React, { useState } from 'react';
import { CheckCircle2, XCircle, Clock, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface Props {
    status: "approved" | "rejected" | "pending"
    user: string
}

const ApprovalTimeline = ({status, user}: Props) => {
  const [timestamp] = useState("2 hours ago");
  const getStatusConfig = () => {
    switch (status) {
      case "approved":
        return {
          icon: CheckCircle2,
          color: "text-green-600",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          label: "Approved",
          badgeVariant: "default",
          badgeClass: "bg-green-100 text-green-700 hover:bg-green-100"
        };
      case "rejected":
        return {
          icon: XCircle,
          color: "text-red-600",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          label: "Rejected",
          badgeVariant: "destructive",
          badgeClass: "bg-red-100 text-red-700 hover:bg-red-100"
        };
      default:
        return {
          icon: Clock,
          color: "text-amber-600",
          bgColor: "bg-amber-50",
          borderColor: "border-amber-200",
          label: "Pending",
          badgeVariant: "secondary",
          badgeClass: "bg-amber-100 text-amber-700 hover:bg-amber-100"
        };
    }
  };

  const config = getStatusConfig();
  const StatusIcon = config.icon;

  return (
    <div className="">
      <Card className="border-l-4" style={{ borderLeftColor: config.color.replace('text-', '') }}>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            {/* Timeline dot and line */}
            <div className="flex flex-col items-center">
              <div className={`rounded-full p-2 ${config.bgColor} ${config.borderColor} border-2`}>
                <StatusIcon className={`w-5 h-5 ${config.color}`} />
              </div>
              {status !== "pending" && (
                <div className={`w-0.5 h-12 mt-2 ${config.bgColor}`}></div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 pt-1">
              <div className="flex items-center gap-3 mb-3">
                <Badge className={config.badgeClass}>
                  {config.label}
                </Badge>
                <span className="text-sm text-muted-foreground">{timestamp}</span>
              </div>

              {status !== "pending" && (
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xs">
                      {user.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">
                      {status === "approved" ? "Approved by" : "Rejected by"}
                    </p>
                    <p className="text-sm text-muted-foreground">{user}</p>
                  </div>
                </div>
              )}

              {status === "pending" && (
                <p className="text-sm text-muted-foreground">
                  Awaiting approval from the review team
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional timeline example showing multiple states */}
      <div className="mt-8 space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Timeline History
        </h3>
        
        {/* Submitted */}
        <div className="flex gap-4 ml-6">
          <div className="flex flex-col items-center">
            <div className="rounded-full p-1.5 bg-gray-100 border-2 border-gray-200">
              <User className="w-4 h-4 text-gray-600" />
            </div>
            <div className="w-0.5 h-12 bg-gray-100"></div>
          </div>
          <div className="flex-1 pb-6">
            <p className="text-sm font-medium">Submitted</p>
            <p className="text-xs text-muted-foreground">John Doe • 5 hours ago</p>
          </div>
        </div>

        {/* Current status */}
        <div className="flex gap-4 ml-6">
          <div className="flex flex-col items-center">
            <div className={`rounded-full p-1.5 ${config.bgColor} border-2 ${config.borderColor}`}>
              <StatusIcon className={`w-4 h-4 ${config.color}`} />
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">{config.label}</p>
            <p className="text-xs text-muted-foreground">{user} • {timestamp}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApprovalTimeline;