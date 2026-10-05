import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

const ROOT = path.resolve(import.meta.dirname, '..');

describe('Production build', () => {
  it('builds without errors', () => {
    expect(() => execSync('npm run build', { cwd: ROOT, stdio: 'pipe' })).not.toThrow();
  });

  it('emits all expected HTML pages', () => {
    const pages = [
      'dist/index.html',
      'dist/pages/home.html',
      'dist/pages/camera.html',
      'dist/pages/prices.html',
      'dist/pages/about.html',
      'dist/pages/tooth-gemz.html',
      'dist/pages/404.html',
      'dist/pages/privacy.html',
      'dist/pages/terms.html',
      'dist/pages/admin.html',
    ];
    for (const page of pages) {
      expect(existsSync(path.join(ROOT, page)), `missing: ${page}`).toBe(true);
    }
  });
});
