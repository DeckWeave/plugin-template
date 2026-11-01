import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { normalizeSettings, nextValue } from "../model.mjs";
import { createPlugin } from "../lib/sdk.mjs";
import { start } from "../plugin.mjs";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
test("settings tolerate old/invalid persisted values", () => {
  assert.deepEqual(normalizeSettings({ step: -2, label: "a".repeat(60) }), {
    step: 1,
    label: "a".repeat(32),
  });
  assert.equal(normalizeSettings({ step: NaN }).step, 1);
  assert.equal(nextValue(5, -3, 2), -1);
  assert.equal(nextValue(99999, 3, 2), 99999);
});
test("backend parses without installed dependencies", () => {
  const result = spawnSync(process.execPath, ["--check", "plugin.mjs"], {
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);
});
test("vendored SDK registers and disposes one independent context", () => {
  class Socket extends EventTarget {
    static current;
    readyState = 1;
    sent = [];
    constructor() {
      super();
      Socket.current = this;
    }
    send(v) {
      this.sent.push(JSON.parse(v));
    }
    close() {
      this.readyState = 3;
    }
  }
  const p = createPlugin({
    arguments: {
      port: 1234,
      uuid: "test",
      registerEvent: "registerPlugin",
      info: {},
    },
    WebSocket: Socket,
  });
  const s = Socket.current;
  s.dispatchEvent(new Event("open"));
  assert.equal(s.sent[0].event, "registerPlugin");
  p.on("willAppear", (ctx) => {
    ctx.state.value = 1;
  });
  s.dispatchEvent(
    new MessageEvent("message", {
      data: JSON.stringify({ event: "willAppear", context: "one" }),
    }),
  );
  const ctx = p.contexts.get("one");
  assert.equal(ctx.state.value, 1);
  p.dispose();
  assert.equal(ctx.active, false);
});
test("actual backend renders Encoder via A0 feedback and keys/panels via setImage", () => {
  class Socket extends EventTarget {
    static current;
    readyState = 1;
    sent = [];
    constructor() {
      super();
      Socket.current = this;
    }
    send(v) {
      this.sent.push(JSON.parse(v));
    }
    close() {
      this.readyState = 3;
    }
    message(m) {
      this.dispatchEvent(
        new MessageEvent("message", { data: JSON.stringify(m) }),
      );
    }
  }
  const p = start({
    arguments: {
      port: 1234,
      uuid: "test",
      registerEvent: "registerPlugin",
      info: {},
    },
    WebSocket: Socket,
  });
  const s = Socket.current;
  s.message({
    event: "willAppear",
    context: "encoder",
    payload: { controller: "Encoder" },
  });
  assert.deepEqual(
    s.sent.find((m) => m.event === "setFeedbackLayout").payload,
    { layout: "$A0" },
  );
  const feedback = s.sent.find((m) => m.event === "setFeedback");
  assert.ok(
    feedback.payload["full-canvas"].startsWith("data:image/svg+xml;base64,"),
  );
  assert.equal(
    s.sent.some((m) => m.event === "setImage"),
    false,
  );
  const before = feedback.payload["full-canvas"];
  s.message({ event: "dialRotate", context: "encoder", payload: { ticks: 2 } });
  assert.notEqual(
    s.sent.filter((m) => m.event === "setFeedback").at(-1).payload[
      "full-canvas"
    ],
    before,
  );
  for (const controller of ["Keypad", "Panel"]) {
    s.message({
      event: "willAppear",
      context: controller,
      payload: { controller, canvas: [800, 128] },
    });
    assert.ok(
      s.sent.some((m) => m.event === "setImage" && m.context === controller),
    );
  }
  p.dispose();
});
test("actual PI preserves a draft step during echoed label save and updates untouched fields", async () => {
  const html = await readFile(
    new URL("../settings.html", import.meta.url),
    "utf8",
  );
  const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  const elements = Object.fromEntries(
    ["label", "step", "heading", "labelText", "stepText", "hint", "status"].map(
      (id) => [id, { value: "", textContent: "" }],
    ),
  );
  const document = {
    getElementById: (id) => elements[id],
    activeElement: null,
    documentElement: {},
  };
  class Socket {
    static current;
    sent = [];
    constructor() {
      Socket.current = this;
    }
    send(v) {
      this.sent.push(JSON.parse(v));
    }
  }
  const window = {};
  vm.runInNewContext(script, {
    document,
    window,
    WebSocket: Socket,
    queueMicrotask,
  });
  window.connectElgatoStreamDeckSocket(
    1234,
    "context",
    "registerPropertyInspector",
    "{}",
    JSON.stringify({ payload: { settings: { label: "Old", step: 1 } } }),
  );
  const s = Socket.current;
  s.onopen();
  // A label change was sent; user immediately starts drafting a step while its echo is pending.
  elements.label.value = "New";
  elements.label.oninput();
  elements.label.onchange();
  document.activeElement = elements.step;
  elements.step.value = "7";
  elements.step.oninput();
  s.onmessage({
    data: JSON.stringify({
      event: "didReceiveSettings",
      payload: { settings: { label: "New", step: 1 } },
    }),
  });
  assert.equal(elements.step.value, "7");
  assert.equal(s.sent.at(-1).payload.step, 1); // Another field's draft has not silently been committed.
  elements.step.onchange();
  assert.equal(s.sent.at(-1).payload.step, 7);
  document.activeElement = null;
  s.onmessage({
    data: JSON.stringify({
      event: "didReceiveSettings",
      payload: { settings: { label: "External", step: 9 } },
    }),
  });
  assert.equal(elements.label.value, "External");
  assert.equal(Number(elements.step.value), 9);
});
