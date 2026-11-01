import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile, rm, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
function run(args, cwd = root) {
  return spawnSync(process.execPath, args, {
    cwd,
    encoding: "utf8",
    timeout: 20000,
  });
}
async function temporary(fn) {
  const base = path.resolve(
    await mkdtemp(path.join(tmpdir(), "deckweave-template-")),
  );
  try {
    await fn(base);
  } finally {
    // Recursive removal is confined to the concrete new directory created above.
    assert.equal(path.dirname(base), path.resolve(tmpdir()));
    assert.ok(path.basename(base).startsWith("deckweave-template-"));
    await rm(base, { recursive: true, force: true });
  }
}
test("standalone generated plugin passes tests, validates and packs byte-identically", async () =>
  temporary(async (base) => {
    const output = path.join(base, "independent checkout");
    let result = run([
      "bin/create.mjs",
      output,
      "dev.test.counter",
      'Test "$& Counter"',
    ]);
    assert.equal(result.status, 0, result.stderr);
    const manifest = JSON.parse(
      await readFile(path.join(output, "manifest.json"), "utf8"),
    );
    assert.equal(manifest.Name, 'Test "$& Counter"');
    assert.equal(manifest.Actions[0].UUID, "dev.test.counter.counter");
    result = run(["--test", "test/plugin.test.mjs"], output);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    result = run(["tools/package.mjs", "validate"], output);
    assert.equal(result.status, 0, result.stderr);
    await writeFile(
      path.join(output, ".env.local"),
      "NEVER_PACKAGE_SECRET=yes",
    );
    result = run(["tools/package.mjs", "pack"], output);
    assert.equal(result.status, 0, result.stderr);
    const zipName = "dev.test.counter-0.1.0.deckweave-plugin.zip";
    const first = await readFile(path.join(output, "dist", zipName));
    assert.equal(first.includes(Buffer.from("NEVER_PACKAGE_SECRET")), false);
    assert.equal(first.readUInt32LE(0), 0x04034b50);
    assert.equal(
      first
        .subarray(30, 30 + first.readUInt16LE(26))
        .toString()
        .startsWith("dev.test.counter.sdPlugin/"),
      true,
    );
    result = run(["tools/package.mjs", "pack"], output);
    assert.equal(result.status, 0, result.stderr);
    const second = await readFile(path.join(output, "dist", zipName));
    assert.deepEqual(first, second);
    const hash = createHash("sha256").update(first).digest("hex");
    assert.equal(
      (
        await readFile(path.join(output, "dist", zipName + ".sha256"), "utf8")
      ).trim(),
      `${hash}  ${zipName}`,
    );
    assert.equal((await readdir(output)).includes("node_modules"), false);
    manifest.DeckWeave = { RequiredFiles: ["bin/missing-helper.exe"] };
    await writeFile(
      path.join(output, "manifest.json"),
      JSON.stringify(manifest),
    );
    result = run(["tools/package.mjs", "pack"], output);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /RequiredFiles/);
    delete manifest.DeckWeave;
    manifest.CodePath = "../outside.mjs";
    await writeFile(
      path.join(output, "manifest.json"),
      JSON.stringify(manifest),
    );
    result = run(["tools/package.mjs", "validate"], output);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /relative file/);
  }));
test("generator refuses invalid identifiers and never overwrites an existing destination", async () =>
  temporary(async (base) => {
    const output = path.join(base, "new");
    let result = run(["bin/create.mjs", output, "../bad"]);
    assert.notEqual(result.status, 0);
    result = run(["bin/create.mjs", output, "dev.test.counter"]);
    assert.equal(result.status, 0, result.stderr);
    await writeFile(path.join(output, "user.txt"), "keep");
    result = run(["bin/create.mjs", output, "dev.test.counter"]);
    assert.notEqual(result.status, 0);
    assert.equal(await readFile(path.join(output, "user.txt"), "utf8"), "keep");
  }));
