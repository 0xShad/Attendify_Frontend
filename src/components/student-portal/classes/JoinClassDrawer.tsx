"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import { classesAPI } from "@/lib/api/classes";
import { checkAuth } from "@/lib/clientAuth";

export default function JoinClassDrawer({
  open,
  onOpenChange,
  onJoinSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onJoinSuccess?: () => void;
}) {
  const { toast } = useToast();
  const router = useRouter();

  const [classCode, setClassCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  // Disable body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
    } else {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
    }

    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
    };
  }, [open]);

  // (browse list removed) only Class Code flow remains

  const handleJoinByCode = async () => {
    if (!classCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid class code",
        variant: "destructive",
      });
      return;
    }

    // Verify session before joining class
    try {
      const ok = await checkAuth();
      if (!ok) {
        const redirectTo = encodeURIComponent(window.location.pathname || "/");
        router.push(`/auth/login?redirect=${redirectTo}`);
        return;
      }
    } catch (err) {
      const redirectTo = encodeURIComponent(window.location.pathname || "/");
      router.push(`/auth/login?redirect=${redirectTo}`);
      return;
    }

    setIsJoining(true);
    try {
      const enrollee = await classesAPI.joinMyClass(classCode.trim());
      toast({
        title: "Successfully Joined! ✓",
        description: `You've been enrolled in ${classCode}`,
      });
      onOpenChange(false);
      onJoinSuccess && onJoinSuccess();
      router.push("/student/classes");
    } catch (err: any) {
      // Map known statuses to user-friendly messages
      const status = err?.status ?? null;
      const msg = err?.message ?? String(err);
      if (status === 401) {
        toast({
          title: "Unauthorized",
          description: "Please sign in to join classes.",
          variant: "destructive",
        });
      } else if (status === 403) {
        toast({
          title: "Forbidden",
          description: "Only students may join classes via this form.",
          variant: "destructive",
        });
      } else if (status === 400) {
        toast({
          title: "Unable to Join",
          description: msg || "Invalid class code or already enrolled",
          variant: "destructive",
        });
      } else if (status === 404) {
        toast({
          title: "Class Not Found",
          description: msg || "The class code you entered doesn't exist",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Failed to Join",
          description: msg || "An unexpected error occurred",
          variant: "destructive",
        });
      }
    } finally {
      setIsJoining(false);
    }
  };

  // confirmJoinRequest and browse handlers removed — we only support join by code here

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      dismissible={true}
      shouldScaleBackground={false}
      modal={true}
      preventScrollRestoration={true}
    >
      <DrawerContent
        className="flex flex-col outline-none !fixed !bottom-0 !left-0 !right-0"
        style={{
          height: "450px",
          maxHeight: "450px",
        }}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DrawerHeader className="shrink-0 pb-2 px-4">
          <DrawerTitle>Join a Class</DrawerTitle>
        </DrawerHeader>

        {/* Scrollable content container */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-2">
          <div className="space-y-3">
            <Tabs defaultValue="code" className="w-full">
              <TabsList className="grid w-full grid-cols-1">
                <TabsTrigger value="code">Class Code</TabsTrigger>
              </TabsList>

              <TabsContent value="code" className="space-y-3 pt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="class-code" className="text-sm">
                    Enter Class Code
                  </Label>
                  <Input
                    id="class-code"
                    value={classCode}
                    onChange={(e) => setClassCode(e.target.value)}
                    placeholder="e.g., CS101-001"
                    className="h-10"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    inputMode="text"
                  />
                  <p className="text-xs text-muted-foreground">
                    Get the class code from your instructor
                  </p>
                </div>
                <Button
                  className="w-full h-10"
                  onClick={handleJoinByCode}
                  disabled={isJoining}
                >
                  {isJoining ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  Request to Join
                </Button>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <DrawerFooter className="shrink-0 border-t pt-3 pb-3 px-4">
          <DrawerClose asChild>
            <Button variant="outline" className="w-full h-10">
              Cancel
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
