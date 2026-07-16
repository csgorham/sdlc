# DevOps Workshop - IaC with Bob (Ansible + Terraform on Ubuntu)

Companion code for [`WORKSHOP-part1-IDE.md`](WORKSHOP-part1-IDE.md) and [`WORKSHOP-part2-CLI.md`](WORKSHOP-part2-CLI.md).

Deploys Traefik + Apache + Prometheus + Grafana on a remote Ubuntu host with **zero public ports** - every container binds to `127.0.0.1`, and the operator reaches them through SSH local-forward tunnels.

## Architecture

```mermaid
flowchart LR
  subgraph laptop["Operator laptop"]
    direction TB
    browser["Browser<br/>http://localhost:8080 / 8081 / 3000 / 9090"]
    sshc["ssh -fN -L 8080..9090<br/>→ host loopback"]
    browser --> sshc
  end

  subgraph cloud["Cloud security group"]
    direction TB
    note["only TCP 2223 (SSH) open inbound<br/>NO 80 / 443 / 3000 / 8080 / 9090"]
  end

  sshc -. "encrypted SSH tunnel<br/>over port 2223" .-> sshd

  subgraph host["Ubuntu host (Docker engine, installed by Ansible)"]
    direction TB
    sshd["sshd :2223"]
    subgraph loop["host loopback 127.0.0.1"]
      direction LR
      p80[":80 → traefik"]
      p8080[":8080 → traefik dash"]
      p3000[":3000 → grafana"]
      p9090[":9090 → prometheus"]
    end

    subgraph docker["docker network: lab_net (private bridge)"]
      direction TB
      traefik["traefik v3.1<br/>file provider · /metrics<br/>healthchecked"]
      apache["apache_web (httpd:2.4-alpine)<br/>init=true (tini PID 1)<br/>healthchecked"]
      prometheus["prometheus<br/>scrapes traefik:8080/metrics"]
      grafana["grafana<br/>provisioned dashboard + datasource"]
    end

    sshd --> loop
    p80 --> traefik
    p8080 --> traefik
    p3000 --> grafana
    p9090 --> prometheus
    traefik -- "/" --> apache
    prometheus -- scrape --> traefik
    grafana -- query --> prometheus
  end

  classDef tunnel fill:#1e293b,stroke:#fbbf24,color:#f1f5f9,stroke-width:2px
  classDef priv fill:#0f172a,stroke:#22c55e,color:#e2e8f0
  class sshc,sshd tunnel
  class loop,docker priv
```

**Provisioning order:**
1. **Ansible bootstrap** - installs Docker engine, adds the SSH user to the `docker` group, sets log rotation
2. **Ansible content** - renders Apache page, Traefik dynamic routes, Prometheus scrape config, Grafana datasource + dashboard into `/opt/lab/` on the host
3. **Terraform** - creates the bridge network, the four containers (each binding only to `127.0.0.1`) and the named volumes
4. **`tunnel.sh up`** - opens the four `ssh -L` forwards from the laptop to host loopback

## Quick start (using the provided IBM Cloud VSI)

```bash
export TF_VAR_grafana_admin_password='Workshop!2026'
make deploy            # bootstrap docker -> terraform apply -> ansible content -> tunnels -> curl
open http://localhost:8080      # the app
open http://localhost:3000      # grafana (admin / $TF_VAR_grafana_admin_password)
open http://localhost:8081      # traefik dashboard
make idempotency       # prove TF = no-op and Ansible --check = 0 changed
make self-heal         # kill apache_web on the host, watch it come back
make clean             # tear down tunnels and infra
```

## Overriding the target

The Makefile defaults to the IBM Cloud VSI used to validate this lab. To target a different host:

```bash
make TARGET_HOST=10.0.0.5 SSH_USER=ubuntu SSH_PORT=22 SSH_KEY=~/.ssh/my.pem deploy
```

## Layout

```
infra/
├── ansible/
│   ├── ansible.cfg
│   ├── inventory.ini
│   ├── group_vars/all.yml
│   ├── site.yml
│   └── roles/{common,docker,web_content,monitoring_content}/
└── terraform/
    ├── versions.tf  variables.tf  main.tf  outputs.tf
    └── modules/{network,traefik,web,monitoring}/
tunnel.sh              # open / close SSH local-forward tunnels
Makefile               # deploy / validate / self-heal / clean wrappers
pem_ibmcloudvsi_download.pem   # SSH key (chmod 600)
```

## Prerequisites on the laptop

- `terraform` >= 1.6
- `ansible` >= 2.15
- `ssh`, `curl`, GNU `make`
- The pem file at `pem_ibmcloudvsi_download.pem` (already present), `chmod 600`
