
const fs = require("fs");
const path = require("path");
const { compressText, extractSummaryFromYaml, summarizeDirectory } = require("../src/lib");

describe("bian2context library", () => {
  const tmpDir = path.join(__dirname, "tmp");
  const goodYaml = path.join(tmpDir, "sample.yaml");
  const badYaml = path.join(tmpDir, "bad.yaml");
  const jsonSpec = path.join(tmpDir, "sample.json");

  beforeAll(() => {
    fs.mkdirSync(tmpDir, { recursive: true });
    fs.writeFileSync(goodYaml, `
info:
  title: Account Reconciliation
components:
  messages:
    AccountResolution:
      description: A course of action for doing Account Resolution Workstep
operations:
  AccountResolution/Created.publish:
    summary: (DDD Domain Event) AccountResolution
`);
    fs.writeFileSync(badYaml, `info:\n  title: Bad\n  :oops`);
    fs.writeFileSync(jsonSpec, JSON.stringify({
      info: { title: "Card Operations" },
      components: { messages: { CardAuthorization: { description: "Authorize card payments" } } },
      operations: { "CardAuthorization/Updated.publish": { summary: "(DDD Domain Event) CardAuthorization" } }
    }, null, 2));
  });

  afterAll(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test("compressText replaces terms when apply=true", () => {
    expect(compressText("Service Domain", true)).toBe("SD");
  });

  test("compressText leaves text when apply=false", () => {
    expect(compressText("Service Domain", false)).toBe("Service Domain");
  });

  test("extractSummaryFromYaml parses valid YAML", () => {
    const res = extractSummaryFromYaml(goodYaml, false);
    expect(res.serviceDomain).toBe("Account Reconciliation");
    expect(res.entities.length).toBe(1);
    expect(res.domainEvents.length).toBe(1);
  });

  test("extractSummaryFromYaml handles invalid YAML", () => {
    const res = extractSummaryFromYaml(badYaml, false);
    expect(res.serviceDomain).toBe("Invalid YAML/JSON");
    expect(res.entities).toEqual([]);
    expect(res.domainEvents).toEqual([]);
  });

  test("extractSummaryFromYaml parses JSON specs too", () => {
    const res = extractSummaryFromYaml(jsonSpec, false);
    expect(res.serviceDomain).toBe("Card Operations");
    expect(res.entities[0].name).toBe("CardAuthorization");
    expect(res.domainEvents.length).toBe(1);
  });

  test("summarizeDirectory reads multiple files", () => {
    const res = summarizeDirectory(tmpDir, false);
    // It should include 3 entries (goodYaml, badYaml, jsonSpec)
    expect(res.length).toBe(3);
  });
});
