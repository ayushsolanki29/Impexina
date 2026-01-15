// components/containers/StatusToggle.jsx
export default function StatusToggle({
  currentStatus,
  containerCode,
  onStatusUpdate,
  updating,
}) {
  return (
    <div className="flex items-center gap-3 mt-4">
      <span className="text-sm text-gray-700">Container Status:</span>
      <div className="flex items-center gap-2">
        <StatusButton
          status="DRAFT"
          currentStatus={currentStatus}
          containerCode={containerCode}
          onUpdate={onStatusUpdate}
          updating={updating && currentStatus !== "DRAFT"}
        />
        <StatusButton
          status="CONFIRMED"
          currentStatus={currentStatus}
          containerCode={containerCode}
          onUpdate={onStatusUpdate}
          updating={updating && currentStatus !== "CONFIRMED"}
        />
      </div>
    </div>
  );
}

function StatusButton({
  status,
  currentStatus,
  containerCode,
  onUpdate,
  updating,
}) {
  const isActive = currentStatus === status;
  const colors = {
    DRAFT: {
      active: "bg-yellow-100 text-yellow-800 border-yellow-300",
      inactive: "bg-gray-100 text-gray-700 hover:bg-gray-200",
    },
    CONFIRMED: {
      active: "bg-green-100 text-green-800 border-green-300",
      inactive: "bg-gray-100 text-gray-700 hover:bg-gray-200",
    },
  };

  return (
    <button
      onClick={() => onUpdate(containerCode, status)}
      disabled={updating || isActive}
      className={`px-3 py-1.5 rounded text-sm font-medium ${
        isActive ? colors[status].active : colors[status].inactive
      }`}
    >
      {updating ? "Updating..." : status}
    </button>
  );
}
