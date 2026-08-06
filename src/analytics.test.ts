import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

describe('analytics', () => {
  it('keeps the GoatCounter snippet in index.html', () => {
    const html = readFileSync(fileURLToPath(new URL('../index.html', import.meta.url)), 'utf8');
    expect(html).toContain('data-goatcounter="https://adrian2045.goatcounter.com/count"');
    expect(html).toContain('gc.zgo.at/count.js');
  });
});
