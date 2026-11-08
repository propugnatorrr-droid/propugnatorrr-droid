// Runs real commands against the private repos and writes data/claims.json.
// Every number on the profile is read from that file. Run locally (the repos are private):
//   node scripts/collect-claims.ts
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const profile = resolve(here, "..");
// Folder that contains the private product repos. Set REPOS_ROOT, or keep this repo two levels below it.
const root = process.env.REPOS_ROOT ?? resolve(profile, "..", "..");
// Alias to real folder name lives in scripts/repos.local.json, which is git-ignored (see repos.local.example.json).
const localMapFile = resolve(here, "repos.local.json");
const repoMap: Record<string, string> = existsSync(localMapFile) ? JSON.parse(readFileSync(localMapFile, "utf8")) : {};
const gitBash = "C:/Program Files/Git/bin/bash.exe";
const shell = existsSync(gitBash) ? gitBash : "bash";

type Spec = { id: string; product: string; label: string; cwd: string; command: string };
const specs: Spec[] = [
  { id: "citeward.tools", product: "CiteWard", label: "Tools in the in-app directory", cwd: "citeward", command: `grep -cE "^[[:space:]]*[{] label:" app/tools/page.tsx` },
  { id: "citeward.api_routes", product: "CiteWard", label: "API routes", cwd: "citeward", command: "find app/api -name route.ts | wc -l" },
  { id: "citeward.commits", product: "CiteWard", label: "Commits", cwd: "citeward", command: "git rev-list --count HEAD" },
  { id: "citeward.tests", product: "CiteWard", label: "Test cases (vitest)", cwd: "@profile", command: `node -e "console.log(require('./data/citeward-tests.json').numTotalTests)"` },
  { id: "citeward.tests_passed", product: "CiteWard", label: "Test cases passing", cwd: "@profile", command: `node -e "console.log(require('./data/citeward-tests.json').numPassedTests)"` },
  { id: "citeward.test_files", product: "CiteWard", label: "Test files", cwd: "@profile", command: `node -e "console.log(require('./data/citeward-tests.json').numTestFiles)"` },
  { id: "illyria.pages", product: "Illyria", label: "Page routes", cwd: "illyria", command: "find src/app -name page.tsx | wc -l" },
  { id: "illyria.tables", product: "Illyria", label: "Database tables", cwd: "illyria", command: `grep -rhoE "pgTable[(]" src/db | wc -l` },
  { id: "illyria.test_cases", product: "Illyria", label: "Test cases", cwd: "illyria", command: `grep -rhoE "await t[(]" scripts/test | wc -l` },
  { id: "illyria.test_files", product: "Illyria", label: "Test files", cwd: "illyria", command: "ls scripts/test/*.test.ts | wc -l" },
  { id: "illyria.commits", product: "Illyria", label: "Commits", cwd: "illyria", command: "git rev-list --count HEAD" },
  { id: "ops.models", product: "TextileWays OS", label: "Data models", cwd: "textilewaysOs", command: `grep -c "^model " prisma/schema.prisma` },
  { id: "ops.models_baseline", product: "TextileWays OS", label: "Data models in the upstream baseline", cwd: "textilewaysOs", command: `git show 393ccb4:prisma/schema.prisma | grep -c "^model "` },
  { id: "hub.models", product: "PrepsNext Hub", label: "Data models", cwd: "hub", command: `grep -c "^model " prisma/schema.prisma` },
  { id: "hub.api_routes", product: "PrepsNext Hub", label: "API routes", cwd: "hub", command: "find src -name route.ts | wc -l" },
  { id: "hub.pages", product: "PrepsNext Hub", label: "Page routes", cwd: "hub", command: "find src/app -name page.tsx | wc -l" },
  { id: "hub.commits", product: "PrepsNext Hub", label: "Commits", cwd: "hub", command: "git rev-list --count HEAD" },
  { id: "hub.migrations", product: "PrepsNext Hub", label: "Migrations", cwd: "hub", command: "ls -d prisma/migrations/*/ | wc -l" },
  { id: "coach.models", product: "PrepsNext Coach Portal", label: "Data models", cwd: "coach", command: `grep -c "^model " prisma/schema.prisma` },
  { id: "coach.pages", product: "PrepsNext Coach Portal", label: "Page routes", cwd: "coach", command: "find src/app -name page.tsx | wc -l" },
  { id: "kynnected.screens", product: "Kynnected", label: "Screens", cwd: "kynnected", command: `find app -name "*.tsx" ! -name "_layout.tsx" | wc -l` },
  { id: "kynnected.migrations", product: "Kynnected", label: "Migrations", cwd: "kynnected", command: "ls supabase/migrations | wc -l" },
  { id: "celesya.pages", product: "Celesya", label: "Page routes", cwd: "@profile", command: `gh api "repos/<repo>/git/trees/HEAD?recursive=1" --jq '[.tree[]|select(.path|endswith("/page.tsx"))]|length'` },
  { id: "celesya.api_routes", product: "Celesya", label: "API routes", cwd: "@profile", command: `gh api "repos/<repo>/git/trees/HEAD?recursive=1" --jq '[.tree[]|select(.path|endswith("/route.ts"))]|length'` },
  { id: "herbiix.eval_cases", product: "Herbiix", label: "AI evaluation prompts with asserted checks", cwd: "herbiix", command: `grep -E "^[[:space:]]*prompt:" tests/ai/evals.ts | grep -vc "prompt: string"` },
  { id: "textileways.redirects", product: "TextileWays", label: "Permanent redirects for renamed pages", cwd: "textileways", command: `grep -c "{ from:" content/configuration/slug-redirects.ts` },
  { id: "novostitches.rfq_required", product: "NovoStitches", label: "Required fields in the quote form", cwd: "novostitches", command: `grep -cE " required" app/public/wp-content/plugins/novostitches-core/includes/class-rfq-form.php` },
];

const claims: Record<string, unknown> = {};
for (const s of specs) {
  const cwd = s.cwd === "@profile" ? profile : resolve(root, repoMap[s.cwd] ?? s.cwd);
  const out = execFileSync(shell, ["-c", s.command.replace("<repo>", repoMap.celesyaGh ?? "")], { cwd, encoding: "utf8" }).trim();
  const value = Number(out);
  if (!Number.isFinite(value)) throw new Error(`${s.id}: not a number: ${out}`);
  claims[s.id] = { value, product: s.product, label: s.label, command: s.command, cwd: s.cwd === "@profile" ? "this repo" : `${s.product} repo (private)`, ranAt: new Date().toISOString() };
  console.log(s.id.padEnd(26), String(value).padStart(6));
}
writeFileSync(resolve(profile, "data/claims.json"), JSON.stringify({ generatedBy: "scripts/collect-claims.ts", claims }, null, 2) + "\n");
