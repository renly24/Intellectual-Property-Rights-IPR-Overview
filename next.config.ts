import type { NextConfig } from "next";

// 公開先ごとにルートフォルダーが違う（GitHub Pages / FTP サーバー）ので、環境変数から読む
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  distDir: "out",
  basePath,
  assetPrefix: basePath,
  // 章ページを chapter/1/index.html の形で書き出す（FTP サーバーで .html なしの URL を開けるように）
  trailingSlash: true,
};

export default nextConfig;
