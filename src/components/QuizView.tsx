"use client";
import { useCallback, useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import EmojiEventsRounded from "@mui/icons-material/EmojiEventsRounded";
import type { QuizStep } from "@/content/types";
import { COLORS } from "@/theme";
import { ActivityHeader, type ActivityProps, ChoiceButtons, Feedback, useOnceWhen } from "./common";

/** 0〜n-1 を並べかえる。avoid と同じ並びになったら、もう一度並べかえる（解き直しで同じ順にしない） */
function shuffled(n: number, avoid?: number[]): number[] {
  for (let tries = 0; ; tries++) {
    const a = Array.from({ length: n }, (_, i) => i);
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    if (n < 2 || tries >= 5 || !avoid || a.some((v, i) => v !== avoid[i])) return a;
  }
}

type Round = {
  /** この回に出す問題（questions の添字） */
  items: number[];
  /** 問題ごとの選択肢の並び（choices の添字） */
  orders: number[][];
};

function makeRound(step: QuizStep, items: number[], prev?: Round): Round {
  return {
    items,
    orders: items.map((q) => {
      const before = prev?.orders[prev.items.indexOf(q)];
      return shuffled(step.questions[q].choices.length, before);
    }),
  };
}

/**
 * 確認テスト。全問に答えたら結果を出し、間違えた問題だけを選択肢の順番を変えて出し直す。
 * 全問正解で合格になり、まとめへ進める。
 */
export default function QuizView({
  step,
  label,
  onResult,
  onDone,
  setNext,
}: ActivityProps<QuizStep> & { label?: string }) {
  const [round, setRound] = useState<Round>(() =>
    makeRound(
      step,
      step.questions.map((_, i) => i),
    ),
  );
  const [attempt, setAttempt] = useState(1);
  const [pos, setPos] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [wrong, setWrong] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);

  const passed = showResult && wrong.length === 0;
  useOnceWhen(passed, onDone);

  const qi = round.items[pos];
  const q = step.questions[qi];
  const order = round.orders[pos];
  const answer = order.indexOf(q.answer);
  const isLast = pos === round.items.length - 1;

  const retry = useCallback(() => {
    setRound(makeRound(step, wrong, round));
    setAttempt((a) => a + 1);
    setPos(0);
    setChosen(null);
    setWrong([]);
    setShowResult(false);
    window.scrollTo({ top: 0 });
  }, [step, wrong, round]);

  useEffect(() => {
    if (!setNext) return;
    if (showResult) {
      setNext(passed ? null : { hint: "間違えた問題にもう一度挑戦しよう", go: retry });
    } else if (chosen !== null) {
      setNext(
        isLast
          ? { hint: "結果を見よう", go: () => setShowResult(true) }
          : {
              hint: "次の問題へ",
              go: () => {
                setPos((p) => p + 1);
                setChosen(null);
              },
            },
      );
    } else {
      setNext(null);
    }
  }, [setNext, showResult, passed, chosen, isLast, retry]);

  const choose = (i: number) => {
    if (chosen !== null) return;
    setChosen(i);
    const correct = i === answer;
    onResult(q.id, correct);
    if (!correct) setWrong((w) => [...w, qi]);
  };

  const total = round.items.length;

  if (passed) {
    return (
      <Box sx={{ maxWidth: 640, mx: "auto" }}>
        <Box
          className="pop"
          data-quiz-passed
          sx={{
            bgcolor: "#fff",
            border: `3px solid ${COLORS.blue}`,
            borderRadius: 5,
            p: { xs: 3, sm: 5 },
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          <EmojiEventsRounded sx={{ fontSize: 72, color: COLORS.blue }} />
          <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 700 }}>
            {label} {step.title}
          </Typography>
          <Typography component="h2" sx={{ fontSize: "2.4rem", fontWeight: 700, color: COLORS.blue }}>
            合格
          </Typography>
          <Typography color="text.secondary">
            {attempt === 1 ? "1回目で全問正解！" : `${attempt}回目で全問正解しました`}
          </Typography>
          <Box
            sx={{
              mt: 1,
              px: 2.5,
              py: 1.5,
              borderRadius: 3,
              bgcolor: COLORS.blueSoft,
              fontWeight: 700,
              lineHeight: 1.8,
            }}
          >
            授業のプリントに「合格」と記録しよう
          </Box>
        </Box>
      </Box>
    );
  }

  if (showResult) {
    return (
      <Box sx={{ maxWidth: 640, mx: "auto" }}>
        <Box
          data-quiz-result
          sx={{
            bgcolor: "#fff",
            border: `2px solid ${COLORS.orangeLine}`,
            borderRadius: 5,
            p: { xs: 3, sm: 4 },
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          <Typography color="text.secondary" sx={{ fontWeight: 700 }}>
            {step.title}
          </Typography>
          <Typography component="h2" sx={{ fontSize: "1.6rem", fontWeight: 700 }}>
            {total}問中 {total - wrong.length}問 正解
          </Typography>
          <Typography sx={{ lineHeight: 1.9 }}>
            全問正解で合格です。
            <br />
            間違えた{wrong.length}問を、選択肢の順番を変えてもう一度出します。
          </Typography>
          <Button variant="contained" size="large" onClick={retry} sx={{ mt: 1 }}>
            間違えた問題に挑戦する
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 820, mx: "auto" }}>
      <ActivityHeader
        title={attempt === 1 ? step.title : `${step.title}（${attempt}回目）`}
        instruction={step.instruction}
        sub={`第 ${pos + 1} 問 / 全 ${total} 問　・　全問正解で合格`}
      />
      <Box
        key={`${attempt}-${q.id}`}
        className="reveal"
        data-question={q.id}
        sx={{
          bgcolor: "#fff",
          border: `1px solid ${COLORS.line}`,
          borderRadius: 4,
          p: { xs: 2.5, sm: 3.5 },
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <Typography sx={{ fontSize: "1.15rem", fontWeight: 700, lineHeight: 1.8 }}>{q.question}</Typography>
        <ChoiceButtons choices={order.map((i) => q.choices[i])} answer={answer} chosen={chosen} onChoose={choose} />
        {chosen !== null && (
          <Feedback correct={chosen === answer} explanation={q.explanation} refText={q.ref} scrollIntoView />
        )}
      </Box>
    </Box>
  );
}
