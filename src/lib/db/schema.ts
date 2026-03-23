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
  date,
  mysqlView,
  time,
  datetime,
} from 'drizzle-orm/mysql-core';
import { relations, sql } from 'drizzle-orm';

// --- USERS & AUTH ---

export const users = mysqlTable(
  'users',
  {
    id: serial('id').primaryKey(),
    email: varchar('email', { length: 255 }).notNull(),
    emailHash: varchar('email_hash', { length: 64 }),
    emailEncrypted: text('email_encrypted'),
    password: varchar('password', { length: 255 }),
    firstName: varchar('first_name', { length: 100 }),
    lastName: varchar('last_name', { length: 100 }),
    fullName: varchar('full_name', { length: 255 }),
    phone: varchar('phone', { length: 255 }),
    phoneEncrypted: text('phone_encrypted'),
    dateOfBirth: date('date_of_birth'),
    dateOfBirthEncrypted: text('date_of_birth_encrypted'),
    isEncrypted: tinyint('is_encrypted').default(0),
    gender: mysqlEnum('gender', ['male', 'female', 'other']),
    isActive: tinyint('is_active').default(1),
    isVerified: tinyint('is_verified').default(0),
    meta: json('meta'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
    isBanned: tinyint('is_banned').default(0),
    membershipTier: mysqlEnum('membership_tier', ['bronze', 'silver', 'gold', 'platinum']).default(
      'bronze'
    ),
    deletedAt: timestamp('deleted_at'),
    googleId: varchar('google_id', { length: 255 }).unique(),
    facebookId: varchar('facebook_id', { length: 255 }).unique(),
    avatarUrl: varchar('avatar_url', { length: 1000 }),
    failedLoginAttempts: int('failed_login_attempts').default(0),
    lockoutUntil: timestamp('lockout_until'),
    tokenVersion: int('token_version').default(1),
    twoFactorEnabled: tinyint('two_factor_enabled').default(0),
    emailNotifications: tinyint('email_notifications').default(1),
    smsNotifications: tinyint('sms_notifications').default(0),
    pushNotifications: tinyint('push_notifications').default(1),
    promoNotifications: tinyint('promo_notifications').default(0),
    orderNotifications: tinyint('order_notifications').default(1),
    dataPersistence: tinyint('data_persistence').default(1),
    publicProfile: tinyint('public_profile').default(1),
    smsOrderNotifications: tinyint('sms_order_notifications').default(0),
    lifetimePoints: int('lifetime_points').notNull().default(0),
    availablePoints: int('available_points').notNull().default(0),
    tierUpdatedAt: timestamp('tier_updated_at'),
    pointsExpiryDate: date('points_expiry_date'),
  },
  (table) => ({
    emailIdx: index('idx_email').on(table.email),
    isBannedIdx: index('idx_is_banned').on(table.isBanned),
    deletedAtIdx: index('idx_deleted_at').on(table.deletedAt),
    isEncryptedIdx: index('idx_is_encrypted').on(table.isEncrypted),
    emailVerifiedIdx: index('idx_email_verified').on(table.email, table.isVerified),
    activeCreatedIdx: index('idx_active_created').on(table.isActive, table.createdAt),
    tierIdx: index('idx_users_tier').on(table.membershipTier),
    lifetimeIdx: index('idx_users_lifetime').on(table.lifetimePoints),
    tierPointsIdx: index('idx_tier_points').on(table.membershipTier, table.lifetimePoints),
  })
);

export const userAddresses = mysqlTable(
  'user_addresses',
  {
    id: serial('id').primaryKey(),
    userId: bigint('user_id', { mode: 'number', unsigned: true }).notNull(),
    label: varchar('label', { length: 100 }),
    recipientName: varchar('recipient_name', { length: 255 }),
    recipientNameEncrypted: text('recipient_name_encrypted'),
    phone: varchar('phone', { length: 255 }),
    phoneEncrypted: text('phone_encrypted'),
    addressLine: varchar('address_line', { length: 255 }),
    addressEncrypted: text('address_encrypted'),
    ward: varchar('ward', { length: 100 }),
    district: varchar('district', { length: 100 }),
    city: varchar('city', { length: 100 }),
    state: varchar('state', { length: 100 }),
    postalCode: varchar('postal_code', { length: 20 }),
    country: varchar('country', { length: 100 }).default('Vietnam'),
    isDefault: tinyint('is_default').default(0),
    createdAt: timestamp('created_at').defaultNow(),
    isEncrypted: tinyint('is_encrypted').default(0),
  },
  (table) => ({
    userIdIdx: index('user_id').on(table.userId),
    isEncryptedIdx: index('idx_is_encrypted').on(table.isEncrypted),
    userAddrDefaultIdx: index('idx_user_addr_default').on(table.userId, table.isDefault),
  })
);

export const userConsents = mysqlTable(
  'user_consents',
  {
    id: serial('id').primaryKey(),
    userId: bigint('user_id', { mode: 'number', unsigned: true }).notNull(),
    purpose: mysqlEnum('purpose', [
      'marketing',
      'analytics',
      'personalization',
      'third_party',
    ]).notNull(),
    isGranted: tinyint('is_granted').default(0),
    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: text('user_agent'),
    version: int('version').default(1),
    grantedAt: timestamp('granted_at'),
    revokedAt: timestamp('revoked_at'),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    userPurposeIdx: index('idx_user_purpose').on(table.userId, table.purpose),
    createdAtIdx: index('idx_created_at').on(table.createdAt),
  })
);

// --- CATEGORIES & BRANDS ---

export const categories = mysqlTable(
  'categories',
  {
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
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    deletedAtIdx: index('idx_deleted_at').on(table.deletedAt),
  })
);

export const pointTransactions = mysqlTable(
  'point_transactions',
  {
    id: serial('id').primaryKey(),
    userId: bigint('user_id', { mode: 'number', unsigned: true }).notNull(),
    points: int('points').notNull(),
    type: mysqlEnum('type', ['earn', 'redeem', 'expire', 'refund', 'adjust']).notNull(),
    description: varchar('description', { length: 255 }),
    createdAt: timestamp('created_at').defaultNow(),
    balanceAfter: int('balance_after').notNull().default(0),
    source: varchar('source', { length: 50 }),
    sourceId: varchar('source_id', { length: 100 }),
    expiresAt: timestamp('expires_at'),
  },
  (table) => ({
    user_idx: index('idx_pt_user').on(table.userId),
    type_idx: index('idx_pt_type').on(table.type),
    expires_idx: index('idx_pt_expires').on(table.expiresAt),
    user_time_idx: index('idx_pt_user_time').on(table.userId, table.createdAt),
  })
);

export const collections = mysqlTable(
  'collections',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull(),
    description: text('description'),
    imageUrl: varchar('image_url', { length: 1000 }),
    isActive: tinyint('is_active').default(1),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    slugIdx: unique('slug').on(table.slug),
    deletedAtIdx: index('idx_deleted_at').on(table.deletedAt),
  })
);

export const sports = mysqlTable(
  'sports',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 200 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull(),
    description: text('description'),
    imageUrl: varchar('image_url', { length: 1000 }),
    isActive: tinyint('is_active').default(1),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  (table) => ({
    slugIdx: unique('slug').on(table.slug),
  })
);

export const categoryAttributes = mysqlTable('category_attributes', {
  id: serial('id').primaryKey(),
  categoryId: bigint('category_id', { mode: 'number', unsigned: true }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  type: mysqlEnum('type', ['text', 'number', 'select', 'boolean']).default('text'),
  isFilterable: tinyint('is_filterable').default(0),
  isRequired: tinyint('is_required').default(0),
  options: json('options'),
});

export const brands = mysqlTable('brands', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 200 }).notNull().unique(),
  slug: varchar('slug', { length: 255 }).unique(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
});

// --- PRODUCTS & INVENTORY ---

export const attributes = mysqlTable('attributes', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  type: mysqlEnum('type', ['text', 'number', 'select', 'color', 'boolean']).default('text'),
  isFilterable: tinyint('is_filterable').default(1),
  createdAt: timestamp('created_at').defaultNow(),
});

export const attributeValues = mysqlTable(
  'attribute_values',
  {
    id: serial('id').primaryKey(),
    attributeId: bigint('attribute_id', { mode: 'number', unsigned: true }).notNull(),
    value: varchar('value', { length: 255 }).notNull(),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    attrIdx: index('attribute_id').on(table.attributeId),
  })
);

export const products = mysqlTable(
  'products',
  {
    id: serial('id').primaryKey(),
    sku: varchar('sku', { length: 100 }).unique(),
    name: varchar('name', { length: 500 }).notNull(),
    slug: varchar('slug', { length: 512 }).notNull().unique(),
    shortDescription: text('short_description'),
    description: longtext('description'),
    brandId: bigint('brand_id', { mode: 'number', unsigned: true }),
    categoryId: bigint('category_id', { mode: 'number', unsigned: true }),
    collectionId: bigint('collection_id', { mode: 'number', unsigned: true }),
    priceCache: decimal('price_cache', { precision: 12, scale: 2 }).notNull().default('0.00'),
    msrpPrice: decimal('msrp_price', { precision: 12, scale: 2 }),
    costPrice: decimal('cost_price', { precision: 12, scale: 2 }).default('0.00'),
    isActive: tinyint('is_active').default(1),
    isFeatured: tinyint('is_featured').default(0),
    isNewArrival: tinyint('is_new_arrival').default(0),
    viewCount: int('view_count').default(0),
    saleCount: int('sale_count').default(0),
    metaTitle: varchar('meta_title', { length: 255 }),
    metaDescription: text('meta_description'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
    sportId: bigint('sport_id', { mode: 'number', unsigned: true }),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    brandIdx: index('brand_id').on(table.brandId),
    categoryIdx: index('category_id').on(table.categoryId),
    collectionIdx: index('collection_id').on(table.collectionId),
    skuIdx: index('idx_sku').on(table.sku),
    slugIdx: index('idx_slug').on(table.slug),
    sportIdx: index('fk_product_sport').on(table.sportId),
    deletedAtIdx: index('idx_deleted_at').on(table.deletedAt),
    categoryActiveIdx: index('idx_category_active_created').on(
      table.categoryId,
      table.isActive,
      table.createdAt
    ),
    featuredActiveIdx: index('idx_featured_active').on(table.isFeatured, table.isActive),
    brandActiveIdx: index('idx_brand_active').on(table.brandId, table.isActive),
    newArrivalIdx: index('idx_new_arrival_created').on(table.isNewArrival, table.createdAt),
  })
);

export const productVariants = mysqlTable(
  'product_variants',
  {
    id: serial('id').primaryKey(),
    productId: bigint('product_id', { mode: 'number', unsigned: true }).notNull(),
    sku: varchar('sku', { length: 200 }).unique(),
    size: varchar('size', { length: 20 }),
    colorId: bigint('color_id', { mode: 'number', unsigned: true }),
    barcode: varchar('barcode', { length: 100 }),
    attributes: json('attributes'),
    price: decimal('price', { precision: 12, scale: 2 }).notNull().default('0.00'),
    weight: decimal('weight', { precision: 10, scale: 3 }).default('0.000'),
    height: decimal('height', { precision: 10, scale: 3 }).default('0.000'),
    width: decimal('width', { precision: 10, scale: 3 }).default('0.000'),
    depth: decimal('depth', { precision: 10, scale: 3 }).default('0.000'),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    productIdx: index('idx_product_id').on(table.productId),
    sizeIdx: index('idx_size').on(table.size),
    productSizeIdx: index('idx_product_size').on(table.productId, table.size),
    priceIdx: index('idx_price').on(table.price),
    colorIdx: index('idx_product_color').on(table.productId, table.colorId),
  })
);

export const productColors = mysqlTable(
  'product_colors',
  {
    id: serial('id').primaryKey(),
    productId: bigint('product_id', { mode: 'number', unsigned: true }).notNull(),
    colorName: varchar('color_name', { length: 100 }).notNull(),
    colorCode: varchar('color_code', { length: 7 }),
    imageUrl: varchar('image_url', { length: 1000 }),
    position: int('position').default(0),
  },
  (table) => ({
    productIdx: index('idx_product_id').on(table.productId),
  })
);

export const productAttributeValues = mysqlTable(
  'product_attribute_values',
  {
    id: serial('id').primaryKey(),
    productId: bigint('product_id', { mode: 'number', unsigned: true }).notNull(),
    attributeId: bigint('attribute_id', { mode: 'number', unsigned: true }).notNull(),
    valueText: text('value_text'),
    valueId: bigint('value_id', { mode: 'number', unsigned: true }),
  },
  (table) => ({
    optionIdx: index('option_id').on(table.valueId),
    productIdx: index('idx_product').on(table.productId),
    attributeIdx: index('idx_attribute').on(table.attributeId),
  })
);

export const productGenderCategories = mysqlTable(
  'product_gender_categories',
  {
    id: serial('id').primaryKey(),
    productId: bigint('product_id', { mode: 'number', unsigned: true }).notNull(),
    gender: mysqlEnum('gender', ['male', 'female', 'unisex', 'kids', 'boys', 'girls']).notNull(),
  },
  (table) => ({
    genderIdx: index('idx_gender').on(table.gender),
    productIdx: index('idx_product_id').on(table.productId),
  })
);

export const productEmbeddings = mysqlTable('product_embeddings', {
  id: serial('id').primaryKey(),
  productId: bigint('product_id', { mode: 'number', unsigned: true }).notNull(),
  embedding: json('embedding').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
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

export const stockReservations = mysqlTable('stock_reservations', {
  id: serial('id').primaryKey(),
  sessionId: varchar('session_id', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const stockReservationItems = mysqlTable('stock_reservation_items', {
  id: serial('id').primaryKey(),
  reservationId: bigint('reservation_id', { mode: 'number', unsigned: true })
    .notNull()
    .references(() => stockReservations.id, { onDelete: 'cascade' }),
  productVariantId: bigint('product_variant_id', { mode: 'number', unsigned: true })
    .notNull()
    .references(() => productVariants.id, { onDelete: 'cascade' }),
  quantity: int('quantity').notNull().default(1),
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
  status: mysqlEnum('status', [
    'pending',
    'approved',
    'in_transit',
    'completed',
    'cancelled',
  ]).default('pending'),
  requestedBy: bigint('requested_by', { mode: 'number', unsigned: true }),
  approvedBy: bigint('approved_by', { mode: 'number', unsigned: true }),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  completedAt: timestamp('completed_at'),
});

export const inventoryLogs = mysqlTable('inventory_logs', {
  id: serial('id').primaryKey(),
  inventoryId: bigint('inventory_id', { mode: 'number', unsigned: true }).notNull(),
  adminId: bigint('admin_id', { mode: 'number', unsigned: true }), // Track who made the change
  quantityChange: int('quantity_change').notNull(),
  reason: varchar('reason', { length: 255 }).notNull(), // restock, order_reserved, order_cancelled, order_fulfilled, transfer, adjustment, return
  referenceId: varchar('reference_id', { length: 100 }), // order_id or transfer_id
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// --- ORDERS ---

export const ipBlocklist = mysqlTable(
  'ip_blocklist',
  {
    id: serial('id').primaryKey(),
    ipAddress: varchar('ip_address', { length: 45 }).notNull(),
    reason: varchar('reason', { length: 255 }),
    isPermanent: tinyint('is_permanent').default(0),
    blockedUntil: timestamp('blocked_until'),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    ipUnq: unique('ip_address').on(table.ipAddress),
    blockedAtIdx: index('idx_blocked_until').on(table.blockedUntil),
  })
);

export const orders = mysqlTable(
  'orders',
  {
    id: serial('id').primaryKey(),
    orderNumber: varchar('order_number', { length: 100 }).notNull(),
    userId: bigint('user_id', { mode: 'number', unsigned: true }),
    subtotal: decimal('subtotal', { precision: 12, scale: 2 }).notNull().default('0.00'),
    shippingFee: decimal('shipping_fee', { precision: 12, scale: 2 }).default('0.00'),
    discount: decimal('discount', { precision: 12, scale: 2 }).default('0.00'),
    promotionCode: varchar('promotion_code', { length: 50 }),
    promotionType: mysqlEnum('promotion_type', ['voucher', 'coupon', 'none']).default('none'),
    couponId: bigint('coupon_id', { mode: 'number', unsigned: true }),
    voucherId: bigint('voucher_id', { mode: 'number', unsigned: true }),
    voucherDiscount: decimal('voucher_discount', { precision: 12, scale: 2 }).default('0.00'),
    giftcardDiscount: decimal('giftcard_discount', { precision: 12, scale: 2 }).default('0.00'),
    giftcardId: bigint('giftcard_id', { mode: 'number', unsigned: true }),
    membershipDiscount: decimal('membership_discount', { precision: 12, scale: 2 }).default('0.00'),
    tax: decimal('tax', { precision: 12, scale: 2 }).default('0.00'),
    total: decimal('total', { precision: 12, scale: 2 }).notNull().default('0.00'),
    currency: varchar('currency', { length: 10 }).default('VND'),
    shippingAddressSnapshot: json('shipping_address_snapshot'),
    status: mysqlEnum('status', [
      'pending',
      'pending_payment_confirmation',
      'payment_received',
      'confirmed',
      'processing',
      'shipped',
      'delivered',
      'cancelled',
      'refunded',
    ]).default('pending'),
    placedAt: timestamp('placed_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
    paymentMethod: varchar('payment_method', { length: 50 }).default('cod'),
    paymentStatus: mysqlEnum('payment_status', ['pending', 'paid', 'failed', 'refunded']).default(
      'pending'
    ),
    trackingNumber: varchar('tracking_number', { length: 100 }),
    carrier: varchar('carrier', { length: 100 }),
    shippedAt: timestamp('shipped_at'),
    deliveredAt: timestamp('delivered_at'),
    paymentConfirmedAt: timestamp('payment_confirmed_at'),
    cancelledAt: timestamp('cancelled_at'),
    notes: text('notes'),
    hasGiftWrapping: tinyint('has_gift_wrapping').default(0),
    giftWrapCost: decimal('gift_wrap_cost', { precision: 12, scale: 2 }).default('0.00'),
    surveySent: tinyint('survey_sent').default(0),
    isEncrypted: tinyint('is_encrypted').default(0),
    phone: varchar('phone', { length: 20 }).default('***'),
    email: varchar('email', { length: 255 }).default('***'),
    emailHash: varchar('email_hash', { length: 64 }),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    orderNumberUnq: unique('order_number').on(table.orderNumber),
    userIdIdx: index('user_id').on(table.userId),
    statusIdx: index('status').on(table.status),
    emailHashIdx: index('idx_email_hash').on(table.emailHash),
    placedAtIdx: index('idx_placed_at').on(table.placedAt),
  })
);

export const orderItems = mysqlTable(
  'order_items',
  {
    id: serial('id').primaryKey(),
    orderId: bigint('order_id', { mode: 'number', unsigned: true }).notNull(),
    productId: bigint('product_id', { mode: 'number', unsigned: true }),
    productVariantId: bigint('product_variant_id', { mode: 'number', unsigned: true }),
    inventoryId: bigint('inventory_id', { mode: 'number', unsigned: true }),
    productName: varchar('product_name', { length: 500 }).notNull(),
    sku: varchar('sku', { length: 200 }),
    size: varchar('size', { length: 10 }),
    quantity: int('quantity').notNull().default(1),
    unitPrice: decimal('unit_price', { precision: 12, scale: 2 }).notNull(),
    costPrice: decimal('cost_price', { precision: 12, scale: 2 }).default('0.00'),
    totalPrice: decimal('total_price', { precision: 12, scale: 2 }).notNull(),
    flashSaleItemId: bigint('flash_sale_item_id', { mode: 'number', unsigned: true }),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    orderIdx: index('order_id').on(table.orderId),
    productIdx: index('product_id').on(table.productId),
    variantIdx: index('product_variant_id').on(table.productVariantId),
    inventoryIdx: index('inventory_id').on(table.inventoryId),
  })
);

export const giftCards = mysqlTable(
  'gift_cards',
  {
    id: serial('id').primaryKey(),
    cardNumberHash: varchar('card_number_hash', { length: 64 }).notNull(),
    cardNumberLast4: varchar('card_number_last4', { length: 4 }).notNull(),
    cardNumberEncrypted: text('card_number_encrypted'),
    pin: varchar('pin', { length: 255 }).notNull(),
    initialBalance: decimal('initial_balance', { precision: 12, scale: 2 })
      .notNull()
      .default('0.00'),
    currentBalance: decimal('current_balance', { precision: 12, scale: 2 })
      .notNull()
      .default('0.00'),
    currency: varchar('currency', { length: 10 }).default('VND'),
    status: mysqlEnum('status', ['active', 'inactive', 'expired', 'used', 'locked']).default(
      'active'
    ),
    failedAttempts: int('failed_attempts').default(0),
    purchasedBy: bigint('purchased_by', { mode: 'number', unsigned: true }),
    purchasedAt: timestamp('purchased_at'),
    expiresAt: timestamp('expires_at'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  (table) => ({
    cardNumberHashUnq: unique('idx_card_hash').on(table.cardNumberHash),
    purchasedIdx: index('idx_gift_purchased').on(table.purchasedBy),
    statusIdx: index('idx_gift_status').on(table.status),
  })
);

export const giftCardTransactions = mysqlTable(
  'gift_card_transactions',
  {
    id: serial('id').primaryKey(),
    giftCardId: bigint('gift_card_id', { mode: 'number', unsigned: true }).notNull(),
    orderId: bigint('order_id', { mode: 'number', unsigned: true }),
    transactionType: mysqlEnum('transaction_type', [
      'purchase',
      'redeem',
      'refund',
      'adjustment',
    ]).notNull(),
    amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
    balanceBefore: decimal('balance_before', { precision: 12, scale: 2 }).notNull(),
    balanceAfter: decimal('balance_after', { precision: 12, scale: 2 }).notNull(),
    description: varchar('description', { length: 500 }),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    giftCardIdx: index('gift_card_id').on(table.giftCardId),
    orderIdx: index('order_id').on(table.orderId),
  })
);

export const giftCardLockouts = mysqlTable(
  'gift_card_lockouts',
  {
    id: serial('id').primaryKey(),
    ipAddress: varchar('ip_address', { length: 45 }).notNull(),
    cardNumber: varchar('card_number', { length: 16 }),
    attemptCount: int('attempt_count').default(1),
    lastAttempt: timestamp('last_attempt').defaultNow().onUpdateNow(),
    lockoutUntil: timestamp('lockout_until'),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    ipIdx: index('idx_ip_address').on(table.ipAddress),
  })
);
// --- VIEWS ---

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

export const banners = mysqlTable(
  'banners',
  {
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
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  (table) => ({
    positionIdx: index('idx_banner_position').on(table.position),
    orderIdx: index('idx_banner_order').on(table.displayOrder),
    activeIdx: index('idx_banner_active').on(table.isActive),
  })
);

export const coupons = mysqlTable(
  'coupons',
  {
    id: serial('id').primaryKey(),
    code: varchar('code', { length: 100 }).notNull().unique(),
    description: varchar('description', { length: 255 }),
    discountType: mysqlEnum('discount_type', ['fixed', 'percent']).default('fixed'),
    discountValue: decimal('discount_value', { precision: 12, scale: 2 }).notNull(),
    applicableTier: mysqlEnum('applicable_tier', ['bronze', 'silver', 'gold', 'platinum']).default(
      'bronze'
    ),
    minOrderAmount: decimal('min_order_amount', { precision: 12, scale: 2 }),
    applicableCategories: json('applicable_categories'),
    maxDiscountAmount: decimal('max_discount_amount', { precision: 12, scale: 2 }),
    startsAt: timestamp('starts_at'),
    endsAt: timestamp('ends_at'),
    usageLimit: int('usage_limit'),
    usageLimitPerUser: int('usage_limit_per_user'),
    createdAt: timestamp('created_at').defaultNow(),
    deletedAt: timestamp('deleted_at'),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  (table) => ({
    unq: unique('code').on(table.code),
    deletedAtIdx: index('idx_deleted_at').on(table.deletedAt),
  })
);

export const couponUsage = mysqlTable(
  'coupon_usage',
  {
    id: serial('id').primaryKey(),
    couponId: bigint('coupon_id', { mode: 'number', unsigned: true }),
    userId: bigint('user_id', { mode: 'number', unsigned: true }),
    orderId: bigint('order_id', { mode: 'number', unsigned: true }).notNull(),
    usedAt: timestamp('used_at').defaultNow(),
  },
  (table) => ({
    couponIdx: index('coupon_id').on(table.couponId),
    userIdIdx: index('user_id').on(table.userId),
    orderIdx: index('order_id').on(table.orderId),
  })
);

export const vouchers = mysqlTable(
  'vouchers',
  {
    id: serial('id').primaryKey(),
    code: varchar('code', { length: 100 }).notNull().unique(),
    value: decimal('value', { precision: 12, scale: 2 }).notNull(),
    applicableTier: mysqlEnum('applicable_tier', ['bronze', 'silver', 'gold', 'platinum']).default(
      'bronze'
    ),
    minOrderValue: decimal('min_order_value', { precision: 12, scale: 2 }).default('0.00'),
    applicableCategories: json('applicable_categories'),
    discountType: mysqlEnum('discount_type', ['fixed', 'percent']).default('fixed'),
    description: varchar('description', { length: 255 }),
    issuedByUserId: bigint('issued_by_user_id', { mode: 'number', unsigned: true }),
    recipientUserId: bigint('recipient_user_id', { mode: 'number', unsigned: true }),
    redeemedByUserId: bigint('redeemed_by_user_id', { mode: 'number', unsigned: true }),
    status: mysqlEnum('status', ['active', 'inactive', 'redeemed', 'expired']).default('active'),
    validFrom: timestamp('valid_from').defaultNow(),
    validUntil: timestamp('valid_until'),
    redeemedAt: timestamp('redeemed_at'),
    usageLimit: int('usage_limit').default(1),
    usageLimitPerUser: int('usage_limit_per_user').default(1),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    unq: unique('code').on(table.code),
    recipientIdx: index('recipient_user_id').on(table.recipientUserId),
    redeemerIdx: index('redeemed_by_user_id').on(table.redeemedByUserId),
    statusIdx: index('status').on(table.status),
    deletedAtIdx: index('idx_deleted_at').on(table.deletedAt),
    statusValidIdx: index('idx_status_valid').on(table.status, table.validUntil),
  })
);

export const flashSales = mysqlTable(
  'flash_sales',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    startTime: timestamp('start_time').notNull(),
    endTime: timestamp('end_time').notNull(),
    isActive: tinyint('is_active').default(1),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    activeIdx: index('idx_flash_active').on(table.isActive),
    deletedAtIdx: index('idx_flash_deleted').on(table.deletedAt),
  })
);

export const flashSaleItems = mysqlTable(
  'flash_sale_items',
  {
    id: serial('id').primaryKey(),
    flashSaleId: bigint('flash_sale_id', { mode: 'number', unsigned: true }).notNull(),
    productId: bigint('product_id', { mode: 'number', unsigned: true }).notNull(),
    discountPercentage: decimal('discount_percentage', { precision: 5, scale: 2 }).notNull(),
    flashPrice: decimal('flash_price', { precision: 12, scale: 2 }).notNull(),
    quantityLimit: int('quantity_limit'),
    quantitySold: int('quantity_sold').default(0),
    perUserLimit: int('per_user_limit').default(1),
    createdAt: timestamp('created_at').defaultNow(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    flashSaleIdx: index('idx_flash_sale_id').on(table.flashSaleId),
    productIdx: index('idx_flash_product').on(table.productId),
    deletedAtIdx: index('idx_flash_items_deleted').on(table.deletedAt),
  })
);

// --- CMS & CONTENT ---

export const faqCategories = mysqlTable('faq_categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 200 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  description: text('description'),
  icon: varchar('icon', { length: 100 }),
  position: int('position').default(0),
  sectionLinks: json('section_links'), // For the cards in Help Center page
  isActive: tinyint('is_active').default(1),
  createdAt: timestamp('created_at').defaultNow(),
});

export const faqs = mysqlTable(
  'faqs',
  {
    id: serial('id').primaryKey(),
    categoryId: bigint('category_id', { mode: 'number', unsigned: true }).notNull(),
    question: varchar('question', { length: 500 }).notNull(),
    answer: text('answer').notNull(),
    position: int('position').default(0),
    isActive: tinyint('is_active').default(1),
    helpfulCount: int('helpful_count').default(0),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  (table) => ({
    categoryIdx: index('idx_faq_category').on(table.categoryId),
    isActiveIdx: index('idx_faq_active').on(table.isActive),
  })
);

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

export const news = mysqlTable(
  'news',
  {
    id: serial('id').primaryKey(),
    title: varchar('title', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    excerpt: text('excerpt'),
    content: longtext('content').notNull(),
    imageUrl: varchar('image_url', { length: 500 }),
    category: varchar('category', { length: 100 }),
    authorId: bigint('author_id', { mode: 'number', unsigned: true }).default(1),
    publishedAt: timestamp('published_at'),
    isPublished: tinyint('is_published').default(0),
    views: int('views').default(0),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  (table) => ({
    slugIdx: unique('slug').on(table.slug),
    publishedIdx: index('idx_news_published').on(table.isPublished, table.publishedAt),
    categoryIdx: index('idx_news_category').on(table.category),
  })
);

export const newsComments = mysqlTable(
  'news_comments',
  {
    id: serial('id').primaryKey(),
    newsId: bigint('news_id', { mode: 'number', unsigned: true }).notNull(),
    userId: bigint('user_id', { mode: 'number', unsigned: true }).notNull(),
    parentId: bigint('parent_id', { mode: 'number', unsigned: true }),
    comment: text('comment').notNull(),
    status: mysqlEnum('status', ['pending', 'approved', 'rejected']).default('approved'),
    likesCount: int('likes_count').default(0),
    isEdited: tinyint('is_edited').default(0),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  (table) => ({
    newsIdx: index('idx_news_id').on(table.newsId),
    userIdIdx: index('idx_user_id').on(table.userId),
    parentIdx: index('idx_parent_id').on(table.parentId),
    statusIdx: index('idx_status').on(table.status),
  })
);

export const newsCommentLikes = mysqlTable(
  'news_comment_likes',
  {
    id: serial('id').primaryKey(),
    commentId: bigint('comment_id', { mode: 'number', unsigned: true }).notNull(),
    userId: bigint('user_id', { mode: 'number', unsigned: true }).notNull(),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    unq: unique('uk_comment_user').on(table.commentId, table.userId),
  })
);

// --- ADMIN & RBAC ---

export const roles = mysqlTable('roles', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 50 }).notNull().unique(), // super_admin, manager, staff, support
  description: varchar('description', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
});

export const permissions = mysqlTable('permissions', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 150 }).notNull().unique(), // e.g., 'read:orders', 'write:products'
  description: varchar('description', { length: 255 }),
});

export const rolePermissions = mysqlTable(
  'role_permissions',
  {
    id: serial('id').primaryKey(),
    roleId: bigint('role_id', { mode: 'number', unsigned: true }).notNull(),
    permissionId: bigint('permission_id', { mode: 'number', unsigned: true }).notNull(),
  },
  (table) => ({
    unq: unique().on(table.roleId, table.permissionId),
  })
);

export const adminUsers = mysqlTable(
  'admin_users',
  {
    id: serial('id').primaryKey(),
    username: varchar('username', { length: 100 }).notNull().unique(),
    email: varchar('email', { length: 255 }).notNull(),
    emailHash: varchar('email_hash', { length: 64 }).unique(),
    emailEncrypted: text('email_encrypted'),
    isEncrypted: tinyint('is_encrypted').default(0),
    password: varchar('password', { length: 255 }),
    fullName: varchar('full_name', { length: 255 }),
    bio: text('bio'),
    avatarUrl: varchar('avatar_url', { length: 1000 }),
    socialLinks: json('social_links'),
    isActive: tinyint('is_active').default(1),
    lastLogin: timestamp('last_login'),
    roleId: bigint('role_id', { mode: 'number', unsigned: true }),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
    deletedAt: timestamp('deleted_at'),
    failedLoginAttempts: int('failed_login_attempts').default(0),
    lockoutUntil: timestamp('lockout_until'),
    twoFactorSecret: text('two_factor_secret'),
    twoFactorEnabled: tinyint('two_factor_enabled').default(0),
    twoFactorType: varchar('two_factor_type', { length: 20 }).default('email'), // 'email' or 'totp'
    twoFactorBackupCodes: json('two_factor_backup_codes'),
  },
  (table) => ({
    emailHashIdx: index('idx_admin_email_hash').on(table.emailHash),
    roleIdx: index('idx_admin_role').on(table.roleId),
  })
);

export const newsletterSubscriptions = mysqlTable(
  'newsletter_subscriptions',
  {
    id: serial('id').primaryKey(),
    email: varchar('email', { length: 255 }).notNull().default('***'),
    emailHash: varchar('email_hash', { length: 64 }).unique(),
    emailEncrypted: text('email_encrypted'),
    isEncrypted: tinyint('is_encrypted').default(0),
    name: varchar('name', { length: 255 }),
    status: mysqlEnum('status', ['active', 'unsubscribed', 'bounced']).default('active'),
    userId: bigint('user_id', { mode: 'number', unsigned: true }),
    subscribedAt: timestamp('subscribed_at').defaultNow(),
    unsubscribedAt: timestamp('unsubscribed_at'),
  },
  (table) => ({
    emailHashIdx: index('idx_newsletter_email_hash').on(table.emailHash),
    emailIdx: index('idx_newsletter_email').on(table.email),
    userIdx: index('idx_newsletter_user').on(table.userId),
  })
);

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
  guestEmailHash: varchar('guest_email_hash', { length: 255 }),
  guestName: varchar('guest_name', { length: 255 }),
  status: mysqlEnum('status', ['waiting', 'active', 'resolved', 'closed']).default('waiting'),
  accessToken: varchar('access_token', { length: 255 }),
  assignedAdminId: bigint('assigned_admin_id', { mode: 'number', unsigned: true }),
  firstResponseAt: timestamp('first_response_at'),
  lastMessageAt: timestamp('last_message_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const supportMessages = mysqlTable(
  'support_messages',
  {
    id: serial('id').primaryKey(),
    chatId: bigint('chat_id', { mode: 'number', unsigned: true }).notNull(),
    senderType: mysqlEnum('sender_type', ['customer', 'admin']).notNull(),
    senderId: bigint('sender_id', { mode: 'number', unsigned: true }),
    message: text('message'),
    imageUrl: varchar('image_url', { length: 500 }),
    isRead: tinyint('is_read').default(0),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    chatIdx: index('chat_id').on(table.chatId),
  })
);

export const notifications = mysqlTable(
  'notifications',
  {
    id: serial('id').primaryKey(),
    userId: bigint('user_id', { mode: 'number', unsigned: true }).notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    message: text('message').notNull(),
    type: varchar('type', { length: 50 }).default('info'), // info, success, warning, error, order, promo
    isRead: tinyint('is_read').default(0),
    linkUrl: varchar('link_url', { length: 500 }),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    userIdIdx: index('user_id').on(table.userId),
    isReadIdx: index('idx_notif_read').on(table.isRead),
  })
);

// --- REVIEWS & FEEDBACK ---

export const productReviews = mysqlTable(
  'product_reviews',
  {
    id: serial('id').primaryKey(),
    productId: bigint('product_id', { mode: 'number', unsigned: true }).notNull(),
    userId: bigint('user_id', { mode: 'number', unsigned: true }),
    rating: tinyint('rating').notNull(),
    title: varchar('title', { length: 255 }),
    comment: text('comment'),
    authorName: varchar('author_name', { length: 255 }),
    status: mysqlEnum('status', ['pending', 'approved', 'rejected']).default('pending'),
    isFeatured: tinyint('is_featured').default(0),
    isVerifiedPurchase: tinyint('is_verified_purchase').default(0),
    helpfulCount: int('helpful_count').default(0),
    adminReply: text('admin_reply'),
    createdAt: timestamp('created_at').defaultNow(),
    orderId: bigint('order_id', { mode: 'number', unsigned: true }),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    productIdx: index('product_id').on(table.productId),
    userIdIdx: index('user_id').on(table.userId),
    statusIdx: index('idx_review_status').on(table.status),
    approvedCreatedIdx: index('idx_product_approved_created').on(
      table.productId,
      table.status,
      table.createdAt
    ),
    deletedAtIdx: index('idx_reviews_deleted').on(table.deletedAt),
  })
);

export const reviewMedia = mysqlTable(
  'review_media',
  {
    id: serial('id').primaryKey(),
    reviewId: bigint('review_id', { mode: 'number', unsigned: true }).notNull(),
    mediaUrl: varchar('media_url', { length: 500 }).notNull(),
    mediaType: varchar('media_type', { length: 50 }).notNull(),
    mimeType: varchar('mime_type', { length: 100 }),
    thumbnailUrl: varchar('thumbnail_url', { length: 500 }),
    position: int('position').default(0),
    fileSize: int('file_size').default(0),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    reviewIdx: index('review_id').on(table.reviewId),
  })
);

// --- STORES ---

export const stores = mysqlTable(
  'stores',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    storeCode: varchar('store_code', { length: 50 }).unique(),
    address: text('address').notNull(),
    city: varchar('city', { length: 100 }).notNull(),
    state: varchar('state', { length: 100 }),
    country: varchar('country', { length: 100 }).default('Vietnam'),
    postalCode: varchar('postal_code', { length: 20 }),
    phone: varchar('phone', { length: 50 }),
    email: varchar('email', { length: 255 }),
    latitude: decimal('latitude', { precision: 10, scale: 8 }),
    longitude: decimal('longitude', { precision: 11, scale: 8 }),
    description: text('description'),
    features: json('features'),
    imageUrl: varchar('image_url', { length: 1000 }),
    isActive: tinyint('is_active').default(1),
    openingDate: date('opening_date'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  (table) => ({
    cityIdx: index('idx_store_city').on(table.city),
  })
);

export const storeHours = mysqlTable(
  'store_hours',
  {
    id: serial('id').primaryKey(),
    storeId: bigint('store_id', { mode: 'number', unsigned: true }).notNull(),
    dayOfWeek: tinyint('day_of_week').notNull(), // 0-6
    openTime: time('open_time'),
    closeTime: time('close_time'),
    isClosed: tinyint('is_closed').default(0),
  },
  (table) => ({
    storeIdx: index('idx_store_hours_store').on(table.storeId),
  })
);

// --- ADVANCED METADATA ---

export const seoMetadata = mysqlTable(
  'seo_metadata',
  {
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
  },
  (table) => ({
    unq: unique().on(table.entityType, table.entityId),
  })
);

// --- ANALYTICS & METRICS ---

export const dailyMetrics = mysqlTable('daily_metrics', {
  date: date('date').primaryKey(),
  revenue: decimal('revenue', { precision: 15, scale: 2 }).default('0.00'),
  ordersCount: int('orders_count').default(0),
  customersCount: int('customers_count').default(0),
  cancelledCount: int('cancelled_count').default(0),
  totalCost: decimal('total_cost', { precision: 15, scale: 2 }).default('0.00'),
  netProfit: decimal('net_profit', { precision: 15, scale: 2 }).default('0.00'),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const searchAnalytics = mysqlTable(
  'search_analytics',
  {
    id: serial('id').primaryKey(),
    query: varchar('query', { length: 255 }).notNull(),
    categoryFilter: varchar('category_filter', { length: 100 }),
    resultsCount: int('results_count').default(0),
    processingTimeMs: int('processing_time_ms').default(0),
    userId: bigint('user_id', { mode: 'number', unsigned: true }),
    ipAddress: varchar('ip_address', { length: 45 }),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    queryIdx: index('idx_query').on(table.query),
    createdAtIdx: index('idx_created_at').on(table.createdAt),
  })
);

export const refundRequests = mysqlTable(
  'refund_requests',
  {
    id: serial('id').primaryKey(),
    orderId: bigint('order_id', { mode: 'number', unsigned: true }).notNull(),
    userId: bigint('user_id', { mode: 'number', unsigned: true }).notNull(),
    amount: decimal('amount', { precision: 12, scale: 2 }).notNull().default('0.00'),
    reason: text('reason').notNull(),
    images: text('images'), // Store image URLs as JSON or newline-separated
    status: mysqlEnum('status', ['pending', 'approved', 'rejected']).default('pending'),
    adminResponse: text('admin_response'),
    adminNotes: text('admin_notes'), // Keep existing if it was there, but DB showed admin_response
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    orderIdx: index('order_id').on(table.orderId),
    userIdx: index('user_id').on(table.userId),
  })
);

export const refunds = mysqlTable(
  'refunds',
  {
    id: serial('id').primaryKey(),
    orderId: bigint('order_id', { mode: 'number', unsigned: true }).notNull(),
    amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
    reason: text('reason'),
    status: mysqlEnum('status', ['pending', 'completed', 'failed']).default('pending'),
    transactionId: varchar('transaction_id', { length: 100 }),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  (table) => ({
    orderIdx: index('order_id').on(table.orderId),
  })
);

export const transactions = mysqlTable(
  'transactions',
  {
    id: serial('id').primaryKey(),
    orderId: bigint('order_id', { mode: 'number', unsigned: true }).notNull(),
    userId: bigint('user_id', { mode: 'number', unsigned: true }),
    paymentProvider: mysqlEnum('payment_provider', [
      'vnpay',
      'momo',
      'zalopay',
      'bank_transfer',
      'cod',
    ]).notNull(),
    transactionCode: varchar('transaction_code', { length: 100 }),
    amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
    status: mysqlEnum('status', ['pending', 'success', 'failed', 'refunded'])
      .default('pending')
      .notNull(),
    responseData: json('response_data'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  (table) => ({
    orderIdx: index('idx_tx_order').on(table.orderId),
    userIdx: index('idx_tx_user').on(table.userId),
    providerIdx: index('idx_tx_provider').on(table.paymentProvider),
  })
);

export const shipments = mysqlTable(
  'shipments',
  {
    id: serial('id').primaryKey(),
    orderId: bigint('order_id', { mode: 'number', unsigned: true }).notNull(),
    warehouseId: bigint('warehouse_id', { mode: 'number', unsigned: true }),
    trackingNumber: varchar('tracking_number', { length: 100 }),
    carrier: varchar('carrier', { length: 100 }),
    status: varchar('status', { length: 50 }).default('preparing'),
    estimatedDelivery: timestamp('estimated_delivery'),
    shippedAt: timestamp('shipped_at'),
    deliveredAt: timestamp('delivered_at'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  (table) => ({
    orderIdx: index('order_id').on(table.orderId),
  })
);

export const shipmentItems = mysqlTable(
  'shipment_items',
  {
    id: serial('id').primaryKey(),
    shipmentId: bigint('shipment_id', { mode: 'number', unsigned: true }).notNull(),
    orderItemId: bigint('order_item_id', { mode: 'number', unsigned: true }).notNull(),
    quantity: int('quantity').notNull(),
  },
  (table) => ({
    shipmentIdx: index('shipment_id').on(table.shipmentId),
  })
);

export const systemLogs = mysqlTable(
  'system_logs',
  {
    id: serial('id').primaryKey(),
    level: mysqlEnum('level', ['info', 'warning', 'error', 'critical']).notNull(),
    module: varchar('module', { length: 100 }),
    message: text('message').notNull(),
    details: json('details'),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    levelIdx: index('idx_log_level').on(table.level),
    createdAtIdx: index('idx_log_created').on(table.createdAt),
  })
);

export const systemConfig = mysqlTable('system_config', {
  id: bigint('id', { mode: 'number', unsigned: true }).primaryKey().autoincrement(),
  key: varchar('key', { length: 255 }).notNull().unique(),
  value: text('value'),
  description: varchar('description', { length: 255 }),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const cookieConsents = mysqlTable('cookie_consents', {
  id: serial('id').primaryKey(),
  sessionId: varchar('session_id', { length: 255 }).notNull().unique(),
  consents: json('consents').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const contactMessages = mysqlTable('contact_messages', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  subject: varchar('subject', { length: 500 }).notNull(),
  message: text('message').notNull(),
  status: mysqlEnum('status', [
    'new',
    'read',
    'replied',
    'in_progress',
    'resolved',
    'closed',
  ]).default('new'),
  userId: bigint('user_id', { mode: 'number', unsigned: true }),
  adminNotes: text('admin_notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});
export const settings = mysqlTable('settings', {
  id: bigint('id', { mode: 'number', unsigned: true }).primaryKey().autoincrement(),
  key: varchar('key', { length: 255 }).notNull().unique(),
  value: text('value'),
  valueType: varchar('value_type', { length: 50 }).default('string'),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const passwordResets = mysqlTable(
  'password_resets',
  {
    id: serial('id').primaryKey(),
    email: varchar('email', { length: 255 }).notNull(),
    token: varchar('token', { length: 255 }).notNull().unique(),
    expiresAt: datetime('expires_at').notNull(),
    used: tinyint('used').default(0),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    tokenIdx: index('idx_token').on(table.token),
    emailIdx: index('idx_email').on(table.email),
    expiresIdx: index('idx_expires_at').on(table.expiresAt),
  })
);

export const sepayTransactions = mysqlTable(
  'sepay_transactions',
  {
    id: serial('id').primaryKey(),
    sepayId: bigint('sepay_id', { mode: 'number' }).unique(),
    gateway: varchar('gateway', { length: 100 }),
    transactionDate: timestamp('transaction_date'),
    accountNumber: varchar('account_number', { length: 100 }),
    transferType: mysqlEnum('transfer_type', ['in', 'out']),
    transferAmount: decimal('transfer_amount', { precision: 20, scale: 2 }),
    accumulated: decimal('accumulated', { precision: 20, scale: 2 }),
    content: text('content'),
    code: varchar('code', { length: 100 }), // The extracted code for matching
    referenceCode: varchar('reference_code', { length: 255 }),
    description: text('description'), // Original raw description
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    sepayIdIdx: index('idx_sepay_id').on(table.sepayId),
    codeIdx: index('idx_sepay_code').on(table.code),
  })
);

export const customerNotes = mysqlTable(
  'customer_notes',
  {
    id: serial('id').primaryKey(),
    userId: bigint('user_id', { mode: 'number', unsigned: true }).notNull(),
    adminId: bigint('admin_id', { mode: 'number', unsigned: true }).notNull(),
    note: text('note').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  (table) => ({
    userIdIdx: index('idx_note_user').on(table.userId),
  })
);

export const media = mysqlTable(
  'media',
  {
    id: serial('id').primaryKey(),
    fileName: varchar('file_name', { length: 255 }).notNull(),
    filePath: varchar('file_path', { length: 500 }).notNull().unique(), // URL or relative path
    fileSize: int('file_size'), // in bytes
    mimeType: varchar('mime_type', { length: 100 }),
    width: int('width'),
    height: int('height'),
    altText: varchar('alt_text', { length: 255 }),
    folder: varchar('folder', { length: 100 }).default('general'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  (table) => ({
    pathIdx: index('idx_media_path').on(table.filePath),
    createdIdx: index('idx_media_created').on(table.createdAt),
  })
);

export const bulkDiscounts = mysqlTable(
  'bulk_discounts',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    discountPercentage: int('discount_percentage').notNull(),
    categoryId: bigint('category_id', { mode: 'number', unsigned: true }), // Null means all categories
    startTime: timestamp('start_time').notNull(),
    endTime: timestamp('end_time').notNull(),
    isActive: tinyint('is_active').default(1),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  (table) => ({
    activeIdx: index('idx_bulk_active').on(table.isActive),
    timeIdx: index('idx_bulk_time').on(table.startTime, table.endTime),
  })
);

export const siteSettings = mysqlTable('site_settings', {
  id: serial('id').primaryKey(),
  key: varchar('key', { length: 100 }).unique().notNull(),
  value: json('value'), // Stores value as JSON string or object
  description: varchar('description', { length: 255 }),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const menuItems = mysqlTable('menu_items', {
  id: serial('id').primaryKey(),
  parentId: bigint('parent_id', { mode: 'number', unsigned: true }),
  location: varchar('location', { length: 100 }), // header, footer_col1, footer_col2, footer_col3, footer_bottom
  title: varchar('title', { length: 255 }).notNull(),
  titleEn: varchar('title_en', { length: 255 }),
  href: varchar('href', { length: 500 }),
  icon: varchar('icon', { length: 100 }),
  order: int('display_order').default(0),
  isActive: tinyint('is_active').default(1),
  createdAt: timestamp('created_at').defaultNow(),
});
