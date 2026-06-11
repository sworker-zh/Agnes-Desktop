// ============================================================
// Settings View — API Key, Save Path, Theme
// ============================================================

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Key, FolderOpen, Sun, Moon, Save, Check } from "lucide-react";
import { useSettingsStore } from "@/stores/settingsStore";
import { getDefaultDownloadDir } from "@/services/downloadService";

export function SettingsView() {
  const { apiKey, savePath, theme, setApiKey, setSavePath, setTheme, loadSettings } =
    useSettingsStore();

  const [keyInput, setKeyInput] = useState(apiKey);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSaveKey = () => {
    setApiKey(keyInput);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handlePickDefaultDir = async () => {
    try {
      const dir = await getDefaultDownloadDir();
      setSavePath(dir);
    } catch {
      alert("Failed to get default download directory.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h2 className="text-xl font-semibold">Settings</h2>

      {/* API Key */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Key className="h-4 w-4" />
            API Key
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Your Agnes AI API Key. Get one from the{" "}
            <a
              href="https://agnes-ai.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              Agnes AI Console
            </a>
            .
          </p>
          <div className="flex gap-2">
            <Input
              type="password"
              placeholder="sk-..."
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleSaveKey}>
              {saved ? (
                <Check className="h-4 w-4 mr-1" />
              ) : (
                <Save className="h-4 w-4 mr-1" />
              )}
              Save
            </Button>
          </div>
          {apiKey && (
            <Badge variant="secondary" className="text-xs">
              Key configured
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Save Path */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            Download Path
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Generated images and videos will be saved to this directory.
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="Leave empty for default (~/Downloads/AgnesAI)"
              value={savePath}
              onChange={(e) => setSavePath(e.target.value)}
              className="flex-1"
            />
            <Button variant="outline" onClick={handlePickDefaultDir}>
              Default
            </Button>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Theme */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            {theme === "dark" ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
            Theme
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              variant={theme === "light" ? "default" : "outline"}
              onClick={() => setTheme("light")}
            >
              <Sun className="h-4 w-4 mr-2" /> Light
            </Button>
            <Button
              variant={theme === "dark" ? "default" : "outline"}
              onClick={() => setTheme("dark")}
            >
              <Moon className="h-4 w-4 mr-2" /> Dark
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">About</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1">
          <p>Agnes AI Tool v0.1.0</p>
          <p>
            Powered by{" "}
            <a
              href="https://agnes-ai.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              Agnes AI API
            </a>
          </p>
          <p>
            Models: <Badge variant="secondary">agnes-2.0-flash</Badge>{" "}
            <Badge variant="secondary">agnes-image-2.1-flash</Badge>{" "}
            <Badge variant="secondary">agnes-video-v2.0</Badge>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
