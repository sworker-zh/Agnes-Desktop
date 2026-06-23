// ============================================================
// Image View — Text-to-Image and Image-to-Image generation
// Supports: local file upload, URL input for img2img
// ============================================================

import { useState, useCallback, useRef } from "react";
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
  Upload,
  X,
  Link,
} from "lucide-react";
import { useImageStore, generateId } from "@/stores/imageStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { textToImageUrl, imageToImage } from "@/services/imageService";
import {
  downloadFile,
  saveBase64Image,
  getDefaultDownloadDir,
  generateFilename,
} from "@/services/downloadService";
import { t } from "@/lib/i18n";
import type { GeneratedImage } from "@/types";

/** Input source mode for img2img */
type InputMode = "upload" | "url";

/** Read a File as Data URI Base64 string */
function fileToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export function ImageView() {
  const {
    images,
    isGenerating,
    setGenerating,
    addImage,
    updateImageLocalPath,
    setError,
  } = useImageStore();
  const apiKey = useSettingsStore((s) => s.apiKey);
  const savePath = useSettingsStore((s) => s.savePath);

  // Translated UI strings
  const STR = {
    title: t("image.title"),
    textToImage: t("image.textToImage"),
    imageToImage: t("image.imageToImage"),
    describeImage: t("image.describeImage"),
    upload: t("image.upload"),
    urlLabel: t("image.url"),
    clickToUpload: t("image.clickToUploadImage"),
    formats: t("image.supportedFormats"),
    inputImagePlaceholder: t("image.inputImagePlaceholder"),
    sizePlaceholder: t("image.sizePlaceholder"),
    generateImage: t("image.generateImage"),
    generating: t("image.generating"),
    modelInfo: t("image.modelInfo", { model: "agnes-image-2.1-flash" }),
    autoDownloadInfo: t("image.autoDownloadInfo"),
    generatedImages: t("image.generatedImages", { count: String(images.length) }),
    noImagesYet: t("image.noImagesYet"),
    pleaseUploadImage: t("image.pleaseUploadImage"),
    pleaseSetApiKeyFirst: t("chat.pleaseSetApiKeyFirst"),
    imageGenerationFailed: t("image.imageGenerationFailed"),
    saved: t("common.saved"),
  };

  const [prompt, setPrompt] = useState("");
  const [size, setSize] = useState("1024x768");
  const [mode, setMode] = useState<"text2img" | "img2img">("text2img");

  // img2img input state
  const [inputMode, setInputMode] = useState<InputMode>("upload");
  const [inputImageUrl, setInputImageUrl] = useState("");
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    dataUri: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // The actual image source sent to API (URL or Data URI)
  const getInputSource = useCallback((): string | null => {
    if (inputMode === "url") {
      return inputImageUrl.trim() || null;
    }
    return uploadedFile?.dataUri || null;
  }, [inputMode, inputImageUrl, uploadedFile]);

  // Handle file selection
  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith("image/")) {
        alert("Please select an image file (PNG, JPG, WebP, etc.)");
        return;
      }

      // Validate file size (max 20MB)
      if (file.size > 20 * 1024 * 1024) {
        alert("File size exceeds 20MB limit.");
        return;
      }

      try {
        const dataUri = await fileToDataUri(file);
        setUploadedFile({ name: file.name, dataUri });
      } catch {
        alert("Failed to read the image file.");
      }
    },
    []
  );

  // Clear uploaded file
  const clearUpload = useCallback(() => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  // Generate image
  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;
    if (!apiKey) {
      alert(STR.pleaseSetApiKeyFirst);
      return;
    }
    if (mode === "img2img" && !getInputSource()) {
      alert(STR.pleaseUploadImage);
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      let result;
      if (mode === "text2img") {
        result = await textToImageUrl(prompt, size);
      } else {
        const source = getInputSource()!;
        result = await imageToImage(prompt, source, { size });
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
      setError(
        err instanceof Error ? err.message : STR.imageGenerationFailed
      );
    } finally {
      setGenerating(false);
    }
  }, [
    prompt,
    size,
    mode,
    apiKey,
    savePath,
    getInputSource,
    setGenerating,
    addImage,
    updateImageLocalPath,
    setError,
    STR.imageGenerationFailed,
    STR.pleaseSetApiKeyFirst,
    STR.pleaseUploadImage,
  ]);

  return (
    <div className="flex h-full">
      {/* Left: Controls */}
      <div className="w-96 border-r border-border p-4 flex flex-col gap-4 overflow-y-auto">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          {STR.title}
        </h2>

        <Tabs
          value={mode}
          onValueChange={(v: string) => setMode(v as "text2img" | "img2img")}
        >
          <TabsList className="w-full">
            <TabsTrigger value="text2img" className="flex-1">
              <Sparkles className="h-4 w-4 mr-1" /> {STR.textToImage}
            </TabsTrigger>
            <TabsTrigger value="img2img" className="flex-1">
              <ArrowRightLeft className="h-4 w-4 mr-1" /> {STR.imageToImage}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Textarea
          placeholder={STR.describeImage}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="min-h-[120px]"
        />

        {/* Image-to-Image input section */}
        {mode === "img2img" && (
          <div className="space-y-3">
            {/* Input mode toggle */}
            <div className="flex gap-2">
              <Button
                variant={inputMode === "upload" ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => setInputMode("upload")}
              >
                <Upload className="h-4 w-4 mr-1" /> {STR.upload}
              </Button>
              <Button
                variant={inputMode === "url" ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => setInputMode("url")}
              >
                <Link className="h-4 w-4 mr-1" /> {STR.urlLabel}
              </Button>
            </div>

            {/* Upload mode */}
            {inputMode === "upload" && (
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  className="hidden"
                  onChange={handleFileSelect}
                />

                {uploadedFile ? (
                  /* Uploaded image preview */
                  <div className="relative rounded-lg border border-border overflow-hidden">
                    <img
                      src={uploadedFile.dataUri}
                      alt="Uploaded"
                      className="w-full aspect-[4/3] object-contain bg-muted"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2 h-7 w-7 p-0"
                      onClick={clearUpload}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-3 py-1.5">
                      <p className="text-xs text-white truncate">
                        {uploadedFile.name}
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Upload button / drop area */
                  <button
                    type="button"
                    className="w-full aspect-[4/3] rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-8 w-8" />
                    <span className="text-sm font-medium">
                      {STR.clickToUpload}
                    </span>
                    <span className="text-xs">
                      {STR.formats}
                    </span>
                  </button>
                )}
              </div>
            )}

            {/* URL mode */}
            {inputMode === "url" && (
              <Input
                placeholder={STR.inputImagePlaceholder}
                value={inputImageUrl}
                onChange={(e) => setInputImageUrl(e.target.value)}
              />
            )}
          </div>
        )}

        <div className="flex gap-2">
          <Input
            placeholder={STR.sizePlaceholder}
            value={size}
            onChange={(e) => setSize(e.target.value)}
            className="flex-1"
          />
        </div>

        <Button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> {STR.generating}
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" /> {STR.generateImage}
            </>
          )}
        </Button>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>{STR.modelInfo}</p>
          <p>{STR.autoDownloadInfo}</p>
        </div>
      </div>

      {/* Right: Results */}
      <div className="flex-1 p-4 overflow-y-auto">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          {STR.generatedImages}
        </h3>
        {images.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <ImageIcon className="h-12 w-12 mx-auto opacity-50 mb-3" />
              <p>{STR.noImagesYet}</p>
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
                        <Download className="h-3 w-3" /> {STR.saved}
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
