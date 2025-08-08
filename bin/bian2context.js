#!/usr/bin/env node

/**
 * bian2context CLI
 * (c) 2025 Enrique Ismael Mendoza Robaina - MIT License
 */

const fs = require("fs");
const {
  REPLACEMENTS,
  summarizeDirectory
} = require("../src/lib");

// ===== arg parsing & help =====
const args = process.argv.slice(2);

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
  --json               Return the output in JSON format (alias of --format=json)
  --format=<fmt>       Output format: txt | json  (default: txt)
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

const yamlDir = args[0];
const onlyDomains = args.includes("--only-domains");
const onlyEntities = args.includes("--only-entities");
const onlyEvents = args.includes("--only-events");
const compress = args.includes("--compress");
const jsonFlag = args.includes("--json");

const outputArg = args.find(a => a.startsWith("--output="));
const customOutput = outputArg ? outputArg.split("=")[1] : null;

const formatArg = args.find(a => a.startsWith("--format="));
let format = formatArg ? formatArg.split("=")[1] : (jsonFlag ? "json" : "txt");

const filterArg = args.find(a => a.startsWith("--filter="));
const filter = filterArg ? filterArg.split("=")[1].toLowerCase() : null;

if (!yamlDir) {
  console.error("Missing path");
  process.exit(1);
}

if (!["txt", "json"].includes(format)) {
  console.error("Invalid --format. Use: txt | json");
  process.exit(1);
}

// ===== summarize & optional filter =====
let summaries = summarizeDirectory(yamlDir, compress);
if (filter) {
  summaries = summaries.filter(s => s.serviceDomain.toLowerCase().includes(filter));
}

// ===== output building =====
let output = "";
let jsonOutput = null;

// full (default)
if (!onlyDomains && !onlyEntities && !onlyEvents) {
  const defaultName = `summary_compact.${format}`;
  const fileName = customOutput || defaultName;

  if (format === "json") {
    jsonOutput = summaries;
    fs.writeFileSync(fileName, JSON.stringify(jsonOutput, null, 2), "utf8");
    console.log(`✅ ${fileName} generated`);
    process.exit(0);
  }

  if (compress) {
    output += "#DICT\n";
    for (const [k, v] of Object.entries(REPLACEMENTS)) output += `${v}=${k};`;
    output += "\n\n";
  }

  output += "#DATA\n";
  for (const summary of summaries) {
    output += `SD=${summary.serviceDomain}\n`;
    summary.entities.forEach(ent => { output += `E=${ent.name}:${ent.description}\n`; });
    summary.domainEvents.forEach(de => { output += `DE=${de}\n`; });
    output += "\n";
  }

  fs.writeFileSync(fileName, output, "utf8");
  console.log(`✅ ${fileName} generated`);
  process.exit(0);
}

// only-domains
if (onlyDomains) {
  const defaultName = `service_domains.${format}`;
  const fileName = customOutput || defaultName;

  if (format === "json") {
    jsonOutput = summaries.map(s => s.serviceDomain);
    fs.writeFileSync(fileName, JSON.stringify(jsonOutput, null, 2), "utf8");
    console.log(`✅ ${fileName} generated`);
    process.exit(0);
  }

  if (compress) {
    output += "#DICT\n";
    for (const [k, v] of Object.entries(REPLACEMENTS)) output += `${v}=${k};`;
    output += "\n\n";
  }

  output += "#DOMAINS\n";
  output += summaries.map(s => `SD=${s.serviceDomain}`).sort().join("\n");
  fs.writeFileSync(fileName, output, "utf8");
  console.log(`✅ ${fileName} generated`);
  process.exit(0);
}

// only-entities
if (onlyEntities) {
  const defaultName = `entities.${format}`;
  const fileName = customOutput || defaultName;

  if (format === "json") {
    jsonOutput = summaries.map(s => ({ serviceDomain: s.serviceDomain, entities: s.entities }));
    fs.writeFileSync(fileName, JSON.stringify(jsonOutput, null, 2), "utf8");
    console.log(`✅ ${fileName} generated`);
    process.exit(0);
  }

  if (compress) {
    output += "#DICT\n";
    for (const [k, v] of Object.entries(REPLACEMENTS)) output += `${v}=${k};`;
    output += "\n\n";
  }

  output += "#ENTITIES\n";
  for (const s of summaries) {
    output += `SD=${s.serviceDomain}\n`;
    s.entities.forEach(ent => { output += `E=${ent.name}:${ent.description}\n`; });
    output += "\n";
  }
  fs.writeFileSync(fileName, output, "utf8");
  console.log(`✅ ${fileName} generated`);
  process.exit(0);
}

// only-events
if (onlyEvents) {
  const defaultName = `events.${format}`;
  const fileName = customOutput || defaultName;

  if (format === "json") {
    jsonOutput = summaries
      .filter(s => s.domainEvents.length > 0)
      .map(s => ({ serviceDomain: s.serviceDomain, domainEvents: s.domainEvents }));
    fs.writeFileSync(fileName, JSON.stringify(jsonOutput, null, 2), "utf8");
    console.log(`✅ ${fileName} generated`);
    process.exit(0);
  }

  if (compress) {
    output += "#DICT\n";
    for (const [k, v] of Object.entries(REPLACEMENTS)) output += `${v}=${k};`;
    output += "\n\n";
  }

  output += "#EVENTS\n";
  for (const s of summaries) {
    if (s.domainEvents.length === 0) continue;
    output += `SD=${s.serviceDomain}\n`;
    s.domainEvents.forEach(de => { output += `DE=${de}\n`; });
    output += "\n";
  }
  fs.writeFileSync(fileName, output, "utf8");
  console.log(`✅ ${fileName} generated`);
  process.exit(0);
}
