const fs = require("fs");
const path = require("path");

const layoutPath = path.join(__dirname, "..", "src", "app", "layout.tsx");
let content = fs.readFileSync(layoutPath, "utf8");
// Strip null bytes that some editors insert
const fixed = content.replace(/\0/g, "");
if (fixed !== content) {
  fs.writeFileSync(layoutPath, fixed);
  console.log("fix-layout: removed null bytes from src/app/layout.tsx");
}
