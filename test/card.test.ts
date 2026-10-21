import { test } from "node:test";
import assert from "node:assert/strict";
import { cardProblems, cardHtml } from "../src/carousel.ts";

test("a card keeps to the limits and renders without a swipe hint or a page count", () => {
  assert.deepEqual(cardProblems({ kicker: "A 14 day rule", title: "Wait before you judge a rewrite", body: "Two weeks is the settling window we leave before reading the result." }), []);
  assert.ok(cardProblems({ title: "one two three four five six seven eight nine ten eleven twelve thirteen" }).some((x) => /12 words/.test(x)));
  assert.ok(cardProblems({ title: "ok", body: "see https://useflowra.com/x" }).some((x) => /link/.test(x)));
  const html = cardHtml({ kicker: "Search Console", title: "Your customers' questions are already there" });
  assert.ok(!html.includes("Swipe"));
  assert.ok(!/<span class="count">/.test(html));
  assert.ok(html.includes('class="floey"'));
});
