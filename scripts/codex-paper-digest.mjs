import { Codex } from "@openai/codex-sdk";
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

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is required.");
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

const codexOptions = {
  apiKey: process.env.OPENAI_API_KEY,
};

if (process.env.OPENAI_BASE_URL) {
  codexOptions.baseUrl = process.env.OPENAI_BASE_URL;
}

const codex = new Codex(codexOptions);

const thread = codex.startThread({
  workingDirectory: process.cwd(),
  sandboxMode: process.env.CODEX_SANDBOX_MODE || "danger-full-access",
  networkAccessEnabled: true,
  webSearchMode: "live",
  approvalPolicy: "never",
  model: process.env.CODEX_MODEL || "gpt-5.5",
  modelReasoningEffort: process.env.CODEX_REASONING_EFFORT || "xhigh",
});

const result = await thread.run(prompt);

console.log(result.finalResponse ?? "Codex run completed.");
