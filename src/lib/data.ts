import fs from "fs";
import path from "path";
import { AppData, defaultData } from "./types";

const DATA_PATH = path.join(process.cwd(), "data.json");

export function readData(): AppData {
  if (!fs.existsSync(DATA_PATH)) {
    fs.writeFileSync(DATA_PATH, JSON.stringify(defaultData, null, 2), "utf-8");
    return defaultData;
  }
  const raw = fs.readFileSync(DATA_PATH, "utf-8");
  return JSON.parse(raw) as AppData;
}

export function writeData(data: AppData): void {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), "utf-8");
}
