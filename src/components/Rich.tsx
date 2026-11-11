import { Fragment } from "react";
import { COLORS } from "@/theme";

/** 文章中の **太字** を、色付きの太字（重要語）にして表示する */
export default function Rich({ text, color = COLORS.blue }: { text: string; color?: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <strong key={i} style={{ color }}>
            {part}
          </strong>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}
