// SPDX-License-Identifier: GPL-3.0-or-later
import { createPlugin, escapeXml, svgDataUrl } from "./lib/sdk.mjs";
import { normalizeSettings, nextValue } from "./model.mjs";
import { pathToFileURL } from "node:url";
export function start(options) {
  const plugin = createPlugin(options);
  function draw(ctx) {
    const [w, h] = ctx.canvas;
    const settings = normalizeSettings(ctx.settings),
      size = Math.min(w, h);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="#142234"/><text x="50%" y="30%" text-anchor="middle" fill="#b8d4ed" font-family="sans-serif" font-size="${size * 0.15}">${escapeXml(settings.label)}</text><text x="50%" y="78%" text-anchor="middle" fill="white" font-family="sans-serif" font-size="${size * 0.42}">${ctx.state.value}</text></svg>`;
    const image = svgDataUrl(svg);
    if (ctx.controller === "Encoder") {
      if (!ctx.state.layout) {
        ctx.setFeedbackLayout("$A0");
        ctx.state.layout = true;
      }
      ctx.setFeedback({ "full-canvas": image });
    } else ctx.setImage(image);
    ctx.setTitle(`${settings.label} ${ctx.state.value}`);
  }
  plugin.on("willAppear", (ctx) => {
    ctx.state.value = 0;
    draw(ctx);
  });
  plugin.on("didReceiveSettings", draw);
  function change(ctx, ticks) {
    ctx.state.value = nextValue(
      ctx.state.value,
      ticks,
      normalizeSettings(ctx.settings).step,
    );
    draw(ctx);
  }
  plugin.on("keyUp", (ctx) => change(ctx, 1));
  plugin.on("dialRotate", (ctx, msg) => change(ctx, msg.payload.ticks));
  plugin.on("dialUp", (ctx) => {
    ctx.state.value = 0;
    draw(ctx);
  });
  plugin.on("touchTap", (ctx) => change(ctx, 1));
  plugin.on("panelUp", (ctx) => change(ctx, 1));
  // Add ctx.interval()/ctx.timeout() only for visible data; they are cancelled on willDisappear.
  // For networking use ctx.signal, shared caches, bounded refreshes and a documented endpoint.
  return plugin;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  start();
