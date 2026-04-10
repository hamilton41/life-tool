"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useTimer } from "@/components/TimerContext";
import { Task, Record } from "@/lib/types";
import { getWeekStart, getDayOfWeek } from "@/lib/hooks";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check, Timer as TimerIcon, Plus } from "lucide-react";
import { toast } from "sonner";
import { formatTime } from "@/lib/hooks";
import { ScheduleCard } from "@/components/ScheduleBanner";

export default function HomePage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkInOpen, setCheckInOpen] = useState(false);
  const { startTimer, isTimerActive } = useTimer();

  const today = new Date().toISOString().split("T")[0];
  const weekStart = getWeekStart();
  const dayOfWeek = getDayOfWeek();

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

  // 今天需要做的任務
  const todayTasks = tasks.filter((task) => {
    if (task.scheduleType === "weekly") return true;
    if (task.scheduleType === "fixed" && task.fixedDays) {
      return task.fixedDays.includes(dayOfWeek);
    }
    return false;
  });

  // 計算某任務本週完成次數
  const getWeeklyCount = (taskId: string) => {
    return records.filter((r) => r.taskId === taskId && r.completed).length;
  };

  // 今天是否已完成
  const isTodayDone = (taskId: string) => {
    return records.some((r) => r.taskId === taskId && r.date === today && r.completed);
  };

  // 快速打卡
  const quickCheck = async (task: Task) => {
    const res = await fetch("/api/records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        taskId: task.id,
        date: today,
        completed: true,
      }),
    });
    const record = await res.json();
    setRecords((prev) => [...prev, record]);
    toast(`${task.icon} ${task.name} 打卡成功！`);
  };

  // 今日所有打卡紀錄
  const todayRecords = records.filter((r) => r.date === today && r.completed);

  // 不在今日待辦中、但還沒打卡的任務（可以額外打卡）
  const todayTaskIds = new Set(todayTasks.map((t) => t.id));
  const extraTasks = tasks.filter(
    (t) => !todayTaskIds.has(t.id) && !isTodayDone(t.id)
  );

  // 啟動計時
  const handleStartTimer = (task: Task) => {
    if (isTimerActive) {
      toast.error("已有計時進行中，請先結束再開始新的");
      return;
    }
    startTimer(task);
    toast(`${task.icon} ${task.name} 開始計時`);
  };

  const dayNames = ["日", "一", "二", "三", "四", "五", "六"];

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-muted-foreground">載入中...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 pt-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">今日待辦</h1>
        <p className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString("zh-TW", {
            year: "numeric",
            month: "long",
            day: "numeric",
            weekday: "long",
          })}
        </p>
      </div>

      {/* 現在應該做什麼 */}
      <ScheduleCard />

      {/* 任務列表 */}
      {todayTasks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            還沒有任務，去「任務」頁面新增吧！
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {todayTasks.map((task) => {
            const done = isTodayDone(task.id);
            const weeklyCount = getWeeklyCount(task.id);
            const target = task.scheduleType === "weekly"
              ? task.weeklyTarget || 1
              : task.fixedDays?.length || 1;
            const progressPct = Math.min((weeklyCount / target) * 100, 100);

            return (
              <Card key={task.id} className={`transition-all ${done ? "opacity-60" : ""}`}>
                <CardContent className="flex items-center gap-4 py-4">
                  {/* 左側：圖示 */}
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl"
                    style={{ backgroundColor: task.color + "20" }}
                  >
                    {task.icon}
                  </div>

                  {/* 中間：資訊 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{task.name}</span>
                      {done && (
                        <Badge variant="secondary" className="text-xs">
                          <Check className="mr-1 h-3 w-3" /> 已完成
                        </Badge>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <Progress value={progressPct} className="h-1.5 flex-1" />
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {weeklyCount}/{target}
                      </span>
                    </div>
                    {task.scheduleType === "fixed" && (() => {
                      const slot = task.daySlots?.find((s) => s.day === dayOfWeek)
                        || (task.timeSlot && task.fixedDays?.includes(dayOfWeek) ? task.timeSlot : null);
                      if (!slot) return null;
                      return (
                        <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-0.5">
                          <TimerIcon className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs font-medium">
                            {slot.start} - {slot.end}
                          </span>
                        </div>
                      );
                    })()}
                  </div>

                  {/* 右側：操作按鈕 */}
                  <div className="flex shrink-0 gap-1">
                    {task.timerMode !== "none" && !done && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleStartTimer(task)}
                      >
                        <TimerIcon className="h-5 w-5" />
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant={done ? "ghost" : "default"}
                      disabled={done}
                      onClick={() => quickCheck(task)}
                    >
                      <Check className="h-5 w-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* 今日紀錄 */}
      {tasks.length > 0 && (
        <div className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">今日紀錄</h2>
            <Button
              size="sm"
              variant="outline"
              className="gap-1"
              onClick={() => setCheckInOpen(true)}
            >
              <Plus className="h-4 w-4" /> 打卡
            </Button>
          </div>
          {todayRecords.length > 0 ? (
            <div className="space-y-2">
              {todayRecords.map((record) => {
                const task = tasks.find((t) => t.id === record.taskId);
                if (!task) return null;
                return (
                  <div
                    key={record.id}
                    className="flex items-center gap-3 rounded-lg border p-3"
                  >
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-lg"
                      style={{ backgroundColor: task.color + "20" }}
                    >
                      {task.icon}
                    </div>
                    <span className="text-sm flex-1">{task.name}</span>
                    {record.duration != null && record.duration > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {formatTime(record.duration)}
                      </span>
                    )}
                    <Check className="h-4 w-4 text-green-500" />
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">還沒有紀錄</p>
          )}
        </div>
      )}

      {/* 打卡選單 Dialog */}
      <Dialog open={checkInOpen} onOpenChange={setCheckInOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>選擇要打卡的任務</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {tasks.map((task) => (
              <button
                key={task.id}
                type="button"
                onClick={() => {
                  quickCheck(task);
                  setCheckInOpen(false);
                }}
                className="flex w-full items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xl"
                  style={{ backgroundColor: task.color + "20" }}
                >
                  {task.icon}
                </div>
                <span className="text-sm font-medium flex-1 text-left">{task.name}</span>
                <Plus className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* 本週總覽 */}
      {tasks.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-lg font-semibold">本週進度</h2>
          <Card>
            <CardContent className="py-4">
              <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground mb-2">
                {dayNames.map((d, i) => (
                  <div key={i} className={i === dayOfWeek ? "font-bold text-primary" : ""}>
                    {d}
                  </div>
                ))}
              </div>
              <div className="space-y-2 mt-3">
                {tasks.map((task) => {
                  const weeklyCount = getWeeklyCount(task.id);
                  const target = task.scheduleType === "weekly"
                    ? task.weeklyTarget || 1
                    : task.fixedDays?.length || 1;

                  return (
                    <div key={task.id} className="flex items-center gap-2">
                      <span className="w-6 text-center">{task.icon}</span>
                      <span className="text-sm flex-1 truncate">{task.name}</span>
                      <span className={`text-sm font-mono ${weeklyCount >= target ? "text-green-500" : ""}`}>
                        {weeklyCount}/{target}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
