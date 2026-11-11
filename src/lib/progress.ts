"use client";
import { useSyncExternalStore } from "react";

/**
 * 学習の記録。ブラウザの localStorage にだけ保存する（サーバーには送らない）。
 *
 * 問題ごとの記録は「章ID/ステップID/問題ID」のキーで持つ。
 * - results：章を解いたときの最初の答えが正解だったか（正答率の計算に使う）
 * - mistakes：間違えた問題。復習で正解すると消える
 */
export type ChapterProgress = {
  /** 次に開くステップ（途中から再開するため） */
  step: number;
  completed: boolean;
  results: Record<string, boolean>;
};

export type Progress = {
  v: 1;
  chapters: Record<string, ChapterProgress>;
  mistakes: string[];
};

const STORAGE_KEY = "edu-copyright-progress-v1";
const EMPTY: Progress = { v: 1, chapters: {}, mistakes: [] };

let cache: Progress | null = null;
const listeners = new Set<() => void>();

function load(): Progress {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const data = JSON.parse(raw) as Progress;
    if (data?.v !== 1 || typeof data.chapters !== "object" || !Array.isArray(data.mistakes)) return EMPTY;
    return data;
  } catch {
    // プライベートブラウズなどで読めないときは、記録なしで動かす
    return EMPTY;
  }
}

function read(): Progress {
  if (cache === null) cache = load();
  return cache;
}

function write(next: Progress) {
  cache = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // 保存できなくても、この画面を開いている間は記録が残る
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      cache = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** 学習の記録を読む。サーバーでの書き出し時と最初の描画では空の記録になる */
export function useProgress(): Progress {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

function chapterOf(p: Progress, chapterId: number): ChapterProgress {
  return p.chapters[chapterId] ?? { step: 0, completed: false, results: {} };
}

function updateChapter(chapterId: number, fn: (c: ChapterProgress) => ChapterProgress) {
  const p = read();
  write({ ...p, chapters: { ...p.chapters, [chapterId]: fn(chapterOf(p, chapterId)) } });
}

export function itemKey(chapterId: number, stepId: string, itemId: string) {
  return `${chapterId}/${stepId}/${itemId}`;
}

export function chapterIdOfKey(key: string) {
  return Number(key.split("/")[0]);
}

/**
 * 問題の答えを記録する。
 * - 章を解いているとき：最初の答えだけを正答率に使い、間違えたら復習リストに入れる
 * - 復習のとき：正解したら復習リストから消す
 */
export function recordResult(key: string, correct: boolean, mode: "chapter" | "review") {
  const p = read();
  let mistakes = p.mistakes;
  let chapters = p.chapters;
  if (mode === "chapter") {
    const chapterId = chapterIdOfKey(key);
    const c = chapterOf(p, chapterId);
    if (key in c.results) return;
    chapters = { ...chapters, [chapterId]: { ...c, results: { ...c.results, [key]: correct } } };
    if (!correct && !mistakes.includes(key)) mistakes = [...mistakes, key];
  } else if (correct) {
    mistakes = mistakes.filter((k) => k !== key);
  }
  write({ ...p, chapters, mistakes });
}

export function saveStep(chapterId: number, step: number) {
  updateChapter(chapterId, (c) => ({ ...c, step }));
}

export function completeChapter(chapterId: number) {
  updateChapter(chapterId, (c) => ({ ...c, completed: true }));
}

/** 章を最初から解き直す（正答率は新しく数え直す。復習リストは残す） */
export function restartChapter(chapterId: number) {
  updateChapter(chapterId, () => ({ step: 0, completed: false, results: {} }));
}

export function resetAll() {
  write(EMPTY);
}

export function scoreOf(c: ChapterProgress | undefined) {
  const values = Object.values(c?.results ?? {});
  return { correct: values.filter(Boolean).length, answered: values.length };
}

const noop = () => () => {};

/** ブラウザで描画されたあと true（localStorage を読んでよいか） */
export function useHydrated() {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}
