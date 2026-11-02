# Contributing

Keep Node 22+ and no runtime/tool dependencies. Test changes by generating into a new OS temp directory, not only by running files inside this repo. Update all en/ru strings, generated instructions and tests together.

To refresh the SDK snapshot, copy `sdk.mjs`, `sdk.d.ts`, `sdk.d.mts`, `LICENSE`, `PROTOCOL.md`, and its referenced `DEVICE-PROTOCOL.md` from the reviewed SDK into `template/lib`, naming license `SDK-LICENSE` and action protocol `SDK-PROTOCOL.md`; update `SDK-VERSION`. Do not automatically read a sibling SDK while a user generates a plugin: the template must be reproducible and independently usable.

The package ZIP has fixed timestamps and sorted paths. Avoid adding machine-local paths, build timestamps or secrets to generated files. Symlinks are rejected. This tool performs no installation, registry publishing, dependency download or OS command execution. Source-distributed plugins must keep GPL-3.0-or-later notices and full licenses.

`--device` uses the separate `device-template/` snapshot: vendor `device.mjs`,
`device.d.mts`, `device-manifest.schema.json`, `DEVICE-PROTOCOL.md` and SDK licence.
Do not read sibling repositories during generation. Keep the runnable two-instance
mock in `examples/dev.deckweave.mock.dwDevice` synchronized. `npm test` generates
outside this checkout and exercises a real process, then deterministic packaging.
Runtime modules belong in `lib/` or `src/`; packaging includes the declared entry
and runtime directories, and excludes tests/tools/local notes. A native provider
needs its own build/required-native-file preflight; the Node mock template does
not pretend to compile or redistribute an arbitrary driver.
