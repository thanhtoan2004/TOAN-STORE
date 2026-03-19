import { db } from '../drizzle';
import { attributes, attributeValues, productAttributeValues } from '../schema';
import { eq, and, asc } from 'drizzle-orm';

export interface Attribute {
  id?: number;
  name: string;
  slug: string;
  type: 'text' | 'number' | 'select' | 'color' | 'boolean';
  isFilterable: boolean;
}

export interface AttributeValue {
  productId: number;
  attributeId: number;
  valueText?: string;
  valueId?: number;
}

export async function getAllAttributes(): Promise<any[]> {
  return await db.select().from(attributes).orderBy(asc(attributes.name));
}

export async function getProductAttributes(productId: number) {
  return await db
    .select({
      name: attributes.name,
      slug: attributes.slug,
      type: attributes.type,
      valueText: productAttributeValues.valueText,
      optionLabel: attributeValues.value,
      optionValue: attributeValues.value,
    })
    .from(productAttributeValues)
    .innerJoin(attributes, eq(productAttributeValues.attributeId, attributes.id))
    .leftJoin(attributeValues, eq(productAttributeValues.valueId, attributeValues.id))
    .where(eq(productAttributeValues.productId, productId));
}

export async function upsertProductAttribute(data: AttributeValue): Promise<boolean> {
  const [existing] = await db
    .select({ id: productAttributeValues.id })
    .from(productAttributeValues)
    .where(
      and(
        eq(productAttributeValues.productId, data.productId),
        eq(productAttributeValues.attributeId, data.attributeId)
      )
    )
    .limit(1);

  if (existing) {
    const [result] = await db
      .update(productAttributeValues)
      .set({
        valueText: data.valueText || null,
        valueId: data.valueId || null,
        updatedAt: new Date(),
      })
      .where(eq(productAttributeValues.id, existing.id));
    return result.affectedRows > 0;
  } else {
    const [result] = await db.insert(productAttributeValues).values({
      productId: data.productId,
      attributeId: data.attributeId,
      valueText: data.valueText || null,
      valueId: data.valueId || null,
    });
    return result.insertId > 0;
  }
}

export async function deleteProductAttribute(
  productId: number,
  attributeId: number
): Promise<boolean> {
  const [result] = await db
    .delete(productAttributeValues)
    .where(
      and(
        eq(productAttributeValues.productId, productId),
        eq(productAttributeValues.attributeId, attributeId)
      )
    );
  return result.affectedRows > 0;
}
