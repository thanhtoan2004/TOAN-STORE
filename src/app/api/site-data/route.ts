import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { menuItems, siteSettings } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * Public API to fetch site configuration (Menus, Social links).
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Fetch ALL Settings
    const allSettings = await db.select().from(siteSettings);
    const settings: Record<string, any> = {};
    allSettings.forEach((s) => {
      settings[s.key] = s.value;
    });

    // Provide a legacy 'socialLinks' for Footer.tsx
    const socialLinks = {
      facebook: settings.facebook,
      instagram: settings.instagram,
      youtube: settings.youtube,
      twitter: settings.twitter,
    };

    // 2. Fetch Active Menu Items
    const allMenu = await db
      .select()
      .from(menuItems)
      .where(eq(menuItems.isActive, 1))
      .orderBy(asc(menuItems.order));

    // 3. Group Menus by Location with Hierarchy (Tree structure)
    const buildMenuTree = (location: string) => {
      const locationMenus = allMenu.filter((m) => m.location === location);

      // Find top level items
      const roots = locationMenus.filter((m) => !m.parentId);

      // Attach children to each root
      return roots.map((root) => ({
        ...root,
        children: locationMenus.filter((m) => m.parentId === root.id),
      }));
    };

    const menusByLocation: Record<string, any[]> = {
      header: buildMenuTree('header'),
      footer_main: buildMenuTree('footer_main'),
      footer_help: buildMenuTree('footer_help'),
      footer_company: buildMenuTree('footer_company'),
      footer_promos: buildMenuTree('footer_promos'),
      footer_bottom: buildMenuTree('footer_bottom'),
    };

    return ResponseWrapper.success({
      socialLinks,
      menus: menusByLocation,
      settings,
    });
  } catch (error) {
    console.error('Error fetching site data:', error);
    return ResponseWrapper.serverError('Internal server error');
  }
}
