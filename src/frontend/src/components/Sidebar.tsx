import { Activity } from "lucide-react";
import { motion } from "motion/react";
import type { ReactNode } from "react";

interface NavItem {
  id: string;
  label: string;
  icon: ReactNode;
  ocid: string;
}

interface SidebarProps {
  items: NavItem[];
  activeItem: string;
  onNavigate: (id: string) => void;
  userRole?: string;
}

export function Sidebar({
  items,
  activeItem,
  onNavigate,
  userRole,
}: SidebarProps) {
  const roleLabel =
    userRole === "admin"
      ? "Admin"
      : userRole === "doctor"
        ? "Doctor"
        : "Patient";

  const roleColor =
    userRole === "admin"
      ? "text-amber-400"
      : userRole === "doctor"
        ? "text-emerald-400"
        : "text-teal-400";

  return (
    <nav
      className="flex flex-col w-64 min-h-screen border-r border-white/5 bg-navy-950/80 backdrop-blur-xl"
      aria-label="Sidebar navigation"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/5">
        <div className="w-9 h-9 rounded-xl gradient-teal flex items-center justify-center shadow-teal flex-shrink-0">
          <Activity className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="text-base font-bold font-display gradient-text">
            ToknFlow
          </span>
          <p className={`text-xs font-medium ${roleColor}`}>
            {roleLabel} Portal
          </p>
        </div>
      </div>

      {/* Nav items */}
      <div className="flex-1 px-3 py-4 space-y-0.5">
        {items.map((item) => {
          const isActive = activeItem === item.id;
          return (
            <button
              type="button"
              key={item.id}
              onClick={() => onNavigate(item.id)}
              data-ocid={item.ocid}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                isActive
                  ? "bg-teal-400/15 text-teal-400"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 bg-teal-400/10 rounded-xl border border-teal-400/20"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                />
              )}
              <span
                className={`relative z-10 ${isActive ? "text-teal-400" : "text-muted-foreground group-hover:text-foreground"}`}
              >
                {item.icon}
              </span>
              <span className="relative z-10">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-white/5">
        <p className="text-xs text-muted-foreground text-center">
          © {new Date().getFullYear()}{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-teal-400 transition-colors"
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </nav>
  );
}
