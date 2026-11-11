"use client";
import { type PointerEvent as ReactPointerEvent, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import ArrowForwardRounded from "@mui/icons-material/ArrowForwardRounded";
import type { SwipeStep } from "@/content/types";
import { COLORS } from "@/theme";
import { ActivityHeader, type ActivityProps, Feedback, useOnceWhen } from "./common";

/** これ以上横に動かして離したら判定する（px） */
const SWIPE_THRESHOLD = 110;

type Side = "left" | "right";

/** スワイプ判定。カードを左右にスワイプするか、下のボタンで答える */
export default function SwipeView({ step, onResult, onDone }: ActivityProps<SwipeStep>) {
  const [index, setIndex] = useState(0);
  const [history, setHistory] = useState<{ id: string; side: Side; correct: boolean }[]>([]);
  const [dx, setDx] = useState(0);
  const [leaving, setLeaving] = useState<Side | null>(null);
  const [held, setHeld] = useState(false);
  const start = useRef<{ x: number; pointerId: number } | null>(null);

  const card = step.cards[index];
  const finished = index >= step.cards.length;
  useOnceWhen(finished, onDone);

  const judge = (side: Side) => {
    if (!card || leaving) return;
    const correct = card.answer === side;
    onResult(card.id, correct);
    setHistory((h) => [...h, { id: card.id, side, correct }]);
    setLeaving(side);
    // カードが飛んでいくのを見せてから次へ
    setTimeout(() => {
      setLeaving(null);
      setDx(0);
      setIndex((i) => i + 1);
    }, 220);
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (leaving || (e.pointerType === "mouse" && e.button !== 0)) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    start.current = { x: e.clientX, pointerId: e.pointerId };
    setHeld(true);
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (start.current?.pointerId !== e.pointerId) return;
    setDx(e.clientX - start.current.x);
  };
  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (start.current?.pointerId !== e.pointerId) return;
    start.current = null;
    setHeld(false);
    if (dx > SWIPE_THRESHOLD) judge("right");
    else if (dx < -SWIPE_THRESHOLD) judge("left");
    else setDx(0);
  };

  const lastJudged = history.at(-1);
  const lastCard = lastJudged ? step.cards.find((c) => c.id === lastJudged.id) : undefined;
  const offset = leaving === "right" ? 600 : leaving === "left" ? -600 : dx;
  const tilt = offset / 18;
  const lean: Side | null = dx > 40 ? "right" : dx < -40 ? "left" : null;

  return (
    <Box>
      <ActivityHeader
        title={step.title}
        instruction={step.instruction}
        sub={`${Math.min(index + 1, step.cards.length)} / ${step.cards.length} 枚　・　下のボタンでも答えられます`}
      />
      <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 3 }}>
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2.5 }}>
          <Box sx={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
            <SideLabel side="left" label={step.left} active={lean === "left"} />
            <Box sx={{ position: "relative", width: "min(360px, 100%)", height: 300, flexShrink: 1 }}>
              {!finished && index + 1 < step.cards.length && (
                <Box
                  aria-hidden
                  sx={{
                    position: "absolute",
                    inset: 0,
                    transform: "translate(8px, 8px)",
                    borderRadius: 5,
                    bgcolor: "#E9ECF1",
                  }}
                />
              )}
              {card ? (
                <Box
                  key={card.id}
                  data-swipe-card={card.id}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={() => {
                    start.current = null;
                    setHeld(false);
                    setDx(0);
                  }}
                  sx={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: 5,
                    bgcolor: "#fff",
                    border: `2px solid ${lean === "right" ? COLORS.blue : lean === "left" ? COLORS.orange : COLORS.border}`,
                    boxShadow: "0 12px 28px rgba(28,36,51,0.14)",
                    p: 3.5,
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    touchAction: "none",
                    userSelect: "none",
                    WebkitUserSelect: "none",
                    cursor: "grab",
                    transform: `translateX(${offset}px) rotate(${tilt}deg)`,
                    transition: held ? "none" : "transform 0.22s ease-out",
                    opacity: leaving ? 0 : 1,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    カード {index + 1}
                  </Typography>
                  <Typography sx={{ fontSize: "1.45rem", fontWeight: 700, lineHeight: 1.6 }}>{card.text}</Typography>
                  {lean && (
                    <Box
                      sx={{
                        mt: "auto",
                        alignSelf: lean === "right" ? "flex-end" : "flex-start",
                        px: 1.75,
                        py: 0.5,
                        borderRadius: 2,
                        border: `2px solid ${lean === "right" ? COLORS.blue : COLORS.orange}`,
                        color: lean === "right" ? COLORS.blue : COLORS.orange,
                        fontWeight: 700,
                        transform: `rotate(${lean === "right" ? -8 : 8}deg)`,
                      }}
                    >
                      {lean === "right" ? step.right : step.left}
                    </Box>
                  )}
                </Box>
              ) : (
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: 5,
                    border: `2px dashed ${COLORS.border}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    p: 3,
                  }}
                >
                  <Typography sx={{ fontWeight: 700 }}>
                    すべて判定しました
                    <br />
                    {history.filter((h) => h.correct).length} / {history.length} 問正解
                  </Typography>
                </Box>
              )}
            </Box>
            <SideLabel side="right" label={step.right} active={lean === "right"} />
          </Box>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", justifyContent: "center" }}>
            <Button
              variant="outlined"
              size="large"
              color="warning"
              disabled={finished || !!leaving}
              onClick={() => judge("left")}
              startIcon={<ArrowBackRounded />}
              sx={{ borderWidth: 2, minWidth: 200 }}
            >
              {step.left}
            </Button>
            <Button
              variant="outlined"
              size="large"
              disabled={finished || !!leaving}
              onClick={() => judge("right")}
              endIcon={<ArrowForwardRounded />}
              sx={{ borderWidth: 2, minWidth: 200 }}
            >
              {step.right}
            </Button>
          </Box>
        </Box>

        <Box
          component="aside"
          sx={{ width: { xs: "100%", md: 340 }, display: "flex", flexDirection: "column", gap: 1.5 }}
          aria-live="polite"
        >
          <Typography variant="body2" sx={{ fontWeight: 700, color: "text.secondary" }}>
            直前のカードの解説
          </Typography>
          {lastJudged && lastCard ? (
            <Box key={lastCard.id}>
              <Typography sx={{ fontWeight: 700, mb: 1 }}>「{lastCard.text}」</Typography>
              <Feedback
                correct={lastJudged.correct}
                label={`${lastJudged.correct ? "正解" : "ざんねん"}：${lastCard.answer === "right" ? step.right : step.left}`}
                explanation={lastCard.explanation}
                refText={lastCard.ref}
              />
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              カードを判定すると、ここに解説が出ます
            </Typography>
          )}
          {history.length > 0 && (
            <Box sx={{ bgcolor: "#fff", border: `1px solid ${COLORS.line}`, borderRadius: 3, p: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                これまでの結果（✓正解　✗不正解）
              </Typography>
              {history.map((h) => (
                <Typography key={h.id} variant="body2" sx={{ lineHeight: 1.9 }}>
                  <span style={{ color: h.correct ? COLORS.blue : COLORS.orange, fontWeight: 700 }}>
                    {h.correct ? "✓" : "✗"}
                  </span>{" "}
                  {step.cards.find((c) => c.id === h.id)?.text}
                </Typography>
              ))}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}

function SideLabel({ side, label, active }: { side: Side; label: string; active: boolean }) {
  const color = side === "right" ? COLORS.blue : COLORS.orange;
  return (
    <Box
      aria-hidden
      sx={{
        width: { xs: 64, sm: 104 },
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 0.5,
        color,
        transform: active ? "scale(1.1)" : "none",
        transition: "transform 0.15s",
      }}
    >
      {side === "left" ? <ArrowBackRounded fontSize="large" /> : <ArrowForwardRounded fontSize="large" />}
      <Typography sx={{ fontWeight: 700, textAlign: "center", fontSize: { xs: "0.85rem", sm: "1rem" } }}>
        {label}
      </Typography>
    </Box>
  );
}
