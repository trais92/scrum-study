const assert = require("assert");
const { chromium } = require("playwright");
const { appUrl } = require("./paths.js");

function rgb(color) {
  const srgb = color.match(/^color\(srgb ([\d.]+) ([\d.]+) ([\d.]+)/);
  if (srgb) return srgb.slice(1).map(channel => Number(channel) * 255);
  const hex = color.match(/^#([0-9a-f]{6})$/i);
  if (hex) return [0, 2, 4].map(index => parseInt(hex[1].slice(index, index + 2), 16));
  const channels = color.match(/[\d.]+/g);
  assert.ok(channels && channels.length >= 3, `Expected an RGB color, got ${color}`);
  return channels.slice(0, 3).map(Number);
}

function luminance(color) {
  const linear = rgb(color).map(channel => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}

function contrast(foreground, background) {
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

(async () => {
  let browser;
  try {
    browser = await chromium.launch();
    const page = await browser.newPage();
    for (const colorScheme of ["light", "dark"]) {
      await page.emulateMedia({ colorScheme });
      await page.goto(appUrl);
      const colors = await page.locator("#v-home .exam-bank").evaluate(element => {
        const style = getComputedStyle(element);
        return {
          background: style.backgroundColor,
          color: style.color,
          panel: (() => {
            const probe = document.createElement("div");
            probe.style.backgroundColor = "var(--panel)";
            document.body.append(probe);
            const panel = getComputedStyle(probe).backgroundColor;
            probe.remove();
            return panel;
          })()
        };
      });
      assert.ok(colors.background !== colors.panel, `${colorScheme} bank header should remain visually highlighted against cards`);
      assert.ok(contrast(colors.color, colors.background) >= 4.5,
        `${colorScheme} bank header text should meet 4.5:1 contrast: ${JSON.stringify(colors)}`);
      if (colorScheme === "dark") {
        assert.ok(Math.max(...rgb(colors.background)) < 100,
          `dark bank header should stay within the dark card palette, not become a pale strip: ${colors.background}`);
      }
    }
    console.log("Question bank header theme checks passed (light and dark color schemes, visible highlight, readable text, and dark palette).");
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
  }
})();
