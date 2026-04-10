"use client";

import { ThemeProvider as NextThemeProvider } from "next-themes";
import { ReactNode, useEffect, useState } from "react";

// hex 轉 oklch（近似值）
function hexToOklch(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  // sRGB to linear
  const toLinear = (c: number) =>
    c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  const lr = toLinear(r);
  const lg = toLinear(g);
  const lb = toLinear(b);

  // Linear RGB to OKLab
  const l_ = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
  const m_ = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
  const s_ = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;

  const l = Math.cbrt(l_);
  const m = Math.cbrt(m_);
  const s = Math.cbrt(s_);

  const L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s;
  const bOk = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s;

  const C = Math.sqrt(a * a + bOk * bOk);
  let h = (Math.atan2(bOk, a) * 180) / Math.PI;
  if (h < 0) h += 360;

  return `oklch(${L.toFixed(3)} ${C.toFixed(3)} ${h.toFixed(1)})`;
}

// 生成較亮的 foreground 色（用於深色背景上的文字）
function hexToOklchForeground(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  // 深色用白字，淺色用深色字
  return luminance > 0.5 ? "oklch(0.205 0 0)" : "oklch(0.985 0 0)";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [accentColor, setAccentColor] = useState("#6366f1");

  useEffect(() => {
    setMounted(true);
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.accentColor) {
          setAccentColor(data.accentColor);
        }
      });
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const oklch = hexToOklch(accentColor);
    const fg = hexToOklchForeground(accentColor);

    root.style.setProperty("--primary", oklch);
    root.style.setProperty("--primary-foreground", fg);
  }, [accentColor]);

  if (!mounted) return null;

  return (
    <NextThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
    </NextThemeProvider>
  );
}
