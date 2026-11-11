"use client";
import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";
import ErrorOutlineRounded from "@mui/icons-material/ErrorOutlineRounded";
import { COLORS } from "@/theme";
import Rich from "./Rich";

/** 各操作問題が受け取るもの */
export type ActivityProps<S> = {
  step: S;
  /** 問題に答えたとき（最初の答えが正答率に使われる） */
  onResult: (itemId: string, correct: boolean) => void;
  /** ステップの問題をすべて終えたとき */
  onDone: () => void;
};

/** 問題の見出しと指示 */
export function ActivityHeader({ title, instruction, sub }: { title: string; instruction?: string; sub?: ReactNode }) {
  return (
    <Box sx={{ mb: 2.5 }}>
      <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: "0.08em" }}>
        {title}
      </Typography>
      {instruction && (
        <Typography component="h2" sx={{ fontSize: { xs: "1.15rem", sm: "1.3rem" }, fontWeight: 700, lineHeight: 1.6 }}>
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
}: {
  correct: boolean;
  label?: string;
  explanation: string;
  refText?: string;
}) {
  const color = correct ? COLORS.blue : COLORS.orange;
  return (
    <Box
      className="reveal"
      role="status"
      data-feedback={correct ? "correct" : "incorrect"}
      sx={{
        borderRadius: 2.5,
        p: 2,
        bgcolor: correct ? COLORS.blueSoft : COLORS.orangeSoft,
        border: `1px solid ${correct ? "#C9D8FB" : COLORS.orangeLine}`,
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
