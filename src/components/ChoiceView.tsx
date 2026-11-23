"use client";
import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { ChoiceStep } from "@/content/types";
import { COLORS } from "@/theme";
import { ActivityHeader, type ActivityProps, ChoiceButtons, Feedback, useOnceWhen } from "./common";

/** 選択問題。1問ずつ答えて、解説を読んでから画面下の「次へ」で次の問題へ */
export default function ChoiceView({ step, onResult, onDone, setNext }: ActivityProps<ChoiceStep>) {
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const q = step.questions[index];
  const isLast = index === step.questions.length - 1;
  useOnceWhen(chosen !== null && isLast, onDone);

  useEffect(() => {
    if (!setNext) return;
    setNext(
      chosen !== null && !isLast
        ? {
            hint: "次の問題へ",
            go: () => {
              setIndex((i) => i + 1);
              setChosen(null);
            },
          }
        : null,
    );
  }, [setNext, chosen, isLast]);

  const choose = (i: number) => {
    if (chosen !== null) return;
    setChosen(i);
    onResult(q.id, i === q.answer);
  };

  return (
    <Box sx={{ maxWidth: 820, mx: "auto" }}>
      <ActivityHeader
        title={step.title}
        instruction={step.instruction}
        sub={`第 ${index + 1} 問 / 全 ${step.questions.length} 問`}
      />
      <Box
        key={q.id}
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
        <ChoiceButtons choices={q.choices} answer={q.answer} chosen={chosen} onChoose={choose} layout="row" />
        {chosen !== null && (
          <Feedback correct={chosen === q.answer} explanation={q.explanation} refText={q.ref} scrollIntoView />
        )}
      </Box>
    </Box>
  );
}
