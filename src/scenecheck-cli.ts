// Lets the director run the automatic checks on itself, inside its own
// session, the same way it already renders and looks at its own stills.
//   npx tsx src/scenecheck-cli.ts <scene.html> <lines.js> <mouthsDir>
// Prints PASS, or every problem found (one per line) and exits 1.
import { readFileSync } from "node:fs";
import { checkScene, loadMouths, type Line } from "./scenecheck.ts";

const [scene, linesFile, mouthsDir] = process.argv.slice(2);
if (!scene || !linesFile || !mouthsDir) {
  console.error("usage: scenecheck-cli.ts <scene.html> <lines.js> <mouthsDir>");
  process.exit(2);
}
const raw = readFileSync(linesFile, "utf8").replace(/^\s*window\.LINES\s*=\s*/, "").replace(/;\s*$/, "");
const lines = JSON.parse(raw) as Line[];
const problems = await checkScene(scene, lines, loadMouths(mouthsDir));
if (problems.length) {
  console.log(problems.join("\n"));
  process.exit(1);
}
console.log("PASS");
