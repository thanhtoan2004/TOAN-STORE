const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.join(__dirname, '..');
const SRC_DIR = path.join(PROJECT_ROOT, 'src');

async function patchBackend() {
  console.log('Starting backend patch for Phase 15...');

  const replacements = [
    {
      from: /is_email_encrypted/g,
      to: 'is_encrypted',
      description: 'Renaming is_email_encrypted to is_encrypted (DB column name)',
    },
    {
      from: /isEmailEncrypted/g,
      to: 'isEncrypted',
      description: 'Renaming isEmailEncrypted to isEncrypted (Drizzle property/local var)',
    },
  ];

  function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach((f) => {
      const dirPath = path.join(dir, f);
      const isDirectory = fs.statSync(dirPath).isDirectory();
      isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
  }

  let totalPatched = 0;

  walkDir(SRC_DIR, (filePath) => {
    // Only process .ts, .tsx, .js, .sql files
    if (!/\.(tsx?|js|sql)$/.test(filePath)) return;

    // Skip hidden files/folders
    if (filePath.includes('.next') || filePath.includes('node_modules')) return;

    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let changed = false;

    for (const r of replacements) {
      if (r.from.test(content)) {
        console.log(`  Patching ${path.relative(PROJECT_ROOT, filePath)}: ${r.description}`);
        content = content.replace(r.from, r.to);
        changed = true;
      }
    }

    if (changed) {
      fs.writeFileSync(filePath, content, 'utf8');
      totalPatched++;
    }
  });

  console.log(`Backend patch completed. Total files modified: ${totalPatched}`);
  console.log('IMPORTANT: Please verify the changes and run tests to ensure no breakage.');
}

patchBackend().catch((err) => {
  console.error('Error during backend patch:', err);
  process.exit(1);
});
