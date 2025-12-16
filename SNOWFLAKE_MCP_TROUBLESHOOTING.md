# Snowflake MCP Troubleshooting Guide

## Issue Summary (Dec 10, 2025)

The Snowflake MCP server stopped working between 1:49 PM and 3:15 PM today. This document explains what went wrong and how to fix it.

---

## Root Cause

The MCP configuration was changed from the working GitHub version to either:
1. An incomplete repository URL
2. The PyPI package version (which doesn't support browser SSO authentication)
3. Wrong executable name or parameters

---

## Working Configuration (CORRECT)

**File:** `~/.cursor/mcp.json`

```json
{
  "mcpServers": {
    "snowflake": {
      "command": "uvx",
      "args": [
        "--from",
        "git+https://github.com/Snowflake-Labs/mcp",
        "mcp-server-snowflake",
        "--service-config-file",
        "/Users/nchua/snowflake-config.yaml",
        "--account",
        "hb85882-jx53120",
        "--user",
        "nchua@brex.com",
        "--warehouse",
        "COMPUTE_XSMALL_WH",
        "--role",
        "BREX_NCHUA",
        "--authenticator",
        "externalbrowser"
      ]
    }
  }
}
```

### Key Points for Working Config:
1. ✅ **Repository**: `git+https://github.com/Snowflake-Labs/mcp` (GitHub version, not PyPI)
2. ✅ **Executable**: `mcp-server-snowflake` (with **hyphens**, not underscores)
3. ✅ **Auth method**: `--authenticator externalbrowser` (for SSO)
4. ✅ **Config file**: `--service-config-file /Users/nchua/snowflake-config.yaml`
5. ✅ **No** `--database` or `--schema` parameters (handled by service config file)

---

## Common Mistakes That Break It

### ❌ Mistake 1: Using PyPI Package Instead of GitHub
```json
"--from",
"mcp-server-snowflake",  // WRONG - PyPI version doesn't support SSO
```

**Why it fails:** PyPI version requires `--password` and doesn't support `--authenticator externalbrowser`

**Error message:** `mcp_server_snowflake: error: the following arguments are required: --password`

---

### ❌ Mistake 2: Wrong Executable Name
```json
"mcp_server_snowflake",  // WRONG - underscores
```

Should be:
```json
"mcp-server-snowflake",  // CORRECT - hyphens
```

**Why it fails:** The GitHub version provides `mcp-server-snowflake` as the executable name, not `mcp_server_snowflake`

---

### ❌ Mistake 3: Incomplete Repository URL
```json
"git+https://github.com/Snowflake-Labs/mcp-server-snowflake",  // WRONG
```

Should be:
```json
"git+https://github.com/Snowflake-Labs/mcp",  // CORRECT
```

**Why it fails:** The correct GitHub repository is `mcp`, not `mcp-server-snowflake`

---

### ❌ Mistake 4: Using --database/--schema Instead of Service Config
```json
"--database", "COREDATA",
"--schema", "CUSTOMER",
// Missing: "--service-config-file"
```

**Why it fails:** The GitHub version expects `--service-config-file` parameter, and the service config file handles database/schema routing

---

## Quick Troubleshooting Steps

### Step 1: Check the Error in Cursor Logs
```bash
# Find the most recent log directory
ls -lt ~/Library/Application\ Support/Cursor/logs/ | head -5

# Check the Snowflake MCP error (replace with your latest log folder)
cat ~/Library/Application\ Support/Cursor/logs/YYYYMMDDTHHMMSS/window1/exthost/anysphere.cursor-mcp/MCP\ user-snowflake.log | grep -i error | tail -20
```

### Step 2: Common Error Messages and Fixes

| Error Message | Problem | Solution |
|--------------|---------|----------|
| `error: the following arguments are required: --password` | Using PyPI version instead of GitHub | Change to `git+https://github.com/Snowflake-Labs/mcp` |
| `An executable named 'mcp-server-snowflake' is not provided` | Wrong package or executable name | Use GitHub version with `mcp-server-snowflake` |
| `Git operation failed` | Corrupted uv cache | Run `rm -rf ~/.cache/uv/sdists-v9/.git` |
| `Operation not permitted (os error 1)` | Corrupted .git in cache | Run `rm -rf ~/.cache/uv/sdists-v9/.git` |

### Step 3: Verify the Config File
```bash
cat ~/.cursor/mcp.json
```

Compare with the working configuration above.

### Step 4: Check Service Config File
```bash
cat /Users/nchua/snowflake-config.yaml
```

Should contain:
```yaml
# Snowflake MCP configuration
search_services: []
agent_services: []
analyst_services: []
```

### Step 5: Clear Cache if Needed
```bash
# If you see cache corruption errors
rm -rf ~/.cache/uv/sdists-v9/.git

# Or clear entire uv cache (more aggressive)
rm -rf ~/.cache/uv/
```

### Step 6: Restart Cursor
After fixing the config, **completely restart Cursor** (not just reload window).

---

## Understanding the Differences

### GitHub Version (CORRECT for Enterprise SSO)
- **Source**: `git+https://github.com/Snowflake-Labs/mcp`
- **Supports**: Browser-based SSO authentication (`--authenticator externalbrowser`)
- **Executable**: `mcp-server-snowflake` (hyphens)
- **Config method**: `--service-config-file`
- **Best for**: Enterprise Snowflake accounts with SSO

### PyPI Version (NOT Compatible with SSO)
- **Source**: `mcp-server-snowflake` (package name)
- **Requires**: Password authentication (`--password`)
- **Executable**: `mcp_server_snowflake` (underscores)
- **Config method**: Direct parameters like `--database`, `--schema`
- **Best for**: Personal accounts with password auth

---

## How to Restore Working Config

If the MCP breaks again, run these commands:

```bash
# 1. Backup current config
cp ~/.cursor/mcp.json ~/.cursor/mcp.json.backup

# 2. Restore the working configuration
cat > ~/.cursor/mcp.json << 'EOF'
{
  "mcpServers": {
    "snowflake": {
      "command": "uvx",
      "args": [
        "--from",
        "git+https://github.com/Snowflake-Labs/mcp",
        "mcp-server-snowflake",
        "--service-config-file",
        "/Users/nchua/snowflake-config.yaml",
        "--account",
        "hb85882-jx53120",
        "--user",
        "nchua@brex.com",
        "--warehouse",
        "COMPUTE_XSMALL_WH",
        "--role",
        "BREX_NCHUA",
        "--authenticator",
        "externalbrowser"
      ]
    }
  }
}
EOF

# 3. Verify the config
cat ~/.cursor/mcp.json

# 4. Restart Cursor
```

---

## Testing the Configuration

After restarting Cursor, test by asking me to query Snowflake:

```
"Can you query the COREDATA.CUSTOMER.CUSTOMER_WIDE table and show me the first 5 customers?"
```

If working correctly:
- A browser window should open for SSO authentication
- You'll authenticate via your Brex SSO
- I'll be able to query Snowflake tables

---

## What Changed Today (Timeline)

| Time | Status | Configuration |
|------|--------|---------------|
| 1:00 PM | ✅ Working | GitHub version with `mcp-server-snowflake` and service-config-file |
| 3:15 PM | ❌ Broken | Configuration was modified (unknown cause) |
| 3:30 PM | ❌ Still broken | Attempted fix with PyPI version (doesn't support SSO) |
| 3:45 PM | ✅ Fixed | Restored original GitHub configuration from logs |

---

## Prevention

To prevent this from happening again:

1. **Don't manually edit** `~/.cursor/mcp.json` unless necessary
2. **Keep a backup** of the working configuration:
   ```bash
   cp ~/.cursor/mcp.json ~/.cursor/mcp.json.working
   ```
3. **Check logs first** when troubleshooting - they show the exact command that was working
4. **Remember**: Enterprise Snowflake = GitHub version with SSO

---

## Additional Resources

- **Snowflake Schema Documentation**: `SNOWFLAKE_SCHEMA.md` in this project
- **Reference Queries**: `reference_queries.sql` in this project
- **Cursor MCP Logs**: `~/Library/Application Support/Cursor/logs/`
- **Config File Location**: `~/.cursor/mcp.json`
- **Service Config**: `/Users/nchua/snowflake-config.yaml`

---

## Summary Checklist

When Snowflake MCP fails, verify:
- [ ] Repository is `git+https://github.com/Snowflake-Labs/mcp` (not PyPI)
- [ ] Executable is `mcp-server-snowflake` (hyphens, not underscores)
- [ ] Using `--service-config-file` parameter
- [ ] Using `--authenticator externalbrowser` for SSO
- [ ] Service config file exists at `/Users/nchua/snowflake-config.yaml`
- [ ] No corrupted cache files (check logs for "Operation not permitted")
- [ ] Cursor has been fully restarted after config changes

If all else fails, restore from the working configuration documented above.

