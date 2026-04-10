"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, ListTodo, BarChart3, Settings } from "lucide-react";

const navItems = [
  { href: "/", label: "今日", icon: Home },
  { href: "/weekly", label: "週曆", icon: Calendar },
  { href: "/tasks", label: "任務", icon: ListTodo },
  { href: "/stats", label: "統計", icon: BarChart3 },
  { href: "/settings", label: "設定", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/80 backdrop-blur-lg safe-area-bottom">
      <div className="mx-auto flex max-w-md items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
