import type { Chapter, ChapterMeta } from "./types";
import copyright1 from "./copyright/chapter1.json";
import copyright2 from "./copyright/chapter2.json";
import copyright3 from "./copyright/chapter3.json";
import copyright4 from "./copyright/chapter4.json";
import copyright5 from "./copyright/chapter5.json";
import copyright6 from "./copyright/chapter6.json";
import cyber1 from "./cyber/chapter1.json";
import cyber2 from "./cyber/chapter2.json";

/**
 * 教材（コース）。1つのリポジトリから、知的財産系とサイバー犯罪系の2つの教材を別々に書き出す。
 * どちらを書き出すかは、ビルドのときの環境変数 NEXT_PUBLIC_COURSE で選ぶ（省略時は copyright）。
 * 公開先のフォルダーも教材ごとに分ける（.github/workflows/deploy-ftp.yml・deploy.yml）。
 */
export type CourseId = "copyright" | "cyber";

export type Course = {
  id: CourseId;
  /** 画面の見出しとページのタイトル */
  title: string;
  /** 見出しの横に小さく出す説明 */
  tagline: string;
  description: string;
  /** 見出しの左のマーク */
  mark: "copyright" | "lock";
  /** 学習の記録を保存する localStorage のキー。同じサーバーに置いても記録が混ざらないよう、教材ごとに分ける */
  storageKey: string;
  /** 中身のある章。章を追加したら JSON を作ってここに足す */
  chapters: Chapter[];
  /** 章一覧に出す、中身がまだの章（「準備中」） */
  planned: { id: number; title: string }[];
};

export const COURSES: Record<CourseId, Course> = {
  copyright: {
    id: "copyright",
    title: "著作権を学ぼう",
    tagline: "情報Ⅰ・共通テスト対策",
    description:
      "高校「情報Ⅰ」・共通テスト対策。著作権を中心とした知的財産権と、プライバシー権・個人情報を、ドラッグ・スワイプ・タップで手を動かしながら学ぶ教育用アプリ",
    mark: "copyright",
    storageKey: "edu-copyright-progress-v1",
    chapters: [copyright1, copyright2, copyright3, copyright4, copyright5, copyright6] as Chapter[],
    planned: [{ id: 7, title: "総合演習（共通テスト形式）" }],
  },
  cyber: {
    id: "cyber",
    title: "サイバー犯罪とマルウェアを学ぼう",
    tagline: "情報Ⅰ・共通テスト対策",
    description:
      "高校「情報Ⅰ」・共通テスト対策。サイバー犯罪の種類と法律、マルウェアと身の守り方を、ドラッグ・スワイプ・タップで手を動かしながら学ぶ教育用アプリ",
    mark: "lock",
    // 章の並びを変えたので v2 にする（v1 の記録は別の章の記録になってしまうため使わない）
    storageKey: "edu-cyber-progress-v2",
    chapters: [cyber1, cyber2] as Chapter[],
    planned: [],
  },
};

function selectCourse(): Course {
  const id = process.env.NEXT_PUBLIC_COURSE ?? "copyright";
  if (!(id in COURSES)) throw new Error(`NEXT_PUBLIC_COURSE は copyright か cyber にしてください（今の値：${id}）`);
  return COURSES[id as CourseId];
}

/** この書き出しで使う教材 */
export const COURSE: Course = selectCourse();

export const CHAPTERS: Chapter[] = COURSE.chapters;

export const CHAPTER_LIST: ChapterMeta[] = [
  ...CHAPTERS.map((c) => ({ id: c.id, title: c.title, ops: c.ops, minutes: c.minutes, available: true })),
  ...COURSE.planned.filter((p) => !CHAPTERS.some((c) => c.id === p.id)).map((p) => ({ ...p, available: false })),
].sort((a, b) => a.id - b.id);

export function getChapter(id: number): Chapter | undefined {
  return CHAPTERS.find((c) => c.id === id);
}
