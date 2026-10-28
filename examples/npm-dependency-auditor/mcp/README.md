# MCP Tools (Optional)

These files expose two of the workflows as [MCP](https://modelcontextprotocol.io/) tools through the [Orkes MCP Gateway](https://orkes.io/content/developer-guides/mcp-gateway), so AI agents can call them:

| Tool | Workflow | What it does |
| --- | --- | --- |
| `POST_assess` | `assess_npm_package` | A full review that combines every source (deps.dev, OSV.dev, npm, DeepWiki, Hacker News): LLM verdict, route and reasons, recommended version, brief. Takes 30–90 seconds and costs one LLM call. Can exceed the gateway's 60-second limit (see below) |
| `POST_scan` | `scan_npm_package` | Security facts only: advisories, severity and fixed versions for the package and its dependency tree, whether this version or the whole package is deprecated, and npm's latest version. A `warning` in the result means there was no data for that version (it may be too new for deps.dev, or may not exist), so the result doesn't mean the version is clean |

Both are read-only. To expose only one tool, delete the other's file from `routes/` before running the script.

**The gateway stops waiting after about 60 seconds.** A longer call fails with `HTTP 504 Gateway Time-out`, whatever client you use and whatever the route's timeout. `POST_assess` can take longer than that. Most of its time is the LLM's reasoning and the DeepWiki call (8–12 seconds); the scan itself takes 1–2 seconds for most packages, and 10–25 seconds for Strapi's 1,300 dependencies. At medium reasoning effort the LLM step took 14–52 seconds across 15 runs, even for a package with no advisories, so `assess_npm_package` uses low reasoning effort to stay under the limit. When a call times out, the assessment still completes, and its result is under **Executions → Workflow** in Conductor. Retrying starts another assessment, so check there first. `POST_scan` fits within the limit.

## Files

- `schemas/`: the tools' input schemas.
- `service.json`: the gateway service.
- `routes/`: one route per tool.
- `create-mcp-tools.sh`: creates all of the above through the Orkes API.

No file contains a key or a token.

## Setup

1. **Save the workflows** in `workflows/`, following the main README.
2. **Create the authentication setting** in the Conductor UI under **APIs → Authentication → + New authentication**:
   - **ID:** `npm-dependency-mcp-auth`. If you use another ID, change `authConfigId` in `service.json` to match.
   - **Authentication Type:** API Key. Copy the generated key.
   - **Application:** Default Orkes Application on Developer Edition. On other clusters, use an application with EXECUTE permission on `assess_npm_package` and `scan_npm_package`.
3. **Create an application access key** under **Access Control → Applications**: open an application, create an access key, and copy its Key ID and Key Secret. The script only uses them to call the Conductor API. If the script fails with HTTP 403, the application isn't allowed to create schemas or gateway services.
4. **Run the script:**
   ```bash
   CONDUCTOR_KEY_ID=<key id> CONDUCTOR_KEY_SECRET=<key secret> ./mcp/create-mcp-tools.sh
   ```
   It uses Developer Edition by default; set `CONDUCTOR_API` for another cluster (for example `https://<your-cluster>/api`). If a service with the same ID already exists, the script stops: delete that service, or change `id` and `path` in `service.json`.

You can also create everything in the UI instead, using these files for the values: paste each schema under **Definitions → Schema**, then create the service and its routes under **APIs → Services**.

## Use the Tools

- **Endpoint:** in **APIs → Services → npm-dependency-tools**, copy the **MCP Tool Remote Endpoint** (under Configuration). On Developer Edition it looks like `https://<cluster-id>.developer.orkescloud.com/npm-dependency-tools/mcp`.
- **Authentication:** clients send your key as `Authorization: Bearer <key>`.
- **From outside Conductor** (MCP Workbench, Claude Code, other agents): connect to the endpoint and call `POST_assess` for a full review, or `POST_scan` for security facts only.
- **From a Conductor workflow:** use `LIST_MCP_TOOLS` and `CALL_MCP_TOOL`, with the key stored as a Conductor secret. The tool's result is the workflow output as JSON text in `content[0].text`.
- **For assessments inside Conductor, prefer a sub-workflow:** a `SUB_WORKFLOW` task that runs `assess_npm_package` directly has no 60-second limit, needs no key, and links to the assessment's run. The example agent in [`examples/`](../examples/README.md) uses both: `POST_scan` through MCP to scan each version it considers, then `assess_npm_package` sub-workflows, in a dynamic fork, for the versions it accepts.

## Test with MCP Workbench

[MCP Workbench](https://www.mcp-workbench.ai/) is Orkes's browser-based MCP client. A saved connection keeps your key, so you only enter it once.

1. In **Connections**, select **+ Add**.
2. **URL:** the service's **MCP Tool Remote Endpoint**.
3. **Type:** **Streamable HTTP (Stateless)**.
4. **Authentication:** choose **OAuth / Bearer Token**, and paste the API key from your authentication setting into **Access Token**. Paste only the key: Workbench adds `Bearer ` itself. Leave the OAuth fields empty, and don't select **Authenticate**. This is not the application access key the script uses.
   - **Alternative:** leave Authentication on **None**, and enter `{"Authorization": "Bearer <key>"}` in **Custom Headers (JSON)**.
   - **Not this one:** **API Key** sends the key without `Bearer `, in an `X-API-Key` header by default, which the gateway doesn't accept.
5. Select **Save**, then **Connect**. `POST_assess` and `POST_scan` should be listed under **Select Tool**.
6. Choose `POST_assess`, enter `packageName` `axios` and `packageVersion` `1.20.0`, and select **Run Tool**. After about 30 seconds the result shows the workflow output as JSON text, including `"aiVerdict": "ADOPT"` and `"route": "AUTO_APPROVE"`.

Each call starts a real workflow run, which you can see under **Executions → Workflow**. A `POST_assess` call costs one LLM call.

**Calls over about 60 seconds fail** in Workbench (`MCP error -32001: Request timed out`), and at the gateway for every client (`HTTP 504`). The workflow keeps running: check its result under **Executions**. Retrying starts another run, so check there before trying again.

## Test with curl

curl has no 60-second limit. MCP requests are JSON-RPC messages posted to the endpoint:

```bash
curl -X POST --max-time 700 "<MCP Tool Remote Endpoint>" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <key>" \
  -d '{"jsonrpc": "2.0", "id": 1, "method": "tools/call",
       "params": {"name": "POST_assess", "arguments": {"packageName": "axios", "packageVersion": "1.20.0"}}}'
```

The answer's `result.content[0].text` holds the workflow output as JSON text. Use `"method": "tools/list"` (with no `params`) to list the tools. To keep the key out of your shell history, put it in a variable first, for example with `read -s`.
