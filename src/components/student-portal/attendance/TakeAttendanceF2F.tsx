"use client";
import React from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import F2FFaceCamera from "@/components/f2f-face-camera";
import { markPresentF2F } from "@/lib/api/attendance";
import { useToast } from "@/hooks/use-toast";
import { checkAuth } from "@/lib/clientAuth";

type FaceBox = { x: number; y: number; width: number; height: number };

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  classItem?: any;
  sessionInfo?: any | null;
  onRecorded?: (record?: any) => void;
};

export default function TakeAttendanceF2F({
  open,
  onOpenChange,
  classItem,
  sessionInfo,
  onRecorded,
}: Props) {
  const { toast } = useToast();
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [cameraWidth, setCameraWidth] = React.useState<number>(560);
  const cameraHeight = React.useMemo(
    () => Math.round(cameraWidth * (420 / 560)),
    [cameraWidth]
  );

  // adapt camera size to available width (responsive)
  React.useEffect(() => {
    function updateSize() {
      try {
        const avail =
          containerRef.current?.clientWidth || window.innerWidth || 560;
        // keep some horizontal padding on small screens; allow larger cap on desktop
        const padded = Math.max(300, Math.min(900, Math.floor(avail - 32)));
        setCameraWidth(padded);
      } catch (e) {
        /* ignore */
      }
    }
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const dataURLtoBlob = (dataurl: string) => {
    const arr = dataurl.split(",");
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new Blob([u8arr], { type: mime });
  };

  const handleRecognized = async (
    dataUrl: string,
    box: FaceBox,
    faceHash: string
  ) => {
    // Called by the F2F camera when a face is recognized; upload and mark present
    if (submitting) return false;
    const classId = sessionInfo?.class?.id ?? classItem?.id ?? null;
    const sessionId =
      sessionInfo?.active_session_id ?? sessionInfo?.session_id ?? null;
    if (!classId || !sessionId) {
      try {
        toast({
          title: "Error",
          description: "Missing class or session id",
          variant: "destructive",
        });
      } catch (e) {}
      return false;
    }

    // Verify session before marking attendance
    try {
      const ok = await checkAuth();
      if (!ok) {
        const redirectTo = encodeURIComponent(window.location.pathname || "/");
        router.push(`/auth/login?redirect=${redirectTo}`);
        return false;
      }
    } catch (err) {
      const redirectTo = encodeURIComponent(window.location.pathname || "/");
      router.push(`/auth/login?redirect=${redirectTo}`);
      return false;
    }

    setSubmitting(true);
    try {
      const blob = dataURLtoBlob(dataUrl);
      const resp = await markPresentF2F({
        class_id: Number(classId),
        session_id: Number(sessionId),
        face_file: blob,
      });

      // parse remarks for match info similar to other components
      try {
        const remarks: string = resp?.remarks || "";
        let matchInfo: any = null;
        const marker = "MATCH_INFO:";
        const idx = remarks.indexOf(marker);
        if (idx >= 0) {
          const jsonPart = remarks.slice(idx + marker.length).trim();
          try {
            matchInfo = JSON.parse(jsonPart);
          } catch (e) {
            /* ignore parse errors */
          }
        }

        if (matchInfo) {
          const THRESHOLD = 0.45;
          const rawScore =
            typeof matchInfo.score === "number"
              ? matchInfo.score
              : Number(matchInfo.score);
          const hasScore = !Number.isNaN(rawScore) && rawScore != null;
          const scoreStr = hasScore ? rawScore.toFixed(4) : null;

          if (hasScore) {
            const passed = rawScore >= THRESHOLD;
            if (passed) {
              toast({
                title: "Attendance recorded",
                description: `Match score: ${scoreStr} — Verified`,
              });
            } else {
              toast({
                title: "Face recognition below threshold",
                description: `Match score: ${scoreStr} — Not verified`,
                variant: "destructive",
              });
            }
          } else {
            if (matchInfo.matched) {
              toast({
                title: "Attendance recorded",
                description: "Face matched — attendance recorded.",
              });
            } else {
              toast({
                title: "Face recognition failed",
                description:
                  "Couldn't verify your face. Tips: ensure even lighting, remove masks/glasses, hold your face centered and still, look directly at the camera, and try moving slightly closer or farther.",
                variant: "destructive",
              });
            }
          }
        } else {
          toast({
            title: "Attendance recorded",
            description: "Attendance recorded successfully.",
          });
        }
      } catch (e) {
        // ignore parsing errors
      }

      if (typeof onRecorded === "function") {
        try {
          onRecorded(resp);
        } catch (e) {
          console.warn("onRecorded callback threw", e);
        }
      }

      // keep a small delay for UI feedback then allow further scans
      setTimeout(() => {
        setSubmitting(false);
        // do NOT close the dialog — F2F flow should continue scanning multiple faces
      }, 700);

      return resp;
    } catch (err: any) {
      setSubmitting(false);
      const msg = err?.message ?? String(err);
      try {
        toast({ title: "Error", description: msg, variant: "destructive" });
      } catch (e) {}
      return false;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Face-to-Face Attendance</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            The camera below will scan faces and attempt to record attendance
            automatically when a match is found.
          </p>
          <div className="mt-4">
            <div className="font-medium">
              Class: {classItem?.course_name ?? classItem?.name ?? "—"}
            </div>
            <div className="text-xs text-muted-foreground">
              Session:{" "}
              {sessionInfo?.active_session_id ?? sessionInfo?.session_id ?? "—"}
            </div>
          </div>

          <div
            ref={containerRef}
            className="mt-4 w-full"
            style={{ maxWidth: `${cameraWidth}px` }}
          >
            <div
              className="mx-auto w-full"
              style={{ aspectRatio: "560 / 420" }}
            >
              <F2FFaceCamera
                onRecognized={handleRecognized}
                bypassFilters={true}
                width={cameraWidth}
                height={cameraHeight}
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
        <DialogFooter />
      </DialogContent>
    </Dialog>
  );
}
