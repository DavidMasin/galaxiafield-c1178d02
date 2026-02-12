import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  Gamepad2,
  Activity,
  Lightbulb,
  Settings,
  Monitor,
  Cog,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMatchStore } from '@/store/matchStore';

const navItems = [
  { to: '/', icon: Gamepad2, label: 'Match Control' },
  { to: '/status', icon: Activity, label: 'System Status' },
  { to: '/leds', icon: Lightbulb, label: 'LED Control' },
  { to: '/motor', icon: Cog, label: 'Motor Control' },
  { to: '/settings', icon: Settings, label: 'Settings' },
  { to: '/fullscreen', icon: Monitor, label: 'Full Screen' },
];

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const connectionStatus = useMatchStore((s) => s.connectionStatus);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside
        className={cn(
          'flex flex-col border-r border-border bg-sidebar transition-all duration-200',
          sidebarOpen ? 'w-56' : 'w-14'
        )}
      >
        <div className="flex h-14 items-center border-b border-border px-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded p-1.5 text-sidebar-foreground hover:bg-sidebar-accent"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          {sidebarOpen && (
            <span className="ml-2 font-display text-sm font-bold tracking-wider text-sidebar-primary">
              FRC HUB
            </span>
          )}
        </div>

        <nav className="flex-1 space-y-1 p-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-primary'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )
              }
            >
              <item.icon size={18} />
              {sidebarOpen && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-border p-3">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'h-2 w-2 rounded-full',
                connectionStatus === 'connected' && 'bg-status-ok',
                connectionStatus === 'reconnecting' && 'bg-status-warn animate-pulse-glow',
                connectionStatus === 'disconnected' && 'bg-status-error'
              )}
            />
            {sidebarOpen && (
              <span className="font-mono text-xs text-muted-foreground">
                {connectionStatus.toUpperCase()}
              </span>
            )}
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
