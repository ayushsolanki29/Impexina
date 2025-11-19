"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";

export default function LayoutShell({ children }) {
  const pathname = usePathname();

  // Hide sidebar on auth pages
  const hideSidebar =
    pathname.startsWith("/login") || pathname.startsWith("/register");

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {!hideSidebar && <Sidebar />}

      <main className="flex-1 overflow-y-auto bg-gray-50">{children}</main>
    </div>
  );
}
