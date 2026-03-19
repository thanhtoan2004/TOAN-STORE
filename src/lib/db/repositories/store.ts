import { db } from '../drizzle';
import { stores, storeHours } from '../schema';
import { eq, and, sql, desc, asc, like } from 'drizzle-orm';

/**
 * Store functions
 */
export async function getStores(city?: string) {
  const hoursSql = sql<string>`
      GROUP_CONCAT(
        CONCAT(
          CASE ${storeHours.dayOfWeek}
            WHEN 0 THEN 'CN'
            WHEN 1 THEN 'T2'
            WHEN 2 THEN 'T3'
            WHEN 3 THEN 'T4'
            WHEN 4 THEN 'T5'
            WHEN 5 THEN 'T6'
            WHEN 6 THEN 'T7'
            WHEN 7 THEN 'CN'
          END,
          ': ',
          CASE 
            WHEN ${storeHours.isClosed} = 1 THEN 'Đóng cửa'
            ELSE CONCAT(TIME_FORMAT(${storeHours.openTime}, '%H:%i'), ' - ', TIME_FORMAT(${storeHours.closeTime}, '%H:%i'))
          END
        )
        ORDER BY ${storeHours.dayOfWeek}
        SEPARATOR ' | '
      )
    `.as('hours');

  const conditions = [eq(stores.isActive, 1)];
  if (city) {
    conditions.push(like(stores.city, `%${city}%`));
  }

  return await db
    .select({
      id: stores.id,
      name: stores.name,
      address: stores.address,
      city: stores.city,
      state: stores.state,
      phone: stores.phone,
      email: stores.email,
      latitude: stores.latitude,
      longitude: stores.longitude,
      description: stores.description,
      hours: hoursSql,
    })
    .from(stores)
    .leftJoin(storeHours, eq(stores.id, storeHours.storeId))
    .where(and(...conditions))
    .groupBy(stores.id)
    .orderBy(asc(stores.city), asc(stores.name));
}
