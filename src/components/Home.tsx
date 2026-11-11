"use client";
import { useState } from "react";
import Link from "next/link";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Typography from "@mui/material/Typography";
import CheckRounded from "@mui/icons-material/CheckRounded";
import { CHAPTER_LIST, getChapter } from "@/content";
import type { ChapterMeta } from "@/content/types";
import { type Progress, resetAll, scoreOf, useProgress } from "@/lib/progress";
import { countItems } from "@/lib/steps";
import { COLORS } from "@/theme";

/** 章一覧（ホーム） */
export default function Home() {
  const progress = useProgress();
  const [confirmReset, setConfirmReset] = useState(false);
  const resume = findResume(progress);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <Box
        component="header"
        sx={{
          bgcolor: "#fff",
          borderBottom: `1px solid ${COLORS.line}`,
          px: { xs: 2, sm: 5 },
          py: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            aria-hidden
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              bgcolor: COLORS.blue,
              color: "#fff",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ©
          </Box>
          <Typography component="h1" sx={{ fontSize: "1.25rem", fontWeight: 700 }}>
            著作権を学ぼう{" "}
            <Box component="span" sx={{ fontSize: "0.85rem", fontWeight: 500, color: "text.secondary" }}>
              情報Ⅰ・共通テスト対策
            </Box>
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1.5 }}>
          <Button
            component={Link}
            href="/review/"
            variant="outlined"
            disabled={progress.mistakes.length === 0}
            sx={{ borderColor: COLORS.border, color: COLORS.ink }}
          >
            復習する（{progress.mistakes.length}問）
          </Button>
          <Button variant="text" onClick={() => setConfirmReset(true)} sx={{ color: COLORS.muted }}>
            記録を消す
          </Button>
        </Box>
      </Box>

      <Box
        component="main"
        sx={{
          maxWidth: 1100,
          mx: "auto",
          px: { xs: 2, sm: 5 },
          py: 4,
          display: "flex",
          flexDirection: "column",
          gap: 3,
        }}
      >
        {resume && (
          <Box
            component="section"
            sx={{
              bgcolor: "#fff",
              border: `1px solid ${COLORS.line}`,
              borderRadius: 4,
              p: { xs: 2.5, sm: 3 },
              display: "flex",
              alignItems: "center",
              gap: 3,
              flexWrap: "wrap",
            }}
          >
            <Box sx={{ flex: 1, minWidth: 220 }}>
              <Typography variant="body2" color="text.secondary">
                {resume.started ? "つづきから" : "はじめよう"}
              </Typography>
              <Typography sx={{ fontSize: "1.3rem", fontWeight: 700, mt: 0.5 }}>
                第{resume.id}章　{resume.title}
              </Typography>
              <Box sx={{ mt: 1.5, height: 8, borderRadius: 4, bgcolor: COLORS.line }}>
                <Box sx={{ width: `${resume.ratio * 100}%`, height: 8, borderRadius: 4, bgcolor: COLORS.blue }} />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                ステップ {resume.step + 1} / {resume.steps}　・　約{resume.minutes}分
              </Typography>
            </Box>
            <Button component={Link} href={`/chapter/${resume.id}/`} variant="contained" size="large">
              {resume.started ? "再開する" : "はじめる"}
            </Button>
          </Box>
        )}

        <Box
          component="nav"
          aria-label="章の一覧"
          sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" }, gap: 2 }}
        >
          {CHAPTER_LIST.map((c) => (
            <ChapterCard key={c.id} meta={c} progress={progress} current={resume?.id === c.id} />
          ))}
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center" }}>
          学習の記録はこの端末のブラウザにだけ保存されます（名前などは保存しません）
        </Typography>
      </Box>

      <Dialog open={confirmReset} onClose={() => setConfirmReset(false)}>
        <DialogTitle>学習の記録を消しますか？</DialogTitle>
        <DialogContent>
          <DialogContentText>
            この端末に保存された、すべての章の進み具合・正答率・間違えた問題が消えます。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmReset(false)}>やめる</Button>
          <Button
            color="warning"
            variant="contained"
            onClick={() => {
              resetAll();
              setConfirmReset(false);
            }}
          >
            消す
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

/** 「つづきから」に出す章：途中の章、なければまだ終えていない最初の章 */
function findResume(progress: Progress) {
  const available = CHAPTER_LIST.filter((c) => c.available);
  const inProgress = available.find((c) => {
    const p = progress.chapters[c.id];
    return p && !p.completed && (p.step > 0 || Object.keys(p.results).length > 0);
  });
  const target = inProgress ?? available.find((c) => !progress.chapters[c.id]?.completed);
  if (!target) return null;
  const chapter = getChapter(target.id)!;
  const step = progress.chapters[target.id]?.step ?? 0;
  return {
    id: chapter.id,
    title: chapter.title,
    minutes: chapter.minutes,
    step,
    steps: chapter.steps.length,
    ratio: step / chapter.steps.length,
    started: !!inProgress,
  };
}

function ChapterCard({ meta, progress, current }: { meta: ChapterMeta; progress: Progress; current: boolean }) {
  const p = progress.chapters[meta.id];
  const chapter = getChapter(meta.id);
  const total = chapter ? countItems(chapter.steps) : 0;
  const { correct } = scoreOf(p);
  const rate = total ? Math.round((correct / total) * 100) : 0;
  const completed = !!p?.completed;

  const badge = (
    <Box
      sx={{
        width: 44,
        height: 44,
        flexShrink: 0,
        borderRadius: "50%",
        fontWeight: 700,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: completed ? "#DBE6FE" : current ? COLORS.blue : "#EEF0F4",
        color: completed ? COLORS.blue : current ? "#fff" : COLORS.muted,
      }}
    >
      {completed ? <CheckRounded /> : meta.id}
    </Box>
  );

  const body = (
    <>
      {badge}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" color="text.secondary">
          第{meta.id}章{meta.ops ? `　${meta.ops}` : ""}
        </Typography>
        <Typography sx={{ fontSize: "1.05rem", fontWeight: 700 }}>{meta.title}</Typography>
      </Box>
      <Typography
        variant="body2"
        sx={{
          fontWeight: completed ? 700 : 500,
          color: completed || current ? COLORS.blue : COLORS.muted,
          whiteSpace: "nowrap",
        }}
      >
        {!meta.available ? "準備中" : completed ? `正答率 ${rate}%` : current && p ? "学習中" : `約${meta.minutes}分`}
      </Typography>
    </>
  );

  const sx = {
    display: "flex",
    alignItems: "center",
    gap: 2,
    p: 2.25,
    minHeight: 80,
    bgcolor: "#fff",
    borderRadius: 3,
    border: `${current ? 2 : 1}px solid ${current ? COLORS.blue : COLORS.line}`,
    color: "inherit",
    textDecoration: "none",
  } as const;

  if (!meta.available) {
    return (
      <Box sx={{ ...sx, opacity: 0.7 }} aria-disabled>
        {body}
      </Box>
    );
  }
  return (
    <Box component={Link} href={`/chapter/${meta.id}/`} sx={{ ...sx, "&:hover": { borderColor: COLORS.blue } }}>
      {body}
    </Box>
  );
}
