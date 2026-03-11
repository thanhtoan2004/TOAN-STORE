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
    consentType: varchar('consent_type', { length: 50 }).notNull(),
    isGranted: tinyint('is_granted').default(0),
    grantedAt: timestamp('granted_at'),
    revokedAt: timestamp('revoked_at'),
    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  (table) => ({
    unq: unique('uk_user_consent_type').on(table.userId, table.consentType),
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
  type: mysqlEnum('type', ['text', 'number', 'select', 'color', 'size']).default('text'),
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
  quantityChange: int('quantity_change').notNull(),
  reason: varchar('reason', { length: 255 }).notNull(), // restock, order_reserved, order_cancelled, order_fulfilled, transfer, adjustment
  referenceId: varchar('reference_id', { length: 100 }), // order_id or transfer_id
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
    status: mysqlEnum('status', [
      'pending',
      'processing',
      'shipped',
      'delivered',
      'cancelled',
      'returned',
      'refunded',
    ]).default('pending'),
    subtotal: decimal('subtotal', { precision: 12, scale: 2 }).notNull().default('0.00'),
    totalAmount: decimal('total', { precision: 12, scale: 2 }).notNull().default('0.00'),
    placedAt: timestamp('placed_at').defaultNow(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
    notes: text('notes'),
    isEncrypted: tinyint('is_encrypted').default(0),
    // Snapshot fields for direct compatibility if needed, but primary data is in split tables
    shippingAddressSnapshot: json('shipping_address_snapshot'),
    billingAddressSnapshot: json('billing_address_snapshot'),
  },
  (table) => ({
    orderNumberUnq: unique('order_number').on(table.orderNumber),
    userIdIdx: index('user_id').on(table.userId),
    statusIdx: index('status').on(table.status),
    createdAtIdx: index('idx_order_created').on(table.createdAt),
  })
);

export const orderShippingDetails = mysqlTable(
  'order_shipping_details',
  {
    orderId: bigint('order_id', { mode: 'number', unsigned: true })
      .notNull()
      .primaryKey()
      .references(() => orders.id, { onDelete: 'cascade' }),
    recipientName: varchar('recipient_name', { length: 255 }),
    phone: varchar('phone', { length: 255 }),
    addressLine: varchar('address_line', { length: 255 }),
    ward: varchar('ward', { length: 100 }),
    district: varchar('district', { length: 100 }),
    city: varchar('city', { length: 100 }),
    postalCode: varchar('postal_code', { length: 20 }),
    carrier: varchar('carrier', { length: 100 }),
    trackingNumber: varchar('tracking_number', { length: 100 }),
    shippingFee: decimal('shipping_fee', { precision: 12, scale: 2 }).default('0.00'),
    shippedAt: timestamp('shipped_at'),
    deliveredAt: timestamp('delivered_at'),
  },
  (table) => ({
    trackingIdx: index('idx_tracking').on(table.trackingNumber),
  })
);

export const orderPaymentDetails = mysqlTable(
  'order_payment_details',
  {
    orderId: bigint('order_id', { mode: 'number', unsigned: true })
      .notNull()
      .primaryKey()
      .references(() => orders.id, { onDelete: 'cascade' }),
    paymentMethod: varchar('payment_method', { length: 50 }),
    paymentStatus: mysqlEnum('payment_status', ['pending', 'paid', 'failed', 'refunded']).default(
      'pending'
    ),
    transactionId: varchar('transaction_id', { length: 255 }),
    amountPaid: decimal('amount_paid', { precision: 12, scale: 2 }).default('0.00'),
    confirmedAt: timestamp('confirmed_at'),
  },
  (table) => ({
    paymentStatusIdx: index('idx_payment_status').on(table.paymentStatus),
    transactionIdx: index('idx_transaction').on(table.transactionId),
  })
);

export const orderItems = mysqlTable(
  'order_items',
  {
    id: serial('id').primaryKey(),
    orderId: bigint('order_id', { mode: 'number', unsigned: true }).notNull(),
    productId: bigint('product_id', { mode: 'number', unsigned: true }),
    productVariantId: bigint('product_variant_id', { mode: 'number', unsigned: true }),
    productName: varchar('product_name', { length: 500 }).notNull(),
    sku: varchar('sku', { length: 100 }),
    size: varchar('size', { length: 10 }).notNull(),
    quantity: int('quantity').notNull(),
    unitPrice: decimal('unit_price', { precision: 12, scale: 2 }).notNull(),
    totalPrice: decimal('total_price', { precision: 12, scale: 2 }).notNull(),
    discountAmount: decimal('discount_amount', { precision: 12, scale: 2 }).default('0.00'),
    taxAmount: decimal('tax_amount', { precision: 12, scale: 2 }).default('0.00'),
    costPrice: decimal('cost_price', { precision: 12, scale: 2 }).default('0.00'),
  },
  (table) => ({
    orderIdx: index('order_id').on(table.orderId),
    productIdx: index('product_id').on(table.productId),
    variantIdx: index('product_variant_id').on(table.productVariantId),
  })
);

export const giftCards = mysqlTable(
  'gift_cards',
  {
    id: serial('id').primaryKey(),
    cardNumberHash: varchar('card_number_hash', { length: 255 }).notNull(),
    cardNumberLast4: varchar('card_number_last4', { length: 4 }).notNull(),
    initialBalance: decimal('initial_balance', { precision: 12, scale: 2 }).notNull(),
    currentBalance: decimal('current_balance', { precision: 12, scale: 2 }).notNull(),
    currency: varchar('currency', { length: 3 }).default('VND'),
    status: mysqlEnum('status', [
      'active',
      'inactive',
      'exhausted',
      'expired',
      'cancelled',
    ]).default('active'),
    expiryDate: timestamp('expiry_date'),
    createdByAdminId: bigint('created_by_admin_id', { mode: 'number', unsigned: true }),
    recipientEmail: varchar('recipient_email', { length: 255 }),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  (table) => ({
    cardNumberHashUnq: unique('idx_card_hash').on(table.cardNumberHash),
    recipientIdx: index('idx_gift_recipient').on(table.recipientEmail),
    statusExpiryIdx: index('idx_gift_status_expiry').on(table.status, table.expiryDate),
  })
);

export const giftCardTransactions = mysqlTable(
  'gift_card_transactions',
  {
    id: serial('id').primaryKey(),
    giftCardId: bigint('gift_card_id', { mode: 'number', unsigned: true }).notNull(),
    orderId: bigint('order_id', { mode: 'number', unsigned: true }),
    type: mysqlEnum('type', ['redeem', 'refund', 'adjust', 'expire']).notNull(),
    amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
    balanceAfter: decimal('balance_after', { precision: 12, scale: 2 }).notNull(),
    description: text('description'),
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
    failedAttempts: int('failed_attempts').default(0),
    lockoutUntil: timestamp('lockout_until'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  (table) => ({
    ipUnq: unique('ip_address').on(table.ipAddress),
  })
);
// --- VIEWS ---

export const ordersFull = mysqlView('orders_full', {
  id: bigint('id', { mode: 'number', unsigned: true }),
  orderNumber: varchar('order_number', { length: 100 }),
  status: varchar('status', { length: 50 }),
  totalAmount: decimal('total_amount', { precision: 12, scale: 2 }),
  recipientName: varchar('recipient_name', { length: 255 }),
  phone: varchar('phone', { length: 255 }),
  addressLine: varchar('address_line', { length: 255 }),
  paymentMethod: varchar('payment_method', { length: 50 }),
  paymentStatus: varchar('payment_status', { length: 50 }),
  placedAt: timestamp('placed_at'),
}).as(
  sql`SELECT 
    o.id, 
    o.order_number, 
    o.status, 
    o.total_amount, 
    s.recipient_name, 
    s.phone, 
    s.address_line, 
    p.payment_method, 
    p.payment_status, 
    o.placed_at
  FROM ${orders} o
  LEFT JOIN ${orderShippingDetails} s ON o.id = s.order_id
  LEFT JOIN ${orderPaymentDetails} p ON o.id = p.order_id`
);

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

export const coupons = mysqlTable(
  'coupons',
  {
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
  },
  (table) => ({
    unq: unique('code').on(table.code),
  })
);

export const couponUsage = mysqlTable(
  'coupon_usage',
  {
    id: serial('id').primaryKey(),
    couponId: bigint('coupon_id', { mode: 'number', unsigned: true }).notNull(),
    userId: bigint('user_id', { mode: 'number', unsigned: true }).notNull(),
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

export const flashSaleItems = mysqlTable(
  'flash_sale_items',
  {
    id: serial('id').primaryKey(),
    flashSaleId: bigint('flash_sale_id', { mode: 'number', unsigned: true }).notNull(),
    productVariantId: bigint('product_variant_id', { mode: 'number', unsigned: true }).notNull(),
    salePrice: decimal('sale_price', { precision: 12, scale: 2 }).notNull(),
    quantityLimit: int('quantity_limit').notNull(),
    soldCount: int('sold_count').default(0),
    createdAt: timestamp('created_at').defaultNow(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    flashSaleIdx: index('idx_flash_sale_id').on(table.flashSaleId),
    variantIdx: index('idx_flash_variant').on(table.productVariantId),
    deletedAtIdx: index('idx_flash_items_deleted').on(table.deletedAt),
  })
);

// --- CMS & CONTENT ---

export const faqCategories = mysqlTable('faq_categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  position: int('position').default(0),
});

export const faqs = mysqlTable(
  'faqs',
  {
    id: serial('id').primaryKey(),
    categoryId: bigint('category_id', { mode: 'number', unsigned: true }).notNull(),
    question: text('question').notNull(),
    answer: longtext('answer').notNull(),
    position: int('position').default(0),
    isActive: tinyint('is_active').default(1),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    categoryIdx: index('category_id').on(table.categoryId),
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
    summary: text('summary'),
    content: longtext('content'),
    thumbnailUrl: varchar('thumbnail_url', { length: 1000 }),
    categoryId: bigint('category_id', { mode: 'number', unsigned: true }),
    authorId: bigint('author_id', { mode: 'number', unsigned: true }),
    isActive: tinyint('is_active').default(1),
    publishedAt: timestamp('published_at'),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    slugIdx: unique('slug').on(table.slug),
    activeCreatedIdx: index('idx_news_active_created').on(table.isActive, table.createdAt),
    categoryIdx: index('idx_news_category').on(table.categoryId),
  })
);

export const newsComments = mysqlTable(
  'news_comments',
  {
    id: serial('id').primaryKey(),
    newsId: bigint('news_id', { mode: 'number', unsigned: true }).notNull(),
    userId: bigint('user_id', { mode: 'number', unsigned: true }),
    content: text('content').notNull(),
    parentId: bigint('parent_id', { mode: 'number', unsigned: true }),
    status: mysqlEnum('status', ['pending', 'approved', 'rejected']).default('approved'),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    newsIdx: index('news_id').on(table.newsId),
    userIdIdx: index('user_id').on(table.userId),
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
  assignedAdminId: bigint('assigned_admin_id', { mode: 'number', unsigned: true }),
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
    comment: text('comment'),
    authorName: varchar('author_name', { length: 255 }),
    status: mysqlEnum('status', ['pending', 'approved', 'rejected']).default('pending'),
    isFeatured: tinyint('is_featured').default(0),
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
    mediaType: mysqlEnum('media_type', ['image', 'video']).default('image'),
    url: varchar('url', { length: 1000 }).notNull(),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    reviewIdx: index('review_id').on(table.reviewId),
  })
);

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
    reason: text('reason').notNull(),
    status: mysqlEnum('status', ['pending', 'approved', 'rejected']).default('pending'),
    adminNotes: text('admin_notes'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
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
    paymentMethod: varchar('payment_method', { length: 50 }).notNull(),
    amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
    status: varchar('status', { length: 50 }).notNull(), // e.g., 'captured', 'authorized', 'failed'
    providerTransactionId: varchar('provider_transaction_id', { length: 255 }),
    providerData: json('provider_data'),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    orderIdx: index('order_id').on(table.orderId),
    providerUnq: unique('provider_tx_unq').on(table.providerTransactionId),
  })
);

export const shipments = mysqlTable(
  'shipments',
  {
    id: serial('id').primaryKey(),
    orderId: bigint('order_id', { mode: 'number', unsigned: true }).notNull(),
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
  id: serial('id').primaryKey(),
  configKey: varchar('config_key', { length: 100 }).notNull().unique(),
  configValue: text('config_value'),
  description: text('description'),
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
  subject: varchar('subject', { length: 255 }),
  message: text('message').notNull(),
  status: mysqlEnum('status', ['unread', 'read', 'replied']).default('unread'),
  createdAt: timestamp('created_at').defaultNow(),
});
