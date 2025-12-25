import React from 'react';
import { History, User, Calendar, FileText, CheckCircle, XCircle } from 'lucide-react';

const ActivityIcon = ({ type }) => {
  switch (type) {
    case 'CREATED':
      return <FileText className="w-5 h-5 text-blue-600" />;
    case 'UPDATED':
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    case 'DELETED':
      return <XCircle className="w-5 h-5 text-red-600" />;
    default:
      return <History className="w-5 h-5 text-gray-600" />;
  }
};

export default function ActivitiesList({ activities }) {
  if (!activities || activities.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-6 text-center">
        <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No activities recorded</p>
      </div>
    );
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-lg border">
      <div className="px-6 py-4 border-b">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <History className="w-5 h-5" />
          Recent Activities
        </h3>
      </div>
      <div className="divide-y">
        {activities.map((activity) => (
          <div key={activity.id} className="px-6 py-4 hover:bg-gray-50">
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <ActivityIcon type={activity.type} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">{activity.user?.name || 'System'}</span>
                  <span className="text-sm text-gray-500 capitalize">{activity.type.toLowerCase()}</span>
                  <span className="text-sm text-gray-500">bifurcation</span>
                </div>
                {activity.note && (
                  <p className="text-sm text-gray-600 mb-2">{activity.note}</p>
                )}
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(activity.createdAt)}
                  </div>
                  {activity.oldValue && (
                    <div className="text-red-600">
                      Old: {JSON.stringify(activity.oldValue)}
                    </div>
                  )}
                  {activity.newValue && (
                    <div className="text-green-600">
                      New: {JSON.stringify(activity.newValue)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}