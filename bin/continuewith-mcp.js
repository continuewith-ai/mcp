#!/usr/bin/env node
import { startServer } from '../src/server.js';

startServer().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
