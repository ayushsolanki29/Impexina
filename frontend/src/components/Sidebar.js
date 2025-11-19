'use client';
import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  Ship,
  Warehouse,
  Split,
  Receipt,
  CreditCard,
  Users,
  BarChart3,
  MessageSquare,
  Settings,
  Search,
  Menu,
  X,
  Bell,
  LogOut,
  ChevronDown,
  ChevronRight,
  Zap,
  Crown,
  HelpCircle
} from 'lucide-react';
import PWAInstallButton from './PWAInstallButton';


const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Loading Sheets', href: '/dashboard/loading', icon: Ship, badge: 'New' },
  {
    name: 'Warehouse',
    href: '/dashboard/warehouse',
    icon: Warehouse,
    children: [
      { name: 'Stock', href: '/dashboard/warehouse/stock' },
      { name: 'Movements', href: '/dashboard/warehouse/movements', badge: '3' },
      { name: 'Alerts', href: '/dashboard/warehouse/alerts', badge: '5' },
    ],
  },
  { name: 'Bifurcation', href: '/dashboard/bifurcation', icon: Split },
  { name: 'Invoices', href: '/dashboard/invoices', icon: Receipt, badge: '12' },
  {
    name: 'Accounts',
    href: '/dashboard/accounts',
    icon: CreditCard,
    children: [
      { name: 'Ledger', href: '/dashboard/accounts/ledger' },
      { name: 'Payments', href: '/dashboard/accounts/payments' },
      { name: 'Expenses', href: '/dashboard/accounts/expenses' },
    ],
  },
  { name: 'Clients', href: '/dashboard/clients', icon: Users },
  { name: 'Reports', href: '/dashboard/reports', icon: BarChart3, featured: true },
  { name: 'WhatsApp', href: '/dashboard/whatsapp', icon: MessageSquare, badge: 'Live' },
];

const settingsNav = [{ name: 'Settings', href: '/dashboard/settings', icon: Settings }];

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const [open, setOpen] = useState(false); // mobile open
  const [openMenus, setOpenMenus] = useState({}); // which menu groups are open
  const [query, setQuery] = useState('');

  // close mobile sidebar when route changes
  useEffect(() => setOpen(false), [pathname]);

  const toggleMenu = (name) =>
    setOpenMenus(prev => ({ ...prev, [name]: !prev[name] }));

  const navigate = (href) => {
    router.push(href);
  };

  const handleLogout = () => {
    logout?.();
    router.push('/auth/login');
  };

  const isActive = (href) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname?.startsWith(href);

  const filtered = navigation.filter(nav =>
    nav.name.toLowerCase().includes(query.toLowerCase()) ||
    nav.children?.some(c => c.name.toLowerCase().includes(query.toLowerCase()))
  );

  const NavItem = ({ item, depth = 0 }) => {
    const hasChildren = Array.isArray(item.children) && item.children.length > 0;
    const opened = !!openMenus[item.name];
    const active = isActive(item.href);
    const childActive = item.children?.some(c => pathname === c.href);

    return (
      <div key={item.name} className={`group`}>
        <button
          onClick={() => (hasChildren ? toggleMenu(item.name) : navigate(item.href))}
          aria-expanded={hasChildren ? opened : undefined}
          aria-label={item.name}
          className={`
            w-full flex items-center justify-between text-sm px-3 py-2 rounded-md transition
            ${active || childActive ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-50'}
            ${depth > 0 ? 'pl-6' : ''}
          `}
        >
          <div className="flex items-center gap-3">
            <div className={`
              w-8 h-8 flex items-center justify-center rounded-md
              ${active || childActive ? 'bg-white/20' : 'bg-gray-100 group-hover:bg-blue-50'}
            `}>
              <item.icon className={`w-4 h-4 ${active || childActive ? 'text-white' : 'text-gray-500'}`} />
            </div>
            <span className="truncate">{item.name}</span>
            {item.featured && <Zap className="w-4 h-4 text-yellow-400" />}
          </div>

          <div className="flex items-center gap-2">
            {item.badge && (
              <span className={`
                text-xs px-2 py-0.5 rounded-full font-medium
                ${active || childActive ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'}
              `}>
                {item.badge}
              </span>
            )}

            {hasChildren && (
              <span className="flex items-center">
                {opened ? (
                  <ChevronDown className={`w-4 h-4 ${active || childActive ? 'text-white' : 'text-gray-400'}`} />
                ) : (
                  <ChevronRight className={`w-4 h-4 ${active || childActive ? 'text-white' : 'text-gray-400'}`} />
                )}
              </span>
            )}
          </div>
        </button>

        {hasChildren && opened && (
          <div className="mt-1 space-y-1">
            {item.children.map(child => (
              <button
                key={child.href}
                onClick={() => navigate(child.href)}
                className={`
                  w-full text-sm text-gray-600 hover:bg-gray-50 px-3 py-2 rounded-md flex items-center gap-3
                  ${pathname === child.href ? 'bg-blue-100 text-blue-700' : ''}
                `}
                aria-label={child.name}
              >
                <span className="ml-1 truncate">{child.name}</span>
                {child.badge && <span className="ml-auto text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{child.badge}</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-lg bg-white shadow-md border border-gray-100"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5 text-gray-700" />
        </button>
      </div>

      {/* overlay */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          aria-hidden
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`
          fixed z-50 inset-y-0 left-0 w-64 bg-white border-r border-gray-100 shadow-md
          transform transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static
        `}
        aria-label="Main navigation"
      >
        {/* header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow">
              <Ship className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold">SLEXIM ERP</div>
              <div className="text-xs text-gray-500">Import Logistics</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setOpen(false)}
              className="p-2 rounded-md hover:bg-gray-50 lg:hidden"
              aria-label="Close menu"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

     

        {/* nav */}
        <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100vh-260px)]">
          {filtered.length > 0 ? (
            filtered.map(item => <NavItem key={item.name} item={item} />)
          ) : (
            <div className="text-center text-sm text-gray-400 py-8">
              No modules found
            </div>
          )}
        </nav>

        {/* footer: settings + logout */}
        <div className="p-3 border-t border-gray-100">
          <div className="space-y-1">
            {settingsNav.map(s => (
              <button
                key={s.name}
                onClick={() => navigate(s.href)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-50"
              >
                <s.icon className="w-4 h-4 text-gray-500" />
                <span>{s.name}</span>
              </button>
            ))}
 <PWAInstallButton />
            <button
              onClick={() => navigate('/help')}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-50"
            >
              <HelpCircle className="w-4 h-4 text-gray-500" />
              <span>Help</span>
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
           
        </div>
      </aside>

      {/* small extra styling for scrollbar (optional) */}
      <style jsx>{`
        aside nav::-webkit-scrollbar {
          width: 6px;
        }
        aside nav::-webkit-scrollbar-thumb {
          background: #e6e7ea;
          border-radius: 10px;
        }
      `}</style>
    </>
  );
}
