"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Task, Record } from "@/lib/types";
import { ChevronLeft, ChevronRight, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

const DAY_NAMES = ["日", "一", "二", "三", "四", "五", "六"];

export default function StatsPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [records, setRecords] = useState<Record[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string>("all");
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const viewDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const fetchData = useCallback(async () => {
    const [tasksRes, recordsRes] = await Promise.all([
      fetch("/api/tasks"),
      fetch("/api/records"),
    ]);
    setTasks(await tasksRes.json());
    setRecords(await recordsRes.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 篩選當月紀錄
  const monthRecords = records.filter((r) => {
    const d = new Date(r.date);
    return d.getFullYear() === year && d.getMonth() === month && r.completed;
  });

  // 依選擇的任務篩選
  const filteredRecords =
    selectedTaskId === "all"
      ? monthRecords
      : monthRecords.filter((r) => r.taskId === selectedTaskId);

  // 有打卡的日期 set
  const doneDates = new Set(filteredRecords.map((r) => r.date));

  // 本月完成次數（依任務分組）
  const statsByTask = tasks.map((task) => {
    const count = monthRecords.filter((r) => r.taskId === task.id).length;
    const totalDuration = monthRecords
      .filter((r) => r.taskId === task.id && r.duration)
      .reduce((sum, r) => sum + (r.duration || 0), 0);
    return { task, count, totalDuration };
  });

  // 月曆資料
  const firstDay = new Date(year, month, 1).getDay(); // 第一天星期幾
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date().toISOString().split("T")[0];

  // 產生月曆格子
  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}小時${m}分`;
    return `${m}分鐘`;
  };

  // 選中日期的紀錄
  const selectedDateRecords = selectedDate
    ? records.filter((r) => r.date === selectedDate && r.completed)
    : [];

  const getTaskById = (id: string) => tasks.find((t) => t.id === id);

  const handleDeleteRecord = async (recordId: string) => {
    await fetch(`/api/records?id=${recordId}`, { method: "DELETE" });
    setRecords((prev) => prev.filter((r) => r.id !== recordId));
    toast("紀錄已刪除");
  };

  const handleAddRecord = async (taskId: string) => {
    if (!selectedDate) return;
    const res = await fetch("/api/records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        taskId,
        date: selectedDate,
        completed: true,
      }),
    });
    const record = await res.json();
    setRecords((prev) => [...prev, record]);
    const task = getTaskById(taskId);
    toast(`${task?.icon} ${task?.name} 補打卡成功！`);
  };

  // 該日期還沒打卡的任務
  const unrecordedTasks = selectedDate
    ? tasks.filter(
        (t) => !records.some((r) => r.taskId === t.id && r.date === selectedDate && r.completed)
      )
    : [];

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
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">統計</h1>
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setMonthOffset((o) => o - 1)}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            onClick={() => setMonthOffset(0)}
            className="text-sm min-w-[100px]"
          >
            {year} 年 {month + 1} 月
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setMonthOffset((o) => o + 1)}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* 任務篩選 */}
      <div className="mb-4">
        <Select value={selectedTaskId} onValueChange={(v) => setSelectedTaskId(v ?? "all")}>
          <SelectTrigger>
            <SelectValue placeholder="選擇任務" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部任務</SelectItem>
            {tasks.map((task) => (
              <SelectItem key={task.id} value={task.id}>
                {task.icon} {task.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 本月總次數 */}
      <Card className="mb-4">
        <CardContent className="py-6 text-center">
          <div className="text-4xl font-bold">{filteredRecords.length}</div>
          <div className="mt-1 text-sm text-muted-foreground">
            本月完成次數
          </div>
        </CardContent>
      </Card>

      {/* 月曆熱力圖 */}
      <Card className="mb-4">
        <CardContent className="py-4">
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground mb-2">
            {DAY_NAMES.map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarCells.map((day, i) => {
              if (day === null) {
                return <div key={`empty-${i}`} className="h-10" />;
              }

              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const isDone = doneDates.has(dateStr);
              const isToday = dateStr === today;

              // 計算當天完成幾次（用於深淺）
              const dayCount = filteredRecords.filter(
                (r) => r.date === dateStr
              ).length;

              let bgClass = "bg-muted/50";
              if (isDone) {
                if (dayCount >= 3) bgClass = "bg-green-500";
                else if (dayCount >= 2) bgClass = "bg-green-400";
                else bgClass = "bg-green-300 dark:bg-green-600";
              }

              return (
                <button
                  type="button"
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`flex h-10 items-center justify-center rounded-md text-sm transition-all cursor-pointer hover:opacity-80 ${bgClass} ${
                    isToday ? "ring-2 ring-primary ring-offset-1" : ""
                  } ${isDone ? "text-white font-medium" : "text-muted-foreground"}`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 各任務統計 */}
      {selectedTaskId === "all" && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">各任務統計</h2>
          {statsByTask.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                還沒有紀錄
              </CardContent>
            </Card>
          ) : (
            statsByTask.map(({ task, count, totalDuration }) => (
              <Card key={task.id}>
                <CardContent className="flex items-center gap-4 py-4">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl"
                    style={{ backgroundColor: task.color + "20" }}
                  >
                    {task.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{task.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {totalDuration > 0
                        ? `總計 ${formatDuration(totalDuration)}`
                        : ""}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{count}</div>
                    <div className="text-xs text-muted-foreground">次</div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* 日期紀錄 Dialog */}
      <Dialog open={!!selectedDate} onOpenChange={(open) => !open && setSelectedDate(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {selectedDate &&
                new Date(selectedDate + "T00:00:00").toLocaleDateString("zh-TW", {
                  month: "long",
                  day: "numeric",
                  weekday: "long",
                })}
            </DialogTitle>
          </DialogHeader>
          {/* 已打卡的紀錄 */}
          {selectedDateRecords.length > 0 && (
            <div className="space-y-2">
              {selectedDateRecords.map((record) => {
                const task = getTaskById(record.taskId);
                if (!task) return null;
                return (
                  <div
                    key={record.id}
                    className="flex items-center gap-3 rounded-lg border p-3"
                  >
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xl"
                      style={{ backgroundColor: task.color + "20" }}
                    >
                      {task.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{task.name}</div>
                      {record.duration != null && record.duration > 0 && (
                        <div className="text-xs text-muted-foreground">
                          {formatDuration(record.duration)}
                        </div>
                      )}
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDeleteRecord(record.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          {/* 補打卡 */}
          {unrecordedTasks.length > 0 && (
            <div className="space-y-2">
              {selectedDateRecords.length > 0 && (
                <div className="border-t pt-3 mt-3" />
              )}
              <p className="text-sm text-muted-foreground">補打卡</p>
              {unrecordedTasks.map((task) => (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => handleAddRecord(task.id)}
                  className="flex w-full items-center gap-3 rounded-lg border border-dashed p-3 transition-colors hover:bg-muted/50"
                >
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xl"
                    style={{ backgroundColor: task.color + "20" }}
                  >
                    {task.icon}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="font-medium text-sm">{task.name}</div>
                  </div>
                  <Plus className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          )}

          {selectedDateRecords.length === 0 && unrecordedTasks.length === 0 && (
            <div className="py-6 text-center text-muted-foreground">
              沒有任務可以打卡
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
