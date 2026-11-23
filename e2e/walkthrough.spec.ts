import { expect, test, type Locator, type Page, type TestInfo } from "@playwright/test";
import { CHAPTERS } from "../src/content";
import type { ChoiceStep, LessonStep, QuizStep, SortStep, Step, SwipeStep, TapStep } from "../src/content/types";
import { lessonPages } from "../src/lib/steps";

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

/** 解説は小問ごとのページに分かれていて、小問に答えたら画面下の「次へ」で次のページへ進む */
async function solveLesson(page: Page, step: LessonStep, info: TestInfo) {
  const pages = lessonPages(step.blocks);
  for (const [i, blocks] of pages.entries()) {
    await expect(page.locator(`[data-page="${i}"]`)).toBeVisible();
    for (const b of blocks) {
      if (b.type !== "check") continue;
      const section = page.locator(`[data-check="${b.id}"]`);
      await press(section.getByRole("button", { name: b.choices[b.answer], exact: true }), info);
      await expect(section.locator('[data-feedback="correct"]')).toBeInViewport();
    }
    if (i < pages.length - 1) await goNext(page, info);
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
    await expect(box.locator('[data-feedback="correct"]')).toBeInViewport();
    if (i < step.questions.length - 1) await goNext(page, info);
  }
}

/**
 * 確認テスト。選択肢の順番は毎回変わるので、文字で探して押す。
 * mistake を渡すと、その問題を1回目にわざと間違え、間違えた問題だけの2回目で正解して合格する。
 */
async function solveQuiz(page: Page, step: QuizStep, info: TestInfo, mistake?: string) {
  const answerOne = async (q: QuizStep["questions"][number], wrong: boolean) => {
    const box = page.locator(`[data-question="${q.id}"]`);
    const text = wrong ? q.choices.find((_, i) => i !== q.answer)! : q.choices[q.answer];
    await press(box.getByRole("button", { name: text, exact: true }), info);
    await expect(box.locator(`[data-feedback="${wrong ? "incorrect" : "correct"}"]`)).toBeInViewport();
    await goNext(page, info);
  };
  for (const q of step.questions) await answerOne(q, q.id === mistake);
  if (mistake) {
    // 合格するまでまとめへは進めない
    await expect(page.locator("[data-quiz-result]")).toBeVisible();
    await expect(page.getByText("5問中 4問 正解")).toBeVisible();
    await goNext(page, info);
    await expect(page.getByText("第 1 問 / 全 1 問", { exact: false })).toBeVisible();
    await answerOne(
      step.questions.find((q) => q.id === mistake)!,
      false,
    );
  }
  await expect(page.locator("[data-quiz-passed]")).toBeVisible();
  await expect(page.getByText("授業のプリントに「合格」と記録しよう")).toBeVisible();
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
    case "quiz":
      return solveQuiz(page, step, info, mistake);
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
      case "quiz":
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

  // 第1章の最初のドラッグ仕分けで1枚、確認テストで1問、わざと間違える
  const mistake = { chapter: 1, step: "phone", card: "game" };
  const quizMistake = { chapter: 1, step: "quiz", question: "brand" };

  for (const chapter of CHAPTERS) {
    if (chapter.id === 1) await press(page.getByRole("link", { name: "はじめる" }), info);
    await expect(page.getByRole("heading", { name: chapter.title, level: 1 })).toBeVisible();

    for (const [i, step] of chapter.steps.entries()) {
      const m =
        chapter.id === mistake.chapter && step.id === mistake.step
          ? mistake.card
          : chapter.id === quizMistake.chapter && step.id === quizMistake.step
            ? quizMistake.question
            : undefined;
      await solveStep(page, step, info, m);
      if (i < chapter.steps.length - 1) await goNext(page, info);
    }

    // まとめ：正答率（最初の答えで計算）
    const total = itemCount(chapter.steps);
    const correct = chapter.id === mistake.chapter ? total - 2 : total;
    await expect(page.locator(`[data-score="${Math.round((correct / total) * 100)}"]`)).toBeVisible();
    if (chapter.id === mistake.chapter) {
      await expect(page.locator(`[data-mistake="${mistake.chapter}/${mistake.step}/${mistake.card}"]`)).toBeVisible();
      await expect(
        page.locator(`[data-mistake="${quizMistake.chapter}/${quizMistake.step}/${quizMistake.question}"]`),
      ).toBeVisible();
    }
    await expect(page.getByText("確認テスト 合格")).toBeVisible();

    const nextChapter = CHAPTERS.find((c) => c.id === chapter.id + 1);
    await press(
      page.getByRole("link", { name: nextChapter ? `第${nextChapter.id}章へ進む` : "章一覧へ", exact: true }),
      info,
    );
  }

  // 章一覧：3章とも確認テストに合格、復習が2問
  await expect(page.getByRole("heading", { name: /著作権を学ぼう/ })).toBeVisible();
  for (const chapter of CHAPTERS) await expect(page.locator(`[data-passed="${chapter.id}"]`)).toBeVisible();
  await press(page.getByRole("link", { name: "復習する（2問）" }), info);

  // 復習：間違えたカードだけが出る
  const sortStep = CHAPTERS[0].steps.find((s) => s.id === mistake.step) as SortStep;
  await expect(page.locator("[data-card]")).toHaveCount(1);
  await solveSort(page, { ...sortStep, cards: sortStep.cards.filter((c) => c.id === mistake.card) }, info);
  await goNext(page, info);
  // 確認テストで間違えた問題は、選択問題として出し直される
  const quizStep = CHAPTERS[0].steps.find((s) => s.id === quizMistake.step) as QuizStep;
  await solveChoice(
    page,
    {
      type: "choice",
      id: "quiz",
      title: "",
      questions: quizStep.questions.filter((q) => q.id === quizMistake.question),
    },
    info,
  );
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
