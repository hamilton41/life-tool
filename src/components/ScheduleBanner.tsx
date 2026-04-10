"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Task, DaySlot } from "@/lib/types";
import { Clock } from "lucide-react";

// 取得任務在某天的時段（相容新舊格式）
function getSlotForDay(task: Task, dayOfWeek: number): { start: string; end: string } | null {
  // 新格式
  if (task.daySlots) {
    const slot = task.daySlots.find((s) => s.day === dayOfWeek);
    if (slot) return { start: slot.start, end: slot.end };
  }
  // 舊格式
  if (task.fixedDays?.includes(dayOfWeek) && task.timeSlot) {
    return task.timeSlot;
  }
  return null;
}

export function ScheduleCard() {
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [currentSlot, setCurrentSlot] = useState<{ start: string; end: string } | null>(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const check = () => setNow(new Date());
    check();
    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetch("/api/tasks")
      .then((res) => res.json())
      .then((tasks: Task[]) => {
        const dayOfWeek = now.getDay();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        for (const task of tasks) {
          if (task.scheduleType !== "fixed") continue;
          const slot = getSlotForDay(task, dayOfWeek);
          if (!slot) continue;

          const [startH, startM] = slot.start.split(":").map(Number);
          const [endH, endM] = slot.end.split(":").map(Number);
          const startMinutes = startH * 60 + startM;
          const endMinutes = endH * 60 + endM;

          if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
            setCurrentTask(task);
            setCurrentSlot(slot);
            return;
          }
        }

        setCurrentTask(null);
        setCurrentSlot(null);
      });
  }, [now]);

  if (!currentTask || !currentSlot) return null;

  return (
    <Card
      className="border-0 text-white mb-6"
      style={{ backgroundColor: currentTask.color }}
    >
      <CardContent className="flex items-center gap-4 py-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20 text-2xl">
          {currentTask.icon}
        </div>
        <div className="flex-1">
          <div className="text-xs font-medium opacity-80">現在是</div>
          <div className="text-lg font-bold">{currentTask.name} 時間</div>
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-white/20 px-2.5 py-1">
          <Clock className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">
            {currentSlot.start} - {currentSlot.end}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
