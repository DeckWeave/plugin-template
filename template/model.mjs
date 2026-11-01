// SPDX-License-Identifier: GPL-3.0-or-later
export function normalizeSettings(input = {}) {
  return {
    label: String(input.label ?? "Count").slice(0, 32),
    step: Math.max(1, Math.min(100, Math.round(Number(input.step) || 1))),
  };
}
export function nextValue(current, ticks, step) {
  return Math.max(
    -99999,
    Math.min(99999, current + Math.trunc(Number(ticks) || 0) * step),
  );
}
