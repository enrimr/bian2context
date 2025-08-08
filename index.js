#!/usr/bin/env node

/**
 * bian2context
 * (c) 2025 Enrique Ismael Mendoza Robaina - MIT License
 */

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
  if (!apply) return text.trim().replace(/\s+/g, " ");
  return Object.entries(REPLACEMENTS).reduce(
    (acc, [key, val]) => acc.replace(new RegExp(key, "gi"), val),
    text
  ).replace(/\s+/g, " ").trim();
}

function extractSummaryFromYaml(filePath, compress = true) {
  const content = fs.readFileSync(filePath, "utf8");
  let doc;

  try {
    doc = yaml.load(content);
  } catch (err) {
    console.error(`Error parsing YAML in file: ${filePath}\n${err.message}`);
    return {
      serviceDomain: "Invalid YAML",
      entities: [],
      domainEvents: []
    };
  }

  const title = compressText(doc?.info?.title || "Unknown", compress);

  const messages = doc?.components?.messages || {};
  const entities = Object.entries(messages)
    .filter(([, details]) => details?.description?.trim())
    .map(([name, details]) => ({
      name,
      description: compressText(details.description, compress),
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

  return {
    serviceDomain: title,
    entities,
    domainEvents
  };
}

function summarizeDirectory(directoryPath, compress = true) {
  const files = fs.readdirSync(directoryPath)
  .filter(f => f.endsWith(".yaml") || f.endsWith(".yml") || f.endsWith(".json"));

  return files.map(file => extractSummaryFromYaml(path.join(directoryPath, file), compress));
}

// MAIN
const args = process.argv.slice(2);
const yamlDir = args[0];
const onlyDomains = args.includes("--only-domains");
const onlyEntities = args.includes("--only-entities");
const onlyEvents = args.includes("--only-events");
const compress = args.includes("--compress");

// Show help
if (args.includes("--help") || args.length === 0) {
  console.log(`
bian2context - Compact BIAN OpenAPI Context Extractor
Usage:
  bian2context <directory> [options]

Options:
  --only-domains       Output only the list of Service Domains
  --only-entities      Output only the Entities (per domain)
  --only-events        Output only the Domain Events (per domain)
  --compress           Apply abbreviations from the REPLACEMENTS dictionary
  --output=<file>      Set a custom output filename
  --json               Return the output in JSON format
  --filter=<text>      Filter by text in the Service Domain name
  --help               Show this help message

Examples:
  bian2context ./yamls
  bian2context ./yamls --only-domains
  bian2context ./yamls --only-entities --compress
  bian2context ./yamls --only-events --output=my_events.txt
  bian2context ./yamls --filter=Card --json

Notes:
- By default, without options, the tool generates a full summary (service domain, entities, and events).
- The --compress option also applies when using specific modes (--only-*).
- The --output parameter is optional; if omitted, default filenames are used.
`);
  process.exit(0);
}

if (!yamlDir) {
  console.error("Missing path");
  process.exit(1);
}

if (onlyDomains) {
  const summaries = summarizeDirectory(yamlDir, compress);

  let output = "";

  if (compress) {
    output += "#DICT\n";
    for (const [k, v] of Object.entries(REPLACEMENTS)) {
      output += `${v}=${k};`;
    }
    output += "\n\n";
  }

  output += "#DOMAINS\n";
  output += summaries
    .map(summary => `SD=${summary.serviceDomain}`)
    .sort()
    .join("\n");

  fs.writeFileSync("service_domains.txt", output, "utf8");
  console.log("✅ Service domains list generated: service_domains.txt");
  process.exit(0);
}

if (onlyEntities) {
  const summaries = summarizeDirectory(yamlDir, compress);

  let output = "";

  if (compress) {
    output += "#DICT\n";
    for (const [k, v] of Object.entries(REPLACEMENTS)) {
      output += `${v}=${k};`;
    }
    output += "\n\n";
  }

  output += "#ENTITIES\n";

  for (const summary of summaries) {
    output += `SD=${summary.serviceDomain}\n`;
    summary.entities.forEach(ent => {
      output += `E=${ent.name}:${ent.description}\n`;
    });
    output += "\n";
  }

  fs.writeFileSync("entities.txt", output, "utf8");
  console.log("✅ Entities list generated: entities.txt");
  process.exit(0);
}

if (onlyEvents) {
  const summaries = summarizeDirectory(yamlDir, compress);

  let output = "";

  if (compress) {
    output += "#DICT\n";
    for (const [k, v] of Object.entries(REPLACEMENTS)) {
      output += `${v}=${k};`;
    }
    output += "\n\n";
  }

  output += "#EVENTS\n";

  for (const summary of summaries) {
    if (summary.domainEvents.length === 0) continue;
    output += `SD=${summary.serviceDomain}\n`;
    summary.domainEvents.forEach(de => {
      output += `DE=${de}\n`;
    });
    output += "\n";
  }

  fs.writeFileSync("events.txt", output, "utf8");
  console.log("✅ Event list generated: events.txt");
  process.exit(0);
}

// Resumen completo con o sin compresión
const summaries = summarizeDirectory(yamlDir, compress);

let output = "";

if (compress) {
  output += "#DICT\n";
  for (const [k, v] of Object.entries(REPLACEMENTS)) {
    output += `${v}=${k};`;
  }
  output += "\n\n";
}

output += "#DATA\n";

for (const summary of summaries) {
  output += `SD=${summary.serviceDomain}\n`;

  summary.entities.forEach(ent => {
    output += `E=${ent.name}:${ent.description}\n`;
  });

  summary.domainEvents.forEach(de => {
    output += `DE=${de}\n`;
  });

  output += "\n";
}

fs.writeFileSync("summary_compact.txt", output, "utf8");
console.log("✅ Generated: summary_compact.txt");
