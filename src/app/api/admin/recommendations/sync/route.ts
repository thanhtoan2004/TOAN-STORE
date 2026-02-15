import { NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { executeQuery } from '@/lib/db/mysql';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST() {
    const admin = await checkAdminAuth();
    if (!admin) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    if (!process.env.GEMINI_API_KEY) {
        return NextResponse.json({ success: false, message: 'Gemini API key not configured' }, { status: 500 });
    }

    try {
        // 1. Fetch all active products
        const products = await executeQuery<any[]>(`
      SELECT p.id, p.name, p.short_description, p.description, c.name as category
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = 1 AND p.deleted_at IS NULL
    `);

        const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
        let syncCount = 0;

        for (const product of products) {
            // Create a rich text representation for embedding
            const textToEmbed = `
        Product: ${product.name}
        Category: ${product.category || 'Uncategorized'}
        Description: ${product.short_description || ''} ${product.description || ''}
      `.trim();

            try {
                const result = await model.embedContent(textToEmbed);
                const embedding = result.embedding.values;

                // Save or update embedding
                await executeQuery(
                    'INSERT INTO product_embeddings (product_id, embedding) VALUES (?, ?) ON DUPLICATE KEY UPDATE embedding = VALUES(embedding)',
                    [product.id, JSON.stringify(embedding)]
                );
                syncCount++;
            } catch (embedError) {
                console.error(`Error embedding product ${product.id}:`, embedError);
            }
        }

        return NextResponse.json({
            success: true,
            message: `Synchronized ${syncCount} product embeddings.`,
            totalProducts: products.length
        });
    } catch (error) {
        console.error('Embedding Sync Error:', error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}
