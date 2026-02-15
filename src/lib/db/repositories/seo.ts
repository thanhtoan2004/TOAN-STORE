import { executeQuery } from '../mysql';

export interface SeoMetadata {
    id?: number;
    entity_type: 'product' | 'category' | 'collection' | 'page';
    entity_id: number;
    title: string;
    description: string;
    keywords?: string;
    og_image_url?: string;
    canonical_url?: string;
    structured_data?: any;
}

export async function getSeoMetadata(entityType: string, entityId: number): Promise<SeoMetadata | null> {
    const rows = await executeQuery<SeoMetadata[]>(
        'SELECT * FROM seo_metadata WHERE entity_type = ? AND entity_id = ?',
        [entityType, entityId]
    );
    return rows.length > 0 ? rows[0] : null;
}

export async function upsertSeoMetadata(data: SeoMetadata): Promise<boolean> {
    const existing = await getSeoMetadata(data.entity_type, data.entity_id);

    if (existing) {
        const result = await executeQuery<any>(
            `UPDATE seo_metadata 
       SET title = ?, description = ?, keywords = ?, og_image_url = ?, canonical_url = ?, structured_data = ?
       WHERE entity_type = ? AND entity_id = ?`,
            [
                data.title,
                data.description,
                data.keywords || null,
                data.og_image_url || null,
                data.canonical_url || null,
                JSON.stringify(data.structured_data || {}),
                data.entity_type,
                data.entity_id
            ]
        );
        return result.affectedRows > 0;
    } else {
        const result = await executeQuery<any>(
            `INSERT INTO seo_metadata (entity_type, entity_id, title, description, keywords, og_image_url, canonical_url, structured_data)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                data.entity_type,
                data.entity_id,
                data.title,
                data.description,
                data.keywords || null,
                data.og_image_url || null,
                data.canonical_url || null,
                JSON.stringify(data.structured_data || {})
            ]
        );
        return result.insertId > 0;
    }
}

export async function deleteSeoMetadata(entityType: string, entityId: number): Promise<boolean> {
    const result = await executeQuery<any>(
        'DELETE FROM seo_metadata WHERE entity_type = ? AND entity_id = ?',
        [entityType, entityId]
    );
    return result.affectedRows > 0;
}
