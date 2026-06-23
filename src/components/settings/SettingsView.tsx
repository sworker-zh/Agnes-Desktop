// ============================================================
// Settings View — API Key, Save Path, Theme, Language
// ============================================================

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Key, FolderOpen, Sun, Moon, Languages, Save, Check } from "lucide-react";
import { useSettingsStore } from "@/stores/settingsStore";
import { getDefaultDownloadDir } from "@/services/downloadService";
import { t } from "@/lib/i18n";

export function SettingsView() {
  const {
    apiKey,
    savePath,
    theme,
    language,
    setApiKey,
    setSavePath,
    setTheme,
    setLanguage,
    loadSettings,
  } = useSettingsStore();

  const [keyInput, setKeyInput] = useState(apiKey);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Translated UI strings
  const STR = {
    title: t("settings.title"),
    apiKey: t("settings.apiKey"),
    apiKeyDesc: t("settings.apiKeyDesc"),
    apiKeyConsole: t("settings.apiKeyConsole"),
    save: t("settings.save"),
    keyConfigured: t("settings.keyConfigured"),
    downloadPath: t("settings.downloadPath"),
    downloadPathDesc: t("settings.downloadPathDesc"),
    downloadPathPlaceholder: t("settings.downloadPathPlaceholder"),
    default: t("settings.default"),
    failedToGetDefaultDir: t("settings.failedToGetDefaultDir"),
    theme: t("settings.theme"),
    light: t("settings.light"),
    dark: t("settings.dark"),
    language: t("settings.language"),
    english: t("settings.english"),
    chinese: t("settings.chinese"),
    about: t("settings.about"),
    appName: t("layout.appName"),
    poweredBy: t("settings.poweredBy"),
    agnesAiLink: t("settings.agnesAiLink"),
    modelsLabel: t("settings.models"),
    saved: t("common.saved"),
  };
  // Description strings embed an inline link/model placeholder; split around it
  // so the `<a>` / `<Badge>` elements stay clickable/styled.
  const [apiKeyDescBefore, apiKeyDescAfter] = STR.apiKeyDesc.split("{{link}}");
  const [poweredByBefore, poweredByAfter] = STR.poweredBy.split("{{link}}");
  const [modelsBefore] = STR.modelsLabel.split("{{models}}");

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
      alert(STR.failedToGetDefaultDir);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h2 className="text-xl font-semibold">{STR.title}</h2>

      {/* API Key */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Key className="h-4 w-4" />
            {STR.apiKey}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {apiKeyDescBefore}
            <a
              href="https://agnes-ai.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              {STR.apiKeyConsole}
            </a>
            {apiKeyDescAfter}
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
              {STR.save}
            </Button>
          </div>
          {apiKey && (
            <Badge variant="secondary" className="text-xs">
              {STR.keyConfigured}
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Save Path */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            {STR.downloadPath}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {STR.downloadPathDesc}
          </p>
          <div className="flex gap-2">
            <Input
              placeholder={STR.downloadPathPlaceholder}
              value={savePath}
              onChange={(e) => setSavePath(e.target.value)}
              className="flex-1"
            />
            <Button variant="outline" onClick={handlePickDefaultDir}>
              {STR.default}
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
            {STR.theme}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              variant={theme === "light" ? "default" : "outline"}
              onClick={() => setTheme("light")}
            >
              <Sun className="h-4 w-4 mr-2" /> {STR.light}
            </Button>
            <Button
              variant={theme === "dark" ? "default" : "outline"}
              onClick={() => setTheme("dark")}
            >
              <Moon className="h-4 w-4 mr-2" /> {STR.dark}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Language */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Languages className="h-4 w-4" />
            {STR.language}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              variant={language === "en" ? "default" : "outline"}
              onClick={() => setLanguage("en")}
            >
              {STR.english}
            </Button>
            <Button
              variant={language === "zh" ? "default" : "outline"}
              onClick={() => setLanguage("zh")}
            >
              {STR.chinese}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{STR.about}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1">
          <p>{STR.appName} v0.1.0</p>
          <p>
            {poweredByBefore}
            <a
              href="https://agnes-ai.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              {STR.agnesAiLink}
            </a>
            {poweredByAfter}
          </p>
          <p>
            {modelsBefore}
            <Badge variant="secondary">agnes-2.0-flash</Badge>{" "}
            <Badge variant="secondary">agnes-image-2.1-flash</Badge>{" "}
            <Badge variant="secondary">agnes-video-v2.0</Badge>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
