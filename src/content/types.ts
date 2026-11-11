/**
 * 教材データの型。章の中身は src/content/chapters/*.json に書き、ここの型に合わせる。
 *
 * 文章中の **太字** は重要語として色付きの太字で表示される。
 */

/** 解説の途中に挟む小問（選択式） */
export type CheckBlock = {
  type: "check";
  id: string;
  question: string;
  choices: string[];
  /** 正解の choices の添字（0 始まり） */
  answer: number;
  explanation: string;
  /** 根拠条文など（任意） */
  ref?: string;
};

export type ParagraphBlock = { type: "p"; text: string };

/** 要点を囲みで示す */
export type PointBlock = { type: "point"; title?: string; items: string[] };

export type LessonBlock = ParagraphBlock | PointBlock | CheckBlock;

/** 解説（数段落ごとに小問。答えると続きが開く） */
export type LessonStep = {
  type: "lesson";
  id: string;
  title: string;
  blocks: LessonBlock[];
};

/** ドラッグ仕分け */
export type SortStep = {
  type: "sort";
  id: string;
  title: string;
  instruction: string;
  bins: { id: string; label: string; desc?: string }[];
  cards: { id: string; label: string; bin: string; explanation: string; ref?: string }[];
};

/** スワイプ判定（左右の二択） */
export type SwipeStep = {
  type: "swipe";
  id: string;
  title: string;
  instruction: string;
  left: string;
  right: string;
  cards: { id: string; text: string; answer: "left" | "right"; explanation: string; ref?: string }[];
};

/** 文中タップ指摘。segments の文字列はそのまま表示、オブジェクトはタップできる語句 */
export type TapSegment = string | { id: string; text: string; correct: boolean; explanation: string };

export type TapStep = {
  type: "tap";
  id: string;
  title: string;
  instruction: string;
  source: string;
  segments: TapSegment[];
  hint?: string;
  /** 答え合わせで語句の横に出す言葉（省略時は「あてはまる」「あてはまらない」） */
  labels?: { correct: string; wrong: string };
};

/** 選択問題（1問ずつ） */
export type ChoiceQuestion = {
  id: string;
  question: string;
  choices: string[];
  answer: number;
  explanation: string;
  ref?: string;
};

export type ChoiceStep = {
  type: "choice";
  id: string;
  title: string;
  instruction?: string;
  questions: ChoiceQuestion[];
};

/** まとめ（得点・ポイント・間違えた問題） */
export type SummaryStep = {
  type: "summary";
  id: string;
  title: string;
  points: string[];
};

export type ActivityStep = SortStep | SwipeStep | TapStep | ChoiceStep;
export type Step = LessonStep | ActivityStep | SummaryStep;

export type Chapter = {
  id: number;
  title: string;
  /** 章一覧に表示する主な操作 */
  ops: string;
  minutes: number;
  steps: Step[];
};

/** 章一覧に出す情報（中身がまだない章も含む） */
export type ChapterMeta = {
  id: number;
  title: string;
  ops?: string;
  minutes?: number;
  available: boolean;
};
