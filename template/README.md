# __PLUGIN_NAME__

Standalone DeckWeave action plugin. Node.js 22+; dependency-free ESM backend and bilingual en/ru HTML Property Inspector. No network requests, telemetry, hardware or OS operations. Runtime SDK version is in `lib/SDK-VERSION`; the vendored runtime and generated example are GPL-3.0-or-later, with full license included.

## Develop

No install/build step is required. Run `npm test`, `npm run validate`, then `npm run pack`. The ZIP and SHA-256 file appear in `dist/`; packaging is byte-for-byte reproducible when the source files are unchanged. Packaging includes source, tests and licenses and excludes `.git`, `node_modules`, `.env`, `.env.*` and `dist`. Review contents for private files before distribution. No signing or automatic installer is provided. Declare mandatory native files as `"DeckWeave":{"RequiredFiles":["bin/helper.exe"]}` in the manifest; validation and packaging fail if any are absent.

To try locally, copy this whole directory to DeckWeave's `plugins/__PLUGIN_ID__.sdPlugin`, open app Settings → Plugins and refresh the catalog (or restart). Drag Counter onto a key, dial or native Panel. Open its plugin settings and set Label/Step; changes save immediately. Press increases, rotate changes by direction, dial press resets. Selecting an action does not execute it; use the editor's Test command. Values reset when navigating away, by design; persist application data explicitly if needed.

Edit `model.mjs` for pure logic, `plugin.mjs` for lifecycle, `settings.html` for settings. New actions get unique UUIDs under `__PLUGIN_ID__`; update manifest Controllers to actual supported control types. Panel is a DeckWeave extension, not an Elgato Controller. Do not advertise full Stream Deck compatibility for the Panel part.

Encoder output uses `Encoder.layout: "$A0"` and `setFeedback({'full-canvas':image})`, with a 200×100 logical canvas. `setImage` alone does not populate an Encoder layout. The example chooses this feedback path only for Encoder; keys and native Panels use `setImage`. PI settings preserve focused/dirty fields when a host echo arrives, and each field commits independently on change.

## SDK rules

`createPlugin().on(event,(ctx,message)=>...)` receives an isolated context created by `willAppear`. `ctx.settings` is a whole persisted settings object; `ctx.state` is transient. `ctx.canvas` is native pixels; draw to it rather than assuming a square. Escape dynamic SVG text with `escapeXml` and use standalone SVG, PNG or JPEG data URLs. `ctx.interval`/`timeout` clean up automatically; use `ctx.signal` with fetch and `ctx.onDispose` for owned resources. Global cleanup goes in `plugin.onDispose`. A process serves multiple contexts, so never store per-button state in one global variable.

Async handlers overlap; cancel stale requests, bound retries/cache sizes, show stale/error states and document endpoints before adding networking. `sendToPlugin` and global lifecycle events can have an undefined context; guard it. Never put secrets into logs, example settings, source or archives. Package scripts execute locally; review external plugins before running them. See `lib/SDK-PROTOCOL.md` for exact current events and the explicitly unimplemented hardware-provider contract.

## Contribute

Add tests for real behavior and lifecycle, update both en/ru settings and documentation. Keep runtime imports relative and bundle all required code; no sibling-checkout paths or unpublished npm packages. Do not edit a third-party installed Elgato plugin. Report host/plugin/Node versions and redacted steps. Optional publishing uses the separate `plugin-registry` schema; a local SHA-256 archive does not publish or install anything by itself.
