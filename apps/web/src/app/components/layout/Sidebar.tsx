import {
  LayoutDashboard,
  FileText,
  Boxes,
  GitBranch,
  Brain,
  Network,
} from "lucide-react";
import { NavLink } from "react-router";
import { cn } from "../ui/utils";

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Input Schemas", href: "/input-schemas", icon: FileText },
  { name: "Feature Extractors", href: "/feature-extractors", icon: Boxes },
  { name: "Rules", href: "/rules", icon: GitBranch },
  { name: "Models", href: "/models", icon: Brain },
  { name: "Orchestrator", href: "/orchestrator", icon: Network },
];

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-14 h-[calc(100vh-3.5rem)] w-64 border-r border-border/40 bg-sidebar">
      <nav className="flex flex-col gap-1 p-4">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.href === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all",
                "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm shadow-primary/20"
                  : "text-sidebar-foreground/70"
              )
            }
          >
            <item.icon className="h-4 w-4" />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
