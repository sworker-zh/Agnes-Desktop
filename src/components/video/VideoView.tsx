// ============================================================
// Video View — Text-to-Video, Image-to-Video, Multi-Image Video
// ============================================================

import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Video as VideoIcon,
  Loader2,
  Download,
  Film,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { useVideoStore } from "@/stores/videoStore";
import { useSettingsStore } from "@/stores/settingsStore";
import {
  createTextVideo,
  createImageVideo,
  pollVideoResult,
} from "@/services/videoService";
import { downloadFile, getDefaultDownloadDir, generateFilename } from "@/services/downloadService";

const DURATION_PRESETS = [
  { label: "~3s", num_frames: 81, frame_rate: 24 },
  { label: "~5s", num_frames: 121, frame_rate: 24 },
  { label: "~10s", num_frames: 241, frame_rate: 24 },
  { label: "~18s", num_frames: 441, frame_rate: 24 },
];

export function VideoView() {
  const {
    videos,
    isCreating,
    setCreating,
    addVideo,
    updateVideoProgress,
    completeVideo,
    failVideo,
    setError,
  } = useVideoStore();
  const apiKey = useSettingsStore((s) => s.apiKey);
  const savePath = useSettingsStore((s) => s.savePath);

  const [prompt, setPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [durationIdx, setDurationIdx] = useState(1); // default ~5s
  const stopPollRef = useRef<(() => void) | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;
    if (!apiKey) {
      alert("Please set your API Key in Settings first.");
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const preset = DURATION_PRESETS[durationIdx];
      let task;

      if (imageUrl.trim()) {
        task = await createImageVideo(prompt, imageUrl.trim(), {
          num_frames: preset.num_frames,
          frame_rate: preset.frame_rate,
        });
      } else {
        task = await createTextVideo(prompt, {
          num_frames: preset.num_frames,
          frame_rate: preset.frame_rate,
        });
      }

      const videoId = `vid_${Date.now().toString(36)}`;
      addVideo({
        id: videoId,
        prompt,
        videoId: task.video_id,
        status: "queued",
        progress: 0,
        videoUrl: null,
        localPath: null,
        seconds: task.seconds,
        size: task.size,
        timestamp: Date.now(),
      });

      setCreating(false);

      // Start polling
      const stopPoll = pollVideoResult(
        task.video_id,
        (result) => {
          updateVideoProgress(videoId, result.progress, result.status);
        },
        async (result) => {
          const videoUrl = result.remixed_from_video_id;
          if (videoUrl) {
            completeVideo(videoId, videoUrl);
            // Auto-download
            try {
              const dir = savePath || (await getDefaultDownloadDir());
              const filename = generateFilename("agnes_vid", "mp4");
              const localPath = await downloadFile(videoUrl, `${dir}/${filename}`);
              completeVideo(videoId, videoUrl, localPath);
            } catch {
              // Download failed but video URL is available
            }
          }
        },
        (error) => {
          failVideo(videoId, error);
        }
      );

      stopPollRef.current = stopPoll;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Video creation failed");
      setCreating(false);
    }
  }, [
    prompt,
    imageUrl,
    durationIdx,
    apiKey,
    savePath,
    setCreating,
    addVideo,
    updateVideoProgress,
    completeVideo,
    failVideo,
    setError,
  ]);

  const statusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "in_progress":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  return (
    <div className="flex h-full">
      {/* Left: Controls */}
      <div className="w-96 border-r border-border p-4 flex flex-col gap-4 overflow-y-auto">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <VideoIcon className="h-5 w-5" />
          Video Generation
        </h2>

        <Textarea
          placeholder="Describe the video you want to generate..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="min-h-[120px]"
        />

        <Input
          placeholder="Image URL (optional, for image-to-video)"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
        />

        <div>
          <p className="text-xs text-muted-foreground mb-2">Duration</p>
          <div className="flex gap-2">
            {DURATION_PRESETS.map((preset, i) => (
              <Button
                key={i}
                variant={durationIdx === i ? "default" : "outline"}
                size="sm"
                onClick={() => setDurationIdx(i)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </div>

        <Button onClick={handleGenerate} disabled={isCreating} className="w-full">
          {isCreating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating task...
            </>
          ) : (
            <>
              <Film className="h-4 w-4 mr-2" /> Generate Video
            </>
          )}
        </Button>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>Model: <Badge variant="secondary">agnes-video-v2.0</Badge></p>
          <p>Video generation is asynchronous. Results will auto-download when ready.</p>
        </div>
      </div>

      {/* Right: Task List */}
      <div className="flex-1 p-4 overflow-y-auto">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          Video Tasks ({videos.length})
        </h3>
        {videos.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <VideoIcon className="h-12 w-12 mx-auto opacity-50 mb-3" />
              <p>No video tasks yet</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {videos.map((vid) => (
              <Card key={vid.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-2">
                        {vid.prompt}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        {statusIcon(vid.status)}
                        <span className="text-xs capitalize">{vid.status}</span>
                        <Badge variant="secondary" className="text-xs">
                          {vid.size}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {vid.seconds}s
                        </Badge>
                      </div>
                      {(vid.status === "in_progress" || vid.status === "queued") && (
                        <Progress value={vid.progress} className="mt-2 h-2" />
                      )}
                      {vid.status === "completed" && vid.videoUrl && (
                        <video
                          src={vid.videoUrl}
                          controls
                          className="mt-2 w-full max-h-48 rounded-md"
                        />
                      )}
                    </div>
                    <div className="shrink-0">
                      {vid.localPath && (
                        <span className="text-xs text-green-600 flex items-center gap-1">
                          <Download className="h-3 w-3" /> Saved
                        </span>
                      )}
                    </div>
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
