# Example Agent: npm Upgrade Planner

`npm_upgrade_planner_agent.workflow.json` (version 4) is an AI agent built only from Conductor system tasks. Given a project's npm dependencies and a goal, it scans versions with the `POST_scan` MCP tool and asks an LLM to choose a version for each dependency, while code checks every choice against fixed rules. The workflow then runs a full assessment (`assess_npm_package`) of each accepted version, writes an upgrade plan from the assessments, and posts it as a GitHub issue.

## How It Works

1. **Find the scan tool:** `LIST_MCP_TOOLS` asks the MCP endpoint which tools exist. If it doesn't offer `POST_scan`, the output's `missingTools` says so.
2. **Plan in a loop, one action per iteration.** Code picks each action, not the LLM. Each iteration of a `DO_WHILE` runs four tasks:
   1. `next_action` (code) picks the action. If a version is queued, it scans it. If not, it reviews every choice against the rules below, then asks the LLM or stops.
   2. A `SWITCH` runs that action: `call_npm_tool` (`CALL_MCP_TOOL` with `POST_scan`) or `propose_versions` (the LLM).
   3. `record_result` (code) stores the scan, or checks the LLM's answer and queues the versions it adds.
   4. `save_state` keeps the planner's state in a workflow variable for the next iteration.

   The first iterations scan every current version, so the LLM is asked only once they're all scanned. It never reads the raw scans: it gets one status line per dependency, and answers with a version for each, for example:

   ```
   lodash 4.17.20: must change (own: 2 HIGH, fixed in 4.18.0). Choice: lodash@4.18.0, rejected: deprecated ("Bad release. Please use lodash@4.17.21 instead."). Candidates: lodash@4.18.1 (npm latest).
   ```

   The rules, all in code:
   - **A version is accepted** when its scan has data from deps.dev and OSV.dev, it isn't deprecated, its package isn't deprecated as a whole, and it has no HIGH or CRITICAL advisory of its own. Advisories in its dependencies don't block it, because the plan overrides them (step 4).
   - **Each current dependency gets a status** from its own scan: "must be replaced" (the whole package is deprecated, or a HIGH or CRITICAL advisory of its own has no fix), "must change", "couldn't be checked" or "acceptable as is". Only "must be replaced" allows another package.
   - **Answers are checked:** each choice needs an exact version, can't be a version already rejected, and can name another package only where that's allowed. An invalid or missing choice keeps the previous one, and the next status line says why.
   - **Each version is scanned once.** The candidates come from the scans: each scanned version's recommended upgrade, and npm's latest version unless it's deprecated. For a replacement package, npm's latest version is listed first, since there's no current version to stay close to.
   - **The loop stops** when every choice is accepted after at least one answer, after 3 answers, or when an answer brings nothing new to scan. A rejected choice then falls back to the dependency's last accepted choice, if it had one. The iteration cap, 4 per dependency plus 4, is above the worst case, so it only ends a run if something is broken.
3. **Assess:** `check_recommendations` turns the final choices into recommendations (keep, upgrade or replace), and a dynamic fork runs `assess_npm_package` on each accepted version, in parallel, as sub-workflows. An assessment adds what a scan doesn't cover: licenses, deprecation, build provenance, project health (OpenSSF Scorecard, downloads), DeepWiki and Hacker News, an AI verdict, and the routing rules that approve, reject or send a version to human review.

   A switch, `assess_if_needed`, guards the fork. If no choice was accepted, it skips the fork, so the run never starts a dynamic fork with no tasks, which might fail the whole run. The plan is still written, and says why each dependency wasn't assessed.
4. **Write the plan:** the workflow builds an overview table in code, one row per dependency, with the recommended action, its npm overrides and the assessment's verdict and route. The action says why the current version has to change when its scan shows it, e.g. "Replace with got@11.8.5 (request is deprecated and an advisory on request has no fix; needs code changes)". The workflow also decides whether the goal is reached, and shows it once, at the top of the plan: only if every dependency has a verified recommendation that was assessed, not rejected, and has nothing unresolved, meaning no HIGH or CRITICAL advisory of its own and none in a dependency without a fix. That's the planner's severity rule too. A recommended version's own MODERATE or LOW advisories are noted in its row, e.g. "Optional: its own advisories (1 MODERATE, 1 LOW) are fixed in 4.20.0". A version that only needs a reviewer's approval counts, once approved. Each assessment's full brief follows the table. An LLM writes only a short summary below the goal status, from the overview alone, and a final step keeps just its first paragraph, so the table appears once whatever the LLM writes.
5. **Post it:** the plan is posted as a GitHub issue, where GitHub renders it. This step is optional.

### Why Scans Go Through MCP but Assessments Don't

The MCP Gateway cuts off any tool call after about 60 seconds. A scan takes 1–25 seconds, so it fits. An assessment takes 30–90 seconds, mostly the LLM's reasoning, so many `POST_assess` calls would fail with HTTP 504 and come back empty, while the assessment carried on in Conductor. As a sub-workflow, an assessment has no time limit, and the agent already runs inside Conductor.

`POST_assess` stays available for MCP clients outside Conductor. See [`mcp/`](../mcp/README.md).

## Prerequisites

1. **The main setup** from the [repo README](../README.md#configuration-steps):
   - **Step 1:** the LLM integration (`OpenAi_Key` with `gpt-5-nano`).
   - **Step 2:** the `deps_dev` gRPC service.
   - **Steps 3–5, for the GitHub step:** a repo for the issues, a token with **Issues: Read and write** on it, the secret `github_orkes-dependency-review_token`, and the environment variables `dependency_review_github_owner` and `dependency_review_github_repo`. If you've already set up the main workflow, these exist, and the agent posts its plans to the same repo.
   - **Step 7:** the workflows `scan_npm_package` and `assess_npm_package`. The agent runs `assess_npm_package` directly. It doesn't need the User Form, `record_dependency_decision` or the parent.
2. **The MCP tools** from [`mcp/`](../mcp/README.md). The agent needs the `/scan` route (`POST_scan`).
3. **A secret** named `dependency_tools_key` (under **Definitions → Secrets**), holding the MCP Gateway API key from your authentication setting, without `Bearer `.

## Run

1. Under **Definitions → Workflow**, paste `npm_upgrade_planner_agent.workflow.json` in the **Code** tab and save.
2. In the **Run** tab, paste `npm_upgrade_planner_agent.sample-input.json`, and replace `mcpServerUrl` with your service's **MCP Tool Remote Endpoint** (**APIs → Services → your service → Configuration**). The input has:
   - `goal`: what you want, in plain English;
   - `dependencies`: package names and **exact** versions, e.g. `{"express": "4.17.1"}`. Ranges such as `^4.17.1`, as found in `package.json`, aren't supported: use the versions in your lockfile;
   - `mcpServerUrl`: the endpoint.
3. A run takes a few minutes: 1–2 for the scans, then the assessments, which run in parallel and take 30–90 seconds each. Its output has:
   - `plan`: the markdown plan: the goal status, a summary, the overview table, and each assessment's brief;
   - `recommendations`: one per current dependency, with the action, the version, whether it's verified, and its assessment;
   - `scanProblem`: empty, unless most scans failed or came back without data (see Limits);
   - `issueUrl`: the GitHub issue with the plan rendered;
   - `stoppedBecause`: why the planner stopped, e.g. "every choice is accepted";
   - `rounds` and `answers`: how many rounds the planner took, and how many times the LLM answered;
   - `stateText`: the planner's final state: every round's scans, the status lines the LLM read, and its answers;
   - `missingTools`: should be `[]`; otherwise the endpoint didn't offer `POST_scan`.

Each assessment is an `assess_npm_package` run under **Executions → Workflow**, linked to the agent run as a sub-workflow.

## Limits

- **The summary is written by an LLM and can be imprecise.** The goal status, the overview, the briefs' computed sections, `stateText` and `recommendations` are computed: check the summary against them.
- **Overrides follow a fixed rule:** every dependency of the recommended version with a HIGH or CRITICAL advisory is pinned to its fixed version, using the assessment's data. The overview marks an override "new major" when the fix crosses a major version, which may break the package that depends on it. A dependency with no fix is listed as unresolved.
- **An assessment checks the version as published,** without the npm overrides the plan suggests. So a recommendation that needs overrides usually goes to human review, for the dependency advisories the overrides fix.
- **The assessments run after the planner stops,** so it can't react to them. If an assessment rejects a recommended version, the plan says so, but the agent doesn't look for another.
- **The LLM answers at most 3 times.** A dependency with no accepted choice by then has no verified recommendation, and the plan gives the reason its choice was rejected.
- **Replacement packages come from the LLM's own knowledge.** The scan and the assessment check what it picks, but it may not pick the best replacement.
- **Scans run one at a time,** 1–25 seconds each: one per current dependency, plus one per new version the LLM proposes.
- **LLM calls:** 1–3 for the planner, one for the summary, and one per assessment (at most one per dependency).
- **Missing data is never counted as clean.** If deps.dev or OSV.dev doesn't answer, the scan marks that version's dependencies or advisories as "not checked", and the version is rejected. A version that doesn't exist looks the same, and so does a release from the last few hours that deps.dev hasn't resolved yet, so the reason names all three. If most scans failed or came back without data, a data source is probably failing: `scanProblem` says so, and so does a warning at the top of the GitHub issue. Check the `deps_dev` Remote Service and the run's `scan_npm_package` executions.
- **Failed tool calls are retried** twice, 5 seconds apart, through an inline task definition on `call_npm_tool`. This hasn't yet been tested on a real failure.
- **Each run files a new GitHub issue.** To skip it, remove the `post_plan_to_github` task.
