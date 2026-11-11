import type { Chapter, ChapterMeta } from "./types";
import chapter1 from "./chapters/chapter1.json";
import chapter2 from "./chapters/chapter2.json";
import chapter3 from "./chapters/chapter3.json";

/** 中身のある章。章を追加したら JSON を作ってここに足す */
export const CHAPTERS: Chapter[] = [chapter1, chapter2, chapter3] as Chapter[];

/** 章一覧に出す全10章（中身がまだの章は「準備中」） */
const PLANNED: { id: number; title: string }[] = [
  { id: 4, title: "著作隣接権と保護期間" },
  { id: 5, title: "許諾なく使える場合" },
  { id: 6, title: "学校での利用" },
  { id: 7, title: "SNS・動画投稿と著作権" },
  { id: 8, title: "生成AIと著作権" },
  { id: 9, title: "周辺の権利" },
  { id: 10, title: "総合演習（共通テスト形式）" },
];

export const CHAPTER_LIST: ChapterMeta[] = [
  ...CHAPTERS.map((c) => ({ id: c.id, title: c.title, ops: c.ops, minutes: c.minutes, available: true })),
  ...PLANNED.filter((p) => !CHAPTERS.some((c) => c.id === p.id)).map((p) => ({ ...p, available: false })),
].sort((a, b) => a.id - b.id);

export function getChapter(id: number): Chapter | undefined {
  return CHAPTERS.find((c) => c.id === id);
}
