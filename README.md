# 著作権を学ぼう（教育用）

高校「情報Ⅰ」の大学入学共通テスト対策として、著作権を中心に知的財産権を学ぶ教育用の Web アプリです。解説を読むだけで終わらせず、ドラッグ・スワイプ・タップで手を動かしながら理解します。授業中にタブレット（1人1台端末）で使う想定です。

- GitHub Pages: https://renly24.github.io/Intellectual-Property-Rights-IPR-Overview/
- FTP サーバー: http://e.gmobb.jp/omaesensei/digital/edu-copyright/

## 学べること

全10章（1章 約10〜15分）。現在は第1〜3章が公開中です。

| 章 | 内容 | 主な操作 |
| --- | --- | --- |
| 1. 知的財産権の全体像 | 産業財産権と著作権、産業財産権の4つの権利と保護期間、方式主義／無方式主義 | ドラッグ仕分け |
| 2. 著作物とは何か | 著作物の条件、アイデア・事実・ありふれた表現、権利の目的とならない著作物 | スワイプ判定・文中タップ |
| 3. 著作者の権利 | 著作者人格権（公表権・氏名表示権・同一性保持権）と著作財産権 | ドラッグ仕分け・選択 |
| 4〜10 | 著作隣接権と保護期間、許諾なく使える場合、学校での利用、SNS・動画投稿、生成AI、周辺の権利、総合演習 | 準備中 |

### 1章の流れ

解説（数段落ごとに「予想してみよう」の小問。答えると続きが開く）→ 操作問題 → まとめ（正答率・ポイント・間違えた問題）

### 操作問題の種類

| 操作 | 内容 |
| --- | --- |
| **ドラッグ仕分け** | カードを指やマウスで箱へ運ぶ。タップで選んでから箱をタップしても置ける |
| **スワイプ判定** | 事例カードを左右にスワイプして判定する。ボタンでも答えられる |
| **文中タップ指摘** | 文章の中から、あてはまる語句をすべてタップして答え合わせする |
| **選択問題** | 場面を読んで、関わる権利を選ぶ |

学習の記録（進んだステップ、正答率、間違えた問題）は、端末のブラウザ（localStorage）にだけ保存されます。間違えた問題は「復習する」で解き直せます。

## 教材の追加・修正

章の中身は `src/content/chapters/chapter*.json` にあります（型は `src/content/types.ts`）。文章中の `**語句**` は重要語として色付きの太字になります。新しい章は JSON を作って `src/content/index.ts` の `CHAPTERS` に追加します。

## 開発

```bash
npm ci
npm run dev        # http://localhost:3000
npm run lint
npm run typecheck
npm run build      # out/ に静的ファイルを出力
npx playwright install chromium webkit
npm run test:e2e   # ビルド済みの out/ を、デスクトップ（マウス）と iPad（タッチ）で通しで操作する
```

技術構成：Next.js 16（静的エクスポート）、React 19、TypeScript、MUI v7、Playwright

## 公開（GitHub Actions）

| ワークフロー | タイミング | 内容 |
| --- | --- | --- |
| `e2e.yml` | PR、`main` への push | Lint・型チェック・ビルド・E2E テスト |
| `deploy.yml` | `main` への push | GitHub Pages へ公開（Settings → Pages で Source を「GitHub Actions」にしておく） |
| `deploy-ftp.yml` | `main` への push | 共通ワークフロー [`renly24/edu-deploy-workflows`](https://github.com/renly24/edu-deploy-workflows) で FTP サーバーの `digital/edu-copyright/` へ公開 |

FTP へのアップロードには、リポジトリの Settings → Secrets and variables → Actions に `FTP_HOST`・`FTP_USER`・`FTP_PASS` の3つを登録しておく必要があります（`edu-deploy-workflows` の「Sync FTP secrets」でコピーできます）。

要件定義は [`docs/requirements.md`](docs/requirements.md) を参照してください。
