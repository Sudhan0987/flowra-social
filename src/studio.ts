// The Floey director (stages 5 and 6 of docs/production-process.md).
//
// ONE long-running Claude Code session per reel, the way a motion designer
// actually works: write the scene, render stills, look at them, run the
// automatic checks, fix, repeat, all without leaving the room. Every later
// turn in that one session reuses what is already in context instead of
// paying for the whole brief again.
//
// A version of this tried instead to split those steps into separate fresh
// `claude -p` calls (write / code-check-fix / look-and-review), one per
// round, for a "clean eyes" review each time. Each fresh call has no memory
// of the one before it, so every round re-paid the full fixed cost (the
// rules, the whole studio guide, the whole approved template reel) from
// zero. On a real run that took 8 rounds and about $12 in API-equivalent
// usage for one reel that still didn't finish. NEVER split this again: one
// bounded session, reusing its own context, is both cheaper and closer to
// how the quality bar was actually hit on reel 000.

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { agent } from "./claude.ts";
import { checkScene, loadMouths, type Line } from "./scenecheck.ts";
import type { Style } from "./styles.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (f: string) => readFileSync(path.join(ROOT, f), "utf8");

function studioBrief(style?: Style): string {
  if (style?.id === "duo") {
    return [
      "THE CAST (who Maya and Floey are; keep them in character in every frame):",
      read("brand/cast/README.md"),
      `THE STUDIO for the "${style.name}" style (what you draw with; use these parts, they are approved):`,
      read(style.studio),
      "THE WORKED EXAMPLE, approved by the founder. Match its craft: frame one already shows the problem, the speaker acts every line while the listener reacts, the camera moves between the named shots with a reason, the check is shown in the laptop insert, sounds land on real events, and the button lands on a reaction before the end card.",
      read(style.template),
    ].join("\n\n");
  }
  if (style && !style.mascot) {
    return [
      `THE STUDIO for the "${style.name}" style (what you draw with; use these parts, they are approved):`,
      read(style.studio),
      "THE WORKED EXAMPLE for this style. Match its craft: the problem on screen in frame one, screens that swing in and fall away, a cursor that lands on the exact control the voice names as it is named, rows and lines that move with purpose, a camera push on the payoff, a sound on every real event, and the end card.",
      read(style.template),
    ].join("\n\n");
  }
  return [
    "THE STUDIO (what you draw with; use these parts, they are approved):",
    read("brand/studio/README.md"),
    "THE WORKED EXAMPLE: reel 000, approved by the founder. Match its craft: a world that is built once, a camera that moves with purpose, Floey acting every line (anticipation, follow-through, small behaviours between actions), sounds on every action, and an ending that loops to the opening shot.",
    read("reel/floey/template.html"),
  ].join("\n\n");
}

export async function directFloey(
  dir: string,
  system: string,
  opts: { lines: Line[]; story: unknown; board: unknown; seconds: Record<string, number>; notes?: string; style?: Style },
): Promise<{ scene: string; log: string[] }> {
  const scene = path.join(dir, "scene.html");
  const relDir = path.relative(ROOT, dir);
  const buildDir = path.join(dir, "build");

  const base = [
    system,
    opts.style?.id === "duo"
      ? "You are the director and animator of one Maya & Floey reel: a short sitcom moment in Maya's room. You write the scene, check your own work, and fix it, inside this one session, the way an animator actually works. Aim for the founder's bar: too good, not good enough. Comedy lives in timing and reactions: hold a beat before a reveal, give the listener a reaction on the other's key word, and land the button."
      : opts.style && !opts.style.mascot
      ? `You are the director and animator of one Flowra reel in the "${opts.style.name}" style: a narrator over a drawn working screen in motion. You write the scene, check your own work, and fix it, inside this one session, the way a motion designer actually works. Aim for the founder's bar: too good, not good enough.`
      : "You are the director and animator of one Flowra reel, told by Floey in her page-flower garden. You write the scene, check your own work, and fix it, inside this one session, the way a motion designer actually works. Aim for the founder's bar: too good, not good enough.",
    studioBrief(opts.style),
  ].join("\n\n");

  const context = [
    "The lines Floey speaks (window.LINES from lines.js, in this order; never change them):",
    JSON.stringify(opts.lines, null, 1),
    "How long each line takes to say, in seconds (the voice is fixed):",
    JSON.stringify(opts.seconds),
    "The story:",
    JSON.stringify(opts.story, null, 1),
    "The storyboard (panel.beat is the line index; panel.at is seconds after that line starts):",
    JSON.stringify(opts.board, null, 1),
  ].join("\n\n");

  const prompt = [
    opts.style?.id === "duo"
      ? `Write ${relDir}/scene.html, the animation for this reel, following ${opts.style.template}'s shape exactly: load lines.js for window.LINES (use window.LINES as it is; do not keep the template's fallback lines), DUO.timing with a GAP per line taken from each line's pause in the story (default 0.35), Floey created first and Maya with floey: F, every line said by its own speaker (MY.say for maya, F.say for floey), one paused gsap timeline for the camera and props, and define window.render / DURATION / SOUND / CAMERA / FLOEY / BEATS / STYLE exactly as the template does. The script paths are relative to ${relDir}/, two folders below the repo root, exactly as in the template.`
      : opts.style && !opts.style.mascot
      ? `Write ${relDir}/scene.html, the animation for this reel, following ${opts.style.template}'s shape exactly: load lines.js for window.LINES (use window.LINES as it is; do not keep the template's fallback lines), the same timing from MOUTHS, PRO.sounds() with S.say for every line, one paused gsap timeline for the world, and define window.render / DURATION / SOUND / CAMERA / BEATS / STYLE exactly as the template does (no window.FLOEY). The script paths are relative to ${relDir}/, two folders below the repo root, exactly as in the template.`
      : `Write ${relDir}/scene.html, the animation for this reel, following reel/floey/template.html's shape exactly: load lines.js for window.LINES, use PROPS.timing for beat timing, one Floey actor cued to every line, one paused gsap timeline for the world, and define window.render / DURATION / SOUND / CAMERA / FLOEY / BEATS exactly as the template does.`,
    context,
    "Before you stop, check your own work:",
    `1. Render a few stills across the reel and look at them: npx tsx brand/mascot/render-scene.mts ${relDir}/scene.html stills --out=${relDir}/build --stills=1,5,10,15,20,25 (pick times that land inside real beats). Then Read ${relDir}/build/stills.png. For each still: is the subject (Floey, or the screen) clear and inside the frame, is the text big enough to read on a phone, does it match that moment's storyboard panel, is anything clipped, overlapping, or empty-looking? Fix and render again until it reads well at phone size.`,
    `2. Run the automatic checks: npx tsx src/scenecheck-cli.ts ${relDir}/scene.html ${relDir}/lines.js ${relDir}/build. Fix every problem it prints and run it again until it says PASS. These catch things stills can miss (Floey drifting off screen mid-line, a label overflowing its box, the wrong length).`,
    opts.notes ? `The final test on an earlier render failed for these reasons; fix them, then re-check:\n${opts.notes}` : "",
    "Do not render the full video and do not post to Slack; the pipeline does both after you are done.",
  ].filter(Boolean).join("\n\n");

  const result = await agent({
    system: base,
    prompt,
    bash: ["npx tsx brand/mascot/render-scene.mts:*", "npx tsx src/scenecheck-cli.ts:*"],
    maxTurns: 100,
    timeoutMs: 50 * 60_000,
  });

  if (!existsSync(scene)) throw new Error("The director did not write the scene.");
  // the agent can say PASS and be wrong; this is the real gate, checked fresh
  const problems = await checkScene(scene, opts.lines, loadMouths(buildDir));
  if (problems.length) throw new Error(`The scene still fails the automatic checks: ${problems.join(" | ")}`);
  return { scene, log: [result.trim()] };
}
