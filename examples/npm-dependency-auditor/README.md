# Dependency Adoption Review

A set of Orkes Conductor workflows that answers "Should we adopt this npm package version?" It gathers evidence from deps.dev (gRPC), OSV.dev, npm and Hacker News (HTTP), and DeepWiki (MCP), and has an LLM judge it. Fixed rules then approve the package, reject it, or ask a person, and every decision is recorded as a GitHub issue.

This guide covers the minimum needed to run `dependency_adoption_review` on Orkes Conductor. Everything runs as system tasks, so there are no workers to deploy. Tested on [Developer Edition](https://developer.orkescloud.com/).

## What you need

- **An Orkes Conductor cluster.** Developer Edition works as-is. On other clusters, the **gRPC task** may need enabling by Orkes support.
- **An OpenAI API key.**
- **A GitHub account.**
- **Files from this repo:**
  - the four workflow files in `workflows/`
  - `dependency_review_user_form.json`
  - the sample inputs in `sample-inputs/`

## Setup

1. **LLM integration.** Under **Integrations**, add an OpenAI integration named **`OpenAi_Key`** and enable the model **`gpt-5-nano`**.
2. **Remote Services (gRPC).** Go to **Definitions → Remote Services → + New service** and set:
   - **Name:** **`deps_dev`**
   - **Type:** gRPC
   - **Host:** **`api.deps.dev:443`**. Include the port in the host field even though there's a separate port field, otherwise saving fails.
   - **Port:** `443`
   - **SSL:** **on**

   Save, then **Discover methods**. Server reflection should list methods under `deps_dev.v3.Insights` and `deps_dev.v3alpha.Insights`. The workflow uses `v3` GetVersion, GetProject and GetDependencies, plus `v3alpha` GetVersionBatch.

3. **GitHub repo and token.**
   - Create a new private repo for the decision records, for example `dependency-decisions`. Make sure that Issues are enabled.
   - Create a **fine-grained token** scoped to **only that repo**, with **Repository permissions → Issues: Read and write**. Set it to a 30-day expiry.
4. **Secret.** Under **Definitions → Secrets → + Add secret**, create **`github_orkes-dependency-review_token`** with the token as its value.
5. **User Form.** Create it before the workflows, because the review step refers to it. Under **Definitions → User Forms → + New form**, switch to the JSON view and paste `dependency_review_user_form.json`. Keep the name **`dependency_review_form`** and save it as version 1.
6. **Workflows.** The review is a parent workflow that runs three child workflows. Save the children first, in this order. For each file in `workflows/`, go to **Definitions → Workflow → + Define workflow → Code**, replace the contents with the file, and save:
   1. `scan_npm_package.workflow.json`: checks the package and every dependency for advisories.
   2. `assess_npm_package.workflow.json`: gathers the evidence and asks the LLM. It runs `scan_npm_package`.
   3. `record_dependency_decision.workflow.json`: approves or rejects, asks a person when needed, and files the GitHub issue.
   4. `dependency_adoption_review.workflow.json`: the parent, which runs the assessment and then records the decision.
7. **Optional: retries for DeepWiki.** DeepWiki occasionally drops a connection. To retry it automatically, go to **Definitions → Task → + Define task** and create a task named **`ask_deepwiki`** with, for example, a retry count of 2, fixed retry logic and a 5-second retry delay. System tasks don't need a task definition, but one with the same name changes their retry behavior.

The Hacker News search uses a free public API, so it needs no setup.

**If you used different names,** edit the workflow JSON before saving:

| Setting | Where it appears in the workflow |
| --- | --- |
| Integration or model | `assess_npm_package`: `assess_package` → `llmProvider` / `model` |
| Secret | `record_dependency_decision`: `record_decision_on_github` → `headers.Authorization` |
| gRPC service | `"service": "deps_dev"` in the 4 GRPC tasks: two in `assess_npm_package` (GetVersion, GetProject), two in `scan_npm_package` (GetDependencies, GetVersionBatch) |
| Form | `record_dependency_decision`: `human_review` → `userFormTemplate.name` |
| Child workflow names | `subWorkflowParam.name` in the parent (two) and in `assess_npm_package` (one) |

## Run

1. Open the parent workflow's (`dependency_adoption_review`) **Run** tab and enter input. This is `sample-inputs/human-review-licenses-and-advisories.json`:

   ```json
   {
     "packageName": "express",
     "packageVersion": "4.17.1",
     "githubOwner": "<your-github-user>",
     "githubRepo": "<your-repo>",
     "allowedLicenses": ["MIT"]
   }
   ```

   - **Replace `githubOwner` and `githubRepo`** with your own user and repo. The sample files use `acdevlin/dependency-decisions`, which you won't have access to.
   - Only npm packages are supported. The version must exist exactly, or the run fails at the first task with `NOT_FOUND`.
   - **`allowedLicenses`** is optional. The sample allows only MIT, to show the license policy at work.
     - Missing, `""`, `null`, `[]`, `"ALL"` or `"*"`: any recognized license is accepted.
     - A list (`["MIT","ISC"]`) or a comma-separated string (`"MIT, ISC"`): allowlist mode.

2. **Execute.** A run for express takes under 2 minutes, not counting the human review. DeepWiki and the LLM take most of that time. Packages with large dependency trees take longer, because the workflow pages through every dependency.
3. **Review step.** The route is in the parent's output (`route`), and in the `assess_npm_package` run as `rules_ref.output.result.route`. It's one of three values. `AUTO_APPROVE` and `AUTO_REJECT` runs don't pause. If it's `HUMAN_REVIEW`:
   1. Go to **Executions → Human Tasks → Task inbox**, or use **Admin search** if it isn't listed there.
   2. Open **Dependency review** and select **Claim**.
   3. Choose **APPROVE** or **REJECT**, optionally add notes, and select **Complete**.

   `routeReasons` explains why the run needed review, and `rejectReasons` explains an automatic rejection. The brief lists each vulnerable dependency with its severity and the version that fixes it.

4. **Result.** The workflow output's `issueUrl` points to a new GitHub issue titled `Dependency decision: npm/<pkg>@<ver> → APPROVED|REJECTED (AI: <verdict>)`. Every completed run creates a new issue.

**After editing a workflow, start a new run.** A run keeps the definitions it started with. Re-paste only the file you changed.

## Test inputs and expected results

Counts are as of 2026-10-19. They change as new advisories are published.

| File | Package | Expected |
| --- | --- | --- |
| `human-review-licenses-and-advisories.json` | express@4.17.1, MIT only | Human review. Reasons: the AI verdict, "3 package(s) use licenses outside the allowed list" (`inherits` and `setprototypeof` are ISC, `qs` is BSD-3), and "14 known advisories (2 on the package, 12 in dependencies), 5 of them high or critical". Recommended version 4.20.0 |
| `auto-approve-no-advisories.json` | axios@1.20.0 | **Auto-approved** if the AI says ADOPT: 0 advisories, provenance `verified`. The brief also lists Hacker News stories about an April 2026 axios supply-chain incident, all marked as posted before this release. If the AI adds conditions anyway, the run goes to human review; try express@5.3.0 instead (below) |
| `auto-reject-deprecated-package.json` | request@2.88.2 | **Auto-rejected, whatever the AI says:** npm's latest version is deprecated too, so the whole package is. `rejectReasons`: "request is deprecated by its maintainers, including its latest version 2.88.2 (…)" |
| `stress-test-many-dependencies.json` | @strapi/strapi@5.58.0 | 1,321 dependencies over 14 pages, all checked. Human review: "25 package(s) have unknown or non-standard licenses", "13 known advisories (0 on the package, 13 in dependencies), 4 of them high or critical", and "no single upgrade fixes the high or critical advisories in braces@3.0.3" |

**More to try** (edit the input in the Run tab):

| Input | Expected |
| --- | --- |
| express@4.17.1 without `allowedLicenses` | Human review as above, without the license reason: any recognized license is accepted |
| express@5.3.0 | **Auto-approved** if the AI says ADOPT: 0 advisories across 67 dependencies. The old express@4.17.1 goes to a human |
| node-serialize@0.0.4 | **Auto-rejected, whatever the AI says:** "node-serialize@0.0.4 has a CRITICAL advisory with no fixed version (GHSA-q4v7-4rhw-9hqm)" |

**Auto-approve requires all five:**

1. the AI says `ADOPT`;
2. every license is allowed and recognized;
3. there are 0 known advisories, on the package and its dependencies;
4. every dependency was checked, and the OSV and deps.dev dependency data is present;
5. the package isn't deprecated, in this version or as a whole.

**Auto-reject happens in two cases:**

- **A fact rules the package out, whatever the AI says:** the whole package is deprecated (npm's latest version too), the version is listed as malicious, or it has its own CRITICAL advisory with no fixed version.
- **The AI says `AVOID`, and a weaker fact backs it up:** this version is deprecated, or it has its own high or critical advisory that no single upgrade fixes.

Everything else goes to a human.

## Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| Remote Services: `Unable to connect to gRPC server` | A typo in the host, or SSL is off |
| Remote Services: `Index 1 out of bounds for length 1` | The host is missing `:443` |
| gRPC task: `NOT_FOUND: version not found` | The package or version doesn't exist on npm. If you built your own gRPC task with **Populate from remote services**, replace its placeholder request (`SYSTEM_UNSPECIFIED`, empty strings) and pick the `v3` method |
| Saving: `must have required property 'inputParameters'` | Every task needs `inputParameters`, including FORK_JOIN, JOIN and DO_WHILE (`{}`). The provided file already has it |
| Saving: `taskReferenceName: … is not defined in workflow definition` or `input parameter value: … is not valid` | An INLINE script contains a dollar sign followed by a brace, for example in a JavaScript template literal. Conductor reads it as a workflow reference. Join strings with `+` instead |
| A task fails with `Task size … exceeds … limits configured for this cluster` | A task's input or output is over about 2 MB. The provided file shrinks each dependency page inside the page loop. If you changed the loop, keep `compact_dependency_page` and `keepLastN` |
| `human_review` fails immediately | The form name or version doesn't match `dependency_review_form` v1 |
| `assess_package` fails | Wrong integration or model name. GPT-5 models reject some sampling parameters, so don't add `temperature` or `maxTokens` |
| `record_decision_on_github` 401 / 403 / 404 | 401: secret name or value. 403: the token lacks Issues write. 404: wrong owner or repo (check `githubOwner` and `githubRepo`). Fix it, then **retry the parent run with "resume sub-workflow tasks"**, so `record_dependency_decision` continues from the failed call. Earlier results are kept |
| The parent fails at `assess_npm_package` or `record_dependency_decision` | Open that child's run (the sub-workflow task links to it) to see which task failed |
| A sub-workflow task fails straight away | The child workflow isn't saved, or its name doesn't match. Save the three children before the parent, with their names unchanged |
| `scan_npm_package` fails, but the run continues | Expected: the scan is optional. The assessment carries on without OSV and dependency data, lists them in `missingSources`, and goes to human review |
| A source branch shows `COMPLETED_WITH_ERRORS` | Expected behavior: sources are optional, and failures are listed in `missingSources`. If OSV or the dependency scan fails, the run goes to human review |
| `ask_deepwiki`: `stream was reset: INTERNAL_ERROR` | A temporary DeepWiki error. The run continues without its notes. See setup step 7 for automatic retries |
| Dependency lines say "fix details unavailable" | The OSV lookups for dependencies failed (check `lookup_dependency_advisories` in the `scan_npm_package` run), so severity and fixes are missing. `missingSources` lists "OSV.dev dependency advisory details (HTTP)" |
| `routeReasons` says "only N of M dependencies were checked" | A page of the dependency batch failed. Re-run the workflow |
| `missingSources` lists "npm latest version (HTTP)" | The npm registry call failed, so the workflow can't tell whether the whole package is deprecated. A deprecated version still goes to human review |
| `missingSources` lists "Hacker News (HTTP)" | The Hacker News search failed or timed out. It's information only, so nothing else changes |
| The page loop (in `scan_npm_package`) shows only 2 iterations | Expected: `keepLastN: 2` keeps only the last two, to stay under the size limit |

## Notes

- **Security community reports** are Hacker News stories matched by their titles. Each is marked as posted before or after this version's release; a story from before the release can't be about this version. They're unverified, may be about packages impersonating this one, and never change the route.
- **Dependency counts** are unique package versions. deps.dev's graph lists some versions more than once (once per install location), so its own totals can be higher.
- **Caching:** `cacheConfig` is set on most gRPC tasks (not the paged batch call), but cache hits haven't been confirmed on Developer Edition. Don't rely on them.
- **Token use:** the LLM step used about 6k tokens per run at `reasoningEffort: "medium"`, measured before the prompt gained severity guidance; expect somewhat more now. Setting it to `"low"` cut usage by more than half.
- **Optional: approval alerts.** To get notified when a review is waiting, add a HUMAN `taskTriggers` entry (`PENDING`) that starts a small notification workflow, such as an HTTP POST to ntfy.sh.
