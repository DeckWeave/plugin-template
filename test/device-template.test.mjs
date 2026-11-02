import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync, spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const run = (args, cwd = root) =>
  spawnSync(process.execPath, args, { cwd, encoding: "utf8", timeout: 20000 });
test("device project is standalone, safe-name substituted, deterministic, manifest validates and real process serves two sessions", async () => {
  const base = path.resolve(
    await mkdtemp(path.join(tmpdir(), "deckweave-device-template-")),
  );
  try {
    const out = path.join(base, "unrelated checkout");
    let r = run([
      "bin/create.mjs",
      "--device",
      out,
      "dev.test.hardware",
      'Device "quotes" $&',
    ]);
    assert.equal(r.status, 0, r.stderr);
    let m = JSON.parse(
      await readFile(path.join(out, "deckweave.device.json"), "utf8"),
    );
    assert.equal(m.name, 'Device "quotes" $&');
    for (const args of [
      ["--test", "test/provider.test.mjs"],
      ["tools/package.mjs", "validate"],
      ["tools/package.mjs", "pack"],
    ]) {
      r = run(args, out);
      assert.equal(r.status, 0, r.stdout + r.stderr);
    }
    const zip = path.join(
        out,
        "dist/dev.test.hardware-0.1.0.deckweave-device.zip",
      ),
      first = await readFile(zip);
    assert.ok(
      first.includes(
        Buffer.from("dev.test.hardware.dwDevice/deckweave.device.json"),
      ),
    );
    assert.equal(first.includes(Buffer.from("test/provider.test.mjs")), false);
    await writeFile(path.join(out, ".env.secret"), "SHOULD_NOT_PACKAGE");
    r = run(["tools/package.mjs", "pack"], out);
    assert.equal(r.status, 0, r.stderr);
    assert.deepEqual(first, await readFile(zip));
    const child = spawn(process.execPath, ["provider.mjs"], {
      cwd: out,
      stdio: ["pipe", "pipe", "pipe"],
    });
    let buffer = "",
      stderr = "";
    const replies = new Map(),
      waiting = new Map();
    child.stderr.on("data", (b) => (stderr += b));
    child.stdout.on("data", (b) => {
      buffer += b;
      let n;
      while ((n = buffer.indexOf("\n")) >= 0) {
        const msg = JSON.parse(buffer.slice(0, n));
        buffer = buffer.slice(n + 1);
        if (msg.type === "result") {
          replies.set(msg.requestId, msg);
          waiting.get(msg.requestId)?.(msg);
        }
      }
    });
    let i = 0;
    const send = (type, f = {}) =>
      new Promise((resolve, reject) => {
        const requestId = `r${++i}`,
          timer = setTimeout(
            () => reject(Error("Provider timeout " + stderr)),
            3000,
          );
        waiting.set(requestId, (m) => {
          clearTimeout(timer);
          resolve(m);
        });
        child.stdin.write(JSON.stringify({ type, requestId, ...f }) + "\n");
      });
    try {
      assert.equal((await send("hello", { protocol: 1 })).ok, true);
      assert.equal((await send("discover")).value.devices.length, 2);
      await send("open", { session: "a", generation: 1, instanceId: "mock-a" });
      await send("open", { session: "b", generation: 1, instanceId: "mock-b" });
      await send("close", { session: "a", generation: 1 });
      assert.equal(
        (await send("readState", { session: "b", generation: 1 })).ok,
        true,
      );
      assert.equal(
        (await send("readState", { session: "a", generation: 1 })).error.code,
        "stale_generation",
      );
      await send("close", { session: "b", generation: 1 });
    } finally {
      child.stdin.end();
      child.kill();
    }
    m.entry = "../outside.mjs";
    await writeFile(path.join(out, "deckweave.device.json"), JSON.stringify(m));
    r = run(["tools/package.mjs", "pack"], out);
    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /bundled relative/);
  } finally {
    assert.equal(path.dirname(base), path.resolve(tmpdir()));
    assert.ok(path.basename(base).startsWith("deckweave-device-template-"));
    await rm(base, { recursive: true, force: true });
  }
});
