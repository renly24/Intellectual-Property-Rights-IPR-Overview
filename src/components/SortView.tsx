"use client";
import { type PointerEvent as ReactPointerEvent, useMemo, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import CheckRounded from "@mui/icons-material/CheckRounded";
import type { SortStep } from "@/content/types";
import { COLORS } from "@/theme";
import { ActivityHeader, type ActivityProps, Feedback, stableShuffle, useOnceWhen } from "./common";

type Drag = { id: string; pointerId: number; startX: number; startY: number; x: number; y: number; moved: boolean };

/** 指やマウスがこれ以上動いたら「ドラッグ」とみなす（それより小さければタップ） */
const DRAG_THRESHOLD = 8;

/**
 * ドラッグ仕分け。
 * - カードを指・マウスでドラッグして箱に落とす（Pointer Events。iPad の Safari でも動く）
 * - カードをタップして選び、箱（または「〜に置く」ボタン）をタップしても置ける
 */
export default function SortView({ step, onResult, onDone }: ActivityProps<SortStep>) {
  const cards = useMemo(() => stableShuffle(step.cards, step.id), [step]);
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const [picked, setPicked] = useState<string | null>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [hoverBin, setHoverBin] = useState<string | null>(null);
  const [last, setLast] = useState<{ cardId: string; correct: boolean } | null>(null);
  const [shake, setShake] = useState<{ bin: string; n: number } | null>(null);
  const answered = useRef(new Set<string>());
  const suppressClick = useRef(false);

  const pool = cards.filter((c) => !(c.id in placed));
  useOnceWhen(pool.length === 0, onDone);

  const put = (binId: string, cardId: string) => {
    const card = step.cards.find((c) => c.id === cardId);
    if (!card || cardId in placed) return;
    const correct = card.bin === binId;
    if (!answered.current.has(cardId)) {
      answered.current.add(cardId);
      onResult(cardId, correct);
    }
    setPicked(null);
    setLast({ cardId, correct });
    if (correct) setPlaced((p) => ({ ...p, [cardId]: binId }));
    else setShake({ bin: binId, n: (shake?.n ?? 0) + 1 });
  };

  const binAt = (x: number, y: number) =>
    (document.elementFromPoint(x, y)?.closest("[data-bin]") as HTMLElement | null)?.dataset.bin ?? null;

  const onPointerDown = (e: ReactPointerEvent<HTMLButtonElement>, id: string) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrag({
      id,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      x: e.clientX,
      y: e.clientY,
      moved: false,
    });
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (!drag || e.pointerId !== drag.pointerId) return;
    const moved = drag.moved || Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) > DRAG_THRESHOLD;
    setDrag({ ...drag, x: e.clientX, y: e.clientY, moved });
    if (moved) setHoverBin(binAt(e.clientX, e.clientY));
  };
  const onPointerUp = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (!drag || e.pointerId !== drag.pointerId) return;
    if (drag.moved) {
      // ドラッグのあとに来る click で「選択」にならないようにする
      suppressClick.current = true;
      setTimeout(() => (suppressClick.current = false), 0);
      const bin = binAt(e.clientX, e.clientY);
      if (bin) put(bin, drag.id);
    }
    setDrag(null);
    setHoverBin(null);
  };
  const onCardClick = (id: string) => {
    if (suppressClick.current) return;
    setPicked(picked === id ? null : id);
  };

  const dragging = drag?.moved ? cards.find((c) => c.id === drag.id) : undefined;
  const lastCard = last ? step.cards.find((c) => c.id === last.cardId) : undefined;

  return (
    <Box>
      <ActivityHeader
        title={step.title}
        instruction={step.instruction}
        sub="ドラッグが難しいときは、カードをタップしてから箱をタップしても置けます"
      />

      <Box
        aria-label="仕分けるカード"
        sx={{
          minHeight: 88,
          bgcolor: "#fff",
          border: `1px dashed ${COLORS.border}`,
          borderRadius: 4,
          p: 2,
          display: "flex",
          flexWrap: "wrap",
          gap: 1.5,
          alignContent: "flex-start",
        }}
      >
        {pool.length === 0 && (
          <Typography color="text.secondary" sx={{ m: "auto" }}>
            すべて仕分けました
          </Typography>
        )}
        {pool.map((c) => {
          const on = picked === c.id;
          const lifted = drag?.moved && drag.id === c.id;
          return (
            <Box
              key={c.id}
              component="button"
              type="button"
              data-card={c.id}
              aria-pressed={on}
              onPointerDown={(e: ReactPointerEvent<HTMLButtonElement>) => onPointerDown(e, c.id)}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={() => {
                setDrag(null);
                setHoverBin(null);
              }}
              onClick={() => onCardClick(c.id)}
              sx={{
                font: "inherit",
                fontSize: "1.02rem",
                fontWeight: on ? 700 : 500,
                minHeight: 52,
                px: 2.25,
                py: 1,
                borderRadius: 2.5,
                border: `2px solid ${on ? COLORS.blue : COLORS.border}`,
                bgcolor: on ? COLORS.blueSoft : "#fff",
                color: on ? COLORS.blue : COLORS.ink,
                boxShadow: "0 1px 2px rgba(28,36,51,0.08)",
                cursor: "grab",
                touchAction: "none",
                userSelect: "none",
                WebkitUserSelect: "none",
                opacity: lifted ? 0.3 : 1,
                textAlign: "left",
              }}
            >
              {c.label}
            </Box>
          );
        })}
      </Box>

      <Box
        sx={{
          mt: 2.5,
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: `repeat(${Math.min(step.bins.length, 2)}, minmax(0, 1fr))`,
            md: `repeat(${step.bins.length}, minmax(0, 1fr))`,
          },
          gap: 2,
        }}
      >
        {step.bins.map((b) => {
          const active = hoverBin === b.id || (picked !== null && !drag?.moved);
          const inBin = cards.filter((c) => placed[c.id] === b.id);
          return (
            <Box
              key={`${b.id}-${shake?.bin === b.id ? shake.n : 0}`}
              className={shake?.bin === b.id ? "shake" : undefined}
              data-bin={b.id}
              onClick={() => picked && put(b.id, picked)}
              sx={{
                bgcolor: hoverBin === b.id ? COLORS.blueSoft : "#fff",
                border: `2px ${active ? "dashed" : "solid"} ${active ? COLORS.blue : COLORS.border}`,
                borderRadius: 4,
                p: 2,
                minHeight: 160,
                display: "flex",
                flexDirection: "column",
                gap: 1.25,
                cursor: picked ? "pointer" : "default",
              }}
            >
              <Box>
                <Typography sx={{ fontWeight: 700, fontSize: "1.1rem" }}>{b.label}</Typography>
                {b.desc && (
                  <Typography variant="body2" color="text.secondary">
                    {b.desc}
                  </Typography>
                )}
              </Box>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {inBin.map((c) => (
                  <Box
                    key={c.id}
                    className="pop"
                    data-placed={c.id}
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 0.5,
                      minHeight: 44,
                      px: 1.75,
                      borderRadius: 2.5,
                      bgcolor: COLORS.blueSoft,
                      color: COLORS.blue,
                      fontWeight: 500,
                    }}
                  >
                    {c.label}
                    <CheckRounded fontSize="small" />
                  </Box>
                ))}
              </Box>
              {picked && (
                <Button
                  variant="outlined"
                  onClick={(e) => {
                    e.stopPropagation();
                    put(b.id, picked);
                  }}
                  sx={{ mt: "auto", borderStyle: "dashed", borderWidth: 2 }}
                >
                  「{b.label}」に置く
                </Button>
              )}
            </Box>
          );
        })}
      </Box>

      <Box sx={{ mt: 2.5, minHeight: 96 }} aria-live="polite">
        {last && lastCard && (
          <Feedback
            key={`${last.cardId}-${shake?.n ?? 0}-${Object.keys(placed).length}`}
            correct={last.correct}
            label={
              last.correct ? `正解！「${lastCard.label}」` : `ちがう箱です。「${lastCard.label}」をもう一度考えよう`
            }
            explanation={
              last.correct
                ? lastCard.explanation
                : "カードは元の場所に戻りました。それぞれの箱の説明を読んで、もう一度置いてみよう。"
            }
            refText={last.correct ? lastCard.ref : undefined}
          />
        )}
      </Box>

      {dragging && drag && (
        <Box
          aria-hidden
          sx={{
            position: "fixed",
            left: drag.x,
            top: drag.y,
            transform: "translate(-50%, -50%) rotate(-3deg)",
            pointerEvents: "none",
            zIndex: 1300,
            minHeight: 52,
            px: 2.25,
            display: "flex",
            alignItems: "center",
            borderRadius: 2.5,
            border: `2px solid ${COLORS.blue}`,
            bgcolor: "#fff",
            color: COLORS.blue,
            fontWeight: 700,
            boxShadow: "0 10px 24px rgba(29,78,216,0.25)",
            whiteSpace: "nowrap",
          }}
        >
          {dragging.label}
        </Box>
      )}
    </Box>
  );
}
