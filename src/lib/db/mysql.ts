// Facade for database operations
// This file re-exports everything from the granular repositories for backward compatibility.
// Future imports should prefer importing from specific repositories.

// 1. Connection & Core
export * from './connection';
import { executeQuery, pool } from './connection';

// 2. Repositories
export * from './repositories/product';
export * from './repositories/cart';
export * from './repositories/wishlist';
export * from './repositories/user';
export * from './repositories/order';
export * from './repositories/payment';
export * from './repositories/store';

// 3. Init DB
import { initDb } from './init';
export { initDb };

// Re-export pool as default for legacy support if needed
export default pool;
