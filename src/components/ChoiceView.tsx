"use client";
import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import type { ChoiceStep } from "@/content/types";
import { COLORS } from "@/theme";
import { ActivityHeader, type ActivityProps, Feedback, useOnceWhen } from "./common";

/** 選択問題。1問ずつ答えて、解説を読んでから次の問題へ */
export default function ChoiceView({ step, onResult, onDone }: ActivityProps<ChoiceStep>) {
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const q = step.questions[index];
  const isLast = index === step.questions.length - 1;
  useOnceWhen(finished, onDone);

  const choose = (i: number) => {
    if (chosen !== null) return;
    setChosen(i);
    onResult(q.id, i === q.answer);
    if (isLast) setFinished(true);
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
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: `repeat(${q.choices.length}, minmax(0, 1fr))` },
            gap: 1.5,
          }}
        >
          {q.choices.map((c, i) => {
            const answered = chosen !== null;
            const isAnswer = i === q.answer;
            const isChosen = i === chosen;
            const color = !answered ? COLORS.ink : isAnswer ? COLORS.blue : isChosen ? COLORS.orange : COLORS.muted;
            return (
              <Button
                key={i}
                variant="outlined"
                disabled={answered}
                onClick={() => choose(i)}
                sx={{
                  minHeight: 64,
                  borderRadius: 3,
                  borderWidth: 2,
                  fontSize: "1.05rem",
                  color,
                  borderColor: answered && (isAnswer || isChosen) ? color : COLORS.border,
                  bgcolor: answered && isAnswer ? COLORS.blueSoft : answered && isChosen ? COLORS.orangeSoft : "#fff",
                  "&.Mui-disabled": { color, borderColor: answered && (isAnswer || isChosen) ? color : COLORS.line },
                }}
              >
                {c}
              </Button>
            );
          })}
        </Box>
        {chosen !== null && <Feedback correct={chosen === q.answer} explanation={q.explanation} refText={q.ref} />}
      </Box>
      {chosen !== null && !isLast && (
        <Box sx={{ mt: 2.5, display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="outlined"
            size="large"
            onClick={() => {
              setIndex(index + 1);
              setChosen(null);
            }}
            sx={{ borderWidth: 2 }}
          >
            次の問題
          </Button>
        </Box>
      )}
    </Box>
  );
}
