import { pool } from '../lib/db/connection';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const DEFAULT_ADMIN_PASSWORD = 'admin_password_123'; // User should change this immediately

async function seedAdmin() {
  const connection = await pool.getConnection();
  try {
    console.log('--- Seeding Admin Users (SEC-01) ---');

    const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);

    // Update the system admin (ID 1)
    const [result]: any = await connection.execute(
      'UPDATE admin_users SET password = ? WHERE username = ?',
      [hashedPassword, 'admin']
    );

    if (result.affectedRows > 0) {
      console.log(`[OK] Updated 'admin' password to secure hash.`);
    } else {
      // If not exists (unlikely given db.sql), create it
      await connection.execute(
        `INSERT INTO admin_users (username, email, password, full_name, role_id) 
         VALUES (?, ?, ?, ?, ?)`,
        ['admin', 'admin@toanstore.com', hashedPassword, 'System Administrator', 4]
      );
      console.log(`[OK] Created new 'admin' user.`);
    }

    console.log('--- Admin Seeding Completed ---');
    console.log(`IMPORTANT: Default admin password is set to: ${DEFAULT_ADMIN_PASSWORD}`);
    console.log('Please change it immediately upon first login.');
  } catch (error) {
    console.error('Error during admin seeding:', error);
  } finally {
    connection.release();
    process.exit(0);
  }
}

seedAdmin();
