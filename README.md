# @continuewith/mcp

[MCP](https://modelcontextprotocol.io) server so coding agents (Cursor, Claude Code, Codex, …) can install and configure the [ContinueWith](https://continuewith.ai) AI handoff widget without guessing URLs or snippets.

Runs locally over stdio — no hosted OAuth required for the open-source npm package.

## Install (Cursor / Claude Desktop)

Add to your MCP config:

```json
{
  "mcpServers": {
    "continuewith": {
      "command": "npx",
      "args": ["-y", "@continuewith/mcp@latest"]
    }
  }
}
```

Or run directly:

```bash
npx @continuewith/mcp@latest
```

Node.js 18+.

## Tools

| Tool | Description |
|------|-------------|
| `get_agent_install_rule` | Default rule for agents to auto-install on marketing pages |
| `get_install_snippet` | Widget snippet for `html`, `nextjs`, or `astro` |
| `get_continuewith_docs` | Official doc URLs + default snippet |
| `install_continuewith_widget` | Runs `npx continuewith add` in a project directory |
| `search_ready_directory` | Search the [AI Ready Index](https://ready.continuewith.ai/ready/directory) (public JSON API) |

## Example agent flow

1. Agent calls `get_agent_install_rule` → paste rule into project context
2. Agent calls `install_continuewith_widget` with `projectPath` → patches layout/HTML
3. User replaces `cw_demo_public_key` with their [dashboard](https://continuewith.ai/dashboard) key

## Documentation

- [Agents & MCP setup](https://continuewith.ai/docs/agents)
- [MCP tools reference](https://continuewith.ai/docs/agents/mcp)
- [Install guide](https://continuewith.ai/docs/install)
- [Skills catalog](https://continuewith.ai/docs/skills)
- [Agent index (`llms.txt`)](https://continuewith.ai/llms.txt)

## Related packages

| Package | Purpose |
|---------|---------|
| [`continuewith`](https://www.npmjs.com/package/continuewith) | CLI — `npx continuewith add` |
| [`@continuewith/sdk`](https://www.npmjs.com/package/@continuewith/sdk) | Snippet & prompt helpers |

## Trust & security

**Runs locally:** The MCP server uses stdio only. It does not phone home with your project source.

**Network access (explicit, read-only public APIs):**

- `search_ready_directory` → `https://ready.continuewith.ai/api/ready/directory` (public directory JSON)
- `install_continuewith_widget` → spawns `npx continuewith@latest add` on **your machine** in the path you provide

**No secrets in this package:** No Stripe, Resend, Clerk, or database credentials. The default site key `cw_demo_public_key` is a public demo identifier — replace it for production.

**You control paths:** Only pass `projectPath` values you trust — the install tool modifies files in that directory.

- [Security](https://continuewith.ai/security)
- [Privacy](https://continuewith.ai/privacy)
- [Terms](https://continuewith.ai/terms)

## Community

- Website: [continuewith.ai](https://continuewith.ai)
- X: [@continuewithai](https://x.com/continuewithai)
- Reddit: [@continuewithai](https://www.reddit.com/user/continuewithai)
- AI Ready Index: [ready.continuewith.ai](https://ready.continuewith.ai)

## License

MIT © [ContinueWith](https://continuewith.ai)
