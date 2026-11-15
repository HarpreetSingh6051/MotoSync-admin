import {
  Activity,
  Users,
  Shield,
  Gauge,
  BarChart3,
  Megaphone,
  Flag,
  Volume2,
  Settings,
  ScrollText,
  Route,
  Bell,
} from "lucide-react";
export const navigationGroups = [
  {
    name: "Command center",
    items: [
      { id: "dashboard", name: "Overview & KPIs", icon: Activity },
      { id: "analytics", name: "Regions & growth", icon: BarChart3 },
    ],
  },
  {
    name: "Community & riders",
    items: [
      { id: "users", name: "Registered riders", icon: Users },
      { id: "clubs", name: "Ride groups & clubs", icon: Shield },
      { id: "rides", name: "Ride directory", icon: Route },
      { id: "announcements", name: "Announcements", icon: Megaphone },
    ],
  },
  {
    name: "Monetization & sales",
    items: [
      { id: "plans", name: "Subscription plans", icon: Gauge },
      { id: "reports", name: "Purchases & revenue", icon: BarChart3 },
      { id: "campaigns", name: "Pitstop ad cards", icon: Megaphone },
    ],
  },
  {
    name: "Feature governance",
    items: [
      { id: "flags", name: "Feature controls", icon: Flag },
      { id: "sounds", name: "Exhaust sound vault", icon: Volume2 },
    ],
  },
  {
    name: "System & security",
    items: [
      { id: "admin_accounts", name: "Admin accounts", icon: Users },
      { id: "admin_roles", name: "Admin roles", icon: Shield },
      { id: "audit", name: "Audit history", icon: ScrollText },
      { id: "alerts", name: "Operational alerts", icon: Bell },
      { id: "exports", name: "Export reports", icon: BarChart3 },
      { id: "notifications", name: "Notifications", icon: Bell },
      { id: "settings", name: "Platform & themes", icon: Settings },
    ],
  },
];
export const modules = navigationGroups.flatMap((group) => group.items);
