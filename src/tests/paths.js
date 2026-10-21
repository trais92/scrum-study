const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");

const appPath = path.resolve(__dirname, "../../dist/index.html");
const shotsDir = path.join(__dirname, "shots");
fs.mkdirSync(shotsDir, { recursive: true });

module.exports = {
  appUrl: pathToFileURL(appPath).href,
  shotsDir
};
