# DeckWeave plugin template

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

Use the generated README and `lib/SDK-PROTOCOL.md` for the runtime contract. Device-provider/driver generation is not implemented; this is an action plugin template. See [CONTRIBUTING.md](CONTRIBUTING.md).
