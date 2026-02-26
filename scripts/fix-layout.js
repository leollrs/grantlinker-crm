const fs = require("fs");
const path = require("path");

const READ_TIMEOUT_MS = 1500;
const layoutPath = path.join(__dirname, "..", "src", "app", "layout.tsx");

async function main() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), READ_TIMEOUT_MS);

  try {
    const content = await fs.promises.readFile(layoutPath, "utf8", {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    // Strip null bytes that some editors insert.
    const fixed = content.replace(/\0/g, "");
    if (fixed !== content) {
      await fs.promises.writeFile(layoutPath, fixed, "utf8");
      console.log("fix-layout: removed null bytes from src/app/layout.tsx");
    }
  } catch (error) {
    clearTimeout(timeout);
    const code = error && typeof error === "object" ? error.code : undefined;
    // Fail open so dev/build can continue even when files are cloud-backed.
    if (code === "ABORT_ERR" || code === "ECANCELED" || code === "ETIMEDOUT") {
      console.warn("fix-layout: skipped due to slow file read");
      return;
    }
    if (code === "ENOENT") {
      return;
    }
    console.warn("fix-layout: skipped with error", code || error);
  }
}

void main();
