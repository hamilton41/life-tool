"use client";

import { useTimer } from "./TimerContext";
import { Button } from "@/components/ui/button";
import { Pause, Play, Square } from "lucide-react";

export function TimerBanner() {
  const { timer, pauseTimer, resumeTimer, stopTimer, openDialog, isTimerActive } = useTimer();

  if (!isTimerActive || !timer.task) return null;

  const m = Math.floor(timer.seconds / 60);
  const s = timer.seconds % 60;
  const timeStr = `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;

  return (
    <div
      className="sticky top-0 z-50 flex items-center justify-between px-4 py-2 text-white shadow-lg cursor-pointer"
      style={{ backgroundColor: timer.task.color }}
      onClick={openDialog}
    >
      <div className="flex items-center gap-2">
        <span className="text-lg">{timer.task.icon}</span>
        <span className="text-sm font-medium">
          正在{timer.task.name}
        </span>
      </div>

      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        <span className="font-mono text-lg font-bold tabular-nums">
          {timeStr}
        </span>
        {timer.running ? (
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-white hover:bg-white/20 hover:text-white"
            onClick={pauseTimer}
          >
            <Pause className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-white hover:bg-white/20 hover:text-white"
            onClick={resumeTimer}
          >
            <Play className="h-4 w-4" />
          </Button>
        )}
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-white hover:bg-white/20 hover:text-white"
          onClick={stopTimer}
        >
          <Square className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
