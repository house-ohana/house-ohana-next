// テスト実行専用のNode ESMローダー。
// このリポジトリのTypeScriptは拡張子なしの相対import（bundler向け）で書かれているため、
// `node --test` で直接実行する際に ".ts" を補完して解決する。ビルド成果物やアプリの
// 実行時コードには影響しない（テスト実行コマンドでのみ読み込む）。
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

export async function resolve(specifier, context, nextResolve) {
  const isRelative = specifier.startsWith("./") || specifier.startsWith("../");
  const hasExtension = /\.[a-zA-Z0-9]+$/.test(specifier);

  if (isRelative && !hasExtension && context.parentURL) {
    const candidate = new URL(`${specifier}.ts`, context.parentURL);
    if (existsSync(fileURLToPath(candidate))) {
      return nextResolve(pathToFileURL(fileURLToPath(candidate)).href, context);
    }
  }

  return nextResolve(specifier, context);
}
