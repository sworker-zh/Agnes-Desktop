import { useState } from "react";
import { MainLayout, type PageKey } from "@/components/layout/MainLayout";
import { ChatView } from "@/components/chat/ChatView";
import { ImageView } from "@/components/image/ImageView";
import { VideoView } from "@/components/video/VideoView";
import { SettingsView } from "@/components/settings/SettingsView";
import "./App.css";

function App() {
  const [activePage, setActivePage] = useState<PageKey>("chat");

  return (
    <MainLayout activePage={activePage} onNavigate={setActivePage}>
      {activePage === "chat" && <ChatView />}
      {activePage === "image" && <ImageView />}
      {activePage === "video" && <VideoView />}
      {activePage === "settings" && <SettingsView />}
    </MainLayout>
  );
}

export default App;
