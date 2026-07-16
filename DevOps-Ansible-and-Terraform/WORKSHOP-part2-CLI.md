# WORKSHOP - part 2 - SHELL
## IBM Bob Shell - 10-15 minutes, single-prompt deployment

This document is **Part 2** of the workshop: after using **Bob IDE** to design and generate everything in `WORKSHOP-part1-IDE.md`, you switch to **Bob Shell** and let **one prompt** actually deploy the whole platform onto the remote Ubuntu server, validate it end-to-end, and even break and self-heal it.

**Key idea:** The remote host has **no public web ports**. Every container binds to `127.0.0.1` on the server. The operator reaches everything through **SSH local-forward tunnels** opened by Bob Shell, hitting `http://localhost:<port>` on the laptop.

You use **one single prompt** that instructs the agent to:
1) ssh-check the remote host (custom port, key auth, passwordless sudo)
2) `ansible-playbook` to bootstrap the host (install Docker if missing, add user to `docker` group)
3) `terraform init` / `plan` / `apply` against the remote Docker socket over SSH
4) `ansible-playbook` again for content (vhosts, dashboards, scrape configs)
5) open the **SSH tunnels** for app/Traefik/Grafana/Prometheus
6) curl every `localhost:<port>` and confirm 200 / healthchecks
7) print the final **localhost URLs** the operator can open in a browser
8) run a 60-second self-healing demo (kill a container, watch it come back)

---

## Pre-flight (60 seconds)

### Assumptions
- You are in the project root that contains `infra/terraform/` and `infra/ansible/` (created in Part 1).
- You can SSH to the target host with passwordless sudo (Docker may or may not be installed yet — Ansible handles both).
- You have set:
  ```bash
  export TARGET_HOST=<public-ip-or-dns>
  export SSH_USER=<ssh-user>
  export SSH_PORT=22                       # change if SSH listens on a non-default port
  export SSH_KEY=~/.ssh/<your-key>.pem
  export TF_VAR_grafana_admin_password=<a-strong-password>
  ```

### Validated test environment
A reference IBM Cloud VSI was used to validate every step of this lab:
```bash
export TARGET_HOST=150.240.70.220
export SSH_USER=itzuser
export SSH_PORT=2223
export SSH_KEY=./pem_ibmcloudvsi_download.pem
export TF_VAR_grafana_admin_password='Workshop!2026'
chmod 600 $SSH_KEY
```
On this VSI the cloud security group only allows SSH (2223). Web access works exclusively via the SSH tunnels opened in step 5 of the prompt.

### Quick check commands (optional)
```bash
pwd
ls infra/
terraform -version
ansible --version
ssh -i $SSH_KEY -p $SSH_PORT -o BatchMode=yes -o ConnectTimeout=5 \
    ${SSH_USER}@${TARGET_HOST} 'sudo -n true && echo sudo-ok'
```

---

## The single prompt (copy/paste)

> Use this **exact** prompt in Bob Shell.
> If your CLI supports context attachment, attach the inventory using `@infra/ansible/inventory.ini`.

#### Simple Prompt

```text
Bootstrap the host (install Docker via Ansible if missing), then terraform apply in infra/terraform, then ansible-playbook infra/ansible/site.yml. Open SSH local-forward tunnels for app (8080->80), traefik dashboard (8081->8080), grafana (3000->3000) and prometheus (9090->9090) using $SSH_KEY on port $SSH_PORT, curl every localhost URL, then print them so I can open them in my browser.
```

#### Complex Prompt

```text
You are an agentic DevOps assistant operating inside this repository.

Goal: deploy and validate the full containerized web platform on a remote Ubuntu host that exposes ONLY SSH. All web access is via SSH local-forward tunnels from my laptop — no public ports are opened on the cloud side.

Context:
- Target host: ${TARGET_HOST}
- SSH user:    ${SSH_USER}
- SSH port:    ${SSH_PORT}
- SSH key:     ${SSH_KEY}    (already chmod 600)
- Terraform:   infra/terraform/
- Ansible:     infra/ansible/
- Inventory:   infra/ansible/inventory.ini

All ssh / scp / rsync calls MUST use `-i ${SSH_KEY} -p ${SSH_PORT}`.
All ansible calls MUST pass `--private-key ${SSH_KEY}` (do NOT rely on `ansible_ssh_private_key_file` in the inventory — relative paths there resolve from cwd, which breaks when ansible is invoked from the project root).
The Terraform docker provider host MUST be `ssh://${SSH_USER}@${TARGET_HOST}:${SSH_PORT}` with the same key (passed via `ssh_opts = ["-i", "<key>", "-o", "StrictHostKeyChecking=no", "-o", "UserKnownHostsFile=/dev/null", "-o", "IdentitiesOnly=yes"]`).

Required steps:

1) Pre-flight
   - `ssh -i ${SSH_KEY} -p ${SSH_PORT} ${SSH_USER}@${TARGET_HOST} 'sudo -n true'` must succeed.
   - Run `terraform fmt -check`, `terraform validate`, `ansible-lint`. Stop on any error.

2) Bootstrap (Ansible — host preparation)
   - cd infra/ansible
   - ansible-playbook -i inventory.ini site.yml --tags bootstrap
   - This must: install Docker engine if missing, add ${SSH_USER} to the docker group, refresh the SSH session group membership, configure log rotation.
   - Verify with: `ssh -i ${SSH_KEY} -p ${SSH_PORT} ${SSH_USER}@${TARGET_HOST} 'docker ps'`

3) Provision (Terraform)
   - cd infra/terraform
   - terraform init
   - terraform plan -out tfplan and summarise what will be created
   - terraform apply -auto-approve tfplan
   - Confirm every container `ports` block uses `ip = "127.0.0.1"`. Fail loudly if any is on 0.0.0.0.
   - Capture the outputs: traefik_remote_port, traefik_dashboard_remote_port, grafana_remote_port, prometheus_remote_port.

4) Configure (Ansible — content)
   - cd infra/ansible
   - ansible-playbook -i inventory.ini site.yml --tags content
   - Re-run with `--check --diff` and confirm 0 changed (idempotency proof).

5) Open SSH tunnels (in the background, from this laptop)
   - Start a single multiplexed ssh session that forwards:
       8080 -> 127.0.0.1:80           (app via Traefik)
       8081 -> 127.0.0.1:8080         (Traefik dashboard)
       3000 -> 127.0.0.1:3000         (Grafana)
       9090 -> 127.0.0.1:9090         (Prometheus)
   - Suggested command (write the PID to /tmp/lab-tunnel.pid so step 8 can kill it):
       ssh -i ${SSH_KEY} -p ${SSH_PORT} -fN -o ExitOnForwardFailure=yes \
           -L 8080:127.0.0.1:80 \
           -L 8081:127.0.0.1:8080 \
           -L 3000:127.0.0.1:3000 \
           -L 9090:127.0.0.1:9090 \
           ${SSH_USER}@${TARGET_HOST}
   - Wait up to 5 seconds for the forwards to be ready.

6) Validate (everything via localhost)
   - curl -fsS http://localhost:8080/             -> 200, body contains "Welcome"
   - curl -fsS http://localhost:8081/api/overview -> 200 (Traefik API)
   - curl -fsS http://localhost:3000/api/health   -> 200 (Grafana)
   - curl -fsS http://localhost:9090/-/healthy    -> 200 (Prometheus)
   - List the running containers on the remote host:
     `ssh -i ${SSH_KEY} -p ${SSH_PORT} ${SSH_USER}@${TARGET_HOST} \
         "docker ps --format '{{.Names}} {{.Status}} {{.Ports}}'"`
   - Confirm every published port is `127.0.0.1:<port>->...`, never `0.0.0.0:`.

7) Self-healing demo (60 seconds)
   IMPORTANT: do NOT use `docker stop` or `docker kill` from outside — Docker treats those as
   a deliberate user stop and `restart: always` will not fire. To prove real self-healing,
   crash the application process from INSIDE the container so the exit looks unexpected to
   the daemon. This requires `init = true` on the container (set in Part 1 Step B) so PID 1
   is `tini` and the application is PID 2+ — Linux protects PID 1 from SIGKILL inside its
   own PID namespace, so without tini, killing the in-container app from within is a no-op.

   - Capture before:  `ssh ... docker inspect apache_web -f '{{.State.StartedAt}} restartCount={{.RestartCount}}'`
   - Crash:           `ssh ... "docker exec apache_web sh -c 'kill -9 \$(pidof httpd | tr \" \" \"\\n\" | sort -n | head -1)'"`
   - Wait 8-12 seconds.
   - Capture after:   same inspect — `restartCount` must increment by 1 and `StartedAt` must be newer.
   - Re-curl http://localhost:8080/ — must return 200 again automatically.

8) Print the operator URLs and how to tear down
   - Print:
       App        : http://localhost:8080
       Traefik UI : http://localhost:8081
       Grafana    : http://localhost:3000   (admin / <masked>)
       Prometheus : http://localhost:9090
   - Print the kill command for the tunnel:
       kill $(cat /tmp/lab-tunnel.pid)   # or: pkill -f 'ssh.*-L 8080:127.0.0.1:80'

Constraints:
- Do NOT modify Terraform or Ansible code; only run it.
- Never echo TF_VAR_grafana_admin_password to stdout; mask it.
- If any step fails, stop and print the failing command, the last 30 lines of output, and the proposed remediation.
- Never bind any container to 0.0.0.0. The whole point of this lab is the tunnel-only access model.

Deliverables:
- Summarised bootstrap / plan / apply / play log
- Final localhost URLs the operator can open in a browser
- Idempotency proof (Ansible second run = 0 changed, terraform plan = no changes)
- Self-healing proof (container down -> back up automatically)
- Tear-down command for the SSH tunnel
```

---

## What you do live (2-3 minutes)

After Bob Shell finishes, the SSH tunnels are already up. Run these yourself to land the wow:

```bash
# Open the app in a browser (laptop -> ssh tunnel -> host loopback -> Traefik -> Apache)
open http://localhost:8080

# Open Grafana (admin / $TF_VAR_grafana_admin_password)
open http://localhost:3000

# Open the Traefik dashboard
open http://localhost:8081

# Re-prove idempotency
cd infra/terraform && terraform plan
cd ../ansible && ansible-playbook -i inventory.ini site.yml --check --diff

# Prove there is NO public port on the host (this is the security story)
ssh -i $SSH_KEY -p $SSH_PORT ${SSH_USER}@${TARGET_HOST} \
    "ss -tlnp | grep -E ':(80|3000|8080|9090)'"
# -> every line shows 127.0.0.1, never 0.0.0.0

# Tear down the tunnel when done
pkill -f 'ssh.*-L 8080:127.0.0.1:80'
```

# or:
```text
Re-run terraform plan and ansible-playbook in --check mode and confirm 0 changes. Then kill a random container on the remote and prove it self-heals. Finally show me that no port is bound to 0.0.0.0 on the host.
```

**What the audience should see:**
- A real landing page on **`http://localhost:8080`** — served from a container they cannot reach over the public internet
- A real Grafana dashboard on **`http://localhost:3000`** with live Prometheus + Loki data
- `terraform plan` returning **No changes**
- An apache container killed and **resurrected automatically** by the healthcheck/restart policy
- `ss -tlnp` on the host showing **only 127.0.0.1 bindings** — the security story is bulletproof

---

## Expected output shape (example)

```text
[1/8] Pre-flight
  SSH ok                itzuser@150.240.70.220:2223
  sudo -n true ok       passwordless sudo confirmed
  terraform fmt ok | terraform validate ok | ansible-lint ok

[2/8] Bootstrap (Ansible --tags bootstrap)
  PLAY RECAP
  webhost : ok=14 changed=8 unreachable=0 failed=0
  Docker installed: 24.0.7   |   itzuser added to docker group

[3/8] Terraform
  Plan: 11 to add, 0 to change, 0 to destroy
  Apply complete! Resources: 11 added.
  Bind audit:    every container -> 127.0.0.1   OK

[4/8] Configure (Ansible --tags content)
  PLAY RECAP
  webhost : ok=18 changed=11 unreachable=0 failed=0
  Re-run (--check): ok=18 changed=0     <- idempotent

[5/8] SSH tunnels
  ssh -fN -L 8080:127.0.0.1:80 -L 8081:127.0.0.1:8080 \
        -L 3000:127.0.0.1:3000 -L 9090:127.0.0.1:9090   started   pid 41273

[6/8] Validation
  GET http://localhost:8080/             200  (matched "Welcome")
  GET http://localhost:8081/api/overview 200
  GET http://localhost:3000/api/health   200
  GET http://localhost:9090/-/healthy    200
  Remote docker ps:
    traefik     Up (healthy)   127.0.0.1:80->80/tcp, 127.0.0.1:8080->8080/tcp
    apache_web  Up (healthy)
    prometheus  Up             127.0.0.1:9090->9090/tcp
    grafana     Up             127.0.0.1:3000->3000/tcp
    loki        Up
    promtail    Up
  Public-port audit: 0 containers bound to 0.0.0.0   OK

[7/8] Self-healing
  Before:               StartedAt=2026-05-04T20:46:37Z  restartCount=0
  Crashed httpd inside (kill -9 inside the tini-wrapped container)
  Waited 8s
  After:                StartedAt=2026-05-04T20:47:29Z  restartCount=1   <- Docker restarted it
  GET http://localhost:8080/   200  <- automatic recovery confirmed

[8/8] Operator URLs
  App        : http://localhost:8080
  Traefik UI : http://localhost:8081
  Grafana    : http://localhost:3000   (admin / ********)
  Prometheus : http://localhost:9090
  Tear down  : kill 41273
```

(Values depend on your host and the exact image tags.)

---

## Talk track (what to say while it runs)

- "In Part 1 we used **Bob IDE** to **design and generate** the whole platform. Nothing was deployed."
- "Now Bob Shell **bootstraps the host**, **provisions** with Terraform, **configures** with Ansible, and opens **SSH tunnels** so we can reach the stack."
- "Notice the cloud security group never changed — **only SSH is exposed**. Every container binds to 127.0.0.1. The internet cannot see this platform at all."
- "Watch the **idempotency proof** — that's the difference between a script and infrastructure."
- "And finally — we **kill a container** and the platform heals itself. No human, no ticket."

---

## Troubleshooting (quick fixes)

### `Error: Cannot connect to the Docker daemon`
- Verify `ssh -i $SSH_KEY -p $SSH_PORT ${SSH_USER}@${TARGET_HOST} docker ps` works directly.
- Confirm the Terraform docker provider host is `ssh://${SSH_USER}@${TARGET_HOST}:${SSH_PORT}`, with `ssh_opts = ["-i", "<key>"]` if your key isn't in `~/.ssh/`.

### `permission denied while connecting to the Docker socket`
- The bootstrap step must add the SSH user to the `docker` group AND **the SSH session must be re-established** to pick up the new group. Disconnect and reconnect (or have Ansible run `meta: reset_connection`).

### `Grafana: invalid username or password`
- Make sure `TF_VAR_grafana_admin_password` is exported in the **same shell** that ran terraform.

### `bind: Address already in use` when opening SSH tunnels
- Local ports 8080 / 3000 / 9090 are already taken on the laptop. Either kill the existing listener (`lsof -i :3000`) or change the local side of the forward (`-L 13000:127.0.0.1:3000` and open `http://localhost:13000`).

### `channel ... open failed: connect failed` when curling localhost
- Tunnel is up but the remote container isn't listening on 127.0.0.1 yet. Re-check `docker ps` and the `ip = "127.0.0.1"` setting in the Terraform `ports` block.

### `localhost:8080` works but `localhost:3000` doesn't
- Most often Grafana hasn't finished its first-boot migration. Wait 15-20s and re-curl. If it persists, check `ssh ... docker logs grafana`.

### Ansible `--check` reports unexpected `changed`
- Most common cause: a Jinja template uses non-deterministic data (timestamps, random ids). Pin them to variables.

### `terraform plan` keeps showing N to add / N to destroy on a re-run (not idempotent)
- Cause: the kreuzwerker/docker provider sees the daemon-injected `log_opts` (from `daemon.json`) and the image's `USER` / `WORKDIR` defaults as drift, and they `forces replacement`.
- Fix: every `docker_container` resource needs a `lifecycle { ignore_changes = [log_opts, user, working_dir, command] }` block. Re-apply once, then `plan` will be a clean no-op.

### Terraform init: `provider registry.terraform.io does not have a provider named registry.terraform.io/hashicorp/docker`
- Cause: a child module uses `docker_*` resources without declaring `kreuzwerker/docker` in its own `required_providers`. Terraform falls back to the implicit `hashicorp/docker` which doesn't exist.
- Fix: add a `versions.tf` to **every** module under `modules/` with the same `required_providers` block as the root.

### Traefik logs spam `client version 1.24 is too old. Minimum supported API version is 1.40`
- Cause: Traefik's docker-provider client library starts at API 1.24, modern Docker Engine (≥25) refuses that handshake. Setting `DOCKER_API_VERSION` env on the container does NOT fix it (the library doesn't honour it).
- Fix: do not use Traefik's docker auto-discovery on this host. Switch to the file provider with the routing rules rendered by Ansible into `/opt/lab/traefik/dynamic/routes.yml` and mounted read-only. Bonus: removes the need to expose the Docker socket — better for your security review.

### Self-heal demo doesn't work — `docker stop` / `docker kill` leaves the container Exited (137) and `restart: always` never fires
- Cause #1: `docker stop`/`docker kill` are treated as **deliberate user stops** by the daemon. `restart: always` is for unexpected exits only.
- Cause #2: even if you `docker exec apache_web kill -9 1` from inside, Linux protects PID 1 of a PID namespace from SIGKILL. Without `tini`, httpd-as-PID-1 is immune.
- Fix: set `init = true` on the container (Docker injects `tini` as PID 1, the app becomes PID 2). Then crash the app from inside: `docker exec apache_web sh -c 'kill -9 $(pidof httpd | tr " " "\n" | sort -n | head -1)'` — `tini` exits with the app's status, the daemon sees an unexpected crash, and `restart: always` brings the container back in ~5 seconds with `restartCount` incremented.

---

## Optional 60-second enhancement (if you have time)

Ask Bob Shell one more single-line task (only if time allows):
- "Add a chaos drill that stops a random container every 30 seconds for 2 minutes and report which ones recovered automatically."

This is a strong **resilience-as-code** closer that lands the message: *"the platform you saw built in 40 minutes is also self-defending."*
