"use client";
import { useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import HelpOutlineRounded from "@mui/icons-material/HelpOutlineRounded";
import type { CheckBlock, LessonBlock, LessonStep } from "@/content/types";
import { lessonPages } from "@/lib/steps";
import { COLORS } from "@/theme";
import { type ActivityProps, ChoiceButtons, Feedback, useOnceWhen } from "./common";
import Rich from "./Rich";

/** 解説。1画面に1ページずつ出し、小問に答えたら画面下の「次へ」で次のページへ進む */
export default function LessonView({ step, onResult, onDone, setNext }: ActivityProps<LessonStep>) {
  const pages = useMemo(() => lessonPages(step.blocks), [step.blocks]);
  const [page, setPage] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});

  const blocks = pages[page];
  const check = blocks.find((b): b is CheckBlock => b.type === "check");
  const answered = !check || check.id in answers;
  const isLast = page === pages.length - 1;
  useOnceWhen(answered && isLast, onDone);

  useEffect(() => {
    if (!setNext) return;
    setNext(answered && !isLast ? { hint: "続きを読もう", go: () => setPage((p) => p + 1) } : null);
  }, [setNext, answered, isLast]);

  useEffect(() => {
    if (page > 0) window.scrollTo({ top: 0 });
  }, [page]);

  const answer = (b: CheckBlock, i: number) => {
    if (b.id in answers) return;
    setAnswers({ ...answers, [b.id]: i });
    onResult(b.id, i === b.answer);
  };

  return (
    <Box
      component="article"
      key={page}
      data-page={page}
      sx={{ maxWidth: 760, mx: "auto", display: "flex", flexDirection: "column", gap: 2.5 }}
    >
      <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 2 }}>
        <Typography component="h2" sx={{ fontSize: "1.35rem", fontWeight: 700 }}>
          {step.title}
        </Typography>
        {pages.length > 1 && (
          <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
            {page + 1} / {pages.length} ページ
          </Typography>
        )}
      </Box>
      {blocks.map((b, i) => (
        <Block key={i} block={b} chosen={b.type === "check" ? answers[b.id] : undefined} onChoose={answer} />
      ))}
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
      <ChoiceButtons
        choices={block.choices}
        answer={block.answer}
        chosen={chosen ?? null}
        onChoose={(i) => onChoose(block, i)}
      />
      {chosen !== undefined && (
        <Feedback
          correct={chosen === block.answer}
          explanation={block.explanation}
          refText={block.ref}
          scrollIntoView
        />
      )}
    </Box>
  );
}
