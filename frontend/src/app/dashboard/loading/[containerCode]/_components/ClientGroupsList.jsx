import React, { useState } from 'react';
import ClientCard from './ClientCard';

const ClientGroupsList = ({ 
  clientGroups, 
  selectedClients, 
  previewImages,
  onPreview, 
  onEdit, 
  onCopySummary, 
  onShare 
}) => {
  // State for expanded clients
  const [expandedClient, setExpandedClient] = useState(null);

  // Filter client groups based on selection
  const filteredClientGroups = selectedClients.length > 0
    ? clientGroups.filter(group => selectedClients.includes(group.client))
    : clientGroups;

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800 border border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  if (filteredClientGroups.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
        <div className="text-gray-500 mb-4">
          No items found matching your filters
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filteredClientGroups.map((group) => (
        <ClientCard
          key={group.client}
          group={group}
          isExpanded={expandedClient === group.client}
          previewImages={previewImages}
          statusColor={getStatusColor(group.status)}
          onToggleExpand={() => setExpandedClient(
            expandedClient === group.client ? null : group.client
          )}
          onPreview={() => onPreview(group.client)}
          onEdit={() => onEdit(group.client)}
          onCopySummary={() => onCopySummary(group.client)}
          onShare={() => onShare(group.client)}
        />
      ))}
    </div>
  );
};

export default ClientGroupsList;