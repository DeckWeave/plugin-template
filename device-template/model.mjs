// SPDX-License-Identifier: GPL-3.0-or-later
import { DeviceError } from "./lib/device.mjs";
export const providerId = "__PLUGIN_ID__";
const displayName = __PLUGIN_NAME_JSON__;
export function descriptor(instanceId) {
  return {
    instanceId,
    modelId: providerId + ".mock",
    name: displayName + (instanceId === "mock-a" ? " A" : " B"),
    identity: { confidence: "session", persistentId: null },
    geometry: { width: 3, height: 2 },
    controls: [
      {
        id: "key-1",
        kind: "key",
        x: 0,
        y: 0,
        width: 1,
        height: 1,
        events: ["down", "up"],
      },
      {
        id: "key-2",
        kind: "key",
        x: 1,
        y: 0,
        width: 1,
        height: 1,
        events: ["down", "up"],
      },
      {
        id: "dial-1",
        kind: "dial",
        x: 2,
        y: 0,
        width: 1,
        height: 1,
        events: ["down", "up", "rotate"],
      },
      {
        id: "touch-strip",
        kind: "touch",
        x: 0,
        y: 1,
        width: 3,
        height: 1,
        events: ["touchStart", "touchMove", "touchEnd"],
      },
    ],
    displays: [
      { id: "key-1", width: 96, height: 96, mime: ["image/jpeg", "image/png"] },
      { id: "key-2", width: 96, height: 96, mime: ["image/jpeg", "image/png"] },
      { id: "strip", width: 800, height: 128, mime: ["image/jpeg"] },
    ],
    settings: [
      {
        id: "screenBrightness",
        label: { en: "Screen brightness", ru: "Яркость экрана" },
        type: "number",
        min: 0,
        max: 100,
        step: 1,
        persistence: "volatile",
        readback: true,
      },
      {
        id: "vibration",
        label: { en: "Press vibration", ru: "Вибрация при нажатии" },
        type: "boolean",
        persistence: "volatile",
        readback: true,
      },
    ],
    lighting: [
      {
        id: "keys",
        label: { en: "Key lighting", ru: "Подсветка клавиш" },
        kind: "keys",
        controls: ["key-1", "key-2"],
        modes: ["static", "wave"],
        evidence: "simulated",
      },
    ],
  };
}
export function createMock({ emitInput = false } = {}) {
  const states = new Map();
  return {
    id: providerId,
    discover: () => ["mock-a", "mock-b"].map(descriptor),
    open(instanceId, { signal, input }) {
      if (!["mock-a", "mock-b"].includes(instanceId))
        throw new DeviceError("not_found", "Mock instance not found");
      let state = states.get(instanceId) ?? {
        screenBrightness: 70,
        vibration: true,
      };
      states.set(instanceId, state);
      let timer;
      if (emitInput) {
        timer = setInterval(() => {
          input("key-1", "down");
          input("key-1", "up");
        }, 1000);
        signal.addEventListener("abort", () => clearInterval(timer), {
          once: true,
        });
      }
      const readState = () => ({
        observed: { ...state },
        requested: { ...state },
        evidence: {
          transport: "accepted",
          readback: "verified",
          physical: "unsupported",
        },
      });
      return {
        descriptor: descriptor(instanceId),
        readState,
        setSettings({ changes }) {
          for (const [key, value] of Object.entries(changes))
            if (
              (key === "screenBrightness" &&
                Number.isInteger(value) &&
                value >= 0 &&
                value <= 100) ||
              (key === "vibration" && typeof value === "boolean")
            ) {
            } else
              throw new DeviceError("settings", "Unsupported setting or value");
          Object.assign(state, changes);
          return readState();
        },
        display({ target, mime, data }) {
          const d = descriptor(instanceId).displays.find(
            (d) => d.id === target,
          );
          if (!d || !d.mime.includes(mime) || !data.length)
            throw new DeviceError(
              "display",
              "Unsupported target, MIME or empty frame",
            );
          return {
            transport: "accepted",
            readback: "unsupported",
            physical: "unsupported",
          };
        },
        cancel() {
          clearInterval(timer);
          return { cancelled: true };
        },
        close() {
          clearInterval(timer);
          return { recovery: "not_needed" };
        },
      };
    },
  };
}
