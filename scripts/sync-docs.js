import fs from 'fs';
import path from 'path';

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

const distDir = path.resolve('dist');
const docsDir = path.resolve('docs');
const androidPublicDir = path.resolve('android/app/src/main/assets/public');

if (fs.existsSync(distDir)) {
  console.log('Syncing dist -> docs...');
  copyDir(distDir, docsDir);

  // Also sync to docs/404.html for GitHub Pages routing
  const indexFile = path.join(docsDir, 'index.html');
  const notFoundFile = path.join(docsDir, '404.html');
  if (fs.existsSync(indexFile)) {
    fs.copyFileSync(indexFile, notFoundFile);
  }

  // Ensure service-worker.js and sw.js are in docs
  const swSrc = path.join(distDir, 'service-worker.js');
  if (fs.existsSync(swSrc)) {
    fs.copyFileSync(swSrc, path.join(docsDir, 'sw.js'));
  }

  if (fs.existsSync(path.resolve('android/app/src/main/assets'))) {
    console.log('Syncing dist -> android public assets...');
    copyDir(distDir, androidPublicDir);
  }

  console.log('All deployment assets synced successfully!');
}
