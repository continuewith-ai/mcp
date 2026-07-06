import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DEMO_PUBLIC_KEY,
  agentInstallRule,
  htmlWidgetSnippet,
  snippetForFramework,
} from '../src/install.js';

test('mcp install helpers expose snippets and agent rule', () => {
  assert.match(htmlWidgetSnippet(), /widget\/v1\.js/);
  assert.match(snippetForFramework('nextjs'), /next\/script/);
  assert.match(agentInstallRule, /cw_demo_public_key/);
  assert.equal(DEMO_PUBLIC_KEY, 'cw_demo_public_key');
});
