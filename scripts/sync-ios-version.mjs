#!/usr/bin/env node
// Reads version from package.json and updates MARKETING_VERSION in project.pbxproj.
// Run automatically via the "postversion" npm hook after npm version patch/minor/major.
import { readFileSync, writeFileSync } from "fs";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { version } = require("../package.json");

const pbxprojPath = "ios/App/App.xcodeproj/project.pbxproj";
const content = readFileSync(pbxprojPath, "utf-8");
const updated = content.replace(/MARKETING_VERSION = .+;/g, `MARKETING_VERSION = ${version};`);

if (content === updated) {
  console.log(`[sync-ios-version] MARKETING_VERSION already ${version}`);
} else {
  writeFileSync(pbxprojPath, updated, "utf-8");
  console.log(`[sync-ios-version] MARKETING_VERSION → ${version}`);
}
