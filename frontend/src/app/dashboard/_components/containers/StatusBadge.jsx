// components/containers/StatusBadge.jsx
import { CheckCircle, Clock, XCircle } from "lucide-react";

export default function StatusBadge({ status }) {
  const config = {
    DRAFT: {
      color: "bg-yellow-100 text-yellow-800 border-yellow-200",
      icon: Clock,
    },
    CONFIRMED: {
      color: "bg-green-100 text-green-800 border-green-200",
      icon: CheckCircle,
    },
    CANCELLED: {
      color: "bg-red-100 text-red-800 border-red-200",
      icon: XCircle,
    },
  };

  const statusConfig = config[status] || {
    color: "bg-gray-100 text-gray-800 border-gray-200",
    icon: Clock,
  };

  const Icon = statusConfig.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full border text-sm font-medium ${statusConfig.color}`}>
      <Icon className="w-4 h-4" />
      {status}
    </span>
  );
}