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

import { assetsFor } from "../src/linkedin.ts";
test("media: a carousel beats an image, an image beats nothing, and both point at the public repo", () => {
  // 2026-10-22 has a PDF + slide1 in the repo; a date with nothing has no media
  const doc = assetsFor("2026-10-22", "SEO report: lead with the CTR drop");
  assert.equal(doc.length, 1);
  assert.ok((doc[0] as { document: { url: string; thumbnailUrl: string; title: string } }).document.url.endsWith("/posts/linkedin/2026-10-22.pdf"));
  assert.ok((doc[0] as { document: { thumbnailUrl: string } }).document.thumbnailUrl.endsWith("2026-10-22-slide1.png"));
  assert.deepEqual(assetsFor("1999-01-01", "x"), []);
});
