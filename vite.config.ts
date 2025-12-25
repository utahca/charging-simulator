import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const repoName = process.env.GITHUB_REPOSITORY?.split("/")[1];
const isUserOrOrgSite = repoName?.endsWith(".github.io");
const base = repoName && !isUserOrOrgSite ? `/${repoName}/` : "/";

export default defineConfig({
  plugins: [react()],
  base,
  build: {
    outDir: "docs",
  },
});
