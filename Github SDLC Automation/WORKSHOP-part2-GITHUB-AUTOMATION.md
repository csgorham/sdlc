# Bob GitHub SDLC Lab
## IBM Bob LAB - GitHub-Driven Application Evolution | part 2
### Case Study: Autonomous Enhancement Delivery for the Finance Dashboard

### Audience
Developers, DevOps teams, architects, and AI engineering champions who want to demonstrate how **IBM Bob** works with **GitHub.com** for code review, issue alignment, pull request support, and autonomous feature implementation.

### Goal of the Workshop
Demonstrate how **IBM Bob** can:
- inspect repository changes through Git tooling
- understand GitHub issue or pull request context
- implement requested application enhancements
- validate and review the resulting changes
- prepare the branch for merge-ready delivery

This workshop uses the finance dashboard application from part 1 and treats GitHub as the collaboration surface for ongoing product evolution.

---

## Lab Preparation - Setting Up Your GitHub Repository

### Prerequisites
Before starting this workshop, students must create and configure their own GitHub repository to practice Bob's GitHub integration features.

### Step 0 - Create Your GitHub Repository

#### Why this step?
Bob's GitHub integration requires a real GitHub repository to demonstrate pull request creation, issue tracking, and code review workflows. Students need their own repository to practice these capabilities.

#### Instructions

1. **Create a new repository on GitHub.com**
   - Go to https://github.com/new
   - Repository name: `finance-app` (or your preferred name)
   - Description: "IBM Bob Workshop - Finance Dashboard Application"
   - Visibility: Public or Private (your choice)
   - **Do NOT** initialize with README, .gitignore, or license (we'll push existing code)
   - Click "Create repository"

2. **Connect your local repository to GitHub**
   
   After completing Part 1 of the workshop, connect your local finance-app to GitHub:
   
   ```bash
   # Navigate to your finance-app directory
   cd /path/to/your/finance-app
   
   # Add GitHub remote (replace YOUR_USERNAME with your GitHub username)
   git remote add origin https://github.com/YOUR_USERNAME/finance-app.git
   
   # Verify remote was added
   git remote -v
   
   # Ensure you're on main branch
   git branch -M main
   
   # Push your code to GitHub
   git push -u origin main
   ```

3. **Verify GitHub repository setup**
   - Visit your repository on GitHub.com
   - Confirm all files from Part 1 are visible
   - Check that the GitHub Actions workflow appears in the "Actions" tab
   - Verify the Pull Request template is visible in `.github/PULL_REQUEST_TEMPLATE.md`

4. **Enable GitHub features**
   - Go to repository Settings → General
   - Ensure "Issues" is enabled (required for `/review --issue-coverage`)
   - Ensure "Pull Requests" is enabled
   - (Optional) Under "Branches", add branch protection rules for `main`

5. **Create a feature branch for the workshop**
   ```bash
   # Create and switch to a new feature branch
   git checkout -b feature/initial-finance-dashboard
   
   # Push the branch to GitHub
   git push -u origin feature/initial-finance-dashboard
   ```

6. **(Optional) Create a sample GitHub issue**
   
   To practice the `/review --issue-coverage` command:
   - Go to your repository's "Issues" tab
   - Click "New issue"
   - Title: "Add a graph for a user-selected company"
   - Body: Copy content from `docs/pr-feature-request-example.md`
   - Click "Submit new issue"
   - Note the issue number (e.g., #1) for later use

#### Verification Checklist
- [ ] GitHub repository created and accessible
- [ ] Local repository connected to GitHub remote
- [ ] Code pushed to GitHub successfully
- [ ] GitHub Actions workflow visible in Actions tab
- [ ] Issues and Pull Requests enabled
- [ ] Feature branch created and pushed
- [ ] (Optional) Sample issue created for testing

#### Troubleshooting

**Authentication Issues:**
- Use GitHub Personal Access Token (PAT) for HTTPS authentication
- Or configure SSH keys for SSH authentication
- See: https://docs.github.com/en/authentication

**Push Rejected:**
- Ensure you have write access to the repository
- Check if branch protection rules are blocking the push
- Verify remote URL is correct: `git remote -v`

---

## Workshop Flow Overview

1. Review the current repository state
2. Prepare the initial delivery for GitHub
3. Simulate or process a new feature request through GitHub
4. Let Bob implement the requested enhancement
5. Validate, review, and prepare the updated branch
6. Hand off for merge or automated closure

This mirrors a realistic agentic development flow where Bob operates as an engineering assistant inside a GitHub-centered process.

---

## Step A - Review the Current Repository State

### Why this step?
Before Bob acts on a GitHub request, it should understand:
- what files changed
- what the current branch contains
- whether the repository is in a clean state

### Prompt
```text
Inspect the current repository changes, summarize the current implementation status of the finance dashboard, and identify whether the project is ready to be committed and pushed to GitHub.
```

#### Bob capabilities involved
- git diff analysis
- repository inspection
- validation command support

---

## Step B - Prepare the Initial Delivery

### Why this step?
Good collaboration requires clean commits and understandable PRs.

### Prompt
```text
Generate a concise summary of the finance dashboard implementation, propose a commit message, and prepare a pull request description that explains the new application, dashboards, and validation steps.
```

#### Bob capabilities involved
- diff summarization
- PR description generation
- change review support

---

## Step C - Process a New GitHub Feature Request

### Why this step?
This is the heart of the lab.  
We want to demonstrate that Bob can take a repository enhancement request and convert it into implementation work.

A sample feature request for this lab is:
- add a new graph based on a user-indicated company
- allow the dashboard to accept a stock symbol or company selection
- render an additional comparison chart for the selected company

### Prompt
```text
Fetch the GitHub issue or review request for the next enhancement. Analyze the requested scope, explain the acceptance criteria, and identify the code areas that need to change in the finance dashboard to support a user-selected company graph.
```

#### Example expanded prompt
```text
Fetch the GitHub issue or pull request context requesting a new graph driven by a user-selected company. Analyze the requested enhancement, define the likely acceptance criteria, identify required UI, state, and data-service changes, and explain how to implement the feature without breaking the existing IBM-versus-competitor dashboards.
```

#### Bob capabilities involved
- GitHub issue integration
- scope analysis
- implementation planning from repository context

---

## Step D - Implement the Requested Enhancement

### Why this step?
This is where Bob turns GitHub collaboration into working code.

### Prompt
```text
Implement the requested feature so that the finance dashboard allows a user to indicate a company symbol and see a new graph for that company. Reuse the existing finance data layer where possible, keep the UX simple, and preserve the existing dashboards.
```

### Recommended feature shape
A practical implementation may include:
- input field or dropdown for ticker symbol
- validation for unsupported or empty symbols
- a new chart panel for the selected company
- loading and error states
- tests for the new state flow and rendering behavior

---

## Step E - Validate the Enhancement

### Why this step?
The GitHub story is incomplete unless the new change is validated.

### Prompt
```text
Run the appropriate project validation for the new user-selected company graph feature. Summarize what passed, what failed, and whether the branch is ready to push back to GitHub.
```

#### Bob capabilities involved
- local test execution
- failure diagnosis
- update verification

---

## Step F - Review and Push the Result

### Why this step?
A convincing lab should show how Bob helps finish the work, not just write code.

### Prompt
```text
Review the updated branch, summarize the feature implementation, generate a pull request update description, and provide the git commands needed to push the changes so the GitHub pull request can be completed.
```

#### Bob capabilities involved
- git diff analysis
- PR description generation
- git command preparation

---

## Step G - Close the Loop with GitHub

### Why this step?
The original objective describes a workflow where a new PR triggers Bob to solve the feature request and return the updated implementation.

In a realistic setup, the closure path usually looks like one of these:
1. Bob updates the PR branch with the requested code and tests  
2. Bob prepares the branch and PR notes for a maintainer to merge  
3. Another GitHub automation merges or closes the PR after validation  

### Prompt
```text
Summarize the completed enhancement, confirm the branch is ready, and describe the final GitHub action needed to merge or close the request.
```

---

## Example End-to-End Demo Narrative

A facilitator can present the following storyline:

1. The repository starts with the initial finance dashboard
2. A new GitHub request asks for "a graph for a user-selected company"
3. Bob reads the repository state
4. Bob fetches and analyzes the request
5. Bob updates the application
6. Bob runs tests
7. Bob reviews the diff
8. Bob prepares the push / PR summary
9. A human maintainer merges the PR, or a downstream automation closes it

This keeps the demo grounded in real engineering practice while still showing a strong autonomous workflow.

---

## Suggested GitHub Workflow Pattern

For the strongest lab story, combine Bob with:
- feature branches
- pull request templates
- CI validation
- optional issue templates
- a branch naming convention for AI-assisted work

Example:
- `feature/initial-finance-dashboard`
- `feature/user-selected-company-chart`
- `fix/chart-data-normalization`

---

## Suggested Acceptance Criteria for the Part 2 Feature

For the "user-indicated company graph" enhancement, the request is complete when:
- users can enter or select a company/ticker
- the app fetches or resolves data for that company
- a new graph is rendered without removing the existing dashboards
- invalid symbols produce a clear user-facing message
- tests or validation steps cover the new behavior

---

## Key Workshop Message

Part 2 demonstrates that **IBM Bob** is not only useful for initial code generation.  
It can also participate in the **GitHub delivery loop** by:
- understanding repository changes
- interpreting incoming enhancement requests
- implementing targeted features
- validating the result
- preparing the repository for merge-ready collaboration

---

## Complete SDLC Coverage with Bob + GitHub

This workshop demonstrates Bob's integration across the full Software Development Lifecycle (SDLC):

### 1. **Planning & Requirements** (SDLC: Requirements Analysis)
- **Step C**: Bob fetches and analyzes GitHub issues
- **Tool**: `fetch_github_issue` with `--issue-coverage` flag
- **Outcome**: Requirements understanding and acceptance criteria definition

### 2. **Design & Architecture** (SDLC: Design)
- **Step C**: Bob identifies code areas requiring changes
- **Capability**: Codebase analysis and impact assessment
- **Outcome**: Implementation plan without breaking existing features

### 3. **Implementation** (SDLC: Development)
- **Step D**: Bob implements the requested feature
- **Tools**: `write_to_file`, `apply_diff`, `insert_content`
- **Outcome**: Working code that satisfies requirements

### 4. **Testing & Quality Assurance** (SDLC: Testing)
- **Step E**: Bob runs validation and tests
- **Tool**: `execute_command` for `npm test`, `npm run build`
- **Outcome**: Verified functionality with passing tests

### 5. **Code Review** (SDLC: Quality Control)
- **Command**: `/review` or `/review --issue-coverage`
- **Tool**: `obtain_git_diff`, `submit_review_findings`
- **Outcome**: Identified bugs, security issues, and improvement opportunities

### 6. **Integration & Deployment Preparation** (SDLC: Integration)
- **Step F**: Bob prepares branch for merge
- **Tool**: `generate_description_from_diff`
- **Outcome**: Clean commits and comprehensive PR descriptions

### 7. **Release Management** (SDLC: Deployment)
- **Command**: `/create-pr`
- **Tool**: `create_pull_request`
- **Outcome**: Pull request ready for maintainer review and merge

### 8. **Continuous Integration** (SDLC: Automation)
- **GitHub Actions**: Automated validation on push/PR
- **Workflow**: `.github/workflows/finance-app-ci.yml`
- **Outcome**: Automated lint, test, and build verification

### 9. **Maintenance & Evolution** (SDLC: Maintenance)
- **Iterative**: Steps C-G repeat for new features
- **Capability**: Bob handles ongoing enhancements via GitHub issues
- **Outcome**: Continuous product evolution with AI assistance

### SDLC Benefits Demonstrated

**Traditional SDLC Pain Points Addressed:**
- ❌ Manual requirement analysis → ✅ Automated issue parsing
- ❌ Time-consuming code reviews → ✅ AI-powered review findings
- ❌ Manual PR description writing → ✅ Auto-generated descriptions
- ❌ Context switching between tools → ✅ Unified Bob interface
- ❌ Inconsistent code quality → ✅ Systematic review standards

**Complete Traceability:**
- GitHub Issue → Bob Analysis → Implementation → Tests → Review → PR → Merge
- Every change linked to requirements via issue numbers
- Full audit trail from request to deployment

**Collaboration Model:**
```
GitHub Issue Created
       ↓
Bob Fetches & Analyzes (/review #123 --issue-coverage)
       ↓
Bob Implements Feature
       ↓
Bob Runs Tests & Validation
       ↓
Bob Reviews Changes (/review)
       ↓
Bob Creates Pull Request (/create-pr)
       ↓
GitHub Actions CI/CD Validates
       ↓
Human Maintainer Reviews & Merges
       ↓
Feature Deployed
```

This workshop showcases how Bob integrates into modern SDLC practices, enhancing developer productivity while maintaining quality standards and traceability throughout the entire development lifecycle.

This is the core value proposition of Bob + GitHub integration for modern engineering teams.
