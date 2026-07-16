# IBM Bob GitHub SDLC Lab

This lab demonstrates how to use **IBM Bob** together with **GitHub.com** to build, test, review, and evolve a small finance analytics application with an end-to-end agentic workflow.

The scenario uses a simple React-based market dashboard application that:
- pulls market data for **IBM** and up to 4 competitors
- shows views for **current day**, **last 7 days**, and **last quarter**
- is validated locally before code is committed and pushed
- is extended through GitHub pull requests that Bob can interpret and implement

---

## Lab Goals

By the end of this lab, participants should understand how IBM Bob can help with:

1. **Code generation**
   - Scaffold a new application
   - Implement dashboards and data integrations
   - Add tests and documentation

2. **Local engineering workflow**
   - Inspect the repository
   - run tests
   - review changes
   - prepare commits

3. **GitHub workflow integration**
   - analyze Git diffs
   - generate PR descriptions
   - align code changes to GitHub issues or PR requests
   - support PR-driven feature delivery

4. **Autonomous change handling**
   - interpret a requested enhancement from GitHub
   - implement a new feature branch
   - validate the change
   - push the update back to the repository for review and merge

---

## Reference Style

This repository contains a reference folder with an example workshop style.  
This new lab follows the same approach:
- clear workshop framing
- step-by-step exercises
- concrete prompts to use with Bob
- focus on realistic engineering outcomes

---

## Lab Contents

- `WORKSHOP-part1-BUILD.md` — Build the finance dashboard application with Bob
- `WORKSHOP-part2-GITHUB-AUTOMATION.md` — Use Bob with GitHub issues, branches, PRs, and review automation
- `.github/workflows/finance-app-ci.yml` — Example CI workflow for the finance app
- `.github/PULL_REQUEST_TEMPLATE.md` — Example pull request template for human + Bob collaboration
- `docs/pr-feature-request-example.md` — Example PR/request scenario for autonomous feature implementation

---

## Target Demo Scenario

### Application
A React application that presents finance dashboards for:
- IBM
- Microsoft
- Oracle
- SAP
- Salesforce

The dashboards should cover:
- **current day**
- **last 7 days**
- **last quarter**

Example data source:
- Yahoo Finance, typically through a public npm package such as `yahoo-finance2`, or via a backend proxy if needed

### Operational Flow
1. Bob creates the application structure
2. Bob implements finance data retrieval and dashboard views
3. Bob adds or updates tests
4. Bob validates the project locally
5. Bob reviews the diff
6. Bob helps create commit and PR content
7. A new GitHub PR requests a feature such as:
   - “add a graph for a user-selected company”
8. Bob fetches the request context, implements the feature, tests it, and pushes the branch updates

---

## Important Practical Note

Bob can:
- inspect code
- modify files
- run tests and commands
- analyze diffs
- fetch GitHub issue context
- generate PR descriptions
- help prepare and push branch changes using git commands

Bob typically does **not** directly merge or close PRs through GitHub UI APIs unless a dedicated integration or slash-command path is available in the environment.

Therefore, in this lab, “close the PR” should be understood as one of these realistic outcomes:
- Bob pushes the requested implementation to the PR branch so the PR is ready to merge
- Bob creates the branch, commit, and PR description for a maintainer to merge
- optionally, the maintainer or an external automation closes/merges the PR after validation

---

## Suggested Audience

- Developer advocates
- Solution architects
- Engineering leads
- AI-assisted development champions
- DevOps / platform teams exploring agentic workflows with GitHub

---

## Suggested Lab Duration

- Part 1: 30–45 minutes
- Part 2: 30–45 minutes

---

## Expected Takeaways

Participants should leave with a practical understanding of:
- how Bob accelerates initial application delivery
- how Bob fits into a Git-based workflow
- how Bob can process feature requests coming from GitHub
- how to structure a realistic “AI engineer in the loop” lab for demonstrations and workshops

---

## Related Reference

See the existing reference materials in [Git Platform Operations Guide](https://github.ibm.com/ClientEngineering/bob/blob/main/GitOps/README.md).
