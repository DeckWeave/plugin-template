# DeckWeave plugin template

## Device support (provisional)

```powershell
node bin/create.mjs --device ../my-device dev.example.mydevice "My device"
cd ../my-device
npm test
npm run validate
npm run pack
```

The generated independent project serves a distinct stdin/stdout device protocol,
with two mock instances, stable controls, settings, generation checks, cancellation
and bounded queues. It embeds the device SDK and GPL notices; it does not depend
on this checkout. `examples/dev.deckweave.mock.dwDevice` is a runnable development
fixture, never a public installable release. ZIPs use `.dwDevice/` roots and include
local SHA-256/release metadata. See its README and `lib/DEVICE-PROTOCOL.md`.

The default generator and explicit `--action` preserve the Elgato-compatible
action template below. Device packages are not `.sdPlugin` action packages.

Creates a standalone action plugin with Node.js 22+ ESM backend, en/ru settings, vendored SDK with TypeScript declarations, example counter logic, tests, validator and reproducible ZIP packaging. No package install or network needed.

```powershell
node bin/create.mjs C:\work\my-counter dev.example.counter "My Counter"
cd C:\work\my-counter
npm test
npm run validate
npm run pack
```

Choose a **new destination**. IDs use reverse DNS (three or more lowercase segments). Display name is a separate argument. Existing paths are refused. Generated code has no dependency on this checkout, a drive letter, sibling SDK or npm publication. Copy the directory into the host's plugins directory with a `.sdPlugin` suffix; refresh the catalog/restart. ZIP is an open-source distribution artifact, not a Marketplace installer.

Run `npm test` here to generate and exercise a plugin in an independent OS temporary directory, verify archives reproduce exactly, validate hostile paths and ensure existing destinations remain untouched. Tests remove only their own newly created temp directory. The template snapshot lives in `template/lib`; maintainers update it from `../plugin-sdk` deliberately and record `SDK-VERSION`.

Use `lib/SDK-PROTOCOL.md` for generated action projects and
`lib/DEVICE-PROTOCOL.md` for `--device` projects. See
[CONTRIBUTING.md](CONTRIBUTING.md).

Action projects also include `lib/HOST-SERVICES.md`: optional acknowledged
notification sounds, persistent notes/live metrics and native countdown panels.
Check host capabilities before using them; do not attach producer polling to a
visible action when a background service must survive page/profile changes.
