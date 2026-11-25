import type { Metadata } from "next";
import { Suspense } from "react";
import ReviewScreen from "@/components/ReviewScreen";
import { COURSE } from "@/content";

export const metadata: Metadata = { title: `復習｜${COURSE.title}` };

export default function Page() {
  // ?chapter= を読むため、クライアント側で描画する
  return (
    <Suspense>
      <ReviewScreen />
    </Suspense>
  );
}
