import { spawn } from 'node:child_process';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import {
  DEMO_PUBLIC_KEY,
  agentInstallRule,
  htmlWidgetSnippet,
  snippetForFramework,
  themeToCssBlock,
} from './install.js';

const docs = {
  install: 'https://continuewith.ai/docs/install',
  agents: 'https://continuewith.ai/docs/agents',
  llms: 'https://continuewith.ai/llms.txt',
  readyIndex: 'https://ready.continuewith.ai/api/ready/directory',
  readyLlms: 'https://ready.continuewith.ai/llms.txt',
  demo: `https://continuewith.ai/test-widget?key=${DEMO_PUBLIC_KEY}`,
};

const READY_INDEX_API = process.env.READY_INDEX_API_URL || 'https://ready.continuewith.ai/api/ready/directory';

async function fetchReadyDirectory(searchParams) {
  const url = new URL(READY_INDEX_API);
  for (const [key, value] of Object.entries(searchParams)) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
  }

  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(12_000),
  });

  if (!response.ok) {
    throw new Error(`Ready index API returned ${response.status}`);
  }

  return response.json();
}

function formatReadyDirectoryResults(payload, limit) {
  const sites = Array.isArray(payload?.sites) ? payload.sites.slice(0, limit) : [];
  if (!sites.length) {
    return `No AI Ready Index listings matched your query.\n\nBrowse all: ${READY_INDEX_API}`;
  }

  const rows = sites.map((site) =>
    [
      `- ${site.name} (${site.domain})`,
      `  Score: ${site.aiReadyScore}/100 (${site.level}) · ${site.category}`,
      `  ${String(site.description || '').slice(0, 160).replace(/\s+/g, ' ').trim()}${String(site.description || '').length > 160 ? '…' : ''}`,
      `  Profile: ${site.profileUrl}`,
      `  URL: ${site.url}`,
      `  Signals: ContinueWith=${site.signals?.hasContinueWith}, llms.txt=${site.signals?.hasLlmsTxt}, partner=${site.signals?.isPartner}`,
    ].join('\n'),
  );

  return [
    `AI Ready Index — ${payload.count ?? sites.length} matching listing${(payload.count ?? sites.length) === 1 ? '' : 's'} (showing ${sites.length})`,
    `JSON API: ${READY_INDEX_API}`,
    '',
    ...rows,
    '',
    'Install ContinueWith on your site: https://continuewith.ai/docs/install',
  ].join('\n');
}

function runContinueWithAdd(cwd, options = {}) {
  return new Promise((resolve, reject) => {
    const args = ['continuewith@latest', 'add', '--cwd', cwd];
    if (options.framework) args.push('--framework', options.framework);
    if (options.siteKey) args.push('--site-key', options.siteKey);
    if (options.mode) args.push('--mode', options.mode);
    if (options.target) args.push('--target', options.target);
    if (options.layout) args.push('--layout', options.layout);
    if (options.theme?.primaryColor) args.push('--primary-color', options.theme.primaryColor);
    if (options.theme?.background) args.push('--background', options.theme.background);
    if (options.theme?.textColor) args.push('--text-color', options.theme.textColor);
    if (options.theme?.borderColor) args.push('--border-color', options.theme.borderColor);

    const child = spawn('npx', args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve({ stdout: stdout.trim(), stderr: stderr.trim() });
      else reject(new Error(stderr.trim() || stdout.trim() || `continuewith add exited with code ${code}`));
    });
  });
}

export async function startServer() {
  const server = new McpServer({
    name: 'continuewith',
    version: '0.1.1',
  });

  server.registerTool(
    'get_agent_install_rule',
    {
      description: 'Return the default rule for coding agents to auto-install ContinueWith on marketing pages.',
      inputSchema: {},
    },
    async () => ({
      content: [{ type: 'text', text: agentInstallRule }],
    }),
  );

  server.registerTool(
    'get_install_snippet',
    {
      description: 'Return the ContinueWith widget install snippet for html, nextjs, or astro.',
      inputSchema: {
        framework: z.enum(['html', 'nextjs', 'astro']).default('html').describe('Target stack'),
        siteKey: z.string().optional().describe('Public site key. Defaults to cw_demo_public_key.'),
        mode: z.enum(['floating', 'inline']).optional().describe('Widget display mode. Defaults to floating.'),
        target: z.string().optional().describe('CSS selector for inline mode, e.g. #continuewith-widget'),
        layout: z.enum(['vertical', 'horizontal']).optional().describe('Widget layout inside the panel'),
        primaryColor: z.string().optional().describe('Theme primary color'),
        background: z.string().optional().describe('Theme panel background'),
        textColor: z.string().optional().describe('Theme text color'),
        borderColor: z.string().optional().describe('Theme border color'),
      },
    },
    async ({ framework, siteKey, mode, target, layout, primaryColor, background, textColor, borderColor }) => {
      const theme = { primaryColor, background, textColor, borderColor };
      const snippet = snippetForFramework(framework, siteKey || DEMO_PUBLIC_KEY, {
        mode: mode || 'floating',
        target: target || '#continuewith-widget',
        layout: layout || 'vertical',
        theme,
      });
      const css = themeToCssBlock(theme);
      return {
        content: [{
          type: 'text',
          text: [
            snippet,
            '',
            css,
            '',
            `Docs: ${docs.agents}`,
            `Replace ${siteKey || DEMO_PUBLIC_KEY} with your dashboard key after signup.`,
          ].join('\n'),
        }],
      };
    },
  );

  server.registerTool(
    'get_continuewith_docs',
    {
      description: 'Return ContinueWith documentation URLs for agents and installers.',
      inputSchema: {},
    },
    async () => ({
      content: [{
        type: 'text',
        text: [
          `llms.txt: ${docs.llms}`,
          `AI Ready Index JSON: ${docs.readyIndex}`,
          `AI Ready Index llms.txt: ${docs.readyLlms}`,
          `Install: ${docs.install}`,
          `Agents: ${docs.agents}`,
          `Demo: ${docs.demo}`,
          '',
          `Default snippet:\n${htmlWidgetSnippet()}`,
        ].join('\n'),
      }],
    }),
  );

  server.registerTool(
    'install_continuewith_widget',
    {
      description: 'Run `npx continuewith add` in a project directory to patch the layout or HTML file.',
      inputSchema: {
        projectPath: z.string().describe('Absolute or relative path to the project root'),
        framework: z.enum(['html', 'nextjs', 'astro']).optional().describe('Optional framework override'),
        siteKey: z.string().optional().describe('Optional public site key'),
        mode: z.enum(['floating', 'inline']).optional().describe('Widget display mode'),
        target: z.string().optional().describe('Inline mount selector'),
        layout: z.enum(['vertical', 'horizontal']).optional().describe('Widget layout'),
        primaryColor: z.string().optional().describe('Theme primary color'),
        background: z.string().optional().describe('Theme background'),
        textColor: z.string().optional().describe('Theme text color'),
        borderColor: z.string().optional().describe('Theme border color'),
      },
    },
    async ({ projectPath, framework, siteKey, mode, target, layout, primaryColor, background, textColor, borderColor }) => {
      const result = await runContinueWithAdd(projectPath, {
        framework,
        siteKey,
        mode,
        target,
        layout,
        theme: { primaryColor, background, textColor, borderColor },
      });
      return {
        content: [{
          type: 'text',
          text: [result.stdout, result.stderr].filter(Boolean).join('\n'),
        }],
      };
    },
  );

  server.registerTool(
    'search_ready_directory',
    {
      description:
        'Search the AI Ready Index — agent-ready websites with AI readiness scores, categories, and ContinueWith handoff signals.',
      inputSchema: {
        q: z.string().optional().describe('Search name, description, or tags'),
        category: z.string().optional().describe('Filter by category, e.g. SaaS'),
        continueWith: z.boolean().optional().describe('Only sites with ContinueWith widget installed'),
        partner: z.boolean().optional().describe('Only featured ContinueWith partner listings'),
        limit: z.number().int().min(1).max(25).optional().describe('Max results to return (default 10)'),
      },
    },
    async ({ q, category, continueWith, partner, limit = 10 }) => {
      const payload = await fetchReadyDirectory({
        q,
        category,
        continueWith: continueWith ? '1' : undefined,
        partner: partner ? '1' : undefined,
      });
      return {
        content: [{ type: 'text', text: formatReadyDirectoryResults(payload, limit) }],
      };
    },
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}
