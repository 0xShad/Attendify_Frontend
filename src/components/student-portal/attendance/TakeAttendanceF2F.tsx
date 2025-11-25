"use client";
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import F2FFaceCamera from '@/components/f2f-face-camera';
import { markPresentF2F } from '@/lib/api/attendance';
import { useToast } from '@/hooks/use-toast';

type FaceBox = { x: number; y: number; width: number; height: number };

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  classItem?: any;
  sessionInfo?: any | null;
  onRecorded?: (record?: any) => void;
};

export default function TakeAttendanceF2F({ open, onOpenChange, classItem, sessionInfo, onRecorded }: Props) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = React.useState(false);

  const dataURLtoBlob = (dataurl: string) => {
    const arr = dataurl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new Blob([u8arr], { type: mime });
  };

  const handleRecognized = async (dataUrl: string, box: FaceBox, faceHash: string) => {
    // Called by the F2F camera when a face is recognized; upload and mark present
    if (submitting) return false;
    const classId = sessionInfo?.class?.id ?? classItem?.id ?? null;
    const sessionId = sessionInfo?.active_session_id ?? sessionInfo?.session_id ?? null;
    if (!classId || !sessionId) {
      try { toast({ title: 'Error', description: 'Missing class or session id', variant: 'destructive' }); } catch (e) {}
      return false;
    }

    setSubmitting(true);
    try {
      const blob = dataURLtoBlob(dataUrl);
      const resp = await markPresentF2F({ class_id: Number(classId), session_id: Number(sessionId), face_file: blob });

      // parse remarks for match info similar to other components
      try {
        const remarks: string = resp?.remarks || '';
        let matchInfo: any = null;
        const marker = 'MATCH_INFO:';
        const idx = remarks.indexOf(marker);
        if (idx >= 0) {
          const jsonPart = remarks.slice(idx + marker.length).trim();
          try { matchInfo = JSON.parse(jsonPart); } catch (e) { /* ignore parse errors */ }
        }

        if (matchInfo) {
          const THRESHOLD = 0.45;
          const rawScore = typeof matchInfo.score === 'number' ? matchInfo.score : Number(matchInfo.score);
          const hasScore = !Number.isNaN(rawScore) && rawScore != null;
          const scoreStr = hasScore ? rawScore.toFixed(4) : null;

          if (hasScore) {
            const passed = rawScore >= THRESHOLD;
            if (passed) {
              toast({ title: 'Attendance recorded', description: `Match score: ${scoreStr} — Verified` });
            } else {
              toast({ title: 'Face recognition below threshold', description: `Match score: ${scoreStr} — Not verified`, variant: 'destructive' });
            }
          } else {
            if (matchInfo.matched) {
              toast({ title: 'Attendance recorded', description: 'Face matched — attendance recorded.' });
            } else {
              toast({ title: 'Face recognition failed', description: 'Face recognition did not match our records.', variant: 'destructive' });
            }
          }
        } else {
          toast({ title: 'Attendance recorded', description: 'Attendance recorded successfully.' });
        }
      } catch (e) {
        // ignore parsing errors
      }

      if (typeof onRecorded === 'function') {
        try { onRecorded(resp); } catch (e) { console.warn('onRecorded callback threw', e); }
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
      try { toast({ title: 'Error', description: msg, variant: 'destructive' }); } catch (e) {}
      return false;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Face-to-Face Attendance</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-muted-foreground">The camera below will scan faces and attempt to record attendance automatically when a match is found.</p>
          <div className="mt-4">
            <div className="font-medium">Class: {classItem?.course_name ?? classItem?.name ?? '—'}</div>
            <div className="text-xs text-muted-foreground">Session: {sessionInfo?.active_session_id ?? sessionInfo?.session_id ?? '—'}</div>
          </div>

          <div className="mt-4 flex justify-center">
            <F2FFaceCamera onRecognized={handleRecognized} bypassFilters={false} width={560} height={420} className="mx-auto" />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Close</Button>
        </div>

        <DialogFooter />
      </DialogContent>
    </Dialog>
  );
}
