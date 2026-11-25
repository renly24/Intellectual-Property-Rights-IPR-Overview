"use client";
import { type ReactNode, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import ChevronLeftRounded from "@mui/icons-material/ChevronLeftRounded";
import type { Step } from "@/content/types";
import { completeChapter, itemKey, passQuiz, recordResult, saveStep } from "@/lib/progress";
import type { PlayStep } from "@/lib/steps";
import { COLORS, SHORT_SCREEN } from "@/theme";
import ChoiceView from "./ChoiceView";
import type { NextAction } from "./common";
import LessonView from "./LessonView";
import QuizView from "./QuizView";
import SortView from "./SortView";
import SwipeView from "./SwipeView";
import TapView from "./TapView";

type Props = {
  mode: "chapter" | "review";
  /** ヘッダーの小さい文字（例：第1章） */
  label: string;
  title: string;
  steps: PlayStep[];
  /** 章のとき：章ID（途中のステップを保存する） */
  chapterId?: number;
  initialStep?: number;
  /** まとめ（summary）のステップの中身 */
  renderSummary: (step: Step) => ReactNode;
};

const STEP_NAMES: Record<Step["type"], string> = {
  lesson: "解説",
  sort: "ドラッグ仕分け",
  swipe: "スワイプ判定",
  tap: "文中タップ指摘",
  choice: "選択問題",
  quiz: "確認テスト",
  summary: "まとめ",
};

/** 章（または復習）のステップを1つずつ進める画面 */
export default function StepPlayer({ mode, label, title, steps, chapterId, initialStep = 0, renderSummary }: Props) {
  const [index, setIndex] = useState(Math.min(initialStep, steps.length - 1));
  const [done, setDone] = useState<Set<number>>(new Set());
  // ステップの中のページ・問題を進めるときの「次へ」（各画面が渡す）
  const [inner, setInner] = useState<NextAction | null>(null);
  const current = steps[index];
  const isSummary = current.step.type === "summary";

  useEffect(() => {
    if (mode !== "chapter" || chapterId === undefined) return;
    saveStep(chapterId, index);
    if (isSummary) completeChapter(chapterId);
  }, [mode, chapterId, index, isSummary]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [index]);

  const onResult = useCallback(
    (itemId: string, correct: boolean) =>
      recordResult(itemKey(current.chapterId, current.step.id, itemId), correct, mode),
    [current, mode],
  );
  const stepType = current.step.type;
  const onDone = useCallback(() => {
    setDone((d) => new Set(d).add(index));
    if (stepType === "quiz" && mode === "chapter" && chapterId !== undefined) passQuiz(chapterId);
  }, [index, stepType, mode, chapterId]);

  const canNext = !!inner || done.has(index);
  const moveTo = (i: number) => {
    setInner(null);
    setIndex(i);
  };
  const goNext = () => (inner ? inner.go() : moveTo(index + 1));
  const hint = inner?.hint ?? (done.has(index) ? "できたら次へ進もう" : "問題に答えると次へ進めます");
  const view = renderStep(current.step, { onResult, onDone, setNext: setInner }, label, renderSummary);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", display: "flex", flexDirection: "column" }}>
      <Box
        component="header"
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          bgcolor: "#fff",
          borderBottom: `1px solid ${COLORS.line}`,
          px: { xs: 2, sm: 4 },
          py: 1.25,
          [SHORT_SCREEN]: { py: 0.5 },
          display: "flex",
          alignItems: "center",
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <IconButton
          component={Link}
          href="/"
          aria-label="章一覧へ戻る"
          sx={{ border: `1px solid ${COLORS.border}`, width: 44, height: 44 }}
        >
          <ChevronLeftRounded />
        </IconButton>
        <Box sx={{ flex: 1, minWidth: 160 }}>
          <Typography variant="body2" color="text.secondary">
            {label}
          </Typography>
          <Typography component="h1" sx={{ fontSize: "1.1rem", fontWeight: 700 }}>
            {title}
          </Typography>
        </Box>
        <Box
          sx={{ display: "flex", alignItems: "center", gap: 0.75 }}
          aria-label={`ステップ ${index + 1} / ${steps.length}`}
        >
          {steps.map((_, i) => (
            <Box
              key={i}
              sx={{
                width: { xs: 24, sm: 40 },
                height: 6,
                borderRadius: 3,
                bgcolor: i <= index ? COLORS.blue : COLORS.line,
              }}
            />
          ))}
          <Typography variant="body2" color="text.secondary" sx={{ ml: 1, whiteSpace: "nowrap" }}>
            {STEP_NAMES[current.step.type]} {index + 1}/{steps.length}
          </Typography>
        </Box>
      </Box>

      <Box
        component="main"
        key={index}
        sx={{
          flex: 1,
          width: "100%",
          maxWidth: 1180,
          mx: "auto",
          px: { xs: 2, sm: 4 },
          py: { xs: 3, sm: 4 },
          [SHORT_SCREEN]: { py: 2 },
        }}
      >
        {view}
      </Box>

      {!isSummary && (
        <Box
          component="footer"
          sx={{
            position: "sticky",
            bottom: 0,
            bgcolor: "#fff",
            borderTop: `1px solid ${COLORS.line}`,
            px: { xs: 2, sm: 4 },
            py: 1.5,
            [SHORT_SCREEN]: { py: 0.75 },
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <Button
            variant="text"
            disabled={index === 0}
            onClick={() => moveTo(index - 1)}
            sx={{ color: COLORS.muted, visibility: index === 0 ? "hidden" : "visible" }}
          >
            前へ
          </Button>
          <Typography
            variant="body2"
            color={canNext ? "primary" : "text.secondary"}
            sx={{ fontWeight: canNext ? 700 : 400, textAlign: "center" }}
          >
            {hint}
          </Typography>
          <Button variant="contained" size="large" disabled={!canNext} onClick={goNext} sx={{ flexShrink: 0 }}>
            次へ
          </Button>
        </Box>
      )}
    </Box>
  );
}

function renderStep(
  step: Step,
  props: {
    onResult: (itemId: string, correct: boolean) => void;
    onDone: () => void;
    setNext: (next: NextAction | null) => void;
  },
  label: string,
  renderSummary: (step: Step) => ReactNode,
) {
  switch (step.type) {
    case "lesson":
      return <LessonView step={step} {...props} />;
    case "sort":
      return <SortView step={step} {...props} />;
    case "swipe":
      return <SwipeView step={step} {...props} />;
    case "tap":
      return <TapView step={step} {...props} />;
    case "choice":
      return <ChoiceView step={step} {...props} />;
    case "quiz":
      return <QuizView step={step} label={label} {...props} />;
    case "summary":
      return renderSummary(step);
  }
}
