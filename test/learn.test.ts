import assert from "node:assert/strict";
import { test } from "node:test";
import { breakout, isoSeconds, pickBreakouts, type Candidate } from "../src/hooks.ts";
import { addSnapshot, watchShare, type Snapshot } from "../src/results.ts";

const c = (id: string, channelId: string, views: number, subs: number, seconds = 40): Candidate =>
  ({ id, title: id, channel: channelId, channelId, views, subs, seconds, published: "", query: "", score: breakout(views, subs) });

test("isoSeconds reads YouTube durations", () => {
  assert.equal(isoSeconds("PT45S"), 45);
  assert.equal(isoSeconds("PT1M5S"), 65);
  assert.equal(isoSeconds("PT1H"), 3600);
  assert.equal(isoSeconds("P0D"), 0);
  assert.equal(isoSeconds("nonsense"), 0);
});

test("breakouts rank by views per subscriber, not raw views", () => {
  const big = c("big", "A", 900_000, 2_000_000); // 0.45
  const small = c("small", "B", 60_000, 5_000); // 12
  assert.deepEqual(pickBreakouts([big, small]).map((x) => x.id), ["small", "big"]);
});

test("a tiny channel's subscriber count is floored", () => {
  assert.equal(breakout(10_000, 40), 5);
});

test("breakouts skip long videos, low views, duplicates and a third video from one channel", () => {
  const picks = pickBreakouts([
    c("long", "A", 99_000, 1_000, 600),
    c("few", "B", 900, 10),
    c("a1", "C", 50_000, 1_000), c("a1", "C", 50_000, 1_000),
    c("a2", "C", 40_000, 1_000), c("a3", "C", 30_000, 1_000),
  ]);
  assert.deepEqual(picks.map((x) => x.id), ["a1", "a2"]);
});

const snap = (date: string, views: number): Snapshot => ({ date, ageDays: 1, instagram: { views }, facebook: {}, youtube: {} });

test("a second snapshot on the same day replaces the first", () => {
  const h = addSnapshot(addSnapshot([snap("2026-10-04", 5)], snap("2026-10-11", 10)), snap("2026-10-11", 12));
  assert.deepEqual(h.map((s) => [s.date, s.instagram.views]), [["2026-10-04", 5], ["2026-10-11", 12]]);
});

test("watch share is average watch time over length", () => {
  assert.equal(watchShare({ seconds: 40, latest: { ...snap("d", 1), instagram: { ig_reels_avg_watch_time: 10_000 } } }), 0.25);
  assert.equal(watchShare({ seconds: 40, latest: snap("d", 1) }), undefined);
});

import { mkdtempSync, mkdirSync as mk, writeFileSync as wf } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { STANDARD, lengthFor } from "../src/pipeline.ts";

test("the length test runs for its reels, failed ones not counting, then the standard returns", () => {
  const root = mkdtempSync(join(tmpdir(), "len-"));
  mk(join(root, "story"));
  wf(join(root, "story/length.json"), JSON.stringify({ standard: STANDARD, test: { name: "short", reels: 2, words: [44, 64], aim: "50 to 60", seconds: "20 to 26", beats: [5, 8] } }));
  assert.equal(lengthFor([], root).name, "short");
  assert.equal(lengthFor([{ status: "published", experiment: "short" }, { status: "failed", experiment: "short" }], root).name, "short");
  assert.equal(lengthFor([{ status: "published", experiment: "short" }, { status: "draft", experiment: "short" }], root).name, undefined);
  assert.deepEqual(lengthFor([], join(root, "nowhere")), STANDARD);
});

import { pickStyle, type Style } from "../src/styles.ts";

test("the style alternates, failed reels don't count, and a style named by hand wins", () => {
  const all = [{ id: "floey-garden" }, { id: "pro" }] as Style[];
  assert.equal(pickStyle(all, [{ status: "published" }]).id, "pro");
  assert.equal(pickStyle(all, [{ status: "published", style: "pro" }]).id, "floey-garden");
  assert.equal(pickStyle(all, [{ status: "published", style: "pro" }, { status: "failed", style: "floey-garden" }]).id, "floey-garden");
  assert.equal(pickStyle(all, [{ status: "published" }], "floey-garden").id, "floey-garden");
  assert.throws(() => pickStyle(all, [], "nope"));
});

test("only styles in the rotation are picked; one alone repeats; any style can still be named by hand", () => {
  const all = [{ id: "duo", rotation: true }, { id: "floey-garden", rotation: false }, { id: "pro", rotation: false }] as Style[];
  assert.equal(pickStyle(all, [{ status: "published", style: "duo" }]).id, "duo");
  assert.equal(pickStyle(all, [{ status: "published", style: "pro" }]).id, "duo");
  assert.equal(pickStyle(all, [], "pro").id, "pro");
});

import { duoProblems } from "../src/pipeline.ts";

test("duo scripts: Maya opens, Floey tips once, it ends on a button, and the brand stays out of the dialogue", () => {
  const beat = (role: string, speaker: string, say: string) => ({ role, speaker, say, emotion: "warm", visual: "Maya reacts" });
  const ok = {
    id: "x", format: "duo-sitcom", goal: "send", topic: "t", title: "t", hookPattern: "own", loopNote: "",
    caption: "Maya panicked on a Sunday again. Compare Sunday with last Sunday, not with Friday. Who else checks traffic at brunch? ".repeat(2),
    hashtags: ["#seo", "#blogging", "#contentmarketing"],
    beats: [
      beat("hook", "maya", "Floey. My traffic dropped forty percent overnight."),
      beat("reframe", "floey", "It's Sunday, Maya."),
      beat("doubt", "maya", "So?"),
      beat("tip", "floey", "So everyone's at brunch. Compare it with last Sunday, not Friday."),
      beat("check", "maya", "Oh. It's up three percent."),
      beat("payoff", "maya", "I nearly deleted the whole blog for that."),
      beat("button", "floey", "You're welcome. Again. Every single Sunday, apparently."),
    ],
  } as never;
  assert.deepEqual(duoProblems(ok), []);
  const bad = { ...(ok as object), beats: [beat("hook", "floey", "Hi, I'm Floey from Flowra, check useflowra.com today.")] } as never;
  const p = duoProblems(bad).join(" ");
  assert.match(p, /hook, said by Maya/);
  assert.match(p, /mentions Flowra/);
  assert.match(p, /button/);
  assert.match(p, /one tip/);
});
