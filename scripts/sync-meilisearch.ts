
import dotenv from 'dotenv';
import path from 'path';
import { executeQuery } from '../src/lib/db/mysql';
import { meiliClient, PRODUCT_INDEX, ProductDocument } from '../src/lib/meilisearch';

// Load env vars from root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function syncProducts() {
    console.log('🔄 Starting Meilisearch sync...');

    try {
        // 1. Fetch all active products
        const products = await executeQuery<any[]>(`
      SELECT 
        p.id, 
        p.name, 
        p.slug, 
        p.description, 
        p.short_description, 
        p.base_price, 
        p.retail_price, 
        p.is_new_arrival, 
        p.created_at,
        c.name as category_name,
        b.name as brand_name,
        (SELECT url FROM product_images WHERE product_id = p.id AND is_main = 1 LIMIT 1) as main_image,
        (SELECT url FROM product_images WHERE product_id = p.id LIMIT 1) as fallback_image
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE p.deleted_at IS NULL AND p.is_active = 1
    `, []);

        console.log(`📦 Found ${products.length} products to sync.`);

        if (products.length === 0) {
            console.log('⚠️ No products found. Exiting.');
            process.exit(0);
        }

        // 2. Format documents
        const documents: ProductDocument[] = products.map(p => {
            const price = Number(p.retail_price || p.base_price);
            return {
                id: p.id,
                name: p.name,
                slug: p.slug,
                description: p.description || '',
                short_description: p.short_description || '',
                base_price: Number(p.base_price),
                retail_price: Number(p.retail_price || 0),
                current_price: price,
                image_url: p.main_image || p.fallback_image || '',
                category_name: p.category_name || 'Uncategorized',
                brand_name: p.brand_name || 'No Brand',
                is_active: true,
                is_new_arrival: !!p.is_new_arrival,
                created_at: new Date(p.created_at).getTime(),
            };
        });

        // 3. Configure Index
        console.log('⚙️ Configuring index settings...');
        const index = meiliClient.index(PRODUCT_INDEX);

        // Introspection
        console.log('Index methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(index)));
        console.log('Client methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(meiliClient)));

        await index.updateSettings({
            searchableAttributes: [
                'name',
                'category_name',
                'brand_name',
                'description',
                'short_description'
            ],
            filterableAttributes: [
                'category_name',
                'brand_name',
                'current_price',
                'is_new_arrival',
                'is_active'
            ],
            sortableAttributes: [
                'current_price',
                'created_at'
            ],
            rankingRules: [
                'words',
                'typo',
                'proximity',
                'attribute',
                'sort',
                'exactness',
                'created_at:desc'
            ]
        });

        // 4. Upload Documents
        console.log('🚀 Uploading documents...');
        const task = await index.addDocuments(documents, { primaryKey: 'id' });
        console.log('Task response:', task);
        const taskUid = task.taskUid;

        // Dynamic choice of wait method
        console.log('⏳ Waiting for task completion...');

        if (typeof (index as any).waitForTask === 'function') {
            console.log('Using index.waitForTask');
            await (index as any).waitForTask(taskUid);
        } else if (typeof (meiliClient as any).waitForTask === 'function') {
            console.log('Using client.waitForTask');
            await (meiliClient as any).waitForTask(taskUid);
        } else {
            console.log('Falling back to manual polling');
            let status = 'enqueued';
            while (status === 'enqueued' || status === 'processing') {
                await new Promise(resolve => setTimeout(resolve, 500));
                let taskInfo;
                if (typeof (index as any).getTask === 'function') {
                    taskInfo = await (index as any).getTask(taskUid);
                } else if (typeof (meiliClient as any).getTask === 'function') {
                    taskInfo = await (meiliClient as any).getTask(taskUid);
                } else {
                    console.log('❌ Neither getTask nor waitForTask found on Index or Client');
                    break;
                }
                status = taskInfo.status;
                console.log(`...task status: ${status}`);
            }
        }

        console.log('✅ Sync completed successfully!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Sync failed:', error);
        process.exit(1);
    }
}

syncProducts();
