// ============================================================
// Main Layout — Sidebar + Content area
// ============================================================

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  MessageSquare,
  Image,
  Video,
  Settings,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { useSettingsStore } from "@/stores/settingsStore";
import { t, type TranslationKey } from "@/lib/i18n";

export type PageKey = "chat" | "image" | "video" | "settings";

interface MainLayoutProps {
  activePage: PageKey;
  onNavigate: (page: PageKey) => void;
  children: React.ReactNode;
}

const navItems: { key: PageKey; labelKey: TranslationKey; icon: React.ReactNode }[] = [
  { key: "chat", labelKey: "nav.chat", icon: <MessageSquare className="h-5 w-5" /> },
  { key: "image", labelKey: "nav.image", icon: <Image className="h-5 w-5" /> },
  { key: "video", labelKey: "nav.video", icon: <Video className="h-5 w-5" /> },
  { key: "settings", labelKey: "nav.settings", icon: <Settings className="h-5 w-5" /> },
];

export function MainLayout({ activePage, onNavigate, children }: MainLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const language = useSettingsStore((s) => s.language);
  // `t()` resolves from a module-level current lang (set by setLanguage());
  // `language` is an intentional proxy dep so labels re-translate on switch.
  const navLabels = useMemo(
    () => navItems.map((item) => t(item.labelKey)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [language]
  );

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col border-r border-border transition-all duration-200",
          collapsed ? "w-16" : "w-56"
        )}
      >
        {/* Logo / Brand */}
        <div className="flex items-center gap-2 px-4 h-14 border-b border-border">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">A</span>
          </div>
          {!collapsed && (
            <span className="font-semibold text-sm truncate">Agnes AI Tool</span>
          )}
        </div>

        {/* Nav Items */}
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item, idx) => (
            <Button
              key={item.key}
              variant={activePage === item.key ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start gap-3",
                collapsed && "justify-center px-0"
              )}
              onClick={() => onNavigate(item.key)}
            >
              {item.icon}
              {!collapsed && <span>{navLabels[idx] || item.labelKey}</span>}
            </Button>
          ))}
        </nav>

        <Separator />

        {/* Collapse Toggle */}
        <div className="p-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? (
              <PanelLeft className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
