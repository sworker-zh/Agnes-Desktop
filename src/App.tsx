import { useState, useEffect } from "react";
import { ErrorBoundary } from "@/lib/error-boundary";
import { MainLayout, type PageKey } from "@/components/layout/MainLayout";
import { ChatView } from "@/components/chat/ChatView";
import { ImageView } from "@/components/image/ImageView";
import { VideoView } from "@/components/video/VideoView";
import { SettingsView } from "@/components/settings/SettingsView";
import { useSettingsStore } from "@/stores/settingsStore";
import "./App.css";

function App() {
  const [activePage, setActivePage] = useState<PageKey>("chat");
  const loadSettings = useSettingsStore((s) => s.loadSettings);

  // Apply saved settings (theme + language/i18n) once on startup.
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return (
    <ErrorBoundary>
      <MainLayout activePage={activePage} onNavigate={setActivePage}>
        {activePage === "chat" && <ChatView />}
        {activePage === "image" && <ImageView />}
        {activePage === "video" && <VideoView />}
        {activePage === "settings" && <SettingsView />}
      </MainLayout>
    </ErrorBoundary>
  );
}

export default App;
