import { expect, test, type Locator, type Page, type TestInfo } from "@playwright/test";
import { CHAPTERS } from "../src/content";
import type { ChoiceStep, LessonStep, SortStep, Step, SwipeStep, TapStep } from "../src/content/types";

/**
 * 第1〜3章を最初から最後まで、実際の操作（ドラッグ・スワイプ・タップ）で解き、
 * まとめの正答率と、間違えた問題の復習まで確認する。
 *
 * デスクトップ（マウス）とタブレット（タッチ）の両方の projects で実行し、
 * 「マウスでは動くがタッチでは反応しない」種類の不具合を検知する。
 * 答えは教材データ（src/content/chapters/*.json）から読むので、問題を直してもテストはそのまま使える。
 */

const CONSOLE_IGNORE = [/Download the React DevTools/i];

function trackPageErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (CONSOLE_IGNORE.some((re) => re.test(text))) return;
    errors.push(`console.error: ${text}`);
  });
  return errors;
}

const isTouch = (info: TestInfo) => !!info.project.use.hasTouch;

/** タッチ端末ではタップ、それ以外ではクリック */
async function press(locator: Locator, info: TestInfo) {
  if (isTouch(info)) await locator.tap();
  else await locator.click();
}

async function goNext(page: Page, info: TestInfo) {
  const next = page.getByRole("button", { name: "次へ", exact: true });
  await expect(next).toBeEnabled();
  await press(next, info);
}

/** マウスで要素を target までドラッグする */
async function mouseDrag(page: Page, from: Locator, to: { x: number; y: number }) {
  const box = (await from.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(to.x, to.y, { steps: 12 });
  await page.mouse.up();
}

async function center(locator: Locator) {
  const box = (await locator.boundingBox())!;
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

async function solveLesson(page: Page, step: LessonStep, info: TestInfo) {
  for (const b of step.blocks) {
    if (b.type !== "check") continue;
    const section = page.locator(`[data-check="${b.id}"]`);
    await press(section.getByRole("button", { name: b.choices[b.answer], exact: true }), info);
    await expect(section.locator('[data-feedback="correct"]')).toBeVisible();
  }
}

/**
 * ドラッグ仕分け。デスクトップでは最初のカードを本当にドラッグし、残りはタップで選んで置く。
 * mistake を渡すと、そのカードを一度わざと違う箱に置く。
 */
async function solveSort(page: Page, step: SortStep, info: TestInfo, mistake?: string) {
  for (const [i, card] of step.cards.entries()) {
    const el = page.locator(`[data-card="${card.id}"]`);
    if (card.id === mistake) {
      const wrong = step.bins.find((b) => b.id !== card.bin)!;
      await press(el, info);
      await press(page.getByRole("button", { name: `「${wrong.label}」に置く` }), info);
      await expect(page.locator('[data-feedback="incorrect"]')).toBeVisible();
      await expect(el).toBeVisible(); // カードは元の場所に戻る
    }
    const bin = step.bins.find((b) => b.id === card.bin)!;
    if (i === 0 && !isTouch(info)) {
      await mouseDrag(page, el, await center(page.locator(`[data-bin="${bin.id}"]`)));
    } else {
      await press(el, info);
      await press(page.getByRole("button", { name: `「${bin.label}」に置く` }), info);
    }
    await expect(page.locator(`[data-bin="${bin.id}"] [data-placed="${card.id}"]`)).toBeVisible();
  }
  await expect(page.getByText("すべて仕分けました")).toBeVisible();
}

/** スワイプ判定。デスクトップでは最初の2枚をマウスでスワイプし、残りはボタンで答える */
async function solveSwipe(page: Page, step: SwipeStep, info: TestInfo) {
  for (const [i, card] of step.cards.entries()) {
    const el = page.locator(`[data-swipe-card="${card.id}"]`);
    await expect(el).toBeVisible();
    if (i < 2 && !isTouch(info)) {
      const c = await center(el);
      await mouseDrag(page, el, { x: c.x + (card.answer === "right" ? 220 : -220), y: c.y });
    } else {
      await press(
        page.getByRole("button", { name: card.answer === "right" ? step.right : step.left, exact: true }),
        info,
      );
    }
    await expect(page.locator("aside").getByText(`「${card.text}」`)).toBeVisible();
    await expect(page.locator('aside [data-feedback="correct"]')).toBeVisible();
  }
  await expect(page.getByText("すべて判定しました")).toBeVisible();
}

async function solveTap(page: Page, step: TapStep, info: TestInfo) {
  for (const s of step.segments) {
    if (typeof s !== "string" && s.correct) await press(page.locator(`[data-tap="${s.id}"]`), info);
  }
  await press(page.getByRole("button", { name: "答え合わせ" }), info);
  await expect(page.getByText("全部正解！")).toBeVisible();
}

async function solveChoice(page: Page, step: ChoiceStep, info: TestInfo) {
  for (const [i, q] of step.questions.entries()) {
    const box = page.locator(`[data-question="${q.id}"]`);
    await press(box.getByRole("button", { name: q.choices[q.answer], exact: true }), info);
    await expect(box.locator('[data-feedback="correct"]')).toBeVisible();
    if (i < step.questions.length - 1) await press(page.getByRole("button", { name: "次の問題" }), info);
  }
}

async function solveStep(page: Page, step: Step, info: TestInfo, mistake?: string) {
  switch (step.type) {
    case "lesson":
      return solveLesson(page, step, info);
    case "sort":
      return solveSort(page, step, info, mistake);
    case "swipe":
      return solveSwipe(page, step, info);
    case "tap":
      return solveTap(page, step, info);
    case "choice":
      return solveChoice(page, step, info);
    case "summary":
      return;
  }
}

function itemCount(steps: Step[]) {
  return steps.reduce((n, s) => {
    switch (s.type) {
      case "lesson":
        return n + s.blocks.filter((b) => b.type === "check").length;
      case "sort":
      case "swipe":
        return n + s.cards.length;
      case "tap":
        return n + s.segments.filter((x) => typeof x !== "string").length;
      case "choice":
        return n + s.questions.length;
      default:
        return n;
    }
  }, 0);
}

test("第1〜3章を最後まで解き、間違えた問題を復習できる", async ({ page }, info) => {
  const errors = trackPageErrors(page);
  await page.goto("./");
  await expect(page.getByRole("heading", { name: /著作権を学ぼう/ })).toBeVisible();

  // 第1章の最初のドラッグ仕分けで、1枚だけわざと間違える
  const mistake = { chapter: 1, step: "phone", card: "game" };

  for (const chapter of CHAPTERS) {
    if (chapter.id === 1) await press(page.getByRole("link", { name: "はじめる" }), info);
    await expect(page.getByRole("heading", { name: chapter.title, level: 1 })).toBeVisible();

    for (const [i, step] of chapter.steps.entries()) {
      const m = chapter.id === mistake.chapter && step.id === mistake.step ? mistake.card : undefined;
      await solveStep(page, step, info, m);
      if (i < chapter.steps.length - 1) await goNext(page, info);
    }

    // まとめ：正答率（最初の答えで計算）
    const total = itemCount(chapter.steps);
    const correct = chapter.id === mistake.chapter ? total - 1 : total;
    await expect(page.locator(`[data-score="${Math.round((correct / total) * 100)}"]`)).toBeVisible();
    if (chapter.id === mistake.chapter) {
      await expect(page.locator(`[data-mistake="${mistake.chapter}/${mistake.step}/${mistake.card}"]`)).toBeVisible();
    }

    const nextChapter = CHAPTERS.find((c) => c.id === chapter.id + 1);
    await press(
      page.getByRole("link", { name: nextChapter ? `第${nextChapter.id}章へ進む` : "章一覧へ", exact: true }),
      info,
    );
  }

  // 章一覧：3章とも完了、復習が1問
  await expect(page.getByRole("heading", { name: /著作権を学ぼう/ })).toBeVisible();
  await press(page.getByRole("link", { name: "復習する（1問）" }), info);

  // 復習：間違えたカードだけが出る
  const sortStep = CHAPTERS[0].steps.find((s) => s.id === mistake.step) as SortStep;
  await expect(page.locator("[data-card]")).toHaveCount(1);
  await solveSort(page, { ...sortStep, cards: sortStep.cards.filter((c) => c.id === mistake.card) }, info);
  await goNext(page, info);
  await expect(page.getByText("復習完了！全部正解できました")).toBeVisible();

  await press(page.getByRole("link", { name: "章一覧へ", exact: true }), info);
  await expect(page.getByRole("link", { name: "復習する（0問）" })).toHaveAttribute("aria-disabled", "true");

  expect(errors).toEqual([]);
});

test("途中でページを閉じても、続きのステップから再開できる", async ({ page }, info) => {
  await page.goto("./chapter/1/");
  await solveLesson(page, CHAPTERS[0].steps[0] as LessonStep, info);
  await goNext(page, info);
  await expect(page.getByText("スマホの中の知的財産権")).toBeVisible();

  await page.goto("./");
  await expect(page.getByText("つづきから")).toBeVisible();
  await press(page.getByRole("link", { name: "再開する" }), info);
  await expect(page.getByText("スマホの中の知的財産権")).toBeVisible();
});
