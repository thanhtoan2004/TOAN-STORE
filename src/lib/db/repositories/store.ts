import { executeQuery } from '../connection';

// Store functions
export async function getStores(city?: string) {
    let query = `
    SELECT 
      s.id,
      s.name,
      s.address,
      s.city,
      s.state,
      s.phone,
      s.email,
      s.latitude,
      s.longitude,
      s.description,
      GROUP_CONCAT(
        CONCAT(
          CASE sh.day_of_week
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
            WHEN sh.is_closed = 1 THEN 'Đóng cửa'
            ELSE CONCAT(TIME_FORMAT(sh.open_time, '%H:%i'), ' - ', TIME_FORMAT(sh.close_time, '%H:%i'))
          END
        )
        ORDER BY sh.day_of_week
        SEPARATOR ' | '
      ) as hours
    FROM stores s
    LEFT JOIN store_hours sh ON s.id = sh.store_id
    WHERE s.is_active = 1
  `;

    const params: any[] = [];
    if (city) {
        query += ' AND s.city LIKE ?';
        params.push(`%${city}%`);
    }

    query += ' GROUP BY s.id ORDER BY s.city, s.name';

    return executeQuery(query, params);
}
