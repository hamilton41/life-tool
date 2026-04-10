"use client";

import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from "react";
import { Task } from "@/lib/types";

interface TimerState {
  task: Task | null;
  mode: "countdown" | "stopwatch";
  seconds: number;
  totalSeconds: number;
  running: boolean;
  started: boolean;
  elapsed: number;
}

interface TimerContextType {
  timer: TimerState;
  dialogOpen: boolean;
  openDialog: () => void;
  closeDialog: () => void;
  startTimer: (task: Task) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
  stopTimer: () => void;
  isTimerActive: boolean;
}

const defaultState: TimerState = {
  task: null,
  mode: "countdown",
  seconds: 0,
  totalSeconds: 0,
  running: false,
  started: false,
  elapsed: 0,
};

const TimerContext = createContext<TimerContextType | null>(null);

export function useTimer() {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error("useTimer must be used within TimerProvider");
  return ctx;
}

export function TimerProvider({
  children,
  onComplete,
}: {
  children: ReactNode;
  onComplete?: (task: Task, duration: number) => void;
}) {
  const [timer, setTimer] = useState<TimerState>(defaultState);
  const [dialogOpen, setDialogOpen] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const clearTick = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (timer.running) {
      intervalRef.current = setInterval(() => {
        setTimer((prev) => {
          if (prev.mode === "countdown") {
            if (prev.seconds <= 1) {
              clearTick();
              if (prev.task && onCompleteRef.current) {
                onCompleteRef.current(prev.task, prev.totalSeconds);
              }
              if ("Notification" in window && Notification.permission === "granted" && prev.task) {
                new Notification(`${prev.task.icon} ${prev.task.name} 完成！`, {
                  body: "倒數計時結束",
                });
              }
              setDialogOpen(false);
              return { ...defaultState };
            }
            return {
              ...prev,
              seconds: prev.seconds - 1,
              elapsed: prev.elapsed + 1,
            };
          } else {
            return {
              ...prev,
              seconds: prev.seconds + 1,
              elapsed: prev.elapsed + 1,
            };
          }
        });
      }, 1000);
    } else {
      clearTick();
    }
    return clearTick;
  }, [timer.running, clearTick]);

  // 更新瀏覽器標題
  useEffect(() => {
    if (timer.task && timer.started) {
      const m = Math.floor(timer.seconds / 60);
      const s = timer.seconds % 60;
      const timeStr = `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
      document.title = `${timer.task.icon} ${timeStr} - ${timer.task.name}`;
    } else {
      document.title = "生活小工具";
    }
  }, [timer.seconds, timer.task, timer.started]);

  const startTimer = useCallback((task: Task) => {
    const mode = task.timerMode === "countdown" ? "countdown" : "stopwatch";
    const totalSeconds = mode === "countdown" ? (task.countdownMinutes || 10) * 60 : 0;
    setTimer({
      task,
      mode,
      seconds: totalSeconds,
      totalSeconds,
      running: false,
      started: false,
      elapsed: 0,
    });
    setDialogOpen(true);
  }, []);

  const pauseTimer = useCallback(() => {
    setTimer((prev) => ({ ...prev, running: false }));
  }, []);

  const resumeTimer = useCallback(() => {
    setTimer((prev) => ({ ...prev, running: true, started: true }));
  }, []);

  const resetTimer = useCallback(() => {
    setTimer((prev) => {
      if (!prev.task) return defaultState;
      return {
        ...prev,
        seconds: prev.mode === "countdown" ? prev.totalSeconds : 0,
        running: false,
        started: false,
        elapsed: 0,
      };
    });
  }, []);

  const stopTimer = useCallback(() => {
    setTimer((prev) => {
      if (prev.task && prev.elapsed > 0 && onCompleteRef.current) {
        onCompleteRef.current(prev.task, prev.elapsed);
      }
      return defaultState;
    });
    setDialogOpen(false);
  }, []);

  const openDialog = useCallback(() => setDialogOpen(true), []);
  const closeDialog = useCallback(() => setDialogOpen(false), []);

  const isTimerActive = timer.task !== null && timer.started;

  return (
    <TimerContext.Provider
      value={{
        timer,
        dialogOpen,
        openDialog,
        closeDialog,
        startTimer,
        pauseTimer,
        resumeTimer,
        resetTimer,
        stopTimer,
        isTimerActive,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
}
