"use client";

import * as React from "react";
import { IconTrash } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  announcement: any | null;
  error?: string | null;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
}

export function DeleteAnnouncementDialog({ open, onOpenChange, announcement, error, loading, onConfirm }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete announcement</DialogTitle>
          <DialogDescription>This will remove the announcement from your list. This action cannot be undone in the UI.</DialogDescription>
        </DialogHeader>

        {announcement && (
          <div className="py-4">
            <div className="bg-stone-50 rounded-lg p-4 space-y-2">
              <div>
                <p className="font-semibold">{announcement.title}</p>
                <p className="text-sm text-muted-foreground">{announcement.createdDate} • {announcement.classCode ?? announcement.classIds?.join(', ')}</p>
              </div>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <IconTrash className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-red-900">Delete failed</h4>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={() => onConfirm()} disabled={loading || !!error}>
            <IconTrash className="h-4 w-4 mr-2" />
            Delete announcement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default DeleteAnnouncementDialog;
