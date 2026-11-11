import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ChapterScreen from "@/components/ChapterScreen";
import { CHAPTERS, getChapter } from "@/content";

// 静的エクスポートなので、中身のある章だけを書き出す
export const dynamicParams = false;

export function generateStaticParams() {
  return CHAPTERS.map((c) => ({ id: String(c.id) }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const chapter = getChapter(Number(id));
  return { title: chapter ? `第${chapter.id}章 ${chapter.title}｜著作権を学ぼう` : "著作権を学ぼう" };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const chapter = getChapter(Number(id));
  if (!chapter) notFound();
  return <ChapterScreen id={chapter.id} />;
}
