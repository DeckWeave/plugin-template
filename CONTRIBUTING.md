# Contributing

Keep Node 22+ and no runtime/tool dependencies. Test changes by generating into a new OS temp directory, not only by running files inside this repo. Update all en/ru strings, generated instructions and tests together.

To refresh the SDK snapshot, copy `sdk.mjs`, `sdk.d.ts`, `sdk.d.mts`, `LICENSE`, and `PROTOCOL.md` from the reviewed SDK into `template/lib`, naming license `SDK-LICENSE` and protocol `SDK-PROTOCOL.md`; update `SDK-VERSION`. Do not automatically read a sibling SDK while a user generates a plugin: the template must be reproducible and independently usable.

The package ZIP has fixed timestamps and sorted paths. Avoid adding machine-local paths, build timestamps or secrets to generated files. Symlinks are rejected. This tool performs no installation, registry publishing, dependency download or OS command execution. Source-distributed plugins must keep GPL-3.0-or-later notices and full licenses.
