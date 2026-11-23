"use client";
import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";
import ErrorOutlineRounded from "@mui/icons-material/ErrorOutlineRounded";
import { COLORS, SHORT_SCREEN } from "@/theme";
import Rich from "./Rich";

/** 各操作問題が受け取るもの */
export type ActivityProps<S> = {
  step: S;
  /** 問題に答えたとき（最初の答えが正答率に使われる） */
  onResult: (itemId: string, correct: boolean) => void;
  /** ステップの問題をすべて終えたとき */
  onDone: () => void;
  /**
   * ステップの中でページや問題を進めるとき、画面下の「次へ」ボタンに進み方を渡す（null で戻す）。
   * 進むボタンをいつも同じ場所に置き、スクロールしなくても次にすることがわかるようにする。
   */
  setNext?: (next: NextAction | null) => void;
};

/** 画面下の「次へ」で、ステップの中を進めるときの動作 */
export type NextAction = {
  /** 「次へ」の横に出す案内 */
  hint: string;
  go: () => void;
};

/** 問題の見出しと指示 */
export function ActivityHeader({ title, instruction, sub }: { title: string; instruction?: string; sub?: ReactNode }) {
  return (
    <Box sx={{ mb: 2.5, [SHORT_SCREEN]: { mb: 1.5 } }}>
      <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: "0.08em" }}>
        {title}
      </Typography>
      {instruction && (
        <Typography
          component="h2"
          sx={{
            fontSize: { xs: "1.15rem", sm: "1.3rem" },
            fontWeight: 700,
            lineHeight: 1.6,
            [SHORT_SCREEN]: { fontSize: "1.2rem", lineHeight: 1.5 },
          }}
        >
          {instruction}
        </Typography>
      )}
      {sub && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {sub}
        </Typography>
      )}
    </Box>
  );
}

/** 正誤と解説 */
export function Feedback({
  correct,
  label,
  explanation,
  refText,
  scrollIntoView = false,
}: {
  correct: boolean;
  label?: string;
  explanation: string;
  refText?: string;
  /** 表示したとき、画面の外なら見える位置までスクロールする */
  scrollIntoView?: boolean;
}) {
  const color = correct ? COLORS.blue : COLORS.orange;
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!scrollIntoView) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    ref.current?.scrollIntoView?.({ block: "nearest", behavior: reduce ? "auto" : "smooth" });
  }, [scrollIntoView]);
  return (
    <Box
      ref={ref}
      className="reveal"
      role="status"
      data-feedback={correct ? "correct" : "incorrect"}
      sx={{
        borderRadius: 2.5,
        p: 2,
        bgcolor: correct ? COLORS.blueSoft : COLORS.orangeSoft,
        border: `1px solid ${correct ? "#C9D8FB" : COLORS.orangeLine}`,
        // 上下に固定したヘッダー・フッターに隠れないように
        scrollMarginTop: 96,
        scrollMarginBottom: 96,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, color, fontWeight: 700, mb: 0.5 }}>
        {correct ? <CheckCircleRounded fontSize="small" /> : <ErrorOutlineRounded fontSize="small" />}
        {label ?? (correct ? "正解！" : "ざんねん")}
      </Box>
      <Typography sx={{ lineHeight: 1.9 }}>
        <Rich text={explanation} />
      </Typography>
      {refText && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          根拠：{refText}
        </Typography>
      )}
    </Box>
  );
}

/**
 * 選択肢のボタン。答えたら、選んだものと正解だけを残して縮め、
 * すぐ下に出る解説が画面に収まるようにする。
 */
export function ChoiceButtons({
  choices,
  answer,
  chosen,
  onChoose,
  layout = "stack",
}: {
  choices: string[];
  /** 正解の choices の添字 */
  answer: number;
  chosen: number | null;
  onChoose: (i: number) => void;
  /** stack：長い文の選択肢を縦に並べる（2つなら横）、row：短い選択肢を横に並べる */
  layout?: "stack" | "row";
}) {
  const answered = chosen !== null;
  const shown = choices.map((c, i) => ({ c, i })).filter(({ i }) => !answered || i === answer || i === chosen);
  const columns = layout === "row" || shown.length === 2 ? shown.length : 1;
  return (
    <Box
      sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: `repeat(${columns}, minmax(0, 1fr))` }, gap: 1.5 }}
    >
      {shown.map(({ c, i }) => {
        const isAnswer = i === answer;
        const color = !answered ? COLORS.ink : isAnswer ? COLORS.blue : COLORS.orange;
        return (
          <Button
            key={i}
            variant="outlined"
            disabled={answered}
            onClick={() => onChoose(i)}
            sx={{
              minHeight: 60,
              borderRadius: 3,
              borderWidth: 2,
              justifyContent: layout === "row" ? "center" : "flex-start",
              textAlign: layout === "row" ? "center" : "left",
              fontSize: "1.02rem",
              fontWeight: answered ? 700 : 500,
              color,
              borderColor: answered ? color : COLORS.border,
              bgcolor: !answered ? "#fff" : isAnswer ? COLORS.blueSoft : COLORS.orangeSoft,
              "&.Mui-disabled": { color, borderColor: answered ? color : COLORS.line },
            }}
          >
            {answered && (
              <Box component="span" aria-hidden sx={{ mr: 1, flexShrink: 0 }}>
                {isAnswer ? "○" : "×"}
              </Box>
            )}
            {c}
          </Button>
        );
      })}
    </Box>
  );
}

/** 条件を満たしたら、一度だけ fn を呼ぶ */
export function useOnceWhen(cond: boolean, fn: () => void) {
  const called = useRef(false);
  const latest = useRef(fn);
  useEffect(() => {
    latest.current = fn;
  });
  useEffect(() => {
    if (cond && !called.current) {
      called.current = true;
      latest.current();
    }
  }, [cond]);
}

/** ID から決まる順番に並べかえる（毎回同じ順で、JSON の並び順とは変わる） */
export function stableShuffle<T extends { id: string }>(items: T[], seed: string): T[] {
  const hash = (s: string) => {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
    return h >>> 0;
  };
  return [...items].sort((a, b) => hash(seed + a.id) - hash(seed + b.id));
}
