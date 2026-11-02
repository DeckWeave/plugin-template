// SPDX-License-Identifier: GPL-3.0-or-later
import { serveDevice } from "./lib/device.mjs";
import { createMock } from "./model.mjs";
serveDevice(createMock({ emitInput: process.argv.includes("--emit-input") }));
