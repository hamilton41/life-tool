"use client";

import { Button } from "@/components/ui/button";
import { formatTime } from "@/lib/hooks";
import { useTimer } from "./TimerContext";
import { Play, Pause, RotateCcw, Square } from "lucide-react";

export function Timer() {
  const { timer, pauseTimer, resumeTimer, resetTimer, stopTimer, closeDialog } = useTimer();
  const { seconds, running, started, mode, totalSeconds } = timer;

  const handleStart = () => {
    resumeTimer();
  };

  const progress = mode === "countdown" && totalSeconds > 0
    ? ((totalSeconds - seconds) / totalSeconds) * 100
    : 0;

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      {/* 圓形計時顯示 */}
      <div className="relative flex h-48 w-48 items-center justify-center">
        <svg className="absolute h-full w-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50" cy="50" r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-muted"
          />
          {mode === "countdown" && (
            <circle
              cx="50" cy="50" r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
              strokeLinecap="round"
              className="text-primary transition-all duration-1000"
            />
          )}
        </svg>
        <span className="text-4xl font-mono font-bold tabular-nums">
          {formatTime(seconds)}
        </span>
      </div>

      {/* 控制按鈕 */}
      <div className="flex items-center gap-3">
        {!started ? (
          <>
            <Button onClick={handleStart} size="lg" className="gap-2">
              <Play className="h-5 w-5" /> 開始
            </Button>
            <Button onClick={() => { resetTimer(); closeDialog(); }} variant="ghost" size="lg">
              取消
            </Button>
          </>
        ) : (
          <>
            {running ? (
              <Button onClick={pauseTimer} variant="secondary" size="lg" className="gap-2">
                <Pause className="h-5 w-5" /> 暫停
              </Button>
            ) : (
              <Button onClick={handleStart} size="lg" className="gap-2">
                <Play className="h-5 w-5" /> 繼續
              </Button>
            )}
            <Button onClick={resetTimer} variant="ghost" size="lg">
              <RotateCcw className="h-5 w-5" />
            </Button>
            <Button onClick={stopTimer} variant="destructive" size="lg" className="gap-2">
              <Square className="h-5 w-5" /> 結束
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
