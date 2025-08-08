const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

const REPLACEMENTS = {
  "Service Domain": "SD",
  "Description": "D",
  "Entity": "E",
  "Value Object": "VO",
  "Aggregate": "AG",
  "Domain Event": "DE",
  "Workstep": "WS",
  "Procedure": "PR",
  "Reference": "Ref",
  "Identifier": "ID",

  // Dominios funcionales comunes
  "Account": "Acct",
  "Customer": "Cust",
  "Contact": "Cntct",
  "Product": "Prod",
  "Payment": "Pay",
  "Corporate": "Corp",
  "Consumer": "Cons",
  "Market": "Mkt",
  "Financial": "Fin",
  "Branch": "Br",
  "Channel": "Chan",
  "Collateral": "Coll",
  "Party": "Party",

  // Actividades / Operaciones
  "Assessment": "Asmt",
  "Notification": "Ntfy",
  "Instruction": "Instr",
  "Transaction": "Tx",
  "Fulfillment": "Ffmt",
  "Reconciliation": "Recon",
  "Clearing": "Clrg",
  "Settlement": "Settl",
  "Execution": "Exec",
  "Authorization": "Auth",
  "Agreement": "Agr",
  "Processing": "Proc",
  "Evaluation": "Eval",
  "Resolution": "Res",
  "Analysis": "Analys",
  "Operation": "Ops",
  "Operations": "Ops",

  // Estados / Resultados
  "Created": "Crtd",
  "Updated": "Updtd",
  "Outcome": "Outc",

  // Gestión / Estructura
  "Management": "Mgmt",
  "Administration": "Adm",
  "Directory": "Dir",
  "Services": "Svcs",
  "Reporting": "Rpt",
  "Compliance": "Comp",
  "Planning": "Plan",
  "Matching": "Match",
  "History": "Hist",
  "Design": "Des",
  "Relationship": "Rel"
};

function compressText(text, apply = true) {
  if (typeof text !== "string") return "";
  if (!apply) return text.trim().replace(/\s+/g, " ");
  return Object.entries(REPLACEMENTS).reduce(
    (acc, [key, val]) => acc.replace(new RegExp(key, "gi"), val),
    text
  ).replace(/\s+/g, " ").trim();
}

function parseYamlOrJsonFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const ext = path.extname(filePath).toLowerCase();
  try {
    if (ext === ".json") {
      return JSON.parse(raw);
    }
    return yaml.load(raw);
  } catch (err) {
    console.error(`Error parsing ${ext} file: ${filePath}\n${err.message}`);
    return null;
  }
}

function extractSummaryFromYaml(filePath, compress = true) {
  const doc = parseYamlOrJsonFile(filePath);
  if (!doc) {
    return { serviceDomain: "Invalid YAML/JSON", entities: [], domainEvents: [] };
  }

  const title = compressText(doc?.info?.title || "Unknown", compress);

  const messages = doc?.components?.messages || {};
  const entities = Object.entries(messages)
    .filter(([, details]) => details?.description && String(details.description).trim())
    .map(([name, details]) => ({
      name,
      description: compressText(String(details.description), compress),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const operations = doc?.operations || {};
  const domainEvents = Object.entries(operations)
    .filter(([, op]) =>
      op?.summary?.includes("Domain Event") ||
      /Created|Updated|Notify/i.test(op?.summary || "")
    )
    .map(([opName]) => compressText(opName, compress))
    .sort();

  return { serviceDomain: title, entities, domainEvents };
}

function summarizeDirectory(directoryPath, compress = true) {
  const files = fs.readdirSync(directoryPath).filter(file =>
    file.endsWith(".yaml") || file.endsWith(".yml") || file.endsWith(".json")
  );
  if (files.length === 0) {
    console.warn(`No files with .yaml, .yml or .json found in ${directoryPath}`);
  }
  return files.map(file => extractSummaryFromYaml(path.join(directoryPath, file), compress));
}

module.exports = {
  REPLACEMENTS,
  compressText,
  parseYamlOrJsonFile,
  extractSummaryFromYaml,
  summarizeDirectory
};
