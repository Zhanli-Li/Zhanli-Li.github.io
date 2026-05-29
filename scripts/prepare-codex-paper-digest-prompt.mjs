import fs from "node:fs/promises";
import process from "node:process";

const readText = async (path) => fs.readFile(path, "utf8");

const requiredPaths = [
  ".github/codex/prompts/paper_digest.md",
  ".agents/skills/paper-search/SKILL.md",
  ".agents/skills/paper-reading/SKILL.md",
  ".agents/skills/research-memory/SKILL.md",
  ".agents/skills/blog-writing/SKILL.md",
];

for (const path of requiredPaths) {
  await fs.access(path);
}

const mainPrompt = await readText(".github/codex/prompts/paper_digest.md");
const skillBlocks = await Promise.all(
  requiredPaths
    .filter((path) => path.includes("/skills/") || path.includes(".agents/skills/"))
    .map(async (path) => {
      const content = await readText(path);
      return `<skill path="${path}">\n${content}\n</skill>`;
    }),
);

const prompt = [
  "# Available Skills",
  ...skillBlocks,
  "# Current Task",
  mainPrompt,
].join("\n\n");

const outputPath = process.argv[2];

if (!outputPath) {
  process.stdout.write(prompt);
} else {
  await fs.writeFile(outputPath, prompt, "utf8");
}
