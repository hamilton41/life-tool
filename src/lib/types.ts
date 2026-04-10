// 每天的時段
export interface DaySlot {
  day: number;    // 0=日, 1=一, ..., 6=六
  start: string;  // "HH:mm"
  end: string;    // "HH:mm"
}

// 任務定義
export interface Task {
  id: string;
  name: string;
  icon: string; // emoji
  color: string; // hex color
  // 排程方式
  scheduleType: "weekly" | "fixed" | "none";
  // 週目標制：每週幾次
  weeklyTarget?: number;
  // 指定日制：每天可設不同時段
  fixedDays?: number[]; // (0=日, 1=一, ..., 6=六)
  // 各天的時段設定
  daySlots?: DaySlot[];
  // 舊欄位，保留相容
  timeSlot?: {
    start: string; // "HH:mm"
    end: string;   // "HH:mm"
  };
  // 計時模式偏好
  timerMode: "countdown" | "stopwatch" | "none";
  // 倒數計時的預設時長（分鐘）
  countdownMinutes?: number;
  createdAt: string;
}

// 打卡紀錄
export interface Record {
  id: string;
  taskId: string;
  date: string; // "YYYY-MM-DD"
  startTime?: string; // ISO string
  endTime?: string;   // ISO string
  duration?: number;  // 秒數
  completed: boolean;
}

// 設定
export interface Settings {
  theme: "light" | "dark" | "system";
  accentColor: string; // hex color
}

// 完整資料結構
export interface AppData {
  tasks: Task[];
  records: Record[];
  settings: Settings;
}

export const defaultSettings: Settings = {
  theme: "system",
  accentColor: "#6366f1", // indigo
};

export const defaultData: AppData = {
  tasks: [],
  records: [],
  settings: defaultSettings,
};
