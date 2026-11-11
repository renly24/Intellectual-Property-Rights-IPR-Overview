import type { Metadata } from "next";
import { Suspense } from "react";
import ReviewScreen from "@/components/ReviewScreen";

export const metadata: Metadata = { title: "復習｜著作権を学ぼう" };

export default function Page() {
  // ?chapter= を読むため、クライアント側で描画する
  return (
    <Suspense>
      <ReviewScreen />
    </Suspense>
  );
}
