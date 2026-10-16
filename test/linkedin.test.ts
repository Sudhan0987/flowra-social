import { test } from "node:test";
import assert from "node:assert/strict";
import { parseDraft } from "../src/linkedin.ts";

test("a LinkedIn draft splits into post text and first comment, without the title or notes", () => {
  const md = "# Internal title\n\nThe hook line.\n\nThe body.\n\n#SEO\n\n---\nFirst comment:\nThe full article: https://useflowra.com/blog/x\n\n<!-- formula: F9 -->\n<!-- goal: saves -->\n";
  const d = parseDraft(md);
  assert.equal(d.text, "The hook line.\n\nThe body.\n\n#SEO");
  assert.equal(d.firstComment, "The full article: https://useflowra.com/blog/x");
});

test("a draft without a first comment", () => {
  assert.deepEqual(parseDraft("# T\n\nJust text."), { text: "Just text.", firstComment: "" });
});
