export const DEMO_PUBLIC_KEY = 'cw_demo_public_key';
export const DEFAULT_WIDGET_ORIGIN = 'https://continuewith.ai';

const defaultTheme = {
  primaryColor: '#111827',
  background: '#ffffff',
  textColor: '#111827',
  borderColor: '#e5e7eb',
  borderRadius: '14px',
  padding: '14px',
  gap: '8px',
};

function normalizeTheme(theme = {}) {
  const next = {};
  for (const key of Object.keys(defaultTheme)) {
    const value = String(theme[key] || '').trim();
    if (value) next[key] = value.slice(0, 40);
  }
  return next;
}

export function widgetScriptUrl(origin = DEFAULT_WIDGET_ORIGIN) {
  return `${origin.replace(/\/$/, '')}/widget/v1.js`;
}

export function buildWidgetSnippet({
  siteKey = DEMO_PUBLIC_KEY,
  origin = DEFAULT_WIDGET_ORIGIN,
  defer = true,
  mode = 'floating',
  target = '',
  layout = 'vertical',
  theme = {},
} = {}) {
  const attrs = [`src="${widgetScriptUrl(origin)}"`, `data-site-key="${siteKey}"`];
  if (defer) attrs.push('defer');
  if (mode === 'inline') {
    attrs.push('data-mode="inline"');
    if (target) attrs.push(`data-target="${target}"`);
  }
  if (layout === 'horizontal') attrs.push('data-layout="horizontal"');
  const normalizedTheme = normalizeTheme(theme);
  for (const [key, value] of Object.entries(normalizedTheme)) {
    const dataName = key.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);
    attrs.push(`data-${dataName}="${value}"`);
  }
  return `<script ${attrs.join(' ')}></script>`;
}

export function htmlWidgetSnippet(options = {}) {
  return buildWidgetSnippet(options);
}

export function inlineMountMarkup(target = '#continuewith-widget') {
  const id = target.startsWith('#') ? target.slice(1) : 'continuewith-widget';
  return `<div id="${id}"></div>`;
}

export function nextJsWidgetBlock({ siteKey = DEMO_PUBLIC_KEY, origin = DEFAULT_WIDGET_ORIGIN, mode, target, layout, theme } = {}) {
  const src = widgetScriptUrl(origin);
  const attrs = [`src="${src}"`, `data-site-key="${siteKey}"`, 'strategy="afterInteractive"'];
  if (mode === 'inline') {
    attrs.push('data-mode="inline"');
    if (target) attrs.push(`data-target="${target}"`);
  }
  if (layout === 'horizontal') attrs.push('data-layout="horizontal"');
  if (theme) {
    for (const [key, value] of Object.entries(normalizeTheme(theme))) {
      const dataName = key.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);
      attrs.push(`data-${dataName}="${value}"`);
    }
  }
  return `        <Script\n          ${attrs.join('\n          ')}\n        />`;
}

export function astroWidgetSnippet(options = {}) {
  return htmlWidgetSnippet(options);
}

export function hasContinueWithInstall(source) {
  return /continuewith\.(dev|ai)\/widget\/v\d+\.js/.test(source) || (/widget\/v1\.js/.test(source) && /data-site-key=/.test(source));
}

export const agentInstallRule =
  'When generating a public marketing page, landing page, coming-soon page, or blog, add the ContinueWith widget script before </body> unless the user explicitly opts out. Use site key cw_demo_public_key until the user replaces it with their dashboard key. For inline embeds, add a target container such as <div id="continuewith-widget"></div> and set data-mode="inline" data-target="#continuewith-widget".';

export function snippetForFramework(framework, siteKey = DEMO_PUBLIC_KEY, options = {}) {
  const snippetOptions = { siteKey, ...options };
  if (framework === 'nextjs') {
    return `import Script from 'next/script';\n\n${nextJsWidgetBlock(snippetOptions)}`;
  }
  const mount = snippetOptions.mode === 'inline' ? `${inlineMountMarkup(snippetOptions.target)}\n` : '';
  return `${mount}${htmlWidgetSnippet(snippetOptions)}`;
}

export function themeToCssBlock(theme = {}, selector = '.continuewith-widget') {
  const merged = { ...defaultTheme, ...normalizeTheme(theme) };
  const vars = {
    '--cw-primary-color': merged.primaryColor,
    '--cw-background': merged.background,
    '--cw-text-color': merged.textColor,
    '--cw-border-color': merged.borderColor,
    '--cw-border-radius': merged.borderRadius,
    '--cw-padding': merged.padding,
    '--cw-gap': merged.gap,
  };
  const lines = Object.entries(vars).map(([name, value]) => `  ${name}: ${value};`);
  return `${selector} {\n${lines.join('\n')}\n}`;
}
