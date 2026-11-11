import { CHAPTERS } from "@/content";
import type { CheckBlock, ChoiceStep, Step } from "@/content/types";
import { chapterIdOfKey, itemKey } from "./progress";

/** 画面に出す1ステップ。復習では複数の章のステップが混ざるので、章IDを添える */
export type PlayStep = { chapterId: number; step: Step };

/** ステップに含まれる問題のID */
export function itemIds(step: Step): string[] {
  switch (step.type) {
    case "lesson":
      return step.blocks.filter((b): b is CheckBlock => b.type === "check").map((b) => b.id);
    case "sort":
    case "swipe":
      return step.cards.map((c) => c.id);
    case "tap":
      return step.segments.flatMap((s) => (typeof s === "string" ? [] : [s.id]));
    case "choice":
      return step.questions.map((q) => q.id);
    case "summary":
      return [];
  }
}

/** 間違えた問題だけを残したステップを作る（なければ null） */
function onlyMissed(step: Step, missed: Set<string>): Step | null {
  switch (step.type) {
    case "lesson": {
      // 解説の小問は、選択問題としてまとめて出し直す
      const checks = step.blocks.filter((b): b is CheckBlock => b.type === "check" && missed.has(b.id));
      if (checks.length === 0) return null;
      const choice: ChoiceStep = {
        type: "choice",
        id: step.id,
        title: step.title,
        questions: checks.map(({ id, question, choices, answer, explanation, ref }) => ({
          id,
          question,
          choices,
          answer,
          explanation,
          ref,
        })),
      };
      return choice;
    }
    case "sort": {
      const cards = step.cards.filter((c) => missed.has(c.id));
      return cards.length ? { ...step, cards } : null;
    }
    case "swipe": {
      const cards = step.cards.filter((c) => missed.has(c.id));
      return cards.length ? { ...step, cards } : null;
    }
    case "tap":
      // 文中タップは文章全体で考える問題なので、そのまま出し直す
      return itemIds(step).some((id) => missed.has(id)) ? step : null;
    case "choice": {
      const questions = step.questions.filter((q) => missed.has(q.id));
      return questions.length ? { ...step, questions } : null;
    }
    case "summary":
      return null;
  }
}

/** 復習リストのキーから、出し直すステップの一覧を作る */
export function buildReview(mistakes: string[]): PlayStep[] {
  const result: PlayStep[] = [];
  for (const chapter of CHAPTERS) {
    if (!mistakes.some((k) => chapterIdOfKey(k) === chapter.id)) continue;
    for (const step of chapter.steps) {
      const missed = new Set(itemIds(step).filter((id) => mistakes.includes(itemKey(chapter.id, step.id, id))));
      if (missed.size === 0) continue;
      const s = onlyMissed(step, missed);
      if (s) result.push({ chapterId: chapter.id, step: s });
    }
  }
  return result;
}

/** 章の問題の総数 */
export function countItems(steps: Step[]) {
  return steps.reduce((n, s) => n + itemIds(s).length, 0);
}

/** 復習リストのキーから、問題の情報（表示用）を探す */
export function describeItem(key: string): { kind: string; title: string; explanation: string } | null {
  const [cid, stepId, id] = key.split("/");
  const step = CHAPTERS.find((c) => c.id === Number(cid))?.steps.find((s) => s.id === stepId);
  if (!step) return null;
  switch (step.type) {
    case "lesson": {
      const b = step.blocks.find((x): x is CheckBlock => x.type === "check" && x.id === id);
      return b ? { kind: "解説の小問", title: b.question, explanation: b.explanation } : null;
    }
    case "sort": {
      const c = step.cards.find((x) => x.id === id);
      return c ? { kind: "ドラッグ仕分け", title: c.label, explanation: c.explanation } : null;
    }
    case "swipe": {
      const c = step.cards.find((x) => x.id === id);
      return c ? { kind: "スワイプ判定", title: c.text, explanation: c.explanation } : null;
    }
    case "tap": {
      const s = step.segments.find((x) => typeof x !== "string" && x.id === id);
      return s && typeof s !== "string" ? { kind: "文中タップ指摘", title: s.text, explanation: s.explanation } : null;
    }
    case "choice": {
      const q = step.questions.find((x) => x.id === id);
      return q ? { kind: "選択問題", title: q.question, explanation: q.explanation } : null;
    }
    default:
      return null;
  }
}
