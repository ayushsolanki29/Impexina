// components/containers/ContainerCard.jsx
import { ChevronRight } from "lucide-react";
import StatusBadge from "./StatusBadge";
import StatusToggle from "./StatusToggle";

export default function ContainerCard({
  container,
  onViewDetails,
  onStatusUpdate,
  updatingStatus,
}) {
  return (
    <div className="p-5 border-b hover:bg-gray-50 transition-colors duration-150">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        {/* Left Section */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-4 mb-4">
            <ContainerIcon containerCode={container.containerCode} />

            <div className="min-w-0">
              <div className="flex items-center gap-3 mb-3">
                <button
                  onClick={() => onViewDetails(container.containerCode)}
                  className="text-xl font-bold text-gray-900 hover:text-blue-700 hover:underline truncate"
                  title={`View ${container.containerCode}`}
                >
                  {container.containerCode}
                </button>
                <StatusBadge status={container.status} />
              </div>

              <ContainerMetadata
                origin={container.origin}
                loadingDate={container.loadingDate}
                sheetCount={container.sheetCount}
              />

              {/* Clients */}
              <ContainerClients
                clients={container.clients}
                clientCount={container.clientCount}
              />
            </div>
          </div>

          {/* Status Toggle */}
          <StatusToggle
            currentStatus={container.status}
            containerCode={container.containerCode}
            onStatusUpdate={onStatusUpdate}
            updating={updatingStatus[container.containerCode]}
          />
        </div>

        {/* Right Section: Totals */}
        <ContainerTotals
          totals={{
            totalCTN: container.totalCTN,
            totalPCS: container.totalPCS,
            totalCBM: container.totalCBM,
            totalWeight: container.totalWeight,
          }}
          onViewDetails={() => onViewDetails(container.containerCode)}
        />
      </div>
    </div>
  );
}

// Sub-components for ContainerCard
function ContainerIcon({ containerCode }) {
  return (
    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
      {containerCode.slice(0, 3).toUpperCase()}
    </div>
  );
}

function ContainerMetadata({ origin, loadingDate, sheetCount }) {
  return (
    <div className="text-sm text-gray-600 mb-4">
      <span className="font-medium text-gray-800">{origin}</span>
      {" • "}
      Last loaded:{" "}
      {loadingDate ? new Date(loadingDate).toLocaleDateString() : "—"}
      {" • "}
      {sheetCount} loading sheet{sheetCount !== 1 ? "s" : ""}
    </div>
  );
}

function ContainerClients({ clients, clientCount }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs font-medium text-gray-700">
        {clientCount} client{clientCount !== 1 ? "s" : ""}:
      </span>
      <div className="flex flex-wrap gap-1">
        {clients.slice(0, 3).map((client, idx) => (
          <span
            key={idx}
            className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded"
          >
            {client}
          </span>
        ))}
        {clientCount > 3 && (
          <span className="text-xs px-2 py-1 bg-gray-200 text-gray-600 rounded">
            +{clientCount - 3} more
          </span>
        )}
      </div>
    </div>
  );
}

function ContainerTotals({ totals, onViewDetails }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
      <StatBox label="CTN" value={totals.totalCTN.toLocaleString()} />
      <StatBox label="PCS" value={totals.totalPCS.toLocaleString()} />
      <StatBox label="CBM" value={totals.totalCBM.toFixed(3)} />
      <StatBox label="Weight" value={`${totals.totalWeight.toFixed(2)} kg`} />

      <div className="col-span-2 md:col-span-4">
        <button
          onClick={onViewDetails}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg mt-2"
        >
          View Details <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function StatBox({ label, value }) {
  return (
    <div className="text-center">
      <div className="text-sm text-gray-500 mb-1">{label}</div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
    </div>
  );
}
