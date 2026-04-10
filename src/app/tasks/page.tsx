"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Task, DaySlot } from "@/lib/types";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

const EMOJI_OPTIONS = ["📌", "🧘", "🏃", "💼", "📖", "🎨", "🎵", "✍️", "💻", "🍳", "🌙", "💪"];
const COLOR_OPTIONS = ["#6366f1", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ef4444", "#14b8a6"];
const DAY_NAMES = ["日", "一", "二", "三", "四", "五", "六"];

interface DaySlotForm {
  enabled: boolean;
  hasTime: boolean;
  start: string;
  end: string;
}

interface TaskForm {
  name: string;
  icon: string;
  color: string;
  scheduleType: "weekly" | "fixed";
  weeklyTarget: number;
  days: DaySlotForm[]; // 7 天，index 0=日 ~ 6=六
  timerMode: "countdown" | "stopwatch" | "none";
  countdownMinutes: number;
}

const defaultDaySlot: DaySlotForm = { enabled: false, hasTime: false, start: "09:00", end: "10:00" };

const emptyForm: TaskForm = {
  name: "",
  icon: "📌",
  color: "#6366f1",
  scheduleType: "weekly",
  weeklyTarget: 3,
  days: Array.from({ length: 7 }, () => ({ ...defaultDaySlot })),
  timerMode: "none",
  countdownMinutes: 10,
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TaskForm>(emptyForm);

  const fetchTasks = useCallback(async () => {
    const res = await fetch("/api/tasks");
    setTasks(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (task: Task) => {
    setEditingId(task.id);

    // 還原 days 表單
    const days = Array.from({ length: 7 }, (_, i) => {
      const slot = task.daySlots?.find((s) => s.day === i);
      if (slot) {
        return { enabled: true, hasTime: true, start: slot.start, end: slot.end };
      }
      // 相容舊資料：fixedDays + timeSlot
      const isFixed = task.fixedDays?.includes(i);
      if (isFixed) {
        return {
          enabled: true,
          hasTime: !!task.timeSlot,
          start: task.timeSlot?.start || "09:00",
          end: task.timeSlot?.end || "10:00",
        };
      }
      return { ...defaultDaySlot };
    });

    setForm({
      name: task.name,
      icon: task.icon,
      color: task.color,
      scheduleType: task.scheduleType,
      weeklyTarget: task.weeklyTarget || 3,
      days,
      timerMode: task.timerMode,
      countdownMinutes: task.countdownMinutes || 10,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("請輸入任務名稱");
      return;
    }

    const enabledDays = (form.days || [])
      .map((d, i) => ({ ...d, day: i }))
      .filter((d) => d.enabled);

    const fixedDays = enabledDays.map((d) => d.day);
    const daySlots: DaySlot[] = enabledDays
      .filter((d) => d.hasTime)
      .map((d) => ({ day: d.day, start: d.start, end: d.end }));

    const payload = {
      ...(editingId ? { id: editingId } : {}),
      name: form.name.trim(),
      icon: form.icon,
      color: form.color,
      scheduleType: form.scheduleType,
      weeklyTarget: form.scheduleType === "weekly" ? form.weeklyTarget : undefined,
      fixedDays: form.scheduleType === "fixed" ? fixedDays : undefined,
      daySlots: form.scheduleType === "fixed" && daySlots.length > 0 ? daySlots : undefined,
      timeSlot: undefined, // 清掉舊欄位
      timerMode: form.timerMode,
      countdownMinutes: form.timerMode === "countdown" ? form.countdownMinutes : undefined,
    };

    const res = await fetch("/api/tasks", {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const saved = await res.json();
    if (editingId) {
      setTasks((prev) => prev.map((t) => (t.id === saved.id ? saved : t)));
      toast("任務已更新");
    } else {
      setTasks((prev) => [...prev, saved]);
      toast("任務已新增");
    }

    setDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/tasks?id=${id}`, { method: "DELETE" });
    setTasks((prev) => prev.filter((t) => t.id !== id));
    toast("任務已刪除");
  };

  const toggleDay = (dayIndex: number) => {
    setForm((prev) => {
      const days = [...prev.days];
      days[dayIndex] = { ...days[dayIndex], enabled: !days[dayIndex].enabled };
      return { ...prev, days };
    });
  };

  const updateDaySlot = (dayIndex: number, updates: Partial<DaySlotForm>) => {
    setForm((prev) => {
      const days = [...prev.days];
      days[dayIndex] = { ...days[dayIndex], ...updates };
      return { ...prev, days };
    });
  };

  // 取得任務的時段顯示文字
  const getScheduleText = (task: Task) => {
    if (task.scheduleType === "weekly") {
      return `每週 ${task.weeklyTarget || 1} 次`;
    }

    const parts: string[] = [];
    if (task.daySlots && task.daySlots.length > 0) {
      // 新格式：每天不同時段
      for (const slot of task.daySlots) {
        parts.push(`週${DAY_NAMES[slot.day]} ${slot.start}-${slot.end}`);
      }
      // 沒有時段的天
      const slotsSet = new Set(task.daySlots.map((s) => s.day));
      const noTimeDays = (task.fixedDays || []).filter((d) => !slotsSet.has(d));
      if (noTimeDays.length > 0) {
        parts.push(noTimeDays.map((d) => `週${DAY_NAMES[d]}`).join("、"));
      }
    } else {
      // 舊格式
      const dayStr = task.fixedDays?.map((d) => `週${DAY_NAMES[d]}`).join("、") || "未設定";
      parts.push(dayStr);
      if (task.timeSlot) {
        parts.push(`${task.timeSlot.start}-${task.timeSlot.end}`);
      }
    }
    return parts.join(" | ");
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-muted-foreground">載入中...</div>
      </div>
    );
  }

  const enabledDays = (form.days || []).filter((d) => d.enabled);

  return (
    <div className="mx-auto max-w-md px-4 pt-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">任務管理</h1>
        <Button onClick={openCreate} className="gap-1">
          <Plus className="h-4 w-4" /> 新增
        </Button>
      </div>

      {/* 任務列表 */}
      {tasks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            還沒有任務，點右上角新增一個吧！
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
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
                    {getScheduleText(task)}
                    {task.timerMode !== "none" &&
                      ` | ${task.timerMode === "countdown" ? `倒數${task.countdownMinutes}分` : "碼錶"}`}
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(task)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(task.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 新增/編輯 Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "編輯任務" : "新增任務"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* 名稱 */}
            <div>
              <Label>任務名稱</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="例：冥想"
              />
            </div>

            {/* 圖示 */}
            <div>
              <Label>圖示</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className={`h-10 w-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                      form.icon === emoji
                        ? "bg-primary/20 ring-2 ring-primary"
                        : "bg-muted hover:bg-muted/80"
                    }`}
                    onClick={() => setForm((f) => ({ ...f, icon: emoji }))}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* 顏色 */}
            <div>
              <Label>顏色</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`h-8 w-8 rounded-full transition-all ${
                      form.color === color ? "ring-2 ring-offset-2 ring-primary" : ""
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setForm((f) => ({ ...f, color }))}
                  />
                ))}
              </div>
            </div>

            {/* 排程方式 */}
            <div>
              <Label>排程方式</Label>
              <Select
                value={form.scheduleType}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, scheduleType: v as "weekly" | "fixed" }))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">週目標（每週 N 次）</SelectItem>
                  <SelectItem value="fixed">指定日期</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 週目標次數 */}
            {form.scheduleType === "weekly" && (
              <div>
                <Label>每週目標次數</Label>
                <Input
                  type="number"
                  min={1}
                  max={7}
                  value={form.weeklyTarget}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, weeklyTarget: parseInt(e.target.value) || 1 }))
                  }
                  className="mt-1"
                />
              </div>
            )}

            {/* 指定日期 + 個別時段 */}
            {form.scheduleType === "fixed" && (
              <>
                <div>
                  <Label>選擇日期</Label>
                  <div className="flex gap-1 mt-1">
                    {DAY_NAMES.map((name, i) => (
                      <button
                        key={i}
                        type="button"
                        className={`h-9 w-9 rounded-full text-sm font-medium transition-all ${
                          form.days[i].enabled
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                        onClick={() => toggleDay(i)}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 各天時段設定 */}
                {enabledDays.length > 0 && (
                  <div className="space-y-3">
                    <Label>時段設定</Label>
                    {form.days.map((day, i) => {
                      if (!day.enabled) return null;
                      return (
                        <div key={i} className="rounded-lg border p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">週{DAY_NAMES[i]}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">設定時段</span>
                              <Switch
                                checked={day.hasTime}
                                onCheckedChange={(v) => updateDaySlot(i, { hasTime: v })}
                              />
                            </div>
                          </div>
                          {day.hasTime && (
                            <div className="flex items-center gap-2">
                              <Input
                                type="time"
                                value={day.start}
                                onChange={(e) => updateDaySlot(i, { start: e.target.value })}
                                className="flex-1"
                              />
                              <span className="text-muted-foreground text-sm">~</span>
                              <Input
                                type="time"
                                value={day.end}
                                onChange={(e) => updateDaySlot(i, { end: e.target.value })}
                                className="flex-1"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* 計時模式 */}
            <div>
              <Label>計時模式</Label>
              <Select
                value={form.timerMode}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    timerMode: v as "countdown" | "stopwatch" | "none",
                  }))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">不使用計時</SelectItem>
                  <SelectItem value="countdown">倒數計時</SelectItem>
                  <SelectItem value="stopwatch">碼錶</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.timerMode === "countdown" && (
              <div>
                <Label>倒數時間（分鐘）</Label>
                <Input
                  type="number"
                  min={1}
                  max={120}
                  value={form.countdownMinutes}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      countdownMinutes: parseInt(e.target.value) || 10,
                    }))
                  }
                  className="mt-1"
                />
              </div>
            )}

            {/* 儲存按鈕 */}
            <Button onClick={handleSave} className="w-full">
              {editingId ? "儲存變更" : "新增任務"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
