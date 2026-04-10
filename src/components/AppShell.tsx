"use client";

import { ReactNode, useCallback } from "react";
import { ThemeProvider } from "./ThemeProvider";
import { TimerProvider, useTimer } from "./TimerContext";
import { TimerBanner } from "./TimerBanner";
import { Timer } from "./Timer";
import { BottomNav } from "./BottomNav";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Toaster } from "@/components/ui/sonner";
import { Task } from "@/lib/types";
import { toast } from "sonner";

function TimerDialog() {
  const { timer, dialogOpen, closeDialog } = useTimer();

  return (
    <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center">
            {timer.task?.icon} {timer.task?.name}
          </DialogTitle>
        </DialogHeader>
        {timer.task && <Timer />}
      </DialogContent>
    </Dialog>
  );
}

function AppContent({ children }: { children: ReactNode }) {
  return (
    <>
      <TimerBanner />
      <main className="flex-1 pb-20">{children}</main>
      <BottomNav />
      <TimerDialog />
      <Toaster />
    </>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const handleTimerComplete = useCallback(async (task: Task, duration: number) => {
    const today = new Date().toISOString().split("T")[0];
    await fetch("/api/records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        taskId: task.id,
        date: today,
        duration,
        completed: true,
        startTime: new Date(Date.now() - duration * 1000).toISOString(),
        endTime: new Date().toISOString(),
      }),
    });
    const mins = Math.floor(duration / 60);
    const secs = duration % 60;
    toast.success(`${task.icon} ${task.name} 完成！耗時 ${mins}分${secs}秒`);
  }, []);

  return (
    <ThemeProvider>
      <TimerProvider onComplete={handleTimerComplete}>
        <AppContent>{children}</AppContent>
      </TimerProvider>
    </ThemeProvider>
  );
}
