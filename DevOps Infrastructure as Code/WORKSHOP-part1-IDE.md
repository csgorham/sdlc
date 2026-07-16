# IBM Bob Kick-Off Workshop - Infrastructure as Code with Bob | part 1
## Case Study: Production Web Platform (Terraform + Ansible + Docker on Ubuntu)

### Audience
DevOps / Platform / SRE engineers working with Terraform, Ansible, Docker and Linux servers.

### Goal of the Workshop
Demonstrate how **IBM Bob** can:
- Design production-grade infrastructure from a one-paragraph brief
- Generate **Terraform** and **Ansible** code that is modular, idempotent and secure
- Reason about drift, secrets, blast radius and compliance
- Produce architecture diagrams, runbooks and CI/CD wiring
- Evolve the platform: add monitoring, harden security, plan rollback

We target a **real Ubuntu Server reachable only over SSH** and deploy a multi-container web platform: **Traefik** reverse proxy + **Apache** web server + **Prometheus** + **Grafana** + **Loki**, fully provisioned and configured by code.

**Zero-public-port design.** All containers bind to `127.0.0.1` on the remote host. Web access from your laptop happens through **SSH local-forward tunnels** (`ssh -L`) opened by Bob Shell. Nothing in the cloud security group needs to change — only SSH must be reachable.

---

## Pre-flight (one-time, before the workshop)

### Local machine
- Bob IDE installed
- Terraform >= 1.6
- Ansible >= 2.15
- An SSH key already authorised on the target host

### Remote Ubuntu Server
- Ubuntu 22.04 LTS, reachable via SSH (key-based, no password)
- A user with **passwordless sudo** (Docker will be installed by Ansible if missing)
- **No extra inbound ports required** — only SSH. Web traffic is tunnelled from your laptop via `ssh -L`.

### Environment
```bash
export TARGET_HOST=<public-ip-or-dns>
export SSH_USER=<ssh-user>
export SSH_PORT=22                       # change if SSH listens on a non-default port
export SSH_KEY=~/.ssh/<your-key>.pem
ssh -i $SSH_KEY -p $SSH_PORT ${SSH_USER}@${TARGET_HOST} 'sudo -n true && echo ok'
```

### Validated test environment (used to author this lab)
A reference IBM Cloud VSI was used to validate every step:
- Host: `150.240.70.220`, SSH port `2223`, user `itzuser`
- Key: `pem_ibmcloudvsi_download.pem` (chmod 600)
- OS: Ubuntu 22.04.5 LTS, passwordless sudo, ufw inactive, Docker **not** pre-installed

```bash
export TARGET_HOST=150.240.70.220
export SSH_USER=itzuser
export SSH_PORT=2223
export SSH_KEY=./pem_ibmcloudvsi_download.pem
chmod 600 $SSH_KEY
ssh -i $SSH_KEY -p $SSH_PORT ${SSH_USER}@${TARGET_HOST} 'sudo -n true && echo ok'
```

---

## Workshop Flow Overview

1. Understand the goal and sketch the architecture
2. Generate the Terraform layer (Docker provider over SSH)
3. Generate the Ansible layer (host config + content)
4. Security & secrets review
5. Idempotency, lint and drift audit
6. Add the observability stack (Prometheus + Grafana + Loki)
7. Disaster recovery & rollback runbook
8. CI/CD pipeline integration

Each step builds on the previous one and mirrors how a platform team ships infrastructure changes in real projects.

---

## Step A - Understand the Goal & Sketch the Architecture

### Why this step?
Before writing a single line of HCL or YAML, we need an unambiguous picture of **what** we are building, **what depends on what** and **where the failure domains are**.

### Prompt
```bash 
We have a fresh Ubuntu 22.04 server reachable **only via SSH** at $TARGET_HOST:$SSH_PORT. No other inbound ports are open and the cloud security group cannot be changed. I want a production-grade containerized web platform deployed by code: Traefik 2 as the reverse proxy with access logs, an Apache 2.4 container serving a custom landing page, Prometheus for metrics, Grafana for dashboards (admin password from a variable). Every container must bind to 127.0.0.1 on the host (never 0.0.0.0) so the only way to reach them is through ssh -L tunnels from the operator's laptop. Everything runs on a private Docker network with named volumes and a healthcheck on every container. Describe the target architecture, the request flow from the operator browser through the SSH tunnel into the host loopback into Traefik into Apache, the data flow for metrics, and produce a Mermaid component diagram that explicitly shows the SSH tunnel boundary. Then list the variables, secrets and outputs we will need.
```

#### Enhance the prompt with Bob magic wand, and you should see something like this:
Analyze the requirement above and produce a complete platform design for a single-host, multi-container web stack on Ubuntu 22.04 that includes Traefik 2 as an L7 reverse proxy with structured access logs, restart-on-failure policy and Docker provider auto-discovery, an Apache 2.4 backend serving a Jinja-templated landing page, a Prometheus instance scraping Traefik, Apache and cAdvisor, a Grafana instance with a pre-provisioned datasource and a starter dashboard whose admin password is sourced from a Terraform variable, and a Docker user-defined bridge network isolating all containers with named volumes for Grafana, Prometheus and Traefik certs. Critical constraint: every published port MUST bind to the host loopback (`ip = "127.0.0.1"` in the docker provider `ports` block) — nothing on `0.0.0.0`. Operator access is exclusively via `ssh -L localPort:127.0.0.1:remotePort` tunnels from the laptop. Produce: (1) a Mermaid C4-style component diagram with a clearly labelled SSH-tunnel trust boundary between laptop and host, (2) the end-to-end request path browser -> ssh tunnel -> host loopback -> Traefik -> Apache, (3) the metrics scrape topology (all in-host loopback or container-network, never internet), (4) a complete table of Terraform variables (target_host, ssh_user, ssh_port, ssh_private_key_path, grafana_admin_password, traefik_local_port, grafana_local_port, prometheus_local_port, traefik_dashboard_local_port), Ansible group_vars and required secrets with owner and rotation policy, (5) the minimum SSH posture on the host (key-only, no password auth, optional MatchUser), and (6) the explicit non-goals and known limitations of a single-host, tunnel-only design (no public TLS, single SPOF, operator must be online to demo).

---

## Step B - Generate the Terraform Layer

### Why this step?
Terraform owns the infrastructure layer: networks, volumes, containers, ports. We want clean modules, a remote-state-ready layout and zero secrets in code.

### Prompt
Generate a Terraform layout under `infra/terraform/` using the kreuzwerker/docker provider configured against the remote Docker daemon over SSH (`ssh://${SSH_USER}@${TARGET_HOST}:${SSH_PORT}`, identity file from `var.ssh_private_key_path`, with ssh_opts `-i <key> -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o IdentitiesOnly=yes`). Create modules: `network`, `traefik`, `web`, `monitoring`. Each module owns its own resources and outputs. **Critical implementation rules**: (a) the root `versions.tf` AND every `modules/*/versions.tf` must declare `kreuzwerker/docker` in `required_providers` — without this, Terraform silently looks for the non-existent `hashicorp/docker` and init fails; (b) every container `ports` block MUST set `ip = "127.0.0.1"` so nothing is exposed to the public interface; (c) every container resource must include `lifecycle { ignore_changes = [log_opts, user, working_dir, command] }` because the Docker daemon's `daemon.json` log-opts and the image's `USER`/`WORKDIR` defaults appear as drift on every plan and trigger needless replacements; (d) for **Traefik specifically**, do NOT use the `docker` provider auto-discovery — modern Docker Engine (25+) requires API ≥1.40 but the Traefik docker client library starts at 1.24 and the daemon refuses the handshake. Instead use the **file provider** (`--providers.file.directory=/etc/traefik/dynamic --providers.file.watch=true`) with the routing config rendered by Ansible, mounted read-only. This is also better for the security review (no Docker socket exposure); (e) for the `web` module's container, set `init = true` so Docker injects `tini` as PID 1 — needed so the self-healing demo in Part 2 actually works (Linux protects PID 1 of a PID namespace from SIGKILL, so without `init=true` httpd-as-PID-1 cannot be crashed from inside the container). Use `terraform.tfvars.example` for inputs (target_host, ssh_user, ssh_port, ssh_private_key_path, grafana_admin_password, domain) and never hardcode secrets. Generate `outputs.tf` exposing the **localhost** URLs operators will hit through the SSH tunnel (e.g. `http://localhost:8080` for the app, `http://localhost:8081` for the Traefik dashboard, `http://localhost:3000` for Grafana, `http://localhost:9090` for Prometheus) plus a `tunnel_command` output that prints the exact one-line `ssh -fN -L ...` command. The code must pass `terraform fmt -check` and `terraform validate`. Include a short README with init/plan/apply commands.

---

## Step C - Generate the Ansible Layer

### Why this step?
Terraform stands up resources; Ansible configures the host and seeds the content (vhosts, dashboards, scrape configs, certs). We want roles, full idempotency and a single entrypoint.

### Prompt
Generate an Ansible layout under `infra/ansible/` with an inventory file `inventory.ini` (using `ansible_port`, `ansible_user` and `ansible_ssh_private_key_file` so any non-default SSH port is supported), a top-level `site.yml` and roles: `common` (kernel sysctls, journald limits — leave ufw alone, no public ports are used), `docker` (**install the Docker engine via the official apt repo if not present**, add the SSH user to the `docker` group, set log driver = json-file with rotation, configure a daily prune timer), `web_content` (render the Apache vhost and landing page from Jinja templates into a host bind-mount), `monitoring_content` (Prometheus scrape config, Grafana datasource provisioning and a starter dashboard JSON). Every task must be idempotent and tagged. Use an `ansible-vault`-friendly variable layout with `group_vars/all/vars.yml` and `group_vars/all/vault.yml`. Provide an `ansible-lint`-clean output and a one-liner to run the full playbook.

---

## Step D - Security & Secrets Review

### Why this step?
Most IaC incidents are not bugs in HCL - they are **leaked secrets**, **world-open ports**, **weak defaults** or **unscoped state files**.

### Prompt
Audit the generated Terraform and Ansible for: secrets in code or state, **any port bound to 0.0.0.0 instead of 127.0.0.1**, missing TLS for the SSH-tunnel-only operator path, weak Grafana defaults, container privilege escalation, exposed Docker socket without read-only mode, missing resource limits and missing log drivers. For each finding give severity (low/med/high), exploit scenario in one line and the minimal fix as a unified diff. Then propose a remote-state backend (S3+DynamoDB or equivalent) with state encryption and locking, and an `ansible-vault` strategy for the Grafana admin password.

---

## Step E - Idempotency, Lint & Drift Audit

### Why this step?
A platform that cannot be re-run safely is not a platform - it is a one-shot script.

### Prompt
Run a static review against `terraform fmt`, `terraform validate`, `tflint`, `ansible-lint` and `yamllint`. Fix every finding inline. Then walk through what `terraform plan` should report on a second run (must be no-op) and what `ansible-playbook --check --diff` should report (must be 0 changed). Highlight any resource where drift detection is weak (`null_resource`, `local-exec`, manually-created host files) and propose stronger alternatives.

---

## Step F - Add the Observability Stack

### Why this step?
You cannot operate what you cannot see. Adding **Prometheus + Grafana + Loki** turns this lab from a demo into a platform you can actually run.

### Prompt
Extend the `monitoring` Terraform module and the `monitoring_content` Ansible role to add Loki for log aggregation and Promtail as a Docker logs scraper. Pre-provision a Grafana dashboard that shows: Traefik request rate and 5xx ratio, Apache request rate, container CPU/memory and a Loki panel with the last 100 access log lines. Make Grafana persist its DB on a named volume. Update outputs to expose `grafana_url`, `prometheus_url` and `loki_url`.

---

## Step G - Disaster Recovery & Rollback

### Why this step?
DevOps maturity is measured by how fast you can recover, not how slow you fail.

### Prompt
Produce a runbook covering: (1) full rebuild from scratch on a brand-new Ubuntu host (with RTO/RPO assumptions), (2) selective container rollback when a new image is bad, (3) Grafana and Prometheus volume backup and restore using `docker run --rm -v` and `tar`, (4) what `terraform destroy` will and will not remove and the manual cleanup steps. Output as a single `RUNBOOK.md` with a "if you only read one page" TL;DR at the top.

---

## Step H - CI/CD Pipeline Integration

### Why this step?
IaC only delivers value when **every change** goes through review, plan and gated apply.

### Prompt
Generate a GitHub Actions workflow `.github/workflows/iac.yml` with three jobs: `validate` (fmt, validate, tflint, ansible-lint), `plan` (on PR, posts the terraform plan as a PR comment using a least-privilege token), and `apply` (on merge to main, requires environment approval). Add a matrix step that runs the playbook in `--check --diff` against a staging inventory. Add a `make ci-local` target that reproduces the same checks on a developer laptop.

---

## Wrap-up - what the audience just saw

In ~40 minutes an agent took us from a one-paragraph brief to:
- A documented architecture (with a diagram)
- Modular Terraform and Ansible code
- A security and drift review
- A full observability stack
- A disaster-recovery runbook
- A CI/CD pipeline

Everything is reproducible, reviewable, and can be diffed in a pull request. **And we have not yet deployed anything.** That is what Part 2 (Bob Shell) is for.
