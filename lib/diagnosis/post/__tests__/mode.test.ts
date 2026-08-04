import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { resolveDiagnosisMode } from "../../mode";

// Phase1回帰: m=after・m=test・不正値を m=post として誤って扱わないことの確認。
describe("resolveDiagnosisMode", () => {
  test("mが無いURLは後方互換のためpost扱いにする", () => {
    assert.equal(resolveDiagnosisMode(undefined), "post");
  });

  test("m=preはpre", () => {
    assert.equal(resolveDiagnosisMode("pre"), "pre");
  });

  test("m=postはpost", () => {
    assert.equal(resolveDiagnosisMode("post"), "post");
  });

  test("m=afterはpostとして扱わない", () => {
    assert.equal(resolveDiagnosisMode("after"), "invalid");
  });

  test("m=testはpostとして扱わない", () => {
    assert.equal(resolveDiagnosisMode("test"), "invalid");
  });

  test("空文字はpostとして扱わない", () => {
    assert.equal(resolveDiagnosisMode(""), "invalid");
  });

  test("配列で渡された場合は先頭要素を見る", () => {
    assert.equal(resolveDiagnosisMode(["pre", "post"]), "pre");
    assert.equal(resolveDiagnosisMode(["after"]), "invalid");
  });
});
