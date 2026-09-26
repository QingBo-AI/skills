#!/usr/bin/env node
// WaveAPI media client for agents. Zero dependencies, Node.js 18+.
// Calls the WaveAPI tools endpoint (POST {base}/v1/mcp) over plain HTTPS; no MCP client setup needed.
//
//   WAVEAPI_API_KEY   required, read from the environment only
//   WAVEAPI_BASE_URL  optional, default https://api.qingbo.ai
//
// Output: JSON on stdout (docs: Markdown). Errors: JSON on stdout, exit code 2 (API error) or 1 (usage).

import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";

const USAGE = `usage: node waveapi.mjs <command> [options]

  models  [--modality image|video|audio] [--query TEXT] [--limit N] [--cursor C]
  docs    --model ID [--language zh|en]
  schema  --model ID
  quote   --model ID (--input-json JSON | --input-file PATH)
  create  --model ID (--input-json JSON | --input-file PATH) --idempotency-key KEY [--wait SECONDS]
  task    --task-id ID
  cancel  --task-id ID
  key     print a new idempotency key`;

function fail(code, message, exit = 1) {
  process.stdout.write(JSON.stringify({ error: { code, message } }) + "\n");
  process.exit(exit);
}

function parseArgs(argv) {
  const opts = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith("--")) fail("usage", `unexpected argument ${arg}\n${USAGE}`);
    const name = arg.slice(2);
    const value = argv[i + 1];
    if (value === undefined || value.startsWith("--")) fail("usage", `--${name} needs a value`);
    opts[name] = value;
    i++;
  }
  return opts;
}

function need(opts, name) {
  if (!opts[name]) fail("usage", `--${name} is required\n${USAGE}`);
  return opts[name];
}

function readInput(opts) {
  let raw;
  if (opts["input-json"] !== undefined) raw = opts["input-json"];
  else if (opts["input-file"] !== undefined) raw = readFileSync(opts["input-file"], "utf8");
  else fail("usage", "--input-json or --input-file is required");
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    fail("invalid_input", "input is not valid JSON");
  }
  if (!input || typeof input !== "object" || Array.isArray(input)) fail("invalid_input", "input must be a JSON object");
  return input;
}

async function callTool(name, args) {
  const key = process.env.WAVEAPI_API_KEY;
  if (!key) fail("missing_api_key", "set WAVEAPI_API_KEY in the environment; do not paste the key into chat or commands");
  const base = (process.env.WAVEAPI_BASE_URL || "https://api.qingbo.ai").replace(/\/+$/, "");
  let res;
  try {
    res = await fetch(`${base}/v1/mcp`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        "MCP-Protocol-Version": "2025-06-18",
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: args } }),
      signal: AbortSignal.timeout(90_000),
    });
  } catch (err) {
    // A create request that timed out may still have been accepted: retry with the same idempotency key.
    fail("request_outcome_unknown", `request did not complete (${err.name}); retry with the same idempotency key`, 2);
  }
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    fail("bad_response", `HTTP ${res.status}: ${text.slice(0, 300)}`, 2);
  }
  if (res.status === 401 || body.success === false) fail("unauthorized", body.error || body.message || "API key rejected", 2);
  if (body.error) fail("rpc_error", body.error.message || JSON.stringify(body.error), 2);
  const result = body.result || {};
  const content = (result.content || []).map((c) => c.text || "").join("\n");
  if (result.isError) {
    process.stdout.write(content + "\n");
    process.exit(2);
  }
  return { structured: result.structuredContent, text: content };
}

async function main() {
  const [command, ...rest] = process.argv.slice(2);
  const opts = parseArgs(rest);
  let out;
  switch (command) {
    case "models": {
      const args = {};
      if (opts.modality) args.modality = opts.modality;
      if (opts.query) args.query = opts.query;
      if (opts.limit) args.limit = Number(opts.limit);
      if (opts.cursor) args.cursor = opts.cursor;
      out = await callTool("list_models", args);
      break;
    }
    case "docs": {
      const args = { model: need(opts, "model") };
      if (opts.language) args.language = opts.language;
      const { text } = await callTool("get_model_docs", args);
      process.stdout.write(text + "\n");
      return;
    }
    case "schema":
      out = await callTool("get_model_schema", { model: need(opts, "model") });
      break;
    case "quote":
      out = await callTool("estimate_cost", { model: need(opts, "model"), input: readInput(opts) });
      break;
    case "create": {
      const args = { model: need(opts, "model"), input: readInput(opts), idempotency_key: need(opts, "idempotency-key") };
      if (opts.wait) args.wait_seconds = Number(opts.wait);
      out = await callTool("create_task", args);
      break;
    }
    case "task":
      out = await callTool("get_task", { task_id: need(opts, "task-id") });
      break;
    case "cancel":
      out = await callTool("cancel_task", { task_id: need(opts, "task-id") });
      break;
    case "key":
      process.stdout.write(randomUUID() + "\n");
      return;
    default:
      fail("usage", USAGE);
  }
  process.stdout.write(JSON.stringify(out.structured ?? out.text, null, 2) + "\n");
}

main();
