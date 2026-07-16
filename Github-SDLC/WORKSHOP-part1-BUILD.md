# Bob GitHub SDLC Lab
## IBM Bob LAB - Finance Dashboard Build and Validation | part 1
### Case Study: React Finance Dashboard using Yahoo Finance Data

### Audience
Developers, solution architects, AI engineering advocates, and platform teams who want to demonstrate how **IBM Bob** can build and validate a modern application from a GitHub repository.

### Goal of the Workshop
Demonstrate how **IBM Bob** can:
- Understand a GitHub-hosted project context
- Scaffold and evolve a React application
- Integrate external finance data for a realistic use case
- Build visual dashboards for multiple companies and time windows
- Add tests and validation steps
- Prepare the project for GitHub-based collaboration

We use a simple finance dashboard scenario for **IBM** and its major competitors as a realistic but approachable example.

---

## Workshop Flow Overview

1. Understand the repository and target outcome  
2. Create the application skeleton  
3. Integrate Yahoo Finance market data  
4. Build dashboard views for multiple time ranges  
5. Add validation and tests  
6. Review the diff and prepare for GitHub delivery  

Each step mirrors a realistic AI-assisted engineering workflow from idea to validated code.

---

## Step A - Understand the Repository and Goal

### Why this step?
Before generating code, Bob should understand:
- the repository structure
- the desired application scope
- the intended user workflow
- the GitHub delivery model

This step shows that Bob can frame a greenfield task in a structured engineering way rather than generating random code.

### Prompt
```text
Review this repository and propose a build plan for a small React finance dashboard application. The app should use Yahoo Finance data for IBM and up to four major competitors, and should provide dashboard views for current day, last 7 days, and last quarter. Explain the recommended project structure, data-fetching approach, UI sections, and testing strategy.
```

#### Enhance the prompt with Bob magic wand, and you should see something like this:
```text
Analyze this repository as the starting point for a new React-based finance analytics lab. Propose an implementation plan for a market dashboard application that tracks IBM and up to four competitors using Yahoo Finance data. The application should present three time-window views: current day, last 7 days, and last quarter. Recommend a practical architecture including source folders, React component boundaries, data service abstractions, charting approach, state management strategy, error handling, test strategy, and local validation steps. Also explain how the implementation should support later GitHub-driven feature evolution through issues and pull requests.
```

---

## Step B - Create the Application Skeleton

### Why this step?
A repeatable lab needs a clear project structure that Bob can generate consistently:
- app shell
- components
- services
- tests
- documentation
- scripts

### Prompt
```text
Create a simple React application structure for this repository. Include a dashboard page, reusable chart card components, a finance data service layer, and a clean folder layout suitable for future enhancements.
```

---

## Step C - Integrate Yahoo Finance Data

### Why this step?
The application should be realistic enough to demonstrate:
- API integration
- data normalization
- resilience to missing or partial data
- separation between data retrieval and UI rendering

### Prompt
```text
Implement a finance data layer for IBM and its main competitors using Yahoo Finance data. Normalize the returned data so the UI can display quote summaries, short-term history, and quarterly trend views. Keep the code easy to extend if more companies need to be added later.
```

---

## Step D - Build the Dashboards

### Why this step?
A compelling lab needs visible business value.  
This step demonstrates how Bob can translate requirements into a usable product.

### Prompt
```text
Build 2 to 3 dashboard views for the finance application:
- current day market summary
- last 7 days trend comparison
- last quarter comparison view

Include IBM and up to four competitors. Use charts and summary cards where appropriate. Keep the UI simple, readable, and demo-friendly.
```

---

## Step E - Add Validation and Tests

### Why this step?
AI-generated applications still need engineering discipline:
- linting
- unit tests
- render checks
- safe local verification

### Prompt
```text
Add appropriate validation for the finance dashboard project. Create tests for the data transformation logic and at least one UI rendering path. Provide commands to run the application checks locally and summarize what success should look like.
```

---

## Step F - Review the Changes Before GitHub Delivery

### Why this step?
A strong GitHub workflow requires that Bob not only writes code, but also:
- reviews what changed
- confirms scope
- prepares clean collaboration artifacts

### Prompt
```text
Review the uncommitted changes in this repository, summarize what was added for the finance dashboard, identify any missing pieces, and prepare a concise commit summary and pull request description for the initial application delivery.
```

---

## Suggested Demo Output for Part 1

By the end of part 1, the repository should contain:
- a React application scaffold
- a Yahoo Finance integration layer
- dashboards for IBM and competitors
- tests or validation commands
- a review-ready set of Git changes

---

## Engineering Notes

### Suggested companies
A simple default competitor set:
- IBM
- Microsoft
- Oracle
- SAP
- Salesforce

### Suggested metrics
The dashboards can emphasize:
- current price
- daily change
- 7-day relative movement
- quarter trend
- simple comparison ranking

### Suggested charts
Common choices:
- line chart for last 7 days
- line or area chart for quarter trend
- summary cards for current day values

### Practical implementation note
Yahoo Finance access can change over time.  
If direct browser-side calls are not reliable, Bob can instead:
- add a lightweight backend proxy
- mock or cache example data for the workshop
- keep the UI and transformation layers stable while swapping the data source implementation

---

## Key Workshop Message

Part 1 is not just "generate an app."  
It demonstrates that **IBM Bob** can:
- interpret a business request
- create a structured implementation plan
- produce a working codebase
- validate the result
- prepare the repository for collaborative GitHub workflows

That sets the foundation for part 2, where GitHub becomes the control surface for ongoing application evolution.
