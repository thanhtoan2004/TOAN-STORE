const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const util = require('util');

const execPromise = util.promisify(exec);

async function deploy() {
    console.log('🚀 Starting Deployment Process...');
    const startTime = Date.now();

    try {
        // 1. BACKUP DATABASE
        console.log('\n💾 [1/3] Backing up Database...');
        try {
            await execPromise('node scripts/backup-db.js');
            console.log('✅ Backup completed successfully.');
        } catch (error) {
            console.error('❌ Backup failed!');
            console.error(error.message);
            console.log('⚠️  Aborting deployment to protect data.');
            process.exit(1);
        }

        // 2. MIGRATION (Optional but recommended)
        console.log('\n🛠️  [2/3] Checking Database Migrations...');
        try {
            await execPromise('node scripts/migrate.js');
            console.log('✅ Database is up to date.');
        } catch (error) {
            console.error('❌ Migration failed!');
            console.error(error.message);
            process.exit(1);
        }

        // 3. BUILD PROJECT
        console.log('\n🏗️  [3/3] Building Project...');
        try {
            // Note: In a real server, you might use 'npm ci' first.
            await execPromise('npm run build');
            console.log('✅ Build successful.');
        } catch (error) {
            console.error('❌ Build failed!');
            console.error(error.stdout); // Build errors usually in stdout
            console.error(error.stderr);
            process.exit(1);
        }

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`\n🎉 Deployment Ready! (Took ${duration}s)`);
        console.log('👉 You can now restart your server (e.g., pm2 restart nike-clone)');

    } catch (err) {
        console.error('\n❌ Unexpected Deployment Error:', err);
        process.exit(1);
    }
}

deploy();
