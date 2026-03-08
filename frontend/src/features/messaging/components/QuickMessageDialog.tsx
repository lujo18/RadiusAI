"use client";

import { useState } from "react";
import { AlertTriangle, HelpCircle, Lightbulb, Loader2 } from "lucide-react";

import { SidebarMenuButton } from "@/components/animate-ui/components/radix/sidebar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore } from "@/store";
import { useCreateMessage } from "../hooks";

type SupportStep = "type" | "message";
type SupportType = "error" | "idea";
type SupportStatus = "idle" | "loading" | "success" | "error";

export const QuickMessagingDialog = () => {
  const user = useAuthStore((state) => state.user);

  if (!user?.id) return;

  const { mutate: createMessage, isPending: isMessagePending } = useCreateMessage(user?.id, "a29c6bc4-ced4-4c10-92f9-99bc3cf468c8")

  const [supportOpen, setSupportOpen] = useState(false);
  const [supportStep, setSupportStep] = useState<SupportStep>("type");
  const [supportType, setSupportType] = useState<SupportType | null>(null);
  const [supportMessage, setSupportMessage] = useState("");
  const [supportStatus, setSupportStatus] = useState<SupportStatus>("idle");

  const resetSupport = () => {
    setSupportStep("type");
    setSupportType(null);
    setSupportMessage("");
    setSupportStatus("idle");
  };

  const handleSupportTypeSelect = (type: SupportType) => {
    setSupportType(type);
    setSupportStep("message");
  };

  const handleSupportSubmit = async () => {
    if (!supportType || !supportMessage.trim()) return;

    setSupportStatus("loading");
    try {
      createMessage({
        content: supportMessage.trim(),
        type: supportType,
      });

      setSupportStatus("success");
    } catch {
      setSupportStatus("error");
    }
  };

  return (
    <Dialog
      open={supportOpen}
      onOpenChange={(o) => {
        setSupportOpen(o);
        if (!o) resetSupport();
      }}
    >
      <DialogTrigger asChild>
        <SidebarMenuButton tooltip="Support">
          <HelpCircle className="shrink-0" />
          <span>Support</span>
        </SidebarMenuButton>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {supportStatus === "success" ? (
          <>
            <DialogHeader>
              <DialogTitle>Message sent!</DialogTitle>
              <DialogDescription>
                We&apos;ll get back to you as soon as possible.
              </DialogDescription>
            </DialogHeader>
            <Button
              className="w-full mt-2"
              onClick={() => setSupportOpen(false)}
            >
              Done
            </Button>
          </>
        ) : supportStep === "type" ? (
          <>
            <DialogHeader>
              <DialogTitle>How can we help?</DialogTitle>
              <DialogDescription>
                Select the type of support you need.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-row gap-3 mt-2">
              <Button
                variant="outline"
                className="h-auto flex flex-col gap-2 w-full py-5"
                onClick={() => handleSupportTypeSelect("error")}
              >
                <AlertTriangle className="text-destructive size-6" />
                <span className="font-medium">Bug / Error</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto flex flex-col gap-2 w-full py-5"
                onClick={() => handleSupportTypeSelect("idea")}
              >
                <Lightbulb className="text-primary size-6" />
                <span className="font-medium">Feature Idea</span>
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>
                {supportType === "error"
                  ? "Describe the bug"
                  : "Share your idea"}
              </DialogTitle>
              <DialogDescription>
                {supportType === "error"
                  ? "Tell us what happened and how to reproduce it."
                  : "What would make Radius better for you?"}
              </DialogDescription>
            </DialogHeader>
            <Textarea
              placeholder={
                supportType === "error"
                  ? "Steps to reproduce…"
                  : "I wish Radius could…"
              }
              className="min-h-[140px] resize-none"
              value={supportMessage}
              onChange={(e) => setSupportMessage(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                  handleSupportSubmit();
                }
              }}
              autoFocus
            />
            {supportStatus === "error" && (
              <p className="text-sm text-destructive">
                Something went wrong—please try again.
              </p>
            )}
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="ghost"
                onClick={() => setSupportStep("type")}
                disabled={supportStatus === "loading"}
              >
                Back
              </Button>
              <Button
                onClick={handleSupportSubmit}
                disabled={!supportMessage.trim() || supportStatus === "loading"}
              >
                {supportStatus === "loading" ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Sending…
                  </>
                ) : (
                  "Send message"
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
