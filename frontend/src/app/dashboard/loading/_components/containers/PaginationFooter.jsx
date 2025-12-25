// components/containers/PaginationFooter.jsx
export default function PaginationFooter({ 
  pagination, 
  containers, 
  loading, 
  onLoadMore, 
  onPreviousPage 
}) {
  return (
    <div className="p-5 border-t bg-white">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm text-gray-600">
          Page {pagination.page} of {pagination.totalPages} • 
          Showing {containers.length} of {pagination.total} containers
        </div>

        <div className="flex items-center gap-3">
          {pagination.hasPrevPage && (
            <button
              onClick={onPreviousPage}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Previous
            </button>
          )}

          {pagination.hasNextPage && (
            <button
              onClick={onLoadMore}
              disabled={loading}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Loading..." : "Load More"}
            </button>
          )}

          {!pagination.hasNextPage && containers.length > 0 && (
            <div className="text-sm text-gray-500">
              All containers loaded
            </div>
          )}
        </div>
      </div>
    </div>
  );
}