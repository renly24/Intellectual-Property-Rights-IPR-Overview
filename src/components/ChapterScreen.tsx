"use client";
import { useEffect, useState } from "react";
import { getChapter } from "@/content";
import { restartChapter, useHydrated, useProgress } from "@/lib/progress";
import StepPlayer from "./StepPlayer";
import SummaryView from "./SummaryView";

export default function ChapterScreen({ id }: { id: number }) {
  const hydrated = useHydrated();
  if (!hydrated) return null; // 保存された続きの位置を読んでから表示する
  return <ChapterPlayer id={id} />;
}

function ChapterPlayer({ id }: { id: number }) {
  const chapter = getChapter(id)!;
  const saved = useProgress().chapters[id];
  // 一度終えた章を開いたら、最初から解き直す（正答率も数え直す）
  const [wasCompleted] = useState(() => saved?.completed ?? false);
  const [initialStep] = useState(() => (wasCompleted ? 0 : (saved?.step ?? 0)));
  useEffect(() => {
    if (wasCompleted) restartChapter(id);
  }, [wasCompleted, id]);

  return (
    <StepPlayer
      mode="chapter"
      label={`第${chapter.id}章`}
      title={chapter.title}
      chapterId={chapter.id}
      initialStep={initialStep}
      steps={chapter.steps.map((step) => ({ chapterId: chapter.id, step }))}
      renderSummary={(step) => step.type === "summary" && <SummaryView chapterId={chapter.id} step={step} />}
    />
  );
}
