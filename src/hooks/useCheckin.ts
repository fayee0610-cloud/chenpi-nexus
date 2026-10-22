"use client";

// ============================================================
// useCheckin — 打卡进度共享 Hook（马来语 / 商务英文共用）
//
// 进度由数据库打卡记录派生（progressDay = 打卡天数 + 1），
// 打卡即解锁下一课；断签不冻结、跨设备同步（登录后按 user_id）。
// ============================================================

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  getUTC8DateKey,
  deriveProgress,
  type DerivedProgress,
} from "@/lib/checkinProgress";

export type CheckinModule = "english" | "malay";

export interface CheckinData extends DerivedProgress {
  loading: boolean;
  /** 打卡请求进行中（防重复点击） */
  submitting: boolean;
  /** 数据库不可用（表未创建等），打卡会失败 */
  degraded: boolean;
  checkin: () => Promise<boolean>;
}

const DEVICE_KEY = "checkin_device_id";

/** 匿名设备 UUID（localStorage 持久化，登录后记录仍可合并可见） */
function getDeviceId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `dev-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

async function buildHeaders(deviceId: string): Promise<HeadersInit> {
  const headers: Record<string, string> = { "x-device-id": deviceId };
  try {
    const { data } = await supabase?.auth.getSession() ?? { data: null };
    const token = data?.session?.access_token;
    if (token) headers["Authorization"] = `Bearer ${token}`;
  } catch {
    /* 未配置 supabase → 纯匿名 */
  }
  return headers;
}

export function useCheckin(module: CheckinModule): CheckinData {
  const [dates, setDates] = useState<string[]>([]);
  const [today, setToday] = useState<string>(() => getUTC8DateKey());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [degraded, setDegraded] = useState(false);
  const todayRef = useRef(today);
  todayRef.current = today;

  // 拉取打卡记录
  const refetch = useCallback(async () => {
    try {
      const headers = await buildHeaders(getDeviceId());
      const res = await fetch(`/api/checkins?module=${module}`, { headers });
      if (res.ok) {
        const json = await res.json();
        setDates(json.dates || []);
        setToday(json.today || getUTC8DateKey());
        setDegraded(json.available === false);
      } else {
        setDegraded(true);
      }
    } catch {
      setDegraded(true);
    } finally {
      setLoading(false);
    }
  }, [module]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  // 跨午夜自动刷新：长驻标签页跨零点后自动推进到新的一天
  useEffect(() => {
    const timer = setInterval(() => {
      const now = getUTC8DateKey();
      if (now !== todayRef.current) {
        setToday(now);
        refetch();
      }
    }, 30_000);
    // 标签页重新可见时也检查一次（移动端切后台数小时后再打开）
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        const now = getUTC8DateKey();
        if (now !== todayRef.current) {
          setToday(now);
          refetch();
        }
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refetch]);

  // 打卡（幂等：服务端 unique 索引去重，重复打卡无害）
  const checkin = useCallback(async (): Promise<boolean> => {
    if (submitting) return false;
    setSubmitting(true);
    try {
      const headers = await buildHeaders(getDeviceId());
      const res = await fetch("/api/checkins", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ module, deviceId: getDeviceId() }),
      });
      if (!res.ok) {
        setDegraded(true);
        return false;
      }
      const json = await res.json();
      setDates(json.dates || []);
      setToday(json.today || getUTC8DateKey());
      return true;
    } catch {
      setDegraded(true);
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [module, submitting]);

  const derived = deriveProgress(dates, today);
  return { ...derived, loading, submitting, degraded, checkin };
}
