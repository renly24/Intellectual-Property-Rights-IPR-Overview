"use client";
import Link from "next/link";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { getChapter } from "@/content";
import type { SummaryStep } from "@/content/types";
import { chapterIdOfKey, scoreOf, useProgress } from "@/lib/progress";
import { countItems, describeItem } from "@/lib/steps";
import { COLORS } from "@/theme";
import Rich from "./Rich";

/** 章のまとめ：正答率・ポイント・間違えた問題 */
export default function SummaryView({ chapterId, step }: { chapterId: number; step: SummaryStep }) {
  const progress = useProgress();
  const chapter = getChapter(chapterId);
  const total = chapter ? countItems(chapter.steps) : 0;
  const { correct } = scoreOf(progress.chapters[chapterId]);
  const rate = total ? Math.round((correct / total) * 100) : 0;
  const mistakes = progress.mistakes.filter((k) => chapterIdOfKey(k) === chapterId);
  const next = getChapter(chapterId + 1);

  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" }, gap: 3 }}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Box
          sx={{
            bgcolor: "#fff",
            border: `1px solid ${COLORS.line}`,
            borderRadius: 4,
            p: 3,
            display: "flex",
            alignItems: "center",
            gap: 3,
          }}
        >
          <Box
            data-score={rate}
            sx={{
              width: 112,
              height: 112,
              flexShrink: 0,
              borderRadius: "50%",
              background: `conic-gradient(${COLORS.blue} ${rate * 3.6}deg, ${COLORS.line} 0deg)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Box
              sx={{
                width: 88,
                height: 88,
                borderRadius: "50%",
                bgcolor: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography sx={{ fontSize: "1.7rem", fontWeight: 700, color: COLORS.blue }}>{rate}%</Typography>
            </Box>
          </Box>
          <Box>
            <Typography component="h2" sx={{ fontSize: "1.35rem", fontWeight: 700 }}>
              {rate >= 80 ? "よくできました" : rate >= 50 ? "あと一歩！" : "復習してみよう"}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>
              {total}問中 {correct}問正解（最初の答えで計算）
            </Typography>
          </Box>
        </Box>

        <Box sx={{ bgcolor: "#fff", border: `1px solid ${COLORS.line}`, borderRadius: 4, p: 3, flex: 1 }}>
          <Typography sx={{ fontWeight: 700, mb: 1 }}>この章のポイント</Typography>
          <Box component="ol" sx={{ m: 0, pl: 2.75, display: "flex", flexDirection: "column", gap: 0.75 }}>
            {step.points.map((p, i) => (
              <Typography component="li" key={i} sx={{ lineHeight: 1.9 }}>
                <Rich text={p} />
              </Typography>
            ))}
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          bgcolor: "#fff",
          border: `1px solid ${COLORS.line}`,
          borderRadius: 4,
          p: 3,
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
        }}
      >
        <Typography sx={{ fontWeight: 700 }}>間違えた問題（{mistakes.length}問）</Typography>
        {mistakes.length === 0 && (
          <Typography color="text.secondary">間違えた問題はありません。すばらしい！</Typography>
        )}
        <MistakeList keys={mistakes} />
        <Box sx={{ mt: "auto", pt: 1, display: "flex", gap: 1.5, flexWrap: "wrap" }}>
          {mistakes.length > 0 && (
            <Button
              component={Link}
              href={`/review/?chapter=${chapterId}`}
              variant="outlined"
              size="large"
              sx={{ flex: 1, borderWidth: 2 }}
            >
              間違えた問題を解き直す
            </Button>
          )}
          <Button
            component={Link}
            href={next ? `/chapter/${next.id}/` : "/"}
            variant="contained"
            size="large"
            sx={{ flex: 1 }}
          >
            {next ? `第${next.id}章へ進む` : "章一覧へ"}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

export function MistakeList({ keys }: { keys: string[] }) {
  return (
    <>
      {keys.map((k) => {
        const item = describeItem(k);
        if (!item) return null;
        return (
          <Box
            key={k}
            data-mistake={k}
            sx={{ border: `1px solid ${COLORS.orangeLine}`, bgcolor: COLORS.orangeSoft, borderRadius: 3, p: 2 }}
          >
            <Typography variant="body2" sx={{ color: COLORS.orange, fontWeight: 700 }}>
              第{chapterIdOfKey(k)}章　{item.kind}
            </Typography>
            <Typography sx={{ fontWeight: 700, mt: 0.5 }}>{item.title}</Typography>
            <Typography variant="body2" sx={{ lineHeight: 1.8, mt: 0.5 }}>
              <Rich text={item.explanation} />
            </Typography>
          </Box>
        );
      })}
    </>
  );
}
