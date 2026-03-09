#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import glob from "glob";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const apiKey = process.env.OPENROUTER_API_KEY;

if (!apiKey) {
  console.error("Fehler: Bitte setze die Umgebungsvariable OPENROUTER_API_KEY.");
  process.exit(1);
}

// ---------------------------------------------------------
// 1. Konfigurationsdatei laden
// ---------------------------------------------------------
const configPath = path.join(process.cwd(), "saas-ai.config.json");
let config = {};

if (fs.existsSync(configPath)) {
  try {
    config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    console.log(`🔧 Konfiguration geladen: ${configPath}\n`);
  } catch (err) {
    console.error("Fehler beim Lesen der Konfigurationsdatei:", err);
    process.exit(1);
  }
} else {
  console.log("⚠️ Keine Konfigurationsdatei gefunden. Verwende CLI‑Argumente.\n");
}

// ---------------------------------------------------------
// 2. CLI-Argumente auswerten
// ---------------------------------------------------------
const [, , ...args] = process.argv;

let dryRun = false;

// Dry‑Run erkennen
const dryIndex = args.indexOf("--dry");
if (dryIndex !== -1) {
  dryRun = true;
  args.splice(dryIndex, 1);
  console.log("🧪 Dry‑Run aktiviert — keine Dateien werden überschrieben.\n");
}

let mode = null;
let instruction = config.instruction || "Verbessere diesen Code.";
let filePatterns = config.files || [];
let ignorePatterns = config.ignore || [];

// Prüfen, ob der erste Parameter ein Modus ist
if (args.length > 0 && config.modes && config.modes[args[0]]) {
  mode = args.shift();
  const modeConfig = config.modes[mode];

  if (modeConfig.instruction) instruction = modeConfig.instruction;
  if (modeConfig.files) filePatterns = modeConfig.files;

  console.log(`🎛️ Modus aktiviert: ${mode}`);
}

// Letztes Argument könnte eine Anweisung sein
if (args.length > 0) {
  const lastArg = args[args.length - 1];

  if (!lastArg.includes(".")) {
    instruction = lastArg;
    args.pop();
  }

  if (args.length > 0) {
    filePatterns = args;
  }
}

if (filePatterns.length === 0) {
  console.error("Keine Dateien angegeben und keine 'files' in der Config.");
  process.exit(1);
}

// ---------------------------------------------------------
// 3. Dateien per Glob sammeln + Ignore anwenden
// ---------------------------------------------------------
let files = filePatterns.flatMap((pattern) => glob.sync(pattern));

// Ignore‑Muster anwenden
if (ignorePatterns.length > 0) {
  const ignored = ignorePatterns.flatMap((pattern) => glob.sync(pattern));
  const ignoredSet = new Set(ignored.map((f) => path.resolve(f)));

  files = files.filter((file) => !ignoredSet.has(path.resolve(file)));
}

if (files.length === 0) {
  console.error("Keine Dateien gefunden (nach Ignore‑Filtern).");
  process.exit(1);
}

console.log(`📁 ${files.length} Dateien werden verarbeitet...`);
console.log(`🧠 Anweisung: ${instruction}\n`);

// ---------------------------------------------------------
// 4. Modell anhand des Dateityps bestimmen
// ---------------------------------------------------------
function getModelForFile(filePath) {
  const ext = path.extname(filePath);

  const fileTypes = config.fileTypes || {};

  for (const pattern in fileTypes) {
    if (pattern.endsWith(ext)) {
      return fileTypes[pattern].model;
    }
  }

  const firstModel = Object.values(fileTypes)[0]?.model;
  if (firstModel) return firstModel;

  return "meta-llama/llama-3-8b-instruct";
}

// ---------------------------------------------------------
// 5. Datei verarbeiten
// ---------------------------------------------------------
async function processFile(filePath) {
  const absolutePath = path.isAbsolute(filePath)
    ? filePath
    : path.join(process.cwd(), filePath);

  if (!fs.existsSync(absolutePath)) {
    console.error(`❌ Datei nicht gefunden: ${absolutePath}`);
    return;
  }

  const originalCode = fs.readFileSync(absolutePath, "utf8");

  const model = getModelForFile(absolutePath);

  console.log(`➡️ Bearbeite: ${absolutePath}`);
  console.log(`   🤖 Modell: ${model}`);

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "http://localhost",
      "X-Title": "saas-ai-cli"
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "user",
          content:
            instruction +
            "\n\nHier ist der Code:\n\n```ts\n" +
            originalCode +
            "\n```"
        }
      ]
    })
  });

  if (!response.ok) {
    console.error(`❌ Fehler bei ${absolutePath}:`, response.status);
    return;
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content ?? "";

  if (!content) {
    console.error(`❌ Keine Antwort für ${absolutePath}`);
    return;
  }

  if (dryRun) {
    console.log("   🧪 Dry‑Run: Datei wird NICHT überschrieben.");
    console.log("   📄 Vorschau der Änderungen:\n");
    console.log(content);
    console.log("\n──────────────────────────────────────────────\n");
    return;
  }

  const backupPath = absolutePath + ".bak";
  fs.writeFileSync(backupPath, originalCode, "utf8");

  fs.writeFileSync(absolutePath, content, "utf8");

  console.log(`   🛟 Backup: ${backupPath}`);
  console.log(`   ✅ Überschrieben: ${absolutePath}\n`);
}

// ---------------------------------------------------------
// 6. Begrenzte Parallelität (max. 5 gleichzeitige Requests)
// ---------------------------------------------------------
async function runWithConcurrencyLimit(files, limit = 5) {
  let index = 0;

  async function worker() {
    while (index < files.length) {
      const file = files[index++];
      await processFile(file);
    }
  }

  const workers = Array.from({ length: limit }, () => worker());
  await Promise.all(workers);
}

// ---------------------------------------------------------
// 7. Starten
// ---------------------------------------------------------
async function run() {
  await runWithConcurrencyLimit(files, 5);
  console.log("🎉 Fertig! Alle Dateien wurden verarbeitet.");
}

run().catch((err) => {
  console.error("Unerwarteter Fehler:", err);
  process.exit(1);
});
