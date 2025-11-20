"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerClose } from "@/components/ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";

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

  // (browse list removed) only Class Code flow remains

  const handleJoinByCode = async () => {
    if (!classCode.trim()) {
      toast({ title: "Error", description: "Please enter a valid class code", variant: "destructive" });
      return;
    }

    setIsJoining(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsJoining(false);

    // simulate outcomes
    const outcomes = ["success", "not-found", "full", "pending"];
    const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];

    switch (outcome) {
      case "success":
        toast({ title: "Successfully Joined! ✓", description: `You've been enrolled in ${classCode}` });
        onOpenChange(false);
        onJoinSuccess && onJoinSuccess();
        router.push("/student/classes");
        break;
      case "not-found":
        toast({ title: "Class Not Found", description: "The class code you entered doesn't exist or is inactive", variant: "destructive" });
        break;
      case "full":
        toast({ title: "Class Full", description: "This class has reached its maximum capacity. You've been added to the waitlist." });
        break;
      case "pending":
        toast({ title: "Request Sent", description: "Your join request has been sent to the instructor for approval" });
        break;
    }
  };

  // confirmJoinRequest and browse handlers removed — we only support join by code here

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle>Join a Class</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-4 space-y-4 overflow-y-auto">
          <Tabs defaultValue="code" className="w-full">
            <TabsList className="grid w-full grid-cols-1">
                <TabsTrigger value="code">Class Code</TabsTrigger>
              </TabsList>

              <TabsContent value="code" className="space-y-4">
              <div>
                <Label htmlFor="class-code">Enter Class Code</Label>
                <Input id="class-code" value={classCode} onChange={(e) => setClassCode(e.target.value)} placeholder="e.g., CS101-001" className="mt-1" />
                <p className="text-xs text-muted-foreground mt-1">Get the class code from your instructor</p>
              </div>
              <Button className="w-full" onClick={handleJoinByCode} disabled={isJoining}>
                {isJoining ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                Request to Join
              </Button>
              </TabsContent>
          </Tabs>
        </div>
        <DrawerFooter>
          <div className="w-full">
            <DrawerClose asChild>
              <Button variant="outline" className="w-full">Cancel</Button>
            </DrawerClose>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
