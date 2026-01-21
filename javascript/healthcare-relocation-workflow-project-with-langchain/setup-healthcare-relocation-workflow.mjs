#!/usr/bin/env node

/**
 * Setup script for the "Orchestrating LangChain Agents" Orkes Conductor project.
 *
 * Automates:
 * 1) Authenticate to Orkes Conductor (token OR key/secret)
 * 2) Create/ensure OpenAI integration + models exist (idempotent)
 * 3) Register worker task definitions (only missing ones)
 * 4) Register HUMAN task forms from /forms (only missing ones)
 * 5) Register AI prompts from workflows/prompts (only missing ones)
 * 6) Register workflows from /workflows (only missing ones)
 *
 * Requirements: Node 18+ (built-in fetch)
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

/** ---------- CLI helpers ---------- */
function argHas(flag) {
  return process.argv.includes(flag);
}

function argValue(flag, fallback = null) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return fallback;
  return process.argv[idx + 1] ?? fallback;
}

// Flags/Options
const PLAN = argHas("--plan") || argHas("--dry-run");
const NO_OPENAI = argHas("--no-openai");
const WORKFLOWS_DIR = argValue("--workflows-dir", "./workflows");
const PROMPTS_DIR = argValue("--prompts-dir", "./workflows/prompts");
const FORMS_DIR = argValue("--forms-dir", "./forms");

/** ---------- project config ---------- */
const WORKER_TASKS = [
  "healthcare_provider_finder",
  "communication_drafter",
  "medical_system_navigator",
  "prescription_transition_manager",
];

const REQUIRED_PROMPTS = [
  { name: "MedicalUserIntakeAnalyzer", file: "medical-user-intake.json" },
  { name: "CombineAnswers", file: "combine-answers.json" },
  { name: "AssembleHealthPlan", file: "assemble-health-plan.json" },
];

const DEFAULT_OPENAI_MODELS = ["gpt-4.1", "gpt-4.1-mini", "gpt-4o", "gpt-4o-mini"];

/** ---------- pretty output helpers ---------- */
const WIDTH = 64;

function header(title) {
  console.log("\n" + "━".repeat(WIDTH));
  console.log(title);
  console.log("━".repeat(WIDTH));
}

function section(title) {
  console.log("\n" + "─".repeat(WIDTH));
  console.log(title);
  console.log("─".repeat(WIDTH));
}

function bullet(msg) {
  console.log(`• ${msg}`);
}

function ok(msg) {
  console.log(`✅ ${msg}`);
}

function info(msg) {
  console.log(`ℹ️  ${msg}`);
}

function warn(msg) {
  console.log(`⚠️  ${msg}`);
}

function plan(msg) {
  console.log(`🧪 [PLAN] ${msg}`);
}

/** ---------- env helpers ---------- */
function loadDotEnvIfPresent(dotEnvPath = ".env") {
  if (!fs.existsSync(dotEnvPath)) return;
  const content = fs.readFileSync(dotEnvPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;

    const k = trimmed.slice(0, eq).trim();
    let v = trimmed.slice(eq + 1).trim();

    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }

    if (!(k in process.env)) process.env[k] = v;
  }
}

function mustEnv(...names) {
  for (const n of names) {
    const v = process.env[n];
    if (v && String(v).trim() !== "") return v;
  }
  throw new Error(`Missing required env var. Tried: ${names.join(", ")}`);
}

/**
 * Fixes /api/api issues:
 * - If you provide CONDUCTOR_SERVER_URL with or without /api, it works
 * - If you provide CONDUCTOR_SERVER_API_URL, it normalizes it too
 */
function normalizeBaseApiUrl() {
  const api = process.env.CONDUCTOR_SERVER_API_URL;
  const base = process.env.CONDUCTOR_SERVER_URL;

  if (api) return api.replace(/\/api\/?$/, "") + "/api";
  if (base) return base.replace(/\/api\/?$/, "") + "/api";

  return "https://developer.orkescloud.com/api";
}

function uiBaseFromApi(apiUrl) {
  return apiUrl.replace(/\/api\/?$/, "");
}

/** ---------- http helpers ---------- */
async function http(method, url, { token, headers, body, expect = "json", okStatuses = [200] } = {}) {
  // In PLAN mode:
  // - allow GET requests (read-only) so we can check if things exist
  // - allow POST /token (auth) so we can get a token to do GET checks
  const allowInPlan = method === "GET" || (method === "POST" && /\/token\/?$/.test(url));

  if (PLAN && !allowInPlan) {
    plan(`${method} ${url}`);
    return expect === "text" ? "" : {};
  }

  const h = {
    ...(headers ?? {}),
    accept: headers?.accept ?? "*/*",
  };

  if (token) h["X-Authorization"] = token;
  if (body !== undefined && typeof body !== "string" && !h["Content-Type"]) {
    h["Content-Type"] = "application/json";
  }

  const res = await fetch(url, {
    method,
    headers: h,
    body:
      body === undefined
        ? undefined
        : typeof body === "string"
          ? body
          : JSON.stringify(body),
  });

  const text = await res.text();

  if (!okStatuses.includes(res.status)) {
    throw new Error(`HTTP ${res.status} ${res.statusText}\nURL: ${url}\nResponse: ${text}`);
  }

  if (expect === "text") return text;
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { _raw: text };
  }
}

async function exists(url, { token } = {}) {
  try {
    const res = await fetch(url, { method: "GET", headers: token ? { "X-Authorization": token } : {} });
    return res.ok;
  } catch {
    return false;
  }
}

async function listHumanTemplates({ API, token }) {
  const url = `${API}/human/template`;
  const res = await fetch(url, { headers: token ? { "X-Authorization": token } : {} });
  if (!res.ok) return [];
  const text = await res.text();
  if (!text) return [];
  try {
    const data = JSON.parse(text);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function humanTemplateExists({ API, token, name }) {
  // list endpoint is proven to work in your account
  const templates = await listHumanTemplates({ API, token });
  return templates.some((t) => t?.name === name);
}

// NOTE: Keep this for OpenAI integration/model checks where you want PLAN to show "would create"
async function existsGet(url, { token } = {}) {
  if (PLAN) return false;
  const res = await fetch(url, { headers: token ? { "X-Authorization": token } : {} });
  return res.ok;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

/** ---------- main ---------- */
async function main() {
  loadDotEnvIfPresent();

  const API = normalizeBaseApiUrl();
  const UI = uiBaseFromApi(API);

  header("🚀 Orkes Healthcare Relocation Setup");
  bullet(`Mode: ${PLAN ? "PLAN (no changes)" : "APPLY"}`);
  bullet(`Orkes API: ${API}`);
  bullet(`Orkes UI : ${UI}`);

  /** ---- Auth ---- */
  section("🔐 Authentication");
  const accessToken = process.env.CONDUCTOR_ACCESS_TOKEN;
  let token = accessToken;

  if (!token) {
    const keyId =
      process.env.CONDUCTOR_KEY_ID ??
      process.env.CONDUCTOR_AUTH_KEY ??
      process.env.CONDUCTOR_KEY;

    const keySecret =
      process.env.CONDUCTOR_KEY_SECRET ??
      process.env.CONDUCTOR_AUTH_SECRET ??
      process.env.CONDUCTOR_SECRET;

    if (!keyId || !keySecret) {
      throw new Error(
        "Need CONDUCTOR_ACCESS_TOKEN OR (CONDUCTOR_KEY_ID/CONDUCTOR_KEY) + (CONDUCTOR_KEY_SECRET/CONDUCTOR_SECRET)."
      );
    }

    info("Using key/secret to obtain token");
    const tokenResp = await http("POST", `${API}/token`, {
      headers: { accept: "application/json", "Content-Type": "application/json" },
      body: { keyId, keySecret },
      okStatuses: [200],
    });

    token = tokenResp.token;
    if (!token && !PLAN) throw new Error("Failed to obtain token from /token");
  } else {
    ok("Using CONDUCTOR_ACCESS_TOKEN");
  }

  info("Checking server connectivity");
  await http("GET", `${API}/version`, { expect: "text", okStatuses: [200] });
  ok("Server reachable");

  // Optional user info
  let userInfo = {};
  try {
    userInfo = await http("GET", `${API}/token/userInfo`, {
      token,
      headers: { accept: "application/json" },
      okStatuses: [200],
    });
  } catch {
    // not fatal
  }
  const who = userInfo?.name ? `${userInfo.name} (${userInfo.id ?? "unknown"})` : "unknown user";
  ok(`Authenticated as: ${who}`);

  /** ---- OpenAI integration ---- */
  section("🤖 OpenAI Integration (idempotent)");
  if (NO_OPENAI) {
    warn("Skipping OpenAI integration step (--no-openai).");
  } else {
    const openaiIntegrationName = process.env.OPENAI_INTEGRATION_NAME ?? "openai";
    const openaiApiKey = mustEnv("OPENAI_API_KEY");

    const models =
      (process.env.OPENAI_MODELS &&
        process.env.OPENAI_MODELS.split(",").map((s) => s.trim()).filter(Boolean)) ||
      DEFAULT_OPENAI_MODELS;

    bullet(`Integration name: ${openaiIntegrationName}`);
    bullet(`Models: ${models.join(", ")}`);

    const integUrl = `${API}/integrations/provider/${openaiIntegrationName}`;
    const integExists = await existsGet(integUrl, { token });

    if (!integExists) {
      if (PLAN) {
        plan(`Would create OpenAI integration "${openaiIntegrationName}"`);
      } else {
        await http("POST", integUrl, {
          token,
          headers: { "Content-Type": "application/json" },
          okStatuses: [200, 201, 204],
          body: {
            category: "AI_MODEL",
            configuration: {
              api_key: openaiApiKey,
              base_url: "https://api.openai.com",
            },
            description: "OpenAI integration for built-in LLM tasks",
            enabled: true,
            type: "openai",
          },
          expect: "text",
        });
        ok(`Created OpenAI integration: ${openaiIntegrationName}`);
      }
    } else {
      ok(`OpenAI integration already exists: ${openaiIntegrationName}`);
    }

    // Models
    let modelsAdded = 0;
    let modelsSkipped = 0;

    for (const modelName of models) {
      const modelUrl = `${API}/integrations/provider/${openaiIntegrationName}/integration/${encodeURIComponent(
        modelName
      )}`;

      const modelExists = await existsGet(modelUrl, { token });

      if (!modelExists) {
        if (PLAN) {
          plan(`Would enable model "${modelName}"`);
        } else {
          await http("POST", modelUrl, {
            token,
            headers: { "Content-Type": "application/json" },
            okStatuses: [200, 201, 204],
            body: { configuration: {}, description: `${modelName} from OpenAI`, enabled: true },
            expect: "text",
          });
          modelsAdded++;
        }
      } else {
        modelsSkipped++;
      }
    }

    if (!PLAN) {
      ok(`Models added: ${modelsAdded}`);
      ok(`Models already present: ${modelsSkipped}`);
    } else {
      info("PLAN mode: no changes made.");
    }

    bullet(`UI: ${UI}/integrations/${openaiIntegrationName}/integration`);
  }

  /** ---- Task defs ---- */
  section("🧠 Worker Task Definitions");
  WORKER_TASKS.forEach((t) => bullet(t));

  const missingTaskDefs = [];

  for (const name of WORKER_TASKS) {
    const taskDefUrl = `${API}/metadata/taskdefs/${encodeURIComponent(name)}`;
    const taskExists = await exists(taskDefUrl, { token });

    if (taskExists) {
      ok(`TaskDef exists: ${name}`);
    } else {
      warn(`TaskDef missing: ${name}`);
      missingTaskDefs.push({
        name,
        description: `Worker task for ${name}`,
        retryCount: 2,
        timeoutSeconds: 300,
        responseTimeoutSeconds: 300,
        ownerEmail: userInfo?.id ?? "unknown",
      });
    }
  }

  if (missingTaskDefs.length === 0) {
    ok("All worker task definitions already exist (nothing to create).");
  } else {
    await http("POST", `${API}/metadata/taskdefs`, {
      token,
      headers: { "Content-Type": "application/json" },
      body: missingTaskDefs,
      okStatuses: [200, 204],
      expect: "text",
    });

    if (!PLAN) ok(`Registered ${missingTaskDefs.length} missing task definition(s).`);
    else plan(`Would register ${missingTaskDefs.length} missing task definition(s).`);
  }

  bullet(`UI: ${UI}/taskDef`);

  /** ---- Forms ---- */
  section("📝 Human Task Forms");

if (!fs.existsSync(FORMS_DIR)) {
  info(`No forms dir found at ${FORMS_DIR} (skipping).`);
} else {
  const files = fs.readdirSync(FORMS_DIR).filter((f) => f.endsWith(".json"));
  if (files.length === 0) {
    info("No form JSON files found (skipping).");
  } else {
    // List existing templates ONCE
    const existingTemplates = await listHumanTemplates({ API, token });
    const existingNames = new Set(existingTemplates.map((t) => t?.name).filter(Boolean));

    let formsCreated = 0;
    let formsSkipped = 0;

    for (const f of files) {
      const full = path.join(FORMS_DIR, f);
      const form = readJson(full);

      if (!form.name) {
        warn(`Skipping form (missing name): ${f}`);
        continue;
      }

      bullet(`Form: ${form.name}`);

      if (existingNames.has(form.name)) {
        ok(`Form template exists: ${form.name}`);
        formsSkipped++;
        continue;
      }

      await http("POST", `${API}/human/template?newVersion=false`, {
        token,
        headers: { "Content-Type": "application/json" },
        body: form,
        okStatuses: [200, 204],
        expect: "text",
      });

      if (!PLAN) ok(`Created form template: ${form.name}`);
      else plan(`Would create form template: ${form.name}`);

      formsCreated++;
    }

    if (!PLAN) {
      ok(`Forms created: ${formsCreated}`);
      ok(`Forms skipped (already existed): ${formsSkipped}`);
    } else {
      plan(`Would create ${formsCreated} form(s); would skip ${formsSkipped} form(s)`);
    }
  }
}

bullet(`UI hint: ${UI}/humanTask`);


  /** ---- Prompts ---- */
  section("📌 AI Prompts");

  const promptModelAssociation = process.env.PROMPT_MODEL_ASSOCIATION ?? "openai:gpt-4o-mini";
  bullet(`Model association: ${promptModelAssociation}`);

  const encodedModels = encodeURIComponent(promptModelAssociation);

  let promptsCreated = 0;
  let promptsSkipped = 0;

  for (const p of REQUIRED_PROMPTS) {
    const fp = path.join(PROMPTS_DIR, p.file);
    if (!fs.existsSync(fp)) {
      warn(`Prompt file not found: ${fp}`);
      continue;
    }

    bullet(`Prompt: ${p.name}`);

    const promptGetUrl = `${API}/prompts/${encodeURIComponent(p.name)}`;
    const promptExists = await exists(promptGetUrl, { token });

    if (promptExists) {
      ok(`Prompt exists: ${p.name}`);
      promptsSkipped++;
      continue;
    }

    const promptBodyText = readText(fp);
    const desc = encodeURIComponent(`Auto-registered from ${p.file}`);

    await http(
      "POST",
      `${API}/prompts/${encodeURIComponent(p.name)}?description=${desc}&models=${encodedModels}`,
      {
        token,
        headers: { "Content-Type": "application/json" },
        body: promptBodyText,
        okStatuses: [200, 204],
        expect: "text",
      }
    );

    if (!PLAN) ok(`Created prompt: ${p.name}`);
    else plan(`Would create prompt: ${p.name}`);

    promptsCreated++;
    bullet(`UI: ${UI}/ai_prompts/${encodeURIComponent(p.name)}`);
  }

  if (!PLAN) {
    ok(`Prompts created: ${promptsCreated}`);
    ok(`Prompts skipped (already existed): ${promptsSkipped}`);
  } else {
    plan(`Would create ${promptsCreated} prompt(s); would skip ${promptsSkipped} prompt(s)`);
  }

  /** ---- Workflows ---- */
  section("🧩 Workflows");

  if (!fs.existsSync(WORKFLOWS_DIR)) throw new Error(`Workflows dir not found: ${WORKFLOWS_DIR}`);

  const positionalJson = process.argv.find((a) => a.endsWith(".json") && !a.startsWith("-"));
  const workflowFiles = positionalJson
    ? [positionalJson]
    : fs.readdirSync(WORKFLOWS_DIR).filter((f) => f.endsWith(".json"));

  let workflowsCreated = 0;
  let workflowsSkipped = 0;

  for (const wfFile of workflowFiles) {
    const full = positionalJson ? path.resolve(wfFile) : path.join(WORKFLOWS_DIR, wfFile);
    const wf = readJson(full);

    if (!wf.name) {
      warn(`Skipping workflow (missing name): ${wfFile}`);
      continue;
    }

    bullet(`Workflow: ${wf.name} (${wfFile})`);

    const wfGetUrl = `${API}/metadata/workflow/${encodeURIComponent(wf.name)}`;
    const wfExists = await exists(wfGetUrl, { token });

    if (wfExists) {
      ok(`Workflow exists: ${wf.name} (skipping)`);
      workflowsSkipped++;
      bullet(`UI: ${UI}/workflowDef/${encodeURIComponent(wf.name)}`);
      continue;
    }

    await http("POST", `${API}/metadata/workflow?overwrite=false&newVersion=false`, {
      token,
      headers: { "Content-Type": "application/json" },
      body: wf,
      okStatuses: [200, 204],
      expect: "text",
    });

    if (!PLAN) ok(`Created workflow: ${wf.name}`);
    else plan(`Would create workflow: ${wf.name}`);

    workflowsCreated++;
    bullet(`UI: ${UI}/workflowDef/${encodeURIComponent(wf.name)}`);
  }

  if (!PLAN) {
    ok(`Workflows created: ${workflowsCreated}`);
    ok(`Workflows skipped (already existed): ${workflowsSkipped}`);
  } else {
    plan(`Would create ${workflowsCreated} workflow(s); would skip ${workflowsSkipped} workflow(s)`);
  }

  /** ---- done ---- */
  header(`✅ Setup complete (${PLAN ? "PLAN" : "APPLY"} mode)`);

  console.log("Next steps:");
  console.log("1) Start workers: node ConductorWorkers/workers.js");
  console.log("2) Run workflow from Orkes UI (Executions tab).");
  console.log("");
  console.log('Tip: Your integration name + prompt model association must match:');
  console.log('  OPENAI_INTEGRATION_NAME=<name> and PROMPT_MODEL_ASSOCIATION=<name>:<model>\n');
}

main().catch((e) => {
  console.error("\nERROR:", e.message);
  process.exit(1);
});
