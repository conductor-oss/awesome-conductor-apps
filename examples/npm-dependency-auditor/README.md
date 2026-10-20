# Dependency Adoption Review

Orkes Conductor workflows that determine if a particular NPM package is "safe" to use
at a specified version number.

Evidence is gathered from deps.dev (via gRPC), OSV.dev (HTTP), npm (HTTP), Hacker News (HTTP), and DeepWiki (MCP).
Then an LLM is used to deliver a final verdict based on this evidence.
Fixed rules then approve, reject, or hand the decision to a person - any outcome is filed as a GitHub issue for historical tracking.
There are no workers to deploy or SDKs to install since everything runs as Conductor system tasks.

## Technical Overview

### Workflow Structure

```shell
dependency_adoption_review
├─ assess_npm_package
│   └─ scan_npm_package
└─ record_dependency_decision
```

- **`dependency_adoption_review`** is the parent, and the one you run. It runs `assess_npm_package`, then passes the result to `record_dependency_decision`.
- **`assess_npm_package`** decides the route. It gathers the evidence in parallel, asks the LLM for a verdict, applies the routing rules, and writes the brief that the reviewer and the GitHub issue show. It's read-only.
- **`scan_npm_package`** is the security scan that `assess_npm_package` runs. It finds the package's own advisories, then checks every dependency in its tree, with the severity and fixed version of each advisory. It reports facts only, with no LLM.
- **`record_dependency_decision`** acts on the route. It approves or rejects automatically, or waits for a person to decide in a form, then files the GitHub issue.

You can also run `assess_npm_package` or `scan_npm_package` on their own, with just `packageName` and `packageVersion`, to get a verdict or the security facts without filing an issue.

### Outcomes

- **Auto-approved** only if the AI says ADOPT, there are no known advisories, every license is allowed, every dependency was checked, and the package isn't deprecated.
- **Auto-rejected** if the whole package is deprecated, it's flagged as malicious, or it has a critical advisory with no fix. It's also rejected if the AI says AVOID and a weaker fact backs it up.
- **Everything else** goes to a person for human-in-the-loop (HITL) approval.

## Setup

### Prerequisites

- An Orkes Conductor cluster - the free [Developer Edition](https://developer.orkescloud.com/) works!
- An OpenAI API key.
- A GitHub account.

### Conductor UI

1. **LLM:** under **Integrations**, add an OpenAI integration named `OpenAi_Key` and enable the model `gpt-5-nano`.
2. **gRPC service:** under **Definitions → Remote Services**, add a gRPC service named `deps_dev` with host `api.deps.dev:443` (include the port), port `443` and SSL on. Then select **Discover methods**.
3. **GitHub:** create a private repo for the decision records, with Issues enabled. Then create a fine-grained token for that repo only, with **Issues: Read and write**.
4. **Secret:** under **Definitions → Secrets**, add `github_orkes-dependency-review_token` with the token as its value.
5. **Environment variables:** under **Definitions → Environment Variables**, add two Plain Text variables:
   - `dependency_review_github_owner`: the repo's owner;
   - `dependency_review_github_repo`: the repo's name.
6. **User Form:** under **Definitions → User Forms**, paste `dependency_review_user_form.json` in the JSON view, and save it as `dependency_review_form`, version 1.
7. **Workflows:** under **Definitions → Workflow**, save each file from `workflows/` in this order, children first: `scan_npm_package`, `assess_npm_package`, `record_dependency_decision`, then `dependency_adoption_review`.

**If you use different names in steps 1–6, update the matching references in the workflow JSON before saving.**

## Running

Each file in `sample-inputs/` shows a different route:

| Sample input                                                 | Expected route                                                                |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| `human-review-licenses-and-advisories.json` (express@4.17.1) | Human review: known advisories, and 3 licenses outside the MIT-only allowlist |
| `auto-approve-no-advisories.json` (axios@1.20.0)             | Auto-approve, if the AI says ADOPT                                            |
| `auto-reject-deprecated-package.json` (request@2.88.2)       | Auto-reject: the package is deprecated                                        |
| `stress-test-many-dependencies.json` (@strapi/strapi@5.58.0) | Human review, after checking 1,300+ dependencies                              |

`allowedLicenses` is optional. Leave it out to accept any recognized license, or pass a list such as `["MIT", "ISC"]`.

1. Open `dependency_adoption_review`, go to the **Run** tab, and paste an input from `sample-inputs/`.
2. If the route is `HUMAN_REVIEW`, go to **Executions → Human Tasks**, claim **Dependency review**, and choose APPROVE or REJECT.
3. The output's `issueUrl` links to the new GitHub issue. `routeReasons` and `rejectReasons` explain the route.

## Troubleshooting

| Problem                                                         | Fix                                                                                                                                                          |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Remote Services can't connect, or shows `Index 1 out of bounds` | Use the host `api.deps.dev:443`, with SSL on                                                                                                                 |
| `NOT_FOUND: version not found`                                  | The package version doesn't exist on npm                                                                                                                     |
| A sub-workflow task fails immediately                           | Save the three child workflows before the parent, with their names unchanged                                                                                 |
| `human_review` fails                                            | The form must be named `dependency_review_form`, version 1                                                                                                   |
| GitHub returns 401, 403 or 404                                  | 401: check the secret. 403: the token needs Issues write. 404: check the two environment variables. Then retry the parent with **resume sub-workflow tasks** |
| A source shows `COMPLETED_WITH_ERRORS`                          | Sources are optional, so the run continues and lists the failure in `missingSources`. Missing security data sends the run to a person                        |
