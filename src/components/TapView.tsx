"use client";
import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import LightbulbOutlined from "@mui/icons-material/LightbulbOutlined";
import type { TapStep } from "@/content/types";
import { COLORS, SHORT_SCREEN } from "@/theme";
import { ActivityHeader, type ActivityProps, useOnceWhen } from "./common";
import Rich from "./Rich";

/**
 * 文中タップ指摘。あてはまる語句をすべてタップして、答え合わせする。
 * 答え合わせのあとは、語句ごとの解説を右側に1つずつ出し、画面下の「次へ」で次の語句へ進む
 * （解説を下に並べると画面からはみ出して、読まずに進んでしまうため）。
 */
export default function TapView({ step, onResult, onDone, setNext }: ActivityProps<TapStep>) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [checked, setChecked] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [cur, setCur] = useState(0);
  const targets = step.segments.flatMap((s) => (typeof s === "string" ? [] : [s]));
  const isLast = cur === targets.length - 1;
  useOnceWhen(checked && isLast, onDone);

  useEffect(() => {
    if (!setNext) return;
    setNext(checked && !isLast ? { hint: "次の語句の解説へ", go: () => setCur((c) => c + 1) } : null);
  }, [setNext, checked, isLast]);

  const toggle = (id: string) => {
    if (checked) return;
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const check = () => {
    setChecked(true);
    for (const t of targets) onResult(t.id, selected.has(t.id) === t.correct);
  };

  const allRight = targets.every((t) => selected.has(t.id) === t.correct);

  return (
    <Box>
      <ActivityHeader
        title={step.title}
        instruction={step.instruction}
        sub={
          checked
            ? undefined
            : `下線の語句をタップできます。もう一度タップすると選択を外せます（選択中 ${selected.size} か所）`
        }
      />

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "minmax(0, 2fr) minmax(0, 1fr)" },
          gap: { xs: 2.5, md: 3 },
          alignItems: "start",
        }}
      >
        <Box
          component="article"
          sx={{
            bgcolor: "#fff",
            border: `1px solid ${COLORS.line}`,
            borderRadius: 4,
            p: { xs: 2.5, sm: 4 },
            [SHORT_SCREEN]: { p: 2.5 },
          }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            {step.source}
          </Typography>
          <Typography
            component="div"
            sx={{
              fontSize: { xs: "1.1rem", sm: "1.25rem" },
              lineHeight: 2.4,
              [SHORT_SCREEN]: { fontSize: "1.1rem", lineHeight: 2.1 },
            }}
          >
            {step.segments.map((s, i) => {
              if (typeof s === "string") return <span key={i}>{s}</span>;
              const on = selected.has(s.id);
              const right = on === s.correct;
              const current = checked && targets[cur]?.id === s.id;
              const color = !checked
                ? on
                  ? COLORS.blue
                  : COLORS.ink
                : s.correct
                  ? COLORS.blue
                  : on
                    ? COLORS.orange
                    : COLORS.ink;
              return (
                <Box
                  key={i}
                  component="button"
                  type="button"
                  data-tap={s.id}
                  aria-pressed={on}
                  disabled={checked}
                  onClick={() => toggle(s.id)}
                  sx={{
                    font: "inherit",
                    lineHeight: 1.6,
                    mx: 0.25,
                    px: on || (checked && s.correct) ? 1 : 0.5,
                    py: 0.25,
                    minHeight: 44,
                    cursor: checked ? "default" : "pointer",
                    color,
                    fontWeight: on || (checked && s.correct) ? 700 : 400,
                    bgcolor: on ? (checked && !right ? COLORS.orangeSoft : COLORS.blueSoft) : "transparent",
                    border: "none",
                    borderRadius: 2,
                    borderBottom: on ? "none" : `2px dashed ${checked && s.correct ? COLORS.blue : COLORS.muted}`,
                    outline: current ? `3px solid ${COLORS.ink}` : on ? `2px solid ${color}` : "none",
                    outlineOffset: -2,
                    "&:disabled": { color },
                  }}
                >
                  {s.text}
                  {checked && (
                    <Box component="span" sx={{ ml: 0.5, fontSize: "0.8em" }}>
                      {right ? "✓" : s.correct ? "（見落とし）" : "✗"}
                    </Box>
                  )}
                </Box>
              );
            })}
          </Typography>
        </Box>

        <Box component="aside" sx={{ display: "flex", flexDirection: "column", gap: 1.5 }} aria-live="polite">
          {!checked ? (
            <>
              {step.hint &&
                (showHint ? (
                  <Box
                    sx={{
                      bgcolor: "#fff",
                      border: `1px solid ${COLORS.line}`,
                      borderRadius: 3,
                      p: 2,
                      display: "flex",
                      gap: 1.5,
                    }}
                  >
                    <LightbulbOutlined sx={{ color: COLORS.muted }} />
                    <Typography sx={{ lineHeight: 1.8 }}>
                      ヒント：
                      <Rich text={step.hint} />
                    </Typography>
                  </Box>
                ) : (
                  <Button
                    variant="outlined"
                    onClick={() => setShowHint(true)}
                    sx={{ borderColor: COLORS.border, color: COLORS.ink, alignSelf: "flex-start" }}
                  >
                    ヒントを見る
                  </Button>
                ))}
              <Button variant="contained" size="large" onClick={check}>
                答え合わせ
              </Button>
            </>
          ) : (
            <Box className="reveal" sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              <Typography
                sx={{ fontWeight: 700, color: allRight ? COLORS.blue : COLORS.orange }}
                data-feedback={allRight ? "correct" : "incorrect"}
              >
                {allRight
                  ? "全部正解！"
                  : `${targets.filter((t) => selected.has(t.id) === t.correct).length} / ${targets.length} か所 正しく判断できました`}
              </Typography>
              {targets[cur] && (
                <Box
                  key={targets[cur].id}
                  className="reveal"
                  data-tap-explanation={targets[cur].id}
                  sx={{ bgcolor: "#fff", border: `2px solid ${COLORS.ink}`, borderRadius: 3, p: 2 }}
                >
                  <Typography variant="body2" color="text.secondary">
                    解説 {cur + 1} / {targets.length}（文中の太い枠の語句）
                  </Typography>
                  <Typography sx={{ fontWeight: 700, mt: 0.5 }}>
                    <span style={{ color: targets[cur].correct ? COLORS.blue : COLORS.muted }}>
                      {targets[cur].correct
                        ? (step.labels?.correct ?? "あてはまる")
                        : (step.labels?.wrong ?? "あてはまらない")}
                    </span>
                    ：{targets[cur].text}
                  </Typography>
                  <Typography sx={{ lineHeight: 1.8, mt: 0.5 }}>
                    <Rich text={targets[cur].explanation} />
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
