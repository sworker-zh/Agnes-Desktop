// ============================================================
// Image View — Text-to-Image and Image-to-Image generation
// ============================================================

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Image as ImageIcon,
  Loader2,
  Download,
  Sparkles,
  ArrowRightLeft,
} from "lucide-react";
import { useImageStore, generateId } from "@/stores/imageStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { textToImageUrl, imageToImage } from "@/services/imageService";
import { downloadFile, saveBase64Image, getDefaultDownloadDir, generateFilename } from "@/services/downloadService";
import type { GeneratedImage } from "@/types";

export function ImageView() {
  const { images, isGenerating, setGenerating, addImage, updateImageLocalPath, setError } =
    useImageStore();
  const apiKey = useSettingsStore((s) => s.apiKey);
  const savePath = useSettingsStore((s) => s.savePath);

  const [prompt, setPrompt] = useState("");
  const [size, setSize] = useState("1024x768");
  const [mode, setMode] = useState<"text2img" | "img2img">("text2img");
  const [inputImageUrl, setInputImageUrl] = useState("");

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;
    if (!apiKey) {
      alert("Please set your API Key in Settings first.");
      return;
    }
    if (mode === "img2img" && !inputImageUrl.trim()) {
      alert("Please provide an input image URL for Image-to-Image mode.");
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      let result;
      if (mode === "text2img") {
        result = await textToImageUrl(prompt, size);
      } else {
        result = await imageToImage(prompt, inputImageUrl, { size });
      }

      const imageUrl = result.data[0]?.url;
      const b64 = result.data[0]?.b64_json;

      const img: GeneratedImage = {
        id: generateId(),
        prompt,
        url: imageUrl,
        b64_json: b64,
        localPath: null,
        size,
        timestamp: Date.now(),
      };
      addImage(img);

      // Auto-download to local
      const dir = savePath || (await getDefaultDownloadDir());
      const filename = generateFilename("agnes_img", "png");

      if (imageUrl) {
        const localPath = await downloadFile(imageUrl, `${dir}/${filename}`);
        updateImageLocalPath(img.id, localPath);
      } else if (b64) {
        const localPath = await saveBase64Image(b64, filename, dir);
        updateImageLocalPath(img.id, localPath);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image generation failed");
    } finally {
      setGenerating(false);
    }
  }, [prompt, size, mode, inputImageUrl, apiKey, savePath, setGenerating, addImage, updateImageLocalPath, setError]);

  return (
    <div className="flex h-full">
      {/* Left: Controls */}
      <div className="w-96 border-r border-border p-4 flex flex-col gap-4 overflow-y-auto">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Image Generation
        </h2>

        <Tabs value={mode} onValueChange={(v: string) => setMode(v as "text2img" | "img2img")}>
          <TabsList className="w-full">
            <TabsTrigger value="text2img" className="flex-1">
              <Sparkles className="h-4 w-4 mr-1" /> Text → Image
            </TabsTrigger>
            <TabsTrigger value="img2img" className="flex-1">
              <ArrowRightLeft className="h-4 w-4 mr-1" /> Image → Image
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Textarea
          placeholder="Describe the image you want to generate..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="min-h-[120px]"
        />

        {mode === "img2img" && (
          <Input
            placeholder="Input image URL (public accessible)"
            value={inputImageUrl}
            onChange={(e) => setInputImageUrl(e.target.value)}
          />
        )}

        <div className="flex gap-2">
          <Input
            placeholder="Size (e.g. 1024x768)"
            value={size}
            onChange={(e) => setSize(e.target.value)}
            className="flex-1"
          />
        </div>

        <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" /> Generate Image
            </>
          )}
        </Button>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>Model: <Badge variant="secondary">agnes-image-2.1-flash</Badge></p>
          <p>Images are automatically downloaded to local disk.</p>
        </div>
      </div>

      {/* Right: Results */}
      <div className="flex-1 p-4 overflow-y-auto">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          Generated Images ({images.length})
        </h3>
        {images.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <ImageIcon className="h-12 w-12 mx-auto opacity-50 mb-3" />
              <p>No images generated yet</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {images.map((img) => (
              <Card key={img.id} className="overflow-hidden">
                <div className="aspect-[4/3] bg-muted flex items-center justify-center">
                  {img.url ? (
                    <img
                      src={img.url}
                      alt={img.prompt}
                      className="w-full h-full object-cover"
                    />
                  ) : img.b64_json ? (
                    <img
                      src={`data:image/png;base64,${img.b64_json}`}
                      alt={img.prompt}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {img.prompt}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {img.size}
                    </Badge>
                    {img.localPath && (
                      <span className="text-xs text-green-600 flex items-center gap-1">
                        <Download className="h-3 w-3" /> Saved
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
