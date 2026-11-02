# DeckWeave Mock Device

Independent, dependency-free **device support** example, not an Elgato action
plugin. Node 22 or newer. `npm test`, `npm run validate`, `npm run pack` require
no sibling checkouts, hardware, network, or npm install. The ZIP and SHA-256 in
`dist` are local artefacts; nothing is published automatically.

`node provider.mjs` serves provisional device protocol 1 on stdin/stdout;
`--emit-input` emits simulated press/release pairs while sessions are open.
Discovery returns two independent simulated devices. Open/read are read-only.
Settings and frames are simulated, and physical evidence is unsupported.
See [DEVICE-PROTOCOL.md](lib/DEVICE-PROTOCOL.md) for handshake, generations,
limits, cancellation and recovery obligations. Logs belong on stderr.

Replace model discovery and each session adapter with one serialized hardware
owner per real instance. Do not share a single global active device. Keep stable
control IDs, declare actual capabilities, and do not claim a USB path is a serial
number. Keyboard keys have no LCD unless the actual hardware does. Discovery and
open must preserve normal typing and never reset/flash/write settings.

The runtime ZIP contains an explicit file allowlist. Add required native helpers
to both validation and packaging before publishing a real provider. Host-side
installation/execution must validate the archive independently. This example is
provisional and is not a declaration of public host compatibility.
