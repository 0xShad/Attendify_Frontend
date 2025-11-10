"use client";

import * as React from "react";
import { IconTrash, IconUser } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { User } from "./types";

interface DeleteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  error?: string | null;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
}

export function DeleteUserDialog({ open, onOpenChange, user, error, loading, onConfirm }: DeleteUserDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete user</DialogTitle>
          <DialogDescription>
            This will mark the profile as deleted. You can perform a hard delete from the backend if required.
          </DialogDescription>
        </DialogHeader>

        {user && (
          <div className="py-4">
            <div className="bg-stone-50 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <IconUser className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold">{user.name}</p>
                  {user.email && <p className="text-sm text-muted-foreground">{user.email}</p>}
                  <p className="text-sm text-muted-foreground">ID: {user.id}</p>
                </div>
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
            Delete user
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default DeleteUserDialog;
