import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const extensionRoot = path.resolve(__dirname, '..');
const distDir = path.join(extensionRoot, 'dist');
const webPublicDir = path.resolve(extensionRoot, '../proj-experiment-writo-web/public');
const targetZip = path.join(webPublicDir, 'writo.zip');

if (!fs.existsSync(distDir)) {
  console.error('Error: dist directory does not exist. Run "npm run build" first.');
  process.exit(1);
}

if (!fs.existsSync(webPublicDir)) {
  fs.mkdirSync(webPublicDir, { recursive: true });
}

const tmpDir = path.join(extensionRoot, '.writo_pack_tmp');
const tmpWritoDir = path.join(tmpDir, 'writo');

try {
  if (fs.existsSync(tmpDir)) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tmpWritoDir, { recursive: true });
  fs.cpSync(distDir, tmpWritoDir, { recursive: true });

  const tmpZip = path.join(tmpDir, 'writo.zip');
  execSync(`cd "${tmpDir}" && zip -r writo.zip writo`, { stdio: 'inherit' });

  fs.copyFileSync(tmpZip, targetZip);
  fs.rmSync(tmpDir, { recursive: true, force: true });

  const stats = fs.statSync(targetZip);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`✓ Successfully packaged Writo extension into ${targetZip} (${sizeMB} MB)`);
} catch (err) {
  console.error('Failed to package extension:', err);
  process.exit(1);
}

