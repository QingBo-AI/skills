#!/usr/bin/env node
// Regenerates the skill catalog in README.md from skills/*/SKILL.md frontmatter.
// Zero dependencies. Run: node scripts/build-readme.mjs
//
// Frontmatter fields read:
//   name (required)        kebab-case, must equal the folder name
//   description (required) one line, English
//   description_zh         one line, Chinese
//   category               free text; grouped in README (unknown categories are fine)
//   tags                   [a, b, c]
//   source                 URL of the original repo (collected skills only)

import { readdirSync, readFileSync, writeFileSync, existsSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SKILLS_DIR = join(ROOT, "skills");
const README = join(ROOT, "README.md");
const ORG_REPO = "QingBo-AI/skills";

const START = "<!-- CATALOG:START -->";
const END = "<!-- CATALOG:END -->";

// Display labels for known categories. Anything not listed falls back to the raw value.
// Edit freely — categories live here and in frontmatter, never in folder names.
const CATEGORY_LABELS = {
  office: "Office · 办公",
  business: "Business · 经营",
  content: "Content · 内容创作",
  dev: "Development · 开发",
  data: "Data · 数据",
  prompts: "Prompts · 纯提示词",
};
const CATEGORY_ORDER = Object.keys(CATEGORY_LABELS);

function parseFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const out = {};
  for (const raw of m[1].split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf(":");
    if (i < 0) continue;
    const key = line.slice(0, i).trim();
    let val = line.slice(i + 1).trim();
    if (val.startsWith("[") && val.endsWith("]")) {
      out[key] = val
        .slice(1, -1)
        .split(",")
        .map((s) => s.trim().replace(/^['"]|['"]$/g, ""))
        .filter(Boolean);
    } else {
      out[key] = val.replace(/^['"]|['"]$/g, "");
    }
  }
  return out;
}

function loadSkills() {
  if (!existsSync(SKILLS_DIR)) return [];
  const skills = [];
  const errors = [];
  for (const dir of readdirSync(SKILLS_DIR).sort()) {
    const full = join(SKILLS_DIR, dir);
    if (!statSync(full).isDirectory() || dir.startsWith(".") || dir.startsWith("_")) continue;
    const skillMd = join(full, "SKILL.md");
    const promptMd = join(full, "PROMPT.md");
    if (!existsSync(skillMd) && !existsSync(promptMd)) {
      errors.push(`${dir}: has neither SKILL.md nor PROMPT.md`);
      continue;
    }
    const src = existsSync(skillMd) ? skillMd : promptMd;
    const fm = parseFrontmatter(readFileSync(src, "utf8"));
    if (!fm) { errors.push(`${dir}: missing frontmatter in ${src.endsWith("SKILL.md") ? "SKILL.md" : "PROMPT.md"}`); continue; }
    if (!fm.name) { errors.push(`${dir}: frontmatter has no name`); continue; }
    if (fm.name !== dir) { errors.push(`${dir}: frontmatter name "${fm.name}" != folder name`); continue; }
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(fm.name)) { errors.push(`${dir}: name must be lowercase kebab-case`); continue; }
    if (!fm.description) { errors.push(`${dir}: frontmatter has no description`); continue; }
    if (fm.source && !existsSync(join(full, "SOURCE.md"))) { errors.push(`${dir}: has source but no SOURCE.md`); continue; }
    skills.push({
      name: fm.name,
      description: fm.description,
      description_zh: fm.description_zh || "",
      category: (fm.category || "uncategorized").toLowerCase(),
      tags: Array.isArray(fm.tags) ? fm.tags : [],
      source: fm.source || "",
      hasSkill: existsSync(skillMd),
      hasPrompt: existsSync(promptMd),
    });
  }
  if (errors.length) {
    console.error("✗ Catalog build failed:\n  - " + errors.join("\n  - "));
    process.exit(1);
  }
  return skills;
}

function esc(s) {
  return String(s).replace(/\|/g, "\\|").trim();
}

function renderCatalog(skills) {
  if (!skills.length) return "_No skills yet. See CONTRIBUTING.md to add the first one._";
  const byCat = new Map();
  for (const s of skills) {
    if (!byCat.has(s.category)) byCat.set(s.category, []);
    byCat.get(s.category).push(s);
  }
  const cats = [...byCat.keys()].sort((a, b) => {
    const ia = CATEGORY_ORDER.indexOf(a), ib = CATEGORY_ORDER.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });

  const lines = [];
  lines.push(`**${skills.length} skills** · updated ${new Date().toISOString().slice(0, 10)}`, "");
  for (const cat of cats) {
    lines.push(`### ${CATEGORY_LABELS[cat] || cat}`, "");
    lines.push("| Skill | What it does · 做什么 | Tags | Use with |");
    lines.push("|---|---|---|---|");
    for (const s of byCat.get(cat)) {
      const nameCell = `[**${s.name}**](./skills/${s.name})`;
      const desc = s.description_zh ? `${esc(s.description)}<br>${esc(s.description_zh)}` : esc(s.description);
      const tags = s.tags.map((t) => `\`${t}\``).join(" ");
      const use = [
        s.hasSkill ? "agents" : "",
        s.hasPrompt ? "copy-paste" : "",
        s.source ? `[source ↗](${s.source})` : "",
      ].filter(Boolean).join(" · ");
      lines.push(`| ${nameCell} | ${desc} | ${tags} | ${use} |`);
    }
    lines.push("");
  }
  lines.push(`> Install any single skill: \`npx skills add ${ORG_REPO} --skill <name>\``);
  return lines.join("\n");
}

function main() {
  const skills = loadSkills();
  const readme = readFileSync(README, "utf8");
  const a = readme.indexOf(START), b = readme.indexOf(END);
  if (a < 0 || b < 0 || b < a) {
    console.error(`✗ README.md must contain ${START} and ${END} markers`);
    process.exit(1);
  }
  const next = readme.slice(0, a + START.length) + "\n\n" + renderCatalog(skills) + "\n\n" + readme.slice(b);
  if (next !== readme) {
    writeFileSync(README, next);
    console.log(`✓ README.md catalog updated (${skills.length} skills)`);
  } else {
    console.log(`✓ README.md already up to date (${skills.length} skills)`);
  }
}

main();
