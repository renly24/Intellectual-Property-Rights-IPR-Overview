"use client";
import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import LightbulbOutlined from "@mui/icons-material/LightbulbOutlined";
import type { TapStep } from "@/content/types";
import { COLORS } from "@/theme";
import { ActivityHeader, type ActivityProps } from "./common";
import Rich from "./Rich";

/** 文中タップ指摘。あてはまる語句をすべてタップして、答え合わせする */
export default function TapView({ step, onResult, onDone }: ActivityProps<TapStep>) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [checked, setChecked] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const targets = step.segments.flatMap((s) => (typeof s === "string" ? [] : [s]));

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
    onDone();
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
        component="article"
        sx={{ bgcolor: "#fff", border: `1px solid ${COLORS.line}`, borderRadius: 4, p: { xs: 2.5, sm: 4 } }}
      >
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          {step.source}
        </Typography>
        <Typography component="div" sx={{ fontSize: { xs: "1.1rem", sm: "1.3rem" }, lineHeight: 2.4 }}>
          {step.segments.map((s, i) => {
            if (typeof s === "string") return <span key={i}>{s}</span>;
            const on = selected.has(s.id);
            const right = on === s.correct;
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
                  outline: on ? `2px solid ${color}` : "none",
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

      {!checked && step.hint && (
        <Box sx={{ mt: 2 }}>
          {showHint ? (
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
              sx={{ borderColor: COLORS.border, color: COLORS.ink }}
            >
              ヒントを見る
            </Button>
          )}
        </Box>
      )}

      {!checked ? (
        <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
          <Button variant="contained" size="large" onClick={check}>
            答え合わせ
          </Button>
        </Box>
      ) : (
        <Box sx={{ mt: 3, display: "flex", flexDirection: "column", gap: 1.5 }} className="reveal" aria-live="polite">
          <Typography
            sx={{ fontWeight: 700, color: allRight ? COLORS.blue : COLORS.orange }}
            data-feedback={allRight ? "correct" : "incorrect"}
          >
            {allRight
              ? "全部正解！"
              : `${targets.filter((t) => selected.has(t.id) === t.correct).length} / ${targets.length} か所 正しく判断できました`}
          </Typography>
          {targets.map((t) => (
            <Box key={t.id} sx={{ bgcolor: "#fff", border: `1px solid ${COLORS.line}`, borderRadius: 3, p: 1.75 }}>
              <Typography sx={{ fontWeight: 700 }}>
                <span style={{ color: t.correct ? COLORS.blue : COLORS.muted }}>
                  {t.correct ? (step.labels?.correct ?? "あてはまる") : (step.labels?.wrong ?? "あてはまらない")}
                </span>
                ：{t.text}
              </Typography>
              <Typography variant="body2" sx={{ lineHeight: 1.8 }}>
                <Rich text={t.explanation} />
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
