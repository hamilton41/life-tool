"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings } from "@/lib/types";
import { useTheme } from "next-themes";
import { toast } from "sonner";

const ACCENT_COLORS = [
  { name: "靛藍", value: "#6366f1" },
  { name: "天藍", value: "#3b82f6" },
  { name: "海藍", value: "#0ea5e9" },
  { name: "青色", value: "#14b8a6" },
  { name: "翠綠", value: "#10b981" },
  { name: "萊姆", value: "#84cc16" },
  { name: "琥珀", value: "#f59e0b" },
  { name: "橘色", value: "#f97316" },
  { name: "紅色", value: "#ef4444" },
  { name: "玫瑰", value: "#f43f5e" },
  { name: "粉紅", value: "#ec4899" },
  { name: "紫羅蘭", value: "#8b5cf6" },
  { name: "薰衣草", value: "#a78bfa" },
  { name: "深紫", value: "#7c3aed" },
  { name: "棕褐", value: "#a8a29e" },
  { name: "石墨", value: "#525252" },
];

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        setSettings(data);
        setLoading(false);
      });
  }, []);

  const updateSetting = async (updates: Partial<Settings>) => {
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    const updated = await res.json();
    setSettings(updated);

    if (updates.theme) {
      setTheme(updates.theme);
      try { localStorage.setItem("theme", updates.theme); } catch {}
    }
    if (updates.accentColor) {
      // 觸發重新載入來套用新主題色
      window.location.reload();
    }

    toast("設定已儲存");
  };

  // 請求推播權限
  const requestNotification = async () => {
    if (!("Notification" in window)) {
      toast.error("此瀏覽器不支援推播通知");
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      toast.success("推播通知已開啟");
    } else {
      toast.error("推播通知被拒絕");
    }
  };

  if (loading || !settings) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-muted-foreground">載入中...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 pt-6">
      <h1 className="mb-6 text-2xl font-bold">設定</h1>

      <div className="space-y-4">
        {/* 主題 */}
        <Card>
          <CardContent className="py-4">
            <Label className="text-base font-medium">主題</Label>
            <Select
              value={settings.theme}
              onValueChange={(v) => updateSetting({ theme: v as Settings["theme"] })}
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">淺色</SelectItem>
                <SelectItem value="dark">深色</SelectItem>
                <SelectItem value="system">跟隨系統</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* 主題色 */}
        <Card>
          <CardContent className="py-4">
            <Label className="text-base font-medium">主題色</Label>
            <div className="mt-3 grid grid-cols-5 gap-3">
              {ACCENT_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  className="flex flex-col items-center gap-1"
                  onClick={() => updateSetting({ accentColor: color.value })}
                >
                  <div
                    className={`h-10 w-10 rounded-full transition-all ${
                      settings.accentColor === color.value
                        ? "ring-2 ring-offset-2 ring-primary scale-110"
                        : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: color.value }}
                  />
                  <span className="text-[10px] text-muted-foreground">{color.name}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 推播通知 */}
        <Card>
          <CardContent className="py-4">
            <Label className="text-base font-medium">推播通知</Label>
            <p className="mt-1 text-sm text-muted-foreground">
              開啟後，計時進行中會顯示通知
            </p>
            <button
              type="button"
              onClick={requestNotification}
              className="mt-3 text-sm text-primary underline-offset-4 hover:underline"
            >
              開啟推播權限
            </button>
          </CardContent>
        </Card>

        {/* 版本資訊 */}
        <Card>
          <CardContent className="py-4 text-center text-sm text-muted-foreground">
            生活小工具 v0.1.0
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
