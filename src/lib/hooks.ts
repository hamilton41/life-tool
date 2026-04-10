"use client";

import { useState, useEffect, useCallback } from "react";
import { Task, Record, Settings, defaultSettings } from "./types";

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    const res = await fetch("/api/tasks");
    const data = await res.json();
    setTasks(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const createTask = async (task: Partial<Task>) => {
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(task),
    });
    const created = await res.json();
    setTasks((prev) => [...prev, created]);
    return created;
  };

  const updateTask = async (task: Partial<Task> & { id: string }) => {
    const res = await fetch("/api/tasks", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(task),
    });
    const updated = await res.json();
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    return updated;
  };

  const deleteTask = async (id: string) => {
    await fetch(`/api/tasks?id=${id}`, { method: "DELETE" });
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  return { tasks, loading, fetchTasks, createTask, updateTask, deleteTask };
}

export function useRecords(weekStart?: string) {
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = useCallback(async () => {
    const params = weekStart ? `?weekStart=${weekStart}` : "";
    const res = await fetch(`/api/records${params}`);
    const data = await res.json();
    setRecords(data);
    setLoading(false);
  }, [weekStart]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const createRecord = async (record: Partial<Record>) => {
    const res = await fetch("/api/records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record),
    });
    const created = await res.json();
    setRecords((prev) => [...prev, created]);
    return created;
  };

  const updateRecord = async (record: Partial<Record> & { id: string }) => {
    const res = await fetch("/api/records", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record),
    });
    const updated = await res.json();
    setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    return updated;
  };

  const deleteRecord = async (id: string) => {
    await fetch(`/api/records?id=${id}`, { method: "DELETE" });
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  return { records, loading, fetchRecords, createRecord, updateRecord, deleteRecord };
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        setSettings(data);
        setLoading(false);
      });
  }, []);

  const updateSettings = async (updates: Partial<Settings>) => {
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    const updated = await res.json();
    setSettings(updated);
    return updated;
  };

  return { settings, loading, updateSettings };
}

// 取得本週一的日期
export function getWeekStart(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}

// 取得今天是星期幾 (0=日, 1=一, ..., 6=六)
export function getDayOfWeek(date: Date = new Date()): number {
  return date.getDay();
}

// 格式化秒數為 mm:ss
export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}
