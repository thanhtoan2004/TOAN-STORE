import { db } from '../src/lib/db/drizzle';
import { products } from '../src/lib/db/schema';
import { logger } from '../src/lib/logger';
import { eq } from 'drizzle-orm';

async function verifyEnterpriseSetup() {
    try {
        logger.info('Starting Enterprise Verification...');

        // 1. Test Drizzle Query
        logger.info('Testing Drizzle ORM Query...');
        const allProducts = await db.select().from(products).limit(5);
        logger.info(`Successfully fetched ${allProducts.length} products using Drizzle.`);

        if (allProducts.length > 0) {
            const firstProduct = allProducts[0];
            logger.info({ product: { id: firstProduct.id, name: firstProduct.name } }, 'First product sample');

            // 2. Test Single Fetch
            const single = await db.select().from(products).where(eq(products.id, firstProduct.id)).limit(1);
            if (single.length > 0) {
                logger.info('Single product fetch successful.');
            }
        }

        logger.info('✅ Enterprise Infrastructure Verification Complete.');
        process.exit(0);
    } catch (error: any) {
        logger.error({ err: error }, '❌ Verification Failed');
        process.exit(1);
    }
}

verifyEnterpriseSetup();
