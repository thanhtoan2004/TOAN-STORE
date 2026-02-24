import {
    mysqlTable,
    serial,
    varchar,
    text,
    timestamp,
    decimal,
    int,
    tinyint,
    mysqlEnum,
    json,
    bigint,
    index,
    unique,
    longtext,
} from 'drizzle-orm/mysql-core';
import { relations, sql } from 'drizzle-orm';

// --- USERS & AUTH ---

export const users = mysqlTable('users', {
    id: serial('id').primaryKey(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    password: varchar('password', { length: 255 }),
    firstName: varchar('first_name', { length: 100 }),
    lastName: varchar('last_name', { length: 100 }),
    phone: varchar('phone', { length: 50 }),
    dateOfBirth: timestamp('date_of_birth'),
    gender: mysqlEnum('gender', ['male', 'female', 'other']),
    accumulatedPoints: int('accumulated_points').default(0),
    membershipTier: mysqlEnum('membership_tier', ['bronze', 'silver', 'gold', 'platinum']).default('bronze'),
    isActive: tinyint('is_active').default(1),
    isVerified: tinyint('is_verified').default(0),
    isBanned: tinyint('is_banned').default(0),
    googleId: varchar('google_id', { length: 255 }).unique(),
    facebookId: varchar('facebook_id', { length: 255 }).unique(),
    avatarUrl: varchar('avatar_url', { length: 1000 }),
    notificationPreferences: json('notification_preferences'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
    deletedAt: timestamp('deleted_at'),
}, (table) => ({
    emailIdx: index('idx_email').on(table.email),
    deletedAtIdx: index('idx_deleted_at').on(table.deletedAt),
}));

// --- CATEGORIES & BRANDS ---

export const categories = mysqlTable('categories', {
    id: serial('id').primaryKey(),
    parentId: bigint('parent_id', { mode: 'number', unsigned: true }),
    name: varchar('name', { length: 200 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    description: text('description'),
    imageUrl: varchar('image_url', { length: 1000 }),
    position: int('position').default(0),
    isActive: tinyint('is_active').default(1),
    metaTitle: varchar('meta_title', { length: 255 }),
    metaDescription: text('meta_description'),
    createdAt: timestamp('created_at').defaultNow(),
    deletedAt: timestamp('deleted_at'),
}, (table) => ({
    deletedAtIdx: index('idx_deleted_at').on(table.deletedAt),
}));

export const brands = mysqlTable('brands', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 200 }).notNull().unique(),
    slug: varchar('slug', { length: 255 }).unique(),
    description: text('description'),
    createdAt: timestamp('created_at').defaultNow(),
});

// --- PRODUCTS & INVENTORY ---

export const products = mysqlTable('products', {
    id: serial('id').primaryKey(),
    sku: varchar('sku', { length: 100 }).unique(),
    name: varchar('name', { length: 500 }).notNull(),
    slug: varchar('slug', { length: 512 }).notNull().unique(),
    shortDescription: text('short_description'),
    description: longtext('description'),
    brandId: bigint('brand_id', { mode: 'number', unsigned: true }),
    categoryId: bigint('category_id', { mode: 'number', unsigned: true }),
    collectionId: bigint('collection_id', { mode: 'number', unsigned: true }),
    basePrice: decimal('base_price', { precision: 12, scale: 2 }).notNull().default('0.00'),
    retailPrice: decimal('retail_price', { precision: 12, scale: 2 }),
    costPrice: decimal('cost_price', { precision: 12, scale: 2 }).default('0.00'),
    isActive: tinyint('is_active').default(1),
    isFeatured: tinyint('is_featured').default(0),
    isNewArrival: tinyint('is_new_arrival').default(1),
    viewCount: int('view_count').default(0),
    saleCount: int('sale_count').default(0),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
    deletedAt: timestamp('deleted_at'),
}, (table) => ({
    activeIdx: index('idx_is_active').on(table.isActive),
    featuredIdx: index('idx_is_featured').on(table.isFeatured),
    deletedAtIdx: index('idx_deleted_at').on(table.deletedAt),
}));

export const productVariants = mysqlTable('product_variants', {
    id: serial('id').primaryKey(),
    productId: bigint('product_id', { mode: 'number', unsigned: true }).notNull(),
    sku: varchar('sku', { length: 200 }).unique(),
    size: varchar('size', { length: 20 }),
    color: varchar('color', { length: 100 }),
    attributes: json('attributes'),
    price: decimal('price', { precision: 12, scale: 2 }).notNull().default('0.00'),
    createdAt: timestamp('created_at').defaultNow(),
});

export const productImages = mysqlTable('product_images', {
    id: serial('id').primaryKey(),
    productId: bigint('product_id', { mode: 'number', unsigned: true }).notNull(),
    colorId: bigint('color_id', { mode: 'number', unsigned: true }),
    url: varchar('url', { length: 1000 }).notNull(),
    altText: varchar('alt_text', { length: 255 }),
    position: int('position').default(0),
    isMain: tinyint('is_main').default(0),
    mediaType: varchar('media_type', { length: 50 }).default('image'),
});

export const inventory = mysqlTable('inventory', {
    id: serial('id').primaryKey(),
    productVariantId: bigint('product_variant_id', { mode: 'number', unsigned: true }).notNull(),
    warehouseId: bigint('warehouse_id', { mode: 'number', unsigned: true }),
    quantity: int('quantity').notNull().default(0),
    reserved: int('reserved').notNull().default(0),
    lowStockThreshold: int('low_stock_threshold').default(10),
    allowBackorder: tinyint('allow_backorder').default(0),
    expectedRestockDate: timestamp('expected_restock_date'),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const warehouses = mysqlTable('warehouses', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull().unique(),
    address: text('address'),
    isActive: tinyint('is_active').default(1),
    createdAt: timestamp('created_at').defaultNow(),
});

export const inventoryTransfers = mysqlTable('inventory_transfers', {
    id: serial('id').primaryKey(),
    fromWarehouseId: bigint('from_warehouse_id', { mode: 'number', unsigned: true }).notNull(),
    toWarehouseId: bigint('to_warehouse_id', { mode: 'number', unsigned: true }).notNull(),
    productVariantId: bigint('product_variant_id', { mode: 'number', unsigned: true }).notNull(),
    quantity: int('quantity').notNull(),
    status: mysqlEnum('status', ['pending', 'approved', 'in_transit', 'completed', 'cancelled']).default('pending'),
    requestedBy: bigint('requested_by', { mode: 'number', unsigned: true }),
    approvedBy: bigint('approved_by', { mode: 'number', unsigned: true }),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow(),
    completedAt: timestamp('completed_at'),
});

export const inventoryLogs = mysqlTable('inventory_logs', {
    id: serial('id').primaryKey(),
    inventoryId: bigint('inventory_id', { mode: 'number', unsigned: true }).notNull(),
    quantityChange: int('quantity_change').notNull(),
    reason: varchar('reason', { length: 255 }).notNull(), // restock, order_reserved, order_cancelled, order_fulfilled, transfer, adjustment
    referenceId: varchar('reference_id', { length: 100 }), // order_id or transfer_id
    createdAt: timestamp('created_at').defaultNow(),
});

// --- ORDERS ---

export const orders = mysqlTable('orders', {
    id: serial('id').primaryKey(),
    userId: bigint('user_id', { mode: 'number', unsigned: true }),
    orderNumber: varchar('order_number', { length: 100 }).notNull().unique(),
    status: mysqlEnum('status', [
        'pending',
        'pending_payment_confirmation',
        'payment_received',
        'confirmed',
        'processing',
        'shipped',
        'delivered',
        'cancelled'
    ]).default('pending'),
    total: decimal('total', { precision: 12, scale: 2 }).notNull().default('0.00'),
    shippingFee: decimal('shipping_fee', { precision: 12, scale: 2 }).default('0.00'),
    discount: decimal('discount', { precision: 12, scale: 2 }).default('0.00'),
    subtotal: decimal('subtotal', { precision: 12, scale: 2 }).notNull().default('0.00'),
    phone: varchar('phone', { length: 255 }),
    email: varchar('email', { length: 255 }),
    paymentMethod: varchar('payment_method', { length: 50 }).default('cod'),
    paymentStatus: mysqlEnum('payment_status', ['pending', 'paid', 'failed', 'refunded']).default('pending'),
    placedAt: timestamp('placed_at').defaultNow(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const orderItems = mysqlTable('order_items', {
    id: serial('id').primaryKey(),
    orderId: bigint('order_id', { mode: 'number', unsigned: true }).notNull(),
    productId: bigint('product_id', { mode: 'number', unsigned: true }),
    productVariantId: bigint('product_variant_id', { mode: 'number', unsigned: true }),
    productName: varchar('product_name', { length: 500 }).notNull(),
    sku: varchar('sku', { length: 100 }),
    size: varchar('size', { length: 10 }).notNull(),
    quantity: int('quantity').notNull(),
    unitPrice: decimal('unit_price', { precision: 12, scale: 2 }),
    totalPrice: decimal('total_price', { precision: 12, scale: 2 }),
    costPrice: decimal('cost_price', { precision: 12, scale: 2 }).default('0.00'),
});

// --- CARTS & WISHLISTS ---

export const carts = mysqlTable('carts', {
    id: serial('id').primaryKey(),
    userId: bigint('user_id', { mode: 'number', unsigned: true }),
    sessionId: varchar('session_id', { length: 255 }),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
    expiresAt: timestamp('expires_at'),
});

export const cartItems = mysqlTable('cart_items', {
    id: serial('id').primaryKey(),
    cartId: bigint('cart_id', { mode: 'number', unsigned: true }).notNull(),
    productId: bigint('product_id', { mode: 'number', unsigned: true }).notNull(),
    productVariantId: bigint('product_variant_id', { mode: 'number', unsigned: true }),
    size: varchar('size', { length: 10 }).notNull(),
    quantity: int('quantity').notNull().default(1),
    price: decimal('price', { precision: 12, scale: 2 }).notNull(),
    addedAt: timestamp('added_at').defaultNow(),
});

export const wishlists = mysqlTable('wishlists', {
    id: serial('id').primaryKey(),
    userId: bigint('user_id', { mode: 'number', unsigned: true }).notNull(),
    name: varchar('name', { length: 255 }).default('My Wishlist'),
    isDefault: tinyint('is_default').default(1),
    createdAt: timestamp('created_at').defaultNow(),
});

export const wishlistItems = mysqlTable('wishlist_items', {
    id: serial('id').primaryKey(),
    wishlistId: bigint('wishlist_id', { mode: 'number', unsigned: true }).notNull(),
    productId: bigint('product_id', { mode: 'number', unsigned: true }).notNull(),
    addedAt: timestamp('added_at').defaultNow(),
});

// --- MARKETING & PROMOTIONS ---

export const banners = mysqlTable('banners', {
    id: serial('id').primaryKey(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    imageUrl: varchar('image_url', { length: 1000 }).notNull(),
    mobileImageUrl: varchar('mobile_image_url', { length: 1000 }),
    linkUrl: varchar('link_url', { length: 1000 }),
    linkText: varchar('link_text', { length: 100 }),
    position: varchar('position', { length: 50 }).default('homepage'),
    displayOrder: int('display_order').default(0),
    startDate: timestamp('start_date'),
    endDate: timestamp('end_date'),
    isActive: tinyint('is_active').default(1),
    clickCount: int('click_count').default(0),
    impressionCount: int('impression_count').default(0),
    createdAt: timestamp('created_at').defaultNow(),
});

export const coupons = mysqlTable('coupons', {
    id: serial('id').primaryKey(),
    code: varchar('code', { length: 100 }).notNull().unique(),
    description: varchar('description', { length: 255 }),
    discountType: mysqlEnum('discount_type', ['fixed', 'percent']).default('fixed'),
    discountValue: decimal('discount_value', { precision: 12, scale: 2 }).notNull(),
    minOrderAmount: decimal('min_order_amount', { precision: 12, scale: 2 }),
    maxDiscountAmount: decimal('max_discount_amount', { precision: 12, scale: 2 }),
    startsAt: timestamp('starts_at'),
    endsAt: timestamp('ends_at'),
    usageLimit: int('usage_limit'),
    usageLimitPerUser: int('usage_limit_per_user'),
    createdAt: timestamp('created_at').defaultNow(),
    deletedAt: timestamp('deleted_at'),
});

export const flashSales = mysqlTable('flash_sales', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    startTime: timestamp('start_time').notNull(),
    endTime: timestamp('end_time').notNull(),
    status: mysqlEnum('status', ['upcoming', 'active', 'ended', 'cancelled']).default('upcoming'),
    createdAt: timestamp('created_at').defaultNow(),
    deletedAt: timestamp('deleted_at'),
});

// --- CMS & CONTENT ---

export const faqs = mysqlTable('faqs', {
    id: serial('id').primaryKey(),
    categoryId: bigint('category_id', { mode: 'number', unsigned: true }).notNull(),
    question: text('question').notNull(),
    answer: longtext('answer').notNull(),
    position: int('position').default(0),
    isActive: tinyint('is_active').default(1),
    createdAt: timestamp('created_at').defaultNow(),
});

export const pages = mysqlTable('pages', {
    id: serial('id').primaryKey(),
    title: varchar('title', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    content: longtext('content'),
    isActive: tinyint('is_active').default(1),
    metaTitle: varchar('meta_title', { length: 255 }),
    metaDescription: text('meta_description'),
    createdAt: timestamp('created_at').defaultNow(),
});

export const news = mysqlTable('news', {
    id: serial('id').primaryKey(),
    title: varchar('title', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    summary: text('summary'),
    content: longtext('content'),
    thumbnailUrl: varchar('thumbnail_url', { length: 1000 }),
    categoryId: bigint('category_id', { mode: 'number', unsigned: true }),
    authorId: bigint('author_id', { mode: 'number', unsigned: true }),
    isActive: tinyint('is_active').default(1),
    publishedAt: timestamp('published_at'),
    createdAt: timestamp('created_at').defaultNow(),
});

export const newsletterSubscriptions = mysqlTable('newsletter_subscriptions', {
    id: serial('id').primaryKey(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    status: mysqlEnum('status', ['subscribed', 'unsubscribed']).default('subscribed'),
    token: varchar('token', { length: 255 }),
    createdAt: timestamp('created_at').defaultNow(),
});

// --- ADMIN & RBAC ---

export const roles = mysqlTable('roles', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 50 }).notNull().unique(), // super_admin, manager, staff, support
    description: varchar('description', { length: 255 }),
    createdAt: timestamp('created_at').defaultNow(),
});

export const permissions = mysqlTable('permissions', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 100 }).notNull().unique(), // e.g., 'read:orders', 'write:products'
    description: varchar('description', { length: 255 }),
});

export const rolePermissions = mysqlTable('role_permissions', {
    id: serial('id').primaryKey(),
    roleId: bigint('role_id', { mode: 'number', unsigned: true }).notNull(),
    permissionId: bigint('permission_id', { mode: 'number', unsigned: true }).notNull(),
}, (table) => ({
    unq: unique().on(table.roleId, table.permissionId),
}));

export const adminUsers = mysqlTable('admin_users', {
    id: serial('id').primaryKey(),
    username: varchar('username', { length: 100 }).notNull().unique(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    password: varchar('password', { length: 255 }).notNull(),
    fullName: varchar('full_name', { length: 255 }),
    roleId: bigint('role_id', { mode: 'number', unsigned: true }),
    isActive: tinyint('is_active').default(1),
    createdAt: timestamp('created_at').defaultNow(),
});

export const adminActivityLogs = mysqlTable('admin_activity_logs', {
    id: serial('id').primaryKey(),
    adminUserId: bigint('admin_user_id', { mode: 'number', unsigned: true }),
    action: varchar('action', { length: 100 }).notNull(),
    entityType: varchar('entity_type', { length: 100 }),
    entityId: varchar('entity_id', { length: 100 }),
    oldValues: json('old_values'),
    newValues: json('new_values'),
    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at').defaultNow(),
});

export const securityLogs = mysqlTable('security_logs', {
    id: serial('id').primaryKey(),
    userId: bigint('user_id', { mode: 'number', unsigned: true }),
    adminId: bigint('admin_id', { mode: 'number', unsigned: true }),
    eventType: varchar('event_type', { length: 100 }).notNull(),
    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: text('user_agent'),
    details: json('details'),
    status: varchar('status', { length: 50 }),
    createdAt: timestamp('created_at').defaultNow(),
});

// --- SUPPORT CHAT ---

export const supportChats = mysqlTable('support_chats', {
    id: serial('id').primaryKey(),
    userId: bigint('user_id', { mode: 'number', unsigned: true }),
    guestEmail: varchar('guest_email', { length: 255 }),
    guestName: varchar('guest_name', { length: 255 }),
    status: mysqlEnum('status', ['waiting', 'active', 'resolved', 'closed']).default('waiting'),
    accessToken: varchar('access_token', { length: 255 }),
    lastMessageAt: timestamp('last_message_at').defaultNow(),
    createdAt: timestamp('created_at').defaultNow(),
});

export const supportMessages = mysqlTable('support_messages', {
    id: serial('id').primaryKey(),
    chatId: bigint('chat_id', { mode: 'number', unsigned: true }).notNull(),
    senderType: mysqlEnum('sender_type', ['customer', 'admin']).notNull(),
    senderId: bigint('sender_id', { mode: 'number', unsigned: true }),
    message: text('message'),
    imageUrl: varchar('image_url', { length: 500 }),
    isRead: tinyint('is_read').default(0),
    createdAt: timestamp('created_at').defaultNow(),
});

// --- REVIEWS & FEEDBACK ---

export const productReviews = mysqlTable('product_reviews', {
    id: serial('id').primaryKey(),
    productId: bigint('product_id', { mode: 'number', unsigned: true }).notNull(),
    userId: bigint('user_id', { mode: 'number', unsigned: true }),
    rating: tinyint('rating').notNull(),
    comment: text('comment'),
    authorName: varchar('author_name', { length: 255 }),
    status: mysqlEnum('status', ['pending', 'approved', 'rejected']).default('pending'),
    isFeatured: tinyint('is_featured').default(0),
    createdAt: timestamp('created_at').defaultNow(),
});

// --- STORES ---

export const stores = mysqlTable('stores', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    address: text('address').notNull(),
    phone: varchar('phone', { length: 50 }),
    latitude: decimal('latitude', { precision: 10, scale: 8 }),
    longitude: decimal('longitude', { precision: 11, scale: 8 }),
    isActive: tinyint('is_active').default(1),
    createdAt: timestamp('created_at').defaultNow(),
});

export const storeHours = mysqlTable('store_hours', {
    id: serial('id').primaryKey(),
    storeId: bigint('store_id', { mode: 'number', unsigned: true }).notNull(),
    dayOfWeek: tinyint('day_of_week').notNull(), // 0-6
    openTime: varchar('open_time', { length: 5 }), // HH:mm
    closeTime: varchar('close_time', { length: 5 }),
    isClosed: tinyint('is_closed').default(0),
});

// --- ADVANCED METADATA ---

export const seoMetadata = mysqlTable('seo_metadata', {
    id: serial('id').primaryKey(),
    entityType: mysqlEnum('entity_type', ['product', 'category', 'collection', 'page']).notNull(),
    entityId: bigint('entity_id', { mode: 'number', unsigned: true }).notNull(),
    title: varchar('title', { length: 255 }),
    description: text('description'),
    keywords: varchar('keywords', { length: 500 }),
    ogImageUrl: varchar('og_image_url', { length: 1000 }),
    canonicalUrl: varchar('canonical_url', { length: 500 }),
    structuredData: json('structured_data'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
}, (table) => ({
    unq: unique().on(table.entityType, table.entityId),
}));

// --- ANALYTICS & METRICS ---

export const dailyMetrics = mysqlTable('daily_metrics', {
    date: timestamp('date').primaryKey(),
    revenue: decimal('revenue', { precision: 15, scale: 2 }).default('0.00'),
    ordersCount: int('orders_count').default(0),
    customersCount: int('customers_count').default(0),
    cancelledCount: int('cancelled_count').default(0),
    totalCost: decimal('total_cost', { precision: 15, scale: 2 }).default('0.00'),
    netProfit: decimal('net_profit', { precision: 15, scale: 2 }).default('0.00'),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const searchAnalytics = mysqlTable('search_analytics', {
    id: serial('id').primaryKey(),
    query: varchar('query', { length: 255 }).notNull(),
    categoryFilter: varchar('category_filter', { length: 100 }),
    resultsCount: int('results_count').default(0),
    processingTimeMs: int('processing_time_ms').default(0),
    userId: bigint('user_id', { mode: 'number', unsigned: true }),
    ipAddress: varchar('ip_address', { length: 45 }),
    createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
    queryIdx: index('idx_query').on(table.query),
    createdAtIdx: index('idx_created_at').on(table.createdAt),
}));

