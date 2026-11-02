import { test } from "node:test";
import assert from "node:assert/strict";
import { DeviceProvider } from "../lib/device.mjs";
import { createMock } from "../model.mjs";
test("two mock devices retain isolated observed settings and one close leaves its sibling active", async () => {
  const out = [],
    p = new DeviceProvider({ ...createMock(), send: (m) => out.push(m) });
  let n = 0;
  const send = (type, f = {}) =>
    p.receive({ type, requestId: `r${++n}`, ...f });
  await send("hello", { protocol: 1 });
  await send("discover");
  assert.equal(out.at(-1).value.devices.length, 2);
  for (const [session, instanceId] of [
    ["a", "mock-a"],
    ["b", "mock-b"],
  ])
    await send("open", { session, instanceId, generation: 1 });
  await send("setSettings", {
    session: "a",
    generation: 1,
    changes: { screenBrightness: 23 },
  });
  await new Promise((r) => setImmediate(r));
  assert.equal(out.at(-1).value.observed.screenBrightness, 23);
  await send("readState", { session: "b", generation: 1 });
  await new Promise((r) => setImmediate(r));
  assert.equal(out.at(-1).value.observed.screenBrightness, 70);
  await send("close", { session: "a", generation: 1 });
  await new Promise((r) => setImmediate(r));
  assert.equal(p.input("b", 1, "key-1", "down"), true);
  assert.equal(p.input("a", 1, "key-1", "up"), false);
  await send("setSettings", {
    session: "b",
    generation: 1,
    changes: { firmware: "flash" },
  });
  await new Promise((r) => setImmediate(r));
  assert.equal(out.at(-1).ok, false);
});
