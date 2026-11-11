"use client";
import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import HelpOutlineRounded from "@mui/icons-material/HelpOutlineRounded";
import type { CheckBlock, LessonBlock, LessonStep } from "@/content/types";
import { COLORS } from "@/theme";
import { type ActivityProps, Feedback, useOnceWhen } from "./common";
import Rich from "./Rich";

/** 解説。小問に答えるまで、その先の段落は表示しない */
export default function LessonView({ step, onResult, onDone }: ActivityProps<LessonStep>) {
  const [answers, setAnswers] = useState<Record<string, number>>({});

  // 最初の「まだ答えていない小問」までを表示する
  const firstOpen = step.blocks.findIndex((b) => b.type === "check" && !(b.id in answers));
  const visible = firstOpen === -1 ? step.blocks : step.blocks.slice(0, firstOpen + 1);
  useOnceWhen(firstOpen === -1, onDone);

  const answer = (b: CheckBlock, i: number) => {
    if (b.id in answers) return;
    setAnswers({ ...answers, [b.id]: i });
    onResult(b.id, i === b.answer);
  };

  return (
    <Box component="article" sx={{ maxWidth: 760, mx: "auto", display: "flex", flexDirection: "column", gap: 2.5 }}>
      <Typography component="h2" sx={{ fontSize: "1.35rem", fontWeight: 700 }}>
        {step.title}
      </Typography>
      {visible.map((b, i) => (
        <Block key={i} block={b} chosen={b.type === "check" ? answers[b.id] : undefined} onChoose={answer} />
      ))}
      {firstOpen !== -1 && (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center" }}>
          答えると続きが読めるようになります
        </Typography>
      )}
    </Box>
  );
}

function Block({
  block,
  chosen,
  onChoose,
}: {
  block: LessonBlock;
  chosen?: number;
  onChoose: (b: CheckBlock, i: number) => void;
}) {
  if (block.type === "p") {
    return (
      <Typography className="reveal" sx={{ fontSize: "1.1rem", lineHeight: 2 }}>
        <Rich text={block.text} />
      </Typography>
    );
  }
  if (block.type === "point") {
    return (
      <Box
        className="reveal"
        sx={{ bgcolor: "#fff", border: `1px solid ${COLORS.line}`, borderRadius: 3, p: { xs: 2, sm: 2.5 } }}
      >
        {block.title && <Typography sx={{ fontWeight: 700, mb: 1 }}>{block.title}</Typography>}
        <Box component="ul" sx={{ m: 0, pl: 2.5, display: "flex", flexDirection: "column", gap: 0.75 }}>
          {block.items.map((item, i) => (
            <Typography component="li" key={i} sx={{ lineHeight: 1.8 }}>
              <Rich text={item} />
            </Typography>
          ))}
        </Box>
      </Box>
    );
  }
  const answered = chosen !== undefined;
  return (
    <Box
      component="section"
      className="reveal"
      data-check={block.id}
      sx={{
        bgcolor: "#fff",
        border: `2px solid ${COLORS.blue}`,
        borderRadius: 4,
        p: { xs: 2, sm: 3 },
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      <Box
        sx={{ display: "flex", alignItems: "center", gap: 1, color: COLORS.blue, fontWeight: 700, fontSize: "0.9rem" }}
      >
        <HelpOutlineRounded fontSize="small" />
        予想してみよう
      </Box>
      <Typography sx={{ fontSize: "1.15rem", fontWeight: 700, lineHeight: 1.7 }}>{block.question}</Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: block.choices.length === 2 ? "1fr 1fr" : "1fr" },
          gap: 1.5,
        }}
      >
        {block.choices.map((c, i) => {
          const isAnswer = i === block.answer;
          const isChosen = i === chosen;
          const color = !answered ? COLORS.ink : isAnswer ? COLORS.blue : isChosen ? COLORS.orange : COLORS.muted;
          return (
            <Button
              key={i}
              variant="outlined"
              disabled={answered}
              onClick={() => onChoose(block, i)}
              sx={{
                minHeight: 60,
                borderRadius: 3,
                borderWidth: 2,
                justifyContent: "flex-start",
                textAlign: "left",
                fontSize: "1.02rem",
                fontWeight: isChosen || (answered && isAnswer) ? 700 : 500,
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
      {answered && <Feedback correct={chosen === block.answer} explanation={block.explanation} refText={block.ref} />}
    </Box>
  );
}
