#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-or-later
import {
  cp,
  mkdir,
  readdir,
  readFile,
  writeFile,
  lstat,
  access,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
const template = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../template",
);
const [destination, uuid = "dev.example.counter", name = "Example Counter"] =
  process.argv.slice(2);
if (
  !destination ||
  !/^[a-z][a-z0-9]*(?:\.[a-z][a-z0-9_-]*){2,}$/.test(uuid) ||
  /[<>\r\n]/.test(name) ||
  !name.trim()
) {
  console.error(
    "Usage: node bin/create.mjs <new-directory> <reverse.dns.plugin-id> [Display name]",
  );
  process.exitCode = 1;
} else {
  const output = path.resolve(destination);
  try {
    try {
      await access(output);
      throw new Error("Destination already exists; choose a new directory");
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    await mkdir(output, { recursive: true });
    await cp(template, output, { recursive: true });
    async function substitute(dir) {
      for (const item of await readdir(dir)) {
        const file = path.join(dir, item),
          stat = await lstat(file);
        if (stat.isDirectory()) {
          await substitute(file);
          continue;
        }
        if (!/\.(?:json|mjs|html|md)$/.test(item)) continue;
        const text = await readFile(file, "utf8");
        await writeFile(
          file,
          text
            .replaceAll("__PLUGIN_ID__", () => uuid)
            .replaceAll("__PLUGIN_NAME_JSON__", () => JSON.stringify(name))
            .replaceAll("__PLUGIN_NAME__", () => name),
        );
      }
    }
    await substitute(output);
    console.log(
      `Created ${output}\nRun: cd "${output}" then npm test, npm run validate, npm run pack`,
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
