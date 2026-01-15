// components/containers/LoadingSkeleton.jsx
export default function LoadingSkeleton({ count = 6 }) {
  return (
    <div>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse p-5 border-b bg-white/40">
          <div className="flex justify-between items-center gap-4">
            <div className="w-60 h-6 bg-gray-200 rounded" />
            <div className="flex gap-3">
              <div className="w-20 h-6 bg-gray-200 rounded" />
              <div className="w-20 h-6 bg-gray-200 rounded" />
              <div className="w-20 h-6 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}