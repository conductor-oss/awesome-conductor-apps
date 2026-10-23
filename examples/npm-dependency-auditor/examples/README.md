# Example Agent: npm Upgrade Planner

`npm_upgrade_planner_agent.workflow.json` is an AI agent built only from Conductor system tasks. Given a project's npm dependencies and a goal, the LLM decides which package versions to check with the `POST_scan` MCP tool, then writes an upgrade plan and posts it as a GitHub issue.

## How It Works

1. **Find the tools:** `LIST_MCP_TOOLS` asks the MCP endpoint which tools exist, and the workflow keeps only `POST_scan`.
2. **Loop, at most 10 steps:**
   1. The LLM chooses the next scan, or decides to finish.
   2. The workflow checks the choice before anything runs. The tool must be allowed, the version must be exact, a call can't be repeated, and the agent can't finish until every current dependency has been scanned.
   3. `CALL_MCP_TOOL` runs the scan.
   4. A short summary of the result is added to a ledger, which the LLM reads at the next step.
3. **Write the plan:** the LLM writes a markdown plan from the ledger only.
4. **Post it:** the plan is posted as a GitHub issue, where GitHub renders it. This step is optional.

The agent uses only `POST_scan`. An assessment (`POST_assess`) can take over a minute, and the gateway cuts calls off at about 60 seconds.

## Prerequisites

1. **The main setup** from the [repo README](../README.md#configuration-steps):
   - **Step 1:** the LLM integration (`OpenAi_Key` with `gpt-5-nano`).
   - **Steps 3–5, for the GitHub step:** a repo for the issues, a token with **Issues: Read and write** on it, the secret `github_orkes-dependency-review_token`, and the environment variables `dependency_review_github_owner` and `dependency_review_github_repo`. If you've already set up the main workflow, these exist, and the agent posts its plans to the same repo.
2. **The MCP tools** from [`mcp/`](../mcp/README.md). The agent needs the `/scan` route (`POST_scan`).
3. **A secret** named `dependency_tools_key` (under **Definitions → Secrets**), holding the MCP Gateway API key from your authentication setting, without `Bearer `.

## Run

1. Under **Definitions → Workflow**, paste `npm_upgrade_planner_agent.workflow.json` in the **Code** tab and save.
2. In the **Run** tab, paste `npm_upgrade_planner_agent.sample-input.json`, and replace `mcpServerUrl` with your service's **MCP Tool Remote Endpoint** (**APIs → Services → your service → Configuration**). The input has:
   - `goal`: what you want, in plain English;
   - `dependencies`: package names and **exact** versions, e.g. `{"express": "4.17.1"}`. Ranges such as `^4.17.1`, as found in `package.json`, aren't supported: use the versions in your lockfile;
   - `mcpServerUrl`: the endpoint.
3. A run takes 1–2 minutes. Its output has:
   - `plan`: the markdown upgrade plan;
   - `issueUrl`: the GitHub issue with the plan rendered;
   - `ledgerText`: every step and its result;
   - `steps`: the number of steps taken;
   - `missingTools`: allowed tools the endpoint didn't offer, which should be `[]`.

## Limits

- **The plan is written by an LLM and can be imprecise.** The ledger is exact: check each recommendation against it.
- **A version that doesn't exist** comes back from `POST_scan` with a `warning`, and the agent treats it as unverified, never as clean.
- **Failed tool calls are retried** twice, 5 seconds apart, through an inline task definition on `call_npm_tool`. This hasn't yet been tested on a real failure.
- **Each run files a new GitHub issue.** To skip it, remove the `post_plan_to_github` task.
