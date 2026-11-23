import type { Chapter, ChapterMeta } from "./types";
import chapter1 from "./chapters/chapter1.json";
import chapter2 from "./chapters/chapter2.json";
import chapter3 from "./chapters/chapter3.json";
import chapter4 from "./chapters/chapter4.json";
import chapter5 from "./chapters/chapter5.json";
import chapter6 from "./chapters/chapter6.json";
import chapter7 from "./chapters/chapter7.json";
import chapter8 from "./chapters/chapter8.json";

/** 中身のある章。章を追加したら JSON を作ってここに足す */
export const CHAPTERS: Chapter[] = [
  chapter1,
  chapter2,
  chapter3,
  chapter4,
  chapter5,
  chapter6,
  chapter7,
  chapter8,
] as Chapter[];

/** 章一覧に出す全9章（中身がまだの章は「準備中」） */
const PLANNED: { id: number; title: string }[] = [
  { id: 4, title: "著作隣接権・保護期間・クリエイティブ・コモンズ" },
  { id: 5, title: "許諾なく使える場合" },
  { id: 6, title: "プライバシー権と個人情報" },
  { id: 7, title: "サイバー犯罪の種類と法律" },
  { id: 8, title: "マルウェアと身の守り方" },
  { id: 9, title: "総合演習（共通テスト形式）" },
];

export const CHAPTER_LIST: ChapterMeta[] = [
  ...CHAPTERS.map((c) => ({ id: c.id, title: c.title, ops: c.ops, minutes: c.minutes, available: true })),
  ...PLANNED.filter((p) => !CHAPTERS.some((c) => c.id === p.id)).map((p) => ({ ...p, available: false })),
].sort((a, b) => a.id - b.id);

export function getChapter(id: number): Chapter | undefined {
  return CHAPTERS.find((c) => c.id === id);
}
