"use client";
import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { chapterIdOfKey, useHydrated, useProgress } from "@/lib/progress";
import { buildReview, type PlayStep } from "@/lib/steps";
import { COLORS } from "@/theme";
import StepPlayer from "./StepPlayer";
import { MistakeList } from "./SummaryView";

/** 間違えた問題だけを解き直す。?chapter=1 で章をしぼる */
export default function ReviewScreen() {
  const hydrated = useHydrated();
  if (!hydrated) return null;
  return <ReviewPlayer />;
}

function ReviewPlayer() {
  const chapterParam = useSearchParams().get("chapter");
  const chapterId = chapterParam ? Number(chapterParam) : null;
  const progress = useProgress();
  // 開いた時点の復習リストで問題を作る（解いている途中でリストが減っても問題は変えない）
  const [steps] = useState<PlayStep[]>(() =>
    buildReview(progress.mistakes.filter((k) => chapterId === null || chapterIdOfKey(k) === chapterId)),
  );

  if (steps.length === 0) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", p: 3 }}>
        <Box sx={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 2, alignItems: "center" }}>
          <Typography component="h1" sx={{ fontSize: "1.3rem", fontWeight: 700 }}>
            復習する問題はありません
          </Typography>
          <Typography color="text.secondary">章の問題で間違えると、ここで解き直せます。</Typography>
          <Button component={Link} href="/" variant="contained" size="large">
            章一覧へ
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <StepPlayer
      mode="review"
      label={chapterId ? `第${chapterId}章の復習` : "復習"}
      title="間違えた問題を解き直す"
      steps={[
        ...steps,
        { chapterId: chapterId ?? 0, step: { type: "summary", id: "review-end", title: "復習のまとめ", points: [] } },
      ]}
      renderSummary={() => <ReviewEnd chapterId={chapterId} />}
    />
  );
}

function ReviewEnd({ chapterId }: { chapterId: number | null }) {
  const remaining = useProgress().mistakes.filter((k) => chapterId === null || chapterIdOfKey(k) === chapterId);
  return (
    <Box sx={{ maxWidth: 760, mx: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
      <Box sx={{ bgcolor: "#fff", border: `1px solid ${COLORS.line}`, borderRadius: 4, p: 3 }}>
        <Typography component="h2" sx={{ fontSize: "1.35rem", fontWeight: 700 }}>
          {remaining.length === 0
            ? "復習完了！全部正解できました"
            : `まだ ${remaining.length} 問、間違えた問題があります`}
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          正解した問題は復習リストから消えます。
        </Typography>
      </Box>
      <MistakeList keys={remaining} />
      <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
        {remaining.length > 0 && (
          <Button
            variant="outlined"
            size="large"
            sx={{ flex: 1, borderWidth: 2 }}
            onClick={() => window.location.reload()}
          >
            もう一度解き直す
          </Button>
        )}
        <Button component={Link} href="/" variant="contained" size="large" sx={{ flex: 1 }}>
          章一覧へ
        </Button>
      </Box>
    </Box>
  );
}
