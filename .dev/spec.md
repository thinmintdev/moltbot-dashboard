# Moltbot Homelab Infrastructure Automation

## Implementation Specification for AI-Driven Development

**Document Purpose:** Technical specification for extending moltbot to monitor, control, and self-heal homelab infrastructure. Feed this document to Claude or claude-flow as context for development.

**Environment:** Self-hosted homelab with Proxmox VE, Docker containers, Tailscale mesh VPN

---

## Infrastructure Context

### Network Topology (Tailscale IPs)

| Host | Tailscale IP | Role |
|------|-------------|------|
| Dev VM | 100.104.67.12 | Gitea, code-server, databases, NFS storage |
| Infra VM | 100.112.252.61 | Traefik, AdGuard Home, Homepage, Uptime Kuma |
| AI VM | 100.73.167.86 | Open WebUI, LiteLLM, RagFlow, MCP servers |
| Windows Desktop | 100.100.132.101 | llama-swap GPU inference, Adobe CC |
| Proxmox Host | 100.75.100.113 | Hypervisor management |

### Key Technical Details

- **Traefik entrypoint:** Named `https` (not `websecure`)
- **DNS:** AdGuard Home on Infra VM as primary
- **SSL:** Cloudflare DNS challenges via Traefik
- **Storage:** ZFS pools on Proxmox with NFS exports

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        MOLTBOT AGENT                            │
│  (Running on AI VM - coordinates all infrastructure operations) │
└─────────────────────────────────────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  MCP SERVERS    │  │   MONITORING    │  │   AUTOMATION    │
│  (Tool Access)  │  │   (Detection)   │  │   (Response)    │
├─────────────────┤  ├─────────────────┤  ├─────────────────┤
│ • ProxmoxMCP+   │  │ • Uptime Kuma   │  │ • n8n Workflows │
│ • homelab-mcp   │  │ • Prometheus    │  │ • Webhook Hooks │
│ • SSH Orch.     │  │ • Netdata       │  │ • Human-in-Loop │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

---

## Phase 1: MCP Server Deployment

Deploy MCP servers on AI VM (100.73.167.86) for infrastructure control.

### 1.1 ProxmoxMCP-Plus (VM/Container Management)

**Repository:** https://github.com/RekklesNA/ProxmoxMCP-Plus

**Docker Compose** (`/opt/mcp-servers/proxmox/docker-compose.yml`):

```yaml
services:
  proxmox-mcp:
    image: proxmox-mcp-api:latest
    build: .
    container_name: proxmox-mcp
    restart: unless-stopped
    ports:
      - "8811:8811"
    volumes:
      - ./proxmox-config:/app/proxmox-config:ro
    networks:
      - mcp-network

networks:
  mcp-network:
    external: true
```

**Configuration** (`proxmox-config/config.json`):

```json
{
  "proxmox": {
    "host": "100.75.100.113",
    "port": 8006,
    "verify_ssl": false,
    "service": "PVE"
  },
  "auth": {
    "user": "moltbot@pve",
    "token_name": "moltbot-mcp",
    "token_value": "YOUR_TOKEN_VALUE"
  },
  "logging": {
    "level": "INFO",
    "file": "proxmox_mcp.log"
  }
}
```

**Proxmox API Token Setup:**

```bash
# On Proxmox host - create dedicated user and token
pveum user add moltbot@pve
pveum aclmod / -user moltbot@pve -role PVEAdmin
pveum user token add moltbot@pve moltbot-mcp --privsep=0
# Save the token value securely
```

**Available Tools:**
- `list_nodes` - Cluster nodes with status/resources
- `list_vms` - All VMs/containers with uptime/CPU/memory
- `get_vm_status` - Detailed VM metrics
- `start_vm`, `stop_vm`, `shutdown_vm`, `reboot_vm` - VM lifecycle
- `create_vm` - Create new VMs (advanced)
- `get_storage` - Storage pools and usage
- `get_cluster_status` - Overall cluster health

### 1.2 Homelab-MCP (Unified 7-in-1 Server)

**Repository:** https://github.com/bjeans/homelab-mcp

**Docker Compose** (`/opt/mcp-servers/homelab/docker-compose.yml`):

```yaml
services:
  homelab-mcp:
    image: bjeans/homelab-mcp:latest
    container_name: homelab-mcp
    restart: unless-stopped
    network_mode: host  # Required for network scanning
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./ansible_hosts.yml:/config/ansible_hosts.yml:ro
    environment:
      - OLLAMA_HOST=http://100.100.132.101:11434  # Windows llama-swap
      - PIHOLE_URL=http://100.112.252.61:80  # AdGuard (if using Pi-hole API compat)
```

**Capabilities:**
- Docker/Podman container monitoring and control
- Ollama model management
- Network ping/connectivity testing
- Ansible inventory integration
- Pi-hole/AdGuard monitoring (if API compatible)

### 1.3 MCP SSH Orchestrator (Direct Host Access)

**Repository:** https://github.com/samerfarida/mcp-ssh-orchestrator

**Docker Compose** (`/opt/mcp-servers/ssh/docker-compose.yml`):

```yaml
services:
  ssh-orchestrator:
    image: ghcr.io/samerfarida/mcp-ssh-orchestrator:latest
    container_name: mcp-ssh-orchestrator
    restart: unless-stopped
    volumes:
      - ./config:/app/config:ro
      - ./keys:/app/keys:ro
    networks:
      - mcp-network

networks:
  mcp-network:
    external: true
```

**Security Configuration** (`config/policy.yaml`):

```yaml
# Deny-by-default with explicit allowlist
deny_substrings:
  - "rm -rf /"
  - "dd if="
  - "mkfs"
  - "fdisk"
  - "> /dev"
  - "shutdown -h now"
  - "reboot"  # Require explicit approval

allow_patterns:
  # System monitoring
  - "^df -h"
  - "^free -m"
  - "^uptime"
  - "^top -bn1"
  - "^ps aux"
  - "^systemctl status"
  - "^journalctl"
  - "^docker ps"
  - "^docker logs"
  - "^docker stats"
  
  # Service restarts (controlled)
  - "^systemctl restart (docker|traefik|adguardhome)"
  - "^docker restart [a-zA-Z0-9_-]+"

network:
  allow:
    - "100.0.0.0/8"  # Tailscale only
  deny:
    - "0.0.0.0/0"
```

**SSH Key Setup:**

```bash
# On AI VM - generate dedicated key
ssh-keygen -t ed25519 -f /opt/mcp-servers/ssh/keys/moltbot_ed25519 -N ""

# Copy to each managed host
ssh-copy-id -i /opt/mcp-servers/ssh/keys/moltbot_ed25519.pub root@100.75.100.113  # Proxmox
ssh-copy-id -i /opt/mcp-servers/ssh/keys/moltbot_ed25519.pub user@100.104.67.12   # Dev VM
ssh-copy-id -i /opt/mcp-servers/ssh/keys/moltbot_ed25519.pub user@100.112.252.61  # Infra VM
```

---

## Phase 2: Monitoring Stack

### 2.1 Uptime Kuma (Already on Infra VM)

**Existing deployment at:** https://status.thinmint.dev (or internal)

**API Integration for Moltbot:**

Uptime Kuma exposes a REST API. Create skill to query status:

```bash
# Get all monitors status
curl -X GET "http://100.112.252.61:3001/api/status-page/heartbeat/main" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Webhook Configuration for Alerts:**

Configure webhooks in Uptime Kuma to trigger moltbot hooks:
- URL: `http://100.73.167.86:18789/hook/uptime-alert`
- Method: POST
- Content-Type: application/json

### 2.2 Prometheus + Grafana (Optional Enhancement)

If not already deployed, add to monitoring stack for metrics:

```yaml
# /opt/monitoring/docker-compose.yml
services:
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    ports:
      - "9090:9090"
    networks:
      - monitoring

  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=your_password
    volumes:
      - grafana_data:/var/lib/grafana
    ports:
      - "3000:3000"
    networks:
      - monitoring

volumes:
  prometheus_data:
  grafana_data:

networks:
  monitoring:
    driver: bridge
```

---

## Phase 3: Moltbot Skills Development

### 3.1 Skill Directory Structure

Create skills in `~/.clawdbot/skills/` on AI VM:

```
~/.clawdbot/skills/
├── proxmox-control/
│   └── SKILL.md
├── docker-control/
│   └── SKILL.md
├── uptime-kuma/
│   └── SKILL.md
├── network-diagnostics/
│   └── SKILL.md
└── n8n-workflows/
    └── SKILL.md
```

### 3.2 Proxmox Control Skill

**File:** `~/.clawdbot/skills/proxmox-control/SKILL.md`

```yaml
---
name: proxmox-control
description: Manage Proxmox VMs and containers via ProxmoxMCP-Plus API
metadata: {"moltbot":{"requires":{"env":["PROXMOX_MCP_URL"]}}}
---

# Proxmox Infrastructure Control

Use the ProxmoxMCP-Plus API at $PROXMOX_MCP_URL (default: http://localhost:8811) to manage VMs and containers.

## Available Operations

### Query Operations (Safe)
- List all VMs: `GET /api/vms`
- Get VM status: `GET /api/vms/{vmid}/status`
- List nodes: `GET /api/nodes`
- Get storage: `GET /api/storage`
- Cluster health: `GET /api/cluster/status`

### Control Operations (Requires Confirmation)
- Start VM: `POST /api/vms/{vmid}/start`
- Stop VM: `POST /api/vms/{vmid}/stop`
- Shutdown VM: `POST /api/vms/{vmid}/shutdown`
- Reboot VM: `POST /api/vms/{vmid}/reboot`

## VM Reference
- VMID 100: Dev VM (100.104.67.12) - Gitea, code-server, databases
- VMID 101: Infra VM (100.112.252.61) - Traefik, AdGuard, Uptime Kuma
- VMID 102: AI VM (100.73.167.86) - Open WebUI, LiteLLM, MCP servers

## Usage Examples

Check cluster health:
```bash
curl -s http://localhost:8811/api/cluster/status | jq
```

List all VMs with status:
```bash
curl -s http://localhost:8811/api/vms | jq '.[] | {vmid, name, status, cpu, memory}'
```

Restart a stuck VM (VMID 100):
```bash
curl -X POST http://localhost:8811/api/vms/100/reboot
```

## Safety Rules
1. Always check VM status before power operations
2. Prefer `shutdown` over `stop` for graceful termination
3. Confirm with user before any destructive operations
4. Log all control operations for audit trail
```

### 3.3 Docker Control Skill

**File:** `~/.clawdbot/skills/docker-control/SKILL.md`

```yaml
---
name: docker-control
description: Manage Docker containers across all VMs via homelab-mcp or SSH
metadata: {"moltbot":{"requires":{"bins":["curl"]}}}
---

# Docker Container Management

Manage Docker containers across the homelab infrastructure.

## Hosts with Docker
- Dev VM (100.104.67.12): Gitea, code-server, PostgreSQL, Redis
- Infra VM (100.112.252.61): Traefik, AdGuard Home, Uptime Kuma, Homepage
- AI VM (100.73.167.86): Open WebUI, LiteLLM, RagFlow, MCP servers

## Via homelab-mcp (Preferred for AI VM)

```bash
# List containers
curl -s http://localhost:6971/docker/containers | jq

# Container stats
curl -s http://localhost:6971/docker/stats | jq
```

## Via SSH (For Remote VMs)

Use the ssh-orchestrator MCP for containers on other VMs:

```bash
# List containers on Dev VM
ssh user@100.104.67.12 'docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"'

# Check container logs
ssh user@100.104.67.12 'docker logs --tail 50 gitea'

# Restart container
ssh user@100.104.67.12 'docker restart gitea'
```

## Container Health Checks

```bash
# Check all critical containers
for host in 100.104.67.12 100.112.252.61 100.73.167.86; do
  echo "=== $host ==="
  ssh user@$host 'docker ps --format "{{.Names}}: {{.Status}}"'
done
```

## Common Recovery Actions

### Container won't start
1. Check logs: `docker logs <container>`
2. Check disk space: `df -h`
3. Check memory: `free -m`
4. Remove and recreate if corrupted: `docker-compose up -d --force-recreate <service>`

### Container using too much memory
1. Check stats: `docker stats --no-stream`
2. Set memory limits in docker-compose.yml
3. Restart with limits: `docker-compose up -d`
```

### 3.4 Uptime Kuma Skill

**File:** `~/.clawdbot/skills/uptime-kuma/SKILL.md`

```yaml
---
name: uptime-kuma
description: Query and manage Uptime Kuma monitoring
metadata: {"moltbot":{"requires":{"env":["UPTIME_KUMA_URL","UPTIME_KUMA_API_KEY"]}}}
---

# Uptime Kuma Monitoring Integration

Query monitoring status and configure alerts via Uptime Kuma API.

## Configuration
- URL: $UPTIME_KUMA_URL (default: http://100.112.252.61:3001)
- API Key: $UPTIME_KUMA_API_KEY

## Query Status

Get all monitor statuses:
```bash
curl -s "$UPTIME_KUMA_URL/api/status-page/heartbeat/main" \
  -H "Authorization: Bearer $UPTIME_KUMA_API_KEY" | jq
```

## Monitored Services

### Critical (Respond Immediately)
- Traefik reverse proxy
- AdGuard Home DNS
- Gitea

### Important (Respond within 5 minutes)
- Open WebUI
- LiteLLM gateway
- Homepage dashboard

### Standard (Respond within 30 minutes)
- code-server
- RagFlow
- Individual MCP servers

## Alert Response Matrix

| Service Down | Automated Response | Manual Escalation |
|-------------|-------------------|-------------------|
| Traefik | Restart container | Check SSL certs |
| AdGuard | Restart container | Check config |
| Gitea | Restart container | Check database |
| Open WebUI | Restart container | Check model connectivity |

## Creating Monitors (via API)

```bash
curl -X POST "$UPTIME_KUMA_URL/api/monitors" \
  -H "Authorization: Bearer $UPTIME_KUMA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "http",
    "name": "New Service",
    "url": "https://service.thinmint.dev/health",
    "interval": 60,
    "retryInterval": 20,
    "maxretries": 3
  }'
```
```

### 3.5 Network Diagnostics Skill

**File:** `~/.clawdbot/skills/network-diagnostics/SKILL.md`

```yaml
---
name: network-diagnostics
description: Diagnose network connectivity issues across homelab
metadata: {"moltbot":{"requires":{"bins":["ping","curl","dig"]}}}
---

# Network Diagnostics

Diagnose and troubleshoot network connectivity across the homelab.

## Tailscale Network Map

```
Proxmox (100.75.100.113)
    ├── Dev VM (100.104.67.12)
    ├── Infra VM (100.112.252.61)
    └── AI VM (100.73.167.86)

Windows Desktop (100.100.132.101) - GPU inference
```

## Quick Health Check

```bash
# Ping all nodes
for ip in 100.75.100.113 100.104.67.12 100.112.252.61 100.73.167.86 100.100.132.101; do
  ping -c 1 -W 2 $ip > /dev/null 2>&1 && echo "$ip: UP" || echo "$ip: DOWN"
done
```

## DNS Resolution Check

```bash
# Test AdGuard Home DNS
dig @100.112.252.61 google.com +short

# Test internal resolution
dig @100.112.252.61 gitea.thinmint.dev +short
```

## Service Connectivity Matrix

```bash
# Check critical services
curl -s -o /dev/null -w "%{http_code}" https://gitea.thinmint.dev/api/v1/version
curl -s -o /dev/null -w "%{http_code}" https://openwebui.thinmint.dev/health
curl -s -o /dev/null -w "%{http_code}" http://100.112.252.61:3001/  # Uptime Kuma
```

## Common Issues

### DNS Not Resolving
1. Check AdGuard Home status: `ssh user@100.112.252.61 'docker ps | grep adguard'`
2. Restart if needed: `ssh user@100.112.252.61 'docker restart adguardhome'`
3. Verify: `dig @100.112.252.61 google.com`

### Tailscale Connectivity
1. Check status: `tailscale status`
2. Re-authenticate if needed: `tailscale up`

### Traefik Not Routing
1. Check Traefik logs: `ssh user@100.112.252.61 'docker logs traefik --tail 100'`
2. Verify SSL certs: Check Cloudflare API token validity
3. Restart: `ssh user@100.112.252.61 'docker restart traefik'`
```

---

## Phase 4: n8n Self-Healing Workflows

### 4.1 n8n Deployment

Deploy n8n on AI VM for workflow automation:

**Docker Compose** (`/opt/n8n/docker-compose.yml`):

```yaml
services:
  n8n:
    image: docker.n8n.io/n8nio/n8n:latest
    container_name: n8n
    restart: unless-stopped
    ports:
      - "5678:5678"
    environment:
      - N8N_HOST=n8n.thinmint.dev
      - N8N_PORT=5678
      - N8N_PROTOCOL=https
      - NODE_ENV=production
      - WEBHOOK_URL=https://n8n.thinmint.dev/
      - GENERIC_TIMEZONE=America/New_York
      - N8N_ENCRYPTION_KEY=your-encryption-key
    volumes:
      - n8n_data:/home/node/.n8n
    networks:
      - proxy
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.n8n.rule=Host(`n8n.thinmint.dev`)"
      - "traefik.http.routers.n8n.entrypoints=https"
      - "traefik.http.routers.n8n.tls=true"
      - "traefik.http.routers.n8n.tls.certresolver=cloudflare"
      - "traefik.http.services.n8n.loadBalancer.server.port=5678"

volumes:
  n8n_data:

networks:
  proxy:
    external: true
```

### 4.2 Self-Healing Workflow Templates

#### Container Restart Workflow

**Trigger:** Uptime Kuma webhook on service down
**Actions:**
1. Parse webhook payload for service name
2. Map service to container and host
3. SSH to host and restart container
4. Wait 30 seconds
5. Check Uptime Kuma API for recovery
6. Send Telegram notification with result

**n8n Workflow JSON:**

```json
{
  "name": "Container Auto-Restart",
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "uptime-alert",
        "httpMethod": "POST"
      }
    },
    {
      "name": "Parse Alert",
      "type": "n8n-nodes-base.code",
      "parameters": {
        "jsCode": "const alert = $input.item.json;\nconst serviceName = alert.monitor.name;\nconst status = alert.heartbeat.status;\n\n// Map service to container/host\nconst serviceMap = {\n  'Traefik': { container: 'traefik', host: '100.112.252.61' },\n  'Gitea': { container: 'gitea', host: '100.104.67.12' },\n  'Open WebUI': { container: 'open-webui', host: '100.73.167.86' }\n};\n\nreturn { serviceName, status, ...serviceMap[serviceName] };"
      }
    },
    {
      "name": "SSH Restart",
      "type": "n8n-nodes-base.ssh",
      "parameters": {
        "command": "docker restart {{ $json.container }}"
      }
    },
    {
      "name": "Wait",
      "type": "n8n-nodes-base.wait",
      "parameters": {
        "amount": 30
      }
    },
    {
      "name": "Verify Recovery",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "={{ $env.UPTIME_KUMA_URL }}/api/status-page/heartbeat/main"
      }
    },
    {
      "name": "Send Notification",
      "type": "n8n-nodes-base.telegram",
      "parameters": {
        "text": "🔧 Auto-Recovery: {{ $json.serviceName }}\nStatus: {{ $json.recovered ? '✅ Recovered' : '❌ Still Down' }}"
      }
    }
  ]
}
```

#### Resource Alert Workflow

**Trigger:** Prometheus/Netdata alert
**Actions:**
1. Query current resource usage
2. Identify high-usage containers
3. If memory > 90%, restart container
4. If disk > 90%, clean old logs/images
5. Escalate to human if unresolved

### 4.3 n8n MCP Integration

Install n8n MCP client node for AI-triggered workflows:

```bash
# In n8n container
cd /home/node/.n8n
npm install n8n-nodes-mcp-client
```

This allows moltbot to trigger n8n workflows via MCP protocol.

---

## Phase 5: Moltbot Integration

### 5.1 Moltbot Configuration

**File:** `~/.clawdbot/moltbot.json`

```json
{
  "skills": {
    "load": {
      "extraDirs": ["/opt/homelab-skills"]
    },
    "watch": true
  },
  "mcpServers": {
    "proxmox": {
      "serverType": "streamable-http",
      "url": "http://localhost:8811/mcp"
    },
    "homelab": {
      "serverType": "stdio",
      "command": "docker",
      "args": ["exec", "-i", "homelab-mcp", "node", "server.js"]
    },
    "ssh": {
      "serverType": "stdio",
      "command": "docker",
      "args": ["exec", "-i", "mcp-ssh-orchestrator", "node", "server.js"]
    }
  },
  "hooks": {
    "enabled": true,
    "port": 18789,
    "endpoints": {
      "uptime-alert": {
        "description": "Uptime Kuma alert webhook",
        "auth": "Bearer YOUR_WEBHOOK_TOKEN"
      },
      "prometheus-alert": {
        "description": "Prometheus alertmanager webhook",
        "auth": "Bearer YOUR_WEBHOOK_TOKEN"
      }
    }
  }
}
```

### 5.2 Environment Variables

**File:** `~/.clawdbot/.env`

```bash
# Proxmox MCP
PROXMOX_MCP_URL=http://localhost:8811

# Uptime Kuma
UPTIME_KUMA_URL=http://100.112.252.61:3001
UPTIME_KUMA_API_KEY=your_api_key

# n8n
N8N_URL=https://n8n.thinmint.dev
N8N_API_KEY=your_api_key

# Notifications
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
```

### 5.3 Hooks for Alert-Driven Automation

Configure Uptime Kuma to send webhooks to moltbot:

1. In Uptime Kuma, add notification:
   - Type: Webhook
   - URL: `http://100.73.167.86:18789/hook/uptime-alert`
   - Method: POST
   - Headers: `Authorization: Bearer YOUR_WEBHOOK_TOKEN`

2. Moltbot receives alert and can:
   - Query current state via MCP servers
   - Attempt automated recovery
   - Escalate to human if needed
   - Log all actions for audit

---

## Autonomous Operation Scenarios

### Scenario 1: Container Crash Recovery

```
1. Uptime Kuma detects Gitea down
2. Webhook fires to moltbot
3. Moltbot queries Docker via homelab-mcp
4. Moltbot restarts container via SSH orchestrator
5. Moltbot monitors for 60 seconds
6. Moltbot queries Uptime Kuma for recovery confirmation
7. Moltbot sends Telegram notification with summary
```

### Scenario 2: DNS Outage Recovery

```
1. Multiple services report down in Uptime Kuma
2. Moltbot correlates failures (all DNS-dependent)
3. Moltbot checks AdGuard Home status
4. Moltbot restarts AdGuard container
5. Moltbot verifies DNS resolution
6. Services recover automatically
7. Moltbot logs incident and notifies
```

### Scenario 3: VM Resource Exhaustion

```
1. Prometheus alerts high memory on Dev VM
2. n8n workflow triggers
3. Moltbot queries Proxmox MCP for VM metrics
4. Moltbot identifies memory-hungry container
5. Moltbot requests human approval for action
6. Upon approval, restarts container or increases VM resources
7. Moltbot monitors and confirms stability
```

### Scenario 4: Proactive SSL Certificate Renewal

```
1. Uptime Kuma detects cert expiring in 7 days
2. Moltbot triggers n8n cert renewal workflow
3. Workflow restarts Traefik to request new cert
4. Moltbot verifies new cert via Uptime Kuma
5. Moltbot updates status page
```

---

## Security Considerations

### Permission Model

| Operation | Automated | Requires Approval |
|-----------|-----------|-------------------|
| Query status | ✅ | - |
| View logs | ✅ | - |
| Restart container | ✅ | - |
| Stop container | ❌ | ✅ |
| Reboot VM | ❌ | ✅ |
| Delete VM | ❌ | ✅ (double confirm) |
| Modify firewall | ❌ | ✅ |

### Audit Logging

All operations logged with:
- Timestamp
- Operation type
- Target resource
- Trigger source (webhook, scheduled, manual)
- Result (success/failure)
- Any error messages

### Network Isolation

- All MCP servers only accessible via Tailscale
- No public exposure of control endpoints
- Webhook endpoints require bearer token auth
- SSH orchestrator restricted to Tailscale IPs only

---

## Implementation Checklist

### Phase 1: MCP Servers
- [ ] Create Proxmox API token with appropriate permissions
- [ ] Deploy ProxmoxMCP-Plus container
- [ ] Deploy homelab-mcp container
- [ ] Deploy SSH orchestrator with security policy
- [ ] Test each MCP server independently

### Phase 2: Monitoring
- [ ] Configure Uptime Kuma webhooks
- [ ] (Optional) Deploy Prometheus + Grafana
- [ ] Set up alert thresholds

### Phase 3: Skills
- [ ] Create proxmox-control skill
- [ ] Create docker-control skill
- [ ] Create uptime-kuma skill
- [ ] Create network-diagnostics skill
- [ ] Test skills individually

### Phase 4: n8n
- [ ] Deploy n8n with Traefik
- [ ] Create container restart workflow
- [ ] Create resource alert workflow
- [ ] Install MCP client node

### Phase 5: Integration
- [ ] Configure moltbot.json with MCP servers
- [ ] Set up environment variables
- [ ] Configure webhook hooks
- [ ] Test end-to-end scenarios

### Phase 6: Production
- [ ] Enable monitoring for all MCP servers
- [ ] Set up audit logging
- [ ] Document runbooks for manual escalation
- [ ] Test failure scenarios

---

## Development Notes for Claude/Claude-Flow

When implementing this system:

1. **Start with read-only operations** - Deploy MCP servers with query-only permissions first, verify they work, then enable control operations.

2. **Test in isolation** - Each component (MCP server, skill, workflow) should be tested independently before integration.

3. **Fail-safe defaults** - Any operation that doesn't receive explicit success confirmation should be treated as failed and escalated.

4. **Human-in-the-loop** - For any destructive operation (stop, delete, reboot), always require human confirmation via Telegram or chat.

5. **Idempotent operations** - All automated actions should be safe to retry without causing additional issues.

6. **Rate limiting** - Prevent alert storms from triggering repeated recovery attempts. Implement cooldown periods.

7. **Correlation** - Multiple simultaneous alerts likely indicate a root cause (DNS, network) rather than multiple independent failures.

8. **Graceful degradation** - If an MCP server is unreachable, fall back to SSH or skip that check rather than failing completely.