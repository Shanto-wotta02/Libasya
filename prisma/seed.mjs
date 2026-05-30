import fs from 'node:fs';

import { neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';
import ws from 'ws';

function loadLocalEnv() {
  if (process.env.DATABASE_URL || !fs.existsSync('.env')) {
    return;
  }

  const envFile = fs.readFileSync('.env', 'utf8');

  for (const line of envFile.split(/\r?\n/)) {
    const match = line.match(/^([^#=]+)=(.*)$/);

    if (!match) {
      continue;
    }

    const key = match[1].trim();
    let value = match[2].trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] ??= value;
  }
}

loadLocalEnv();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set.');
}

neonConfig.webSocketConstructor = ws;

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }),
  log: ['error'],
});

await prisma.siteSettings.upsert({
  where: { id: 'main' },
  update: {},
  create: { id: 'main' },
});

await prisma.$disconnect();
