const mysql = require('mysql2/promise');

async function seedMenus() {
  const connection = await mysql.createConnection('mysql://root:@localhost:3306/toan_store');
  try {
    console.log('--- Seeding default menus into database (Multi-Language) ---');

    const defaultMenus = [
      // HEADER
      {
        location: 'header',
        title: 'Mới',
        titleEn: 'New',
        href: '/categories?sort=newest',
        order: 1,
      },
      { location: 'header', title: 'Nam', titleEn: 'Men', href: '/men', order: 2 },
      { location: 'header', title: 'Nữ', titleEn: 'Women', href: '/women', order: 3 },
      { location: 'header', title: 'Trẻ Em', titleEn: 'Kids', href: '/kids', order: 4 },
      {
        location: 'header',
        title: 'Jordan',
        titleEn: 'Jordan',
        href: '/categories?sport=basketball',
        order: 5,
      },
      {
        location: 'header',
        title: 'Thể Thao',
        titleEn: 'Sports',
        href: '/categories?sport=running',
        order: 6,
      },
      { location: 'header', title: 'Tin Tức', titleEn: 'News', href: '/news', order: 7 },

      // FOOTER MAIN
      {
        location: 'footer_main',
        title: 'TÌM CỬA HÀNG',
        titleEn: 'FIND A STORE',
        href: '/store',
        order: 1,
      },
      {
        location: 'footer_main',
        title: 'TRỞ THÀNH THÀNH VIÊN',
        titleEn: 'BECOME A MEMBER',
        href: '/sign-up',
        order: 2,
      },
      {
        location: 'footer_main',
        title: 'VỀ TOAN STORE',
        titleEn: 'ABOUT TOAN STORE',
        href: '/about',
        order: 3,
      },
      {
        location: 'footer_main',
        title: 'GỬI PHẢN HỒI',
        titleEn: 'SEND FEEDBACK',
        href: '/help/contact',
        order: 4,
      },

      // FOOTER HELP
      {
        location: 'footer_help',
        title: 'Trạng thái đơn hàng',
        titleEn: 'Order Status',
        href: '/orders',
        order: 1,
      },
      {
        location: 'footer_help',
        title: 'Vận chuyển & Giao hàng',
        titleEn: 'Shipping & Delivery',
        href: '/help/shipping-delivery',
        order: 2,
      },
      {
        location: 'footer_help',
        title: 'Trả hàng',
        titleEn: 'Returns',
        href: '/help/returns',
        order: 3,
      },
      {
        location: 'footer_help',
        title: 'Hủy đơn',
        titleEn: 'Order Cancellation',
        href: '/help/order-cancellation',
        order: 4,
      },
      {
        location: 'footer_help',
        title: 'Tùy chọn thanh toán',
        titleEn: 'Payment Options',
        href: '/help/payment-options',
        order: 5,
      },
      {
        location: 'footer_help',
        title: 'Mã giảm giá',
        titleEn: 'Vouchers',
        href: '/vouchers',
        order: 6,
      },
      {
        location: 'footer_help',
        title: 'Số dư thẻ quà tặng',
        titleEn: 'Gift Card Balance',
        href: '/gift-card-balance',
        order: 7,
      },
      {
        location: 'footer_help',
        title: 'Liên hệ chúng tôi',
        titleEn: 'Contact Us',
        href: '/help/contact',
        order: 8,
      },

      // FOOTER COMPANY
      { location: 'footer_company', title: 'Tin tức', titleEn: 'News', href: '/news', order: 1 },
      {
        location: 'footer_company',
        title: 'Nghề nghiệp',
        titleEn: 'Careers',
        href: '/careers',
        order: 2,
      },
      {
        location: 'footer_company',
        title: 'Nhà đầu tư',
        titleEn: 'Investors',
        href: '/investors',
        order: 3,
      },
      {
        location: 'footer_company',
        title: 'Mục đích',
        titleEn: 'Purpose',
        href: '/purpose',
        order: 4,
      },
      {
        location: 'footer_company',
        title: 'Tính bền vững',
        titleEn: 'Sustainability',
        href: '/sustainability',
        order: 5,
      },

      // FOOTER PROMOS
      {
        location: 'footer_promos',
        title: 'Học sinh',
        titleEn: 'Students',
        href: '/promo/student',
        order: 1,
      },
      {
        location: 'footer_promos',
        title: 'Giáo viên',
        titleEn: 'Teachers',
        href: '/promo/teacher',
        order: 2,
      },
      {
        location: 'footer_promos',
        title: 'Sinh nhật',
        titleEn: 'Birthday',
        href: '/promo/birthday',
        order: 3,
      },

      // FOOTER BOTTOM
      {
        location: 'footer_bottom',
        title: 'Hướng dẫn',
        titleEn: 'Guides',
        href: '/guides',
        order: 1,
      },
      {
        location: 'footer_bottom',
        title: 'Điều khoản bán hàng',
        titleEn: 'Terms of Sale',
        href: '/terms',
        order: 2,
      },
      {
        location: 'footer_bottom',
        title: 'Điều khoản sử dụng',
        titleEn: 'Terms of Use',
        href: '/terms-of-use',
        order: 3,
      },
      {
        location: 'footer_bottom',
        title: 'Chính sách bảo mật',
        titleEn: 'Privacy Policy',
        href: '/privacy-policy',
        order: 4,
      },
      {
        location: 'footer_bottom',
        title: 'Trách nhiệm xã hội',
        titleEn: 'CSR',
        href: '/csr',
        order: 5,
      },
    ];

    for (const menu of defaultMenus) {
      const [existing] = await connection.execute(
        'SELECT id FROM menu_items WHERE location = ? AND title = ?',
        [menu.location, menu.title]
      );

      if (existing.length === 0) {
        await connection.execute(
          'INSERT INTO menu_items (location, title, title_en, href, display_order, is_active) VALUES (?, ?, ?, ?, ?, 1)',
          [menu.location, menu.title, menu.titleEn, menu.href, menu.order]
        );
        console.log(`Inserted: [${menu.location}] ${menu.title} / ${menu.titleEn}`);
      } else {
        await connection.execute(
          'UPDATE menu_items SET title_en = ?, href = ?, display_order = ? WHERE id = ?',
          [menu.titleEn, menu.href, menu.order, existing[0].id]
        );
        console.log(`Updated: [${menu.location}] ${menu.title} (Added English: ${menu.titleEn})`);
      }
    }

    console.log('--- Multi-Language Seeding complete ---');
  } catch (err) {
    console.error('ERROR:', err.message);
  } finally {
    await connection.end();
  }
}

seedMenus();
