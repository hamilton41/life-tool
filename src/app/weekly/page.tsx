"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Task, Record } from "@/lib/types";
import { getWeekStart } from "@/lib/hooks";
import { ChevronLeft, ChevronRight } from "lucide-react";

const DAY_NAMES = ["一", "二", "三", "四", "五", "六", "日"];
const HOURS = Array.from({ length: 16 }, (_, i) => i + 6); // 06:00 ~ 21:00

function parseHour(time: string): number {
  return parseInt(time.split(":")[0], 10);
}

export default function WeeklyPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [records, setRecords] = useState<Record[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [loading, setLoading] = useState(true);

  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() + weekOffset * 7);
  const weekStart = getWeekStart(baseDate);

  const fetchData = useCallback(async () => {
    const [tasksRes, recordsRes] = await Promise.all([
      fetch("/api/tasks"),
      fetch(`/api/records?weekStart=${weekStart}`),
    ]);
    setTasks(await tasksRes.json());
    setRecords(await recordsRes.json());
    setLoading(false);
  }, [weekStart]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // 產生該週的日期
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const today = new Date().toISOString().split("T")[0];

  // 取得某天的時段（相容新舊格式）
  const getSlotForDay = (task: Task, jsDow: number): { start: string; end: string } | null => {
    if (task.daySlots) {
      const slot = task.daySlots.find((s) => s.day === jsDow);
      if (slot) return { start: slot.start, end: slot.end };
    }
    if (task.fixedDays?.includes(jsDow) && task.timeSlot) {
      return task.timeSlot;
    }
    return null;
  };

  // 取得某天某時段的任務
  const getTasksAt = (dayIndex: number, hour: number) => {
    // dayIndex: 0=週一, 1=週二, ..., 6=週日
    // 轉換為 JS 的 day of week: 週一=1, ..., 週六=6, 週日=0
    const jsDow = dayIndex === 6 ? 0 : dayIndex + 1;

    return tasks.filter((task) => {
      if (task.scheduleType !== "fixed") return false;
      const slot = getSlotForDay(task, jsDow);
      if (!slot) return false;
      const startH = parseHour(slot.start);
      const endH = parseHour(slot.end);
      return hour >= startH && hour < endH;
    });
  };

  // 取得某天某任務是否為起始格
  const isStartHourForDay = (task: Task, jsDow: number, hour: number) => {
    const slot = getSlotForDay(task, jsDow);
    if (!slot) return false;
    return parseHour(slot.start) === hour;
  };

  // 取得某天某任務佔幾格
  const getSpanForDay = (task: Task, jsDow: number) => {
    const slot = getSlotForDay(task, jsDow);
    if (!slot) return 1;
    return parseHour(slot.end) - parseHour(slot.start);
  };

  // 檢查某天是否已打卡
  const isDone = (taskId: string, dateStr: string) => {
    return records.some((r) => r.taskId === taskId && r.date === dateStr && r.completed);
  };

  // 沒有時段的任務
  const weeklyTasks = tasks.filter((t) => t.scheduleType === "weekly");
  const noneTasks = tasks.filter((t) => t.scheduleType === "none");
  const fixedNoTime = tasks.filter(
    (t) => t.scheduleType === "fixed" && !t.timeSlot && (!t.daySlots || t.daySlots.length === 0)
  );

  // 週的標題
  const weekStartDate = new Date(weekStart);
  const weekEndDate = new Date(weekStart);
  weekEndDate.setDate(weekEndDate.getDate() + 6);
  const weekLabel = `${weekStartDate.getMonth() + 1}/${weekStartDate.getDate()} - ${weekEndDate.getMonth() + 1}/${weekEndDate.getDate()}`;

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-muted-foreground">載入中...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 pt-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">週曆</h1>
        <div className="flex items-center gap-2">
          <Button size="icon" variant="ghost" onClick={() => setWeekOffset((o) => o - 1)}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button variant="ghost" onClick={() => setWeekOffset(0)} className="text-sm">
            {weekLabel}
          </Button>
          <Button size="icon" variant="ghost" onClick={() => setWeekOffset((o) => o + 1)}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* 週目標任務與彈性任務（無時段） */}
      {(weeklyTasks.length > 0 || noneTasks.length > 0 || fixedNoTime.length > 0) && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {[...weeklyTasks, ...noneTasks, ...fixedNoTime].map((task) => {
              const count = records.filter(
                (r) => r.taskId === task.id && r.completed
              ).length;
              const target = task.scheduleType === "weekly"
                ? task.weeklyTarget || 1
                : task.scheduleType === "fixed" ? task.fixedDays?.length || 1 : 0;
              return (
                <Badge
                  key={task.id}
                  variant={task.scheduleType !== "none" && count >= target ? "default" : "secondary"}
                  className="text-sm py-1 px-3"
                >
                  {task.icon} {task.name} {task.scheduleType === "none" ? `${count}次` : `${count}/${target}`}
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {/* 課表 */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <div className="min-w-[600px]">
            {/* 表頭：星期 */}
            <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b">
              <div className="p-2 text-center text-xs text-muted-foreground" />
              {weekDates.map((date, i) => {
                const dateStr = date.toISOString().split("T")[0];
                const isToday = dateStr === today;
                return (
                  <div
                    key={i}
                    className={`p-2 text-center border-l ${isToday ? "bg-primary/10" : ""}`}
                  >
                    <div className={`text-xs ${isToday ? "font-bold text-primary" : "text-muted-foreground"}`}>
                      {DAY_NAMES[i]}
                    </div>
                    <div className={`text-sm ${isToday ? "font-bold" : ""}`}>
                      {date.getDate()}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 時段格子 */}
            {HOURS.map((hour) => (
              <div key={hour} className="grid grid-cols-[60px_repeat(7,1fr)] border-b last:border-b-0">
                <div className="p-2 text-right text-xs text-muted-foreground pr-3">
                  {hour.toString().padStart(2, "0")}:00
                </div>
                {weekDates.map((date, dayIdx) => {
                  const dateStr = date.toISOString().split("T")[0];
                  const tasksHere = getTasksAt(dayIdx, hour);
                  const isToday = dateStr === today;

                  return (
                    <div
                      key={dayIdx}
                      className={`border-l min-h-[40px] relative ${isToday ? "bg-primary/5" : ""}`}
                    >
                      {(() => {
                        const jsDow = dayIdx === 6 ? 0 : dayIdx + 1;
                        return tasksHere
                          .filter((t) => isStartHourForDay(t, jsDow, hour))
                          .map((task) => {
                            const span = getSpanForDay(task, jsDow);
                            const slot = getSlotForDay(task, jsDow);
                            const done = isDone(task.id, dateStr);
                            return (
                              <div
                                key={task.id}
                                className={`absolute inset-x-0.5 rounded-md px-1 py-0.5 text-xs overflow-hidden ${done ? "opacity-50" : ""}`}
                                style={{
                                  backgroundColor: task.color + "30",
                                  borderLeft: `3px solid ${task.color}`,
                                  height: `${span * 40 - 2}px`,
                                  zIndex: 10,
                                }}
                              >
                                <div className="font-medium truncate">
                                  {task.icon} {task.name}
                                </div>
                                {slot && (
                                  <div className="text-[10px] opacity-70">
                                    {slot.start}-{slot.end}
                                  </div>
                                )}
                              </div>
                            );
                          });
                      })()}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
