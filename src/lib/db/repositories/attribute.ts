import { executeQuery } from '../mysql';

export interface Attribute {
  id?: number;
  name: string;
  slug: string;
  type: 'text' | 'number' | 'select' | 'color' | 'boolean';
  is_filterable: boolean;
}

export interface AttributeValue {
  product_id: number;
  attribute_id: number;
  value_text?: string;
  value_id?: number;
}

export async function getAllAttributes(): Promise<Attribute[]> {
  return executeQuery<Attribute[]>('SELECT * FROM attributes ORDER BY name ASC');
}

export async function getProductAttributes(productId: number) {
  return executeQuery<any[]>(
    `SELECT 
        a.name, 
        a.slug, 
        a.type,
        pav.value_text,
        av.value as option_label,
        av.value as option_value
     FROM product_attribute_values pav
     JOIN attributes a ON pav.attribute_id = a.id
     LEFT JOIN attribute_values av ON pav.value_id = av.id
     WHERE pav.product_id = ?`,
    [productId]
  );
}

export async function upsertProductAttribute(data: AttributeValue): Promise<boolean> {
  // Check if exists
  const existing = await executeQuery<any[]>(
    'SELECT id FROM product_attribute_values WHERE product_id = ? AND attribute_id = ?',
    [data.product_id, data.attribute_id]
  );

  if (existing.length > 0) {
    const result = await executeQuery<any>(
      'UPDATE product_attribute_values SET value_text = ?, value_id = ? WHERE product_id = ? AND attribute_id = ?',
      [data.value_text || null, data.value_id || null, data.product_id, data.attribute_id]
    );
    return result.affectedRows > 0;
  } else {
    const result = await executeQuery<any>(
      'INSERT INTO product_attribute_values (product_id, attribute_id, value_text, value_id) VALUES (?, ?, ?, ?)',
      [data.product_id, data.attribute_id, data.value_text || null, data.value_id || null]
    );
    return result.insertId > 0;
  }
}

export async function deleteProductAttribute(
  productId: number,
  attributeId: number
): Promise<boolean> {
  const result = await executeQuery<any>(
    'DELETE FROM product_attribute_values WHERE product_id = ? AND attribute_id = ?',
    [productId, attributeId]
  );
  return result.affectedRows > 0;
}
