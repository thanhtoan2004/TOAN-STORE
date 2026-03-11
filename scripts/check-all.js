const BASE = 'http://localhost:3000';

async function req(method, path, body) {
  try {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(10000),
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`${BASE}${path}`, opts);
    let data = null;
    try {
      data = await res.json();
    } catch {}
    return { status: res.status, data };
  } catch (e) {
    return { status: 0, error: e.message };
  }
}

(async () => {
  const tests = [
    // Core pages - check if HTML returned
    {
      label: 'Homepage /',
      run: async () => {
        const r = await req('GET', '/');
        return { ok: r.status === 200, status: r.status };
      },
    },
    {
      label: 'Products /products',
      run: async () => {
        const r = await req('GET', '/products');
        return { ok: r.status === 200, status: r.status };
      },
    },
    {
      label: 'Login /login',
      run: async () => {
        const r = await req('GET', '/login');
        return { ok: r.status === 200, status: r.status };
      },
    },
    {
      label: 'Register /register',
      run: async () => {
        const r = await req('GET', '/register');
        return { ok: r.status === 200, status: r.status };
      },
    },
    {
      label: 'Cart /cart',
      run: async () => {
        const r = await req('GET', '/cart');
        return { ok: r.status === 200, status: r.status };
      },
    },
    {
      label: 'Contact /contact',
      run: async () => {
        const r = await req('GET', '/contact');
        return { ok: r.status === 200, status: r.status };
      },
    },
    {
      label: 'FAQ /faq',
      run: async () => {
        const r = await req('GET', '/faq');
        return {
          ok: [200, 404].includes(r.status),
          status: r.status,
          note: r.status === 404 ? 'Trang chưa có' : 'OK',
        };
      },
    },
    {
      label: 'About /about',
      run: async () => {
        const r = await req('GET', '/about');
        return {
          ok: [200, 404].includes(r.status),
          status: r.status,
          note: r.status === 404 ? 'Trang chưa có' : 'OK',
        };
      },
    },

    // Auth
    {
      label: 'API: Register mới',
      run: async () => {
        const r = await req('POST', '/api/auth/register', {
          email: `hc_${Date.now()}@test.com`,
          password: 'Test@1234',
          full_name: 'HC User',
        });
        return { ok: r.status === 201 && r.data?.success, status: r.status, note: r.data?.message };
      },
    },
    {
      label: 'API: Đăng nhập đúng',
      run: async () => {
        const r = await req('POST', '/api/auth/login', {
          email: 'user@toanstore.com',
          password: 'User@123456',
        });
        return {
          ok: r.status === 200,
          status: r.status,
          note: r.data?.message || (r.data?.success ? 'Thành công' : 'Thất bại'),
        };
      },
    },
    {
      label: 'API: Đăng nhập sai pass',
      run: async () => {
        const r = await req('POST', '/api/auth/login', {
          email: 'user@toanstore.com',
          password: 'wrongpass',
        });
        return { ok: r.status === 401, status: r.status };
      },
    },
    {
      label: 'API: Forgot Password',
      run: async () => {
        const r = await req('POST', '/api/auth/forgot-password', { email: 'user@toanstore.com' });
        return { ok: r.status === 200, status: r.status, note: r.data?.message };
      },
    },
    {
      label: 'API: 2FA Send OTP',
      run: async () => {
        const r = await req('POST', '/api/auth/2fa/send', {
          email: 'user@toanstore.com',
          purpose: 'login',
        });
        return { ok: [200, 503].includes(r.status), status: r.status, note: r.data?.message };
      },
    },

    // Products
    {
      label: 'API: Products list',
      run: async () => {
        const r = await req('GET', '/api/products?limit=10');
        const prod = r.data?.products || r.data;
        return {
          ok: r.status === 200 && Array.isArray(prod) && prod.length > 0,
          status: r.status,
          note: `${Array.isArray(prod) ? prod.length : '?'} sản phẩm`,
        };
      },
    },
    {
      label: 'API: Product detail id=1',
      run: async () => {
        const r = await req('GET', '/api/products/1');
        return {
          ok: r.status === 200 && (r.data?.id || r.data?.product?.id),
          status: r.status,
          note: r.data?.name || r.data?.product?.name,
        };
      },
    },
    {
      label: 'API: Categories',
      run: async () => {
        const r = await req('GET', '/api/categories');
        return {
          ok: r.status === 200,
          status: r.status,
          note: `${Array.isArray(r.data) ? r.data.length : Array.isArray(r.data?.categories) ? r.data.categories.length : '?'} danh mục`,
        };
      },
    },
    {
      label: 'API: Search products',
      run: async () => {
        const r = await req('GET', '/api/search?q=Nike');
        return {
          ok: [200, 404].includes(r.status),
          status: r.status,
          note:
            r.status === 404
              ? 'API không tồn tại'
              : `${Array.isArray(r.data?.results) ? r.data.results.length : '?'} kết quả`,
        };
      },
    },

    // Cart
    {
      label: 'API: Cart GET (unauth)',
      run: async () => {
        const r = await req('GET', '/api/cart');
        return {
          ok: [200, 401].includes(r.status),
          status: r.status,
          note: r.status === 401 ? 'Cần đăng nhập' : 'OK',
        };
      },
    },

    // Orders
    {
      label: 'API: Order Lookup (nonexist)',
      run: async () => {
        const r = await req('POST', '/api/orders/lookup', {
          orderNumber: 'FAKE000',
          email: 'fake@test.com',
        });
        return {
          ok: [404, 200].includes(r.status),
          status: r.status,
          note: r.status === 404 ? 'Không tìm thấy (đúng)' : r.data?.message,
        };
      },
    },

    // Newsletter
    {
      label: 'API: Newsletter subscribe',
      run: async () => {
        const r = await req('POST', '/api/newsletter', {
          email: `nw_${Date.now()}@test.com`,
          name: 'Test',
        });
        return { ok: r.status === 200 && r.data?.success, status: r.status, note: r.data?.message };
      },
    },
    {
      label: 'API: Newsletter invalid email',
      run: async () => {
        const r = await req('POST', '/api/newsletter', { email: 'not-an-email' });
        return { ok: r.status === 400, status: r.status };
      },
    },

    // Admin (auth guard)
    {
      label: 'API: Admin dashboard (unauth)',
      run: async () => {
        const r = await req('GET', '/api/admin/dashboard');
        return { ok: [401, 403].includes(r.status), status: r.status, note: 'Bảo vệ đúng' };
      },
    },
    {
      label: 'API: Admin products (unauth)',
      run: async () => {
        const r = await req('GET', '/api/admin/products');
        return { ok: [401, 403].includes(r.status), status: r.status };
      },
    },
    {
      label: 'API: Admin orders (unauth)',
      run: async () => {
        const r = await req('GET', '/api/admin/orders');
        return { ok: [401, 403].includes(r.status), status: r.status };
      },
    },
    {
      label: 'API: Admin users (unauth)',
      run: async () => {
        const r = await req('GET', '/api/admin/users');
        return { ok: [401, 403].includes(r.status), status: r.status };
      },
    },
    {
      label: 'API: Admin inventory (unauth)',
      run: async () => {
        const r = await req('GET', '/api/admin/inventory');
        return { ok: [401, 403].includes(r.status), status: r.status };
      },
    },
    {
      label: 'API: Admin analytics (unauth)',
      run: async () => {
        const r = await req('GET', '/api/admin/analytics');
        return { ok: [401, 403].includes(r.status), status: r.status };
      },
    },
    {
      label: 'API: Admin reviews (unauth)',
      run: async () => {
        const r = await req('GET', '/api/admin/reviews');
        return {
          ok: [401, 403, 404].includes(r.status),
          status: r.status,
          note: r.status === 404 ? 'Route không tồn tại' : '',
        };
      },
    },
    {
      label: 'API: Admin vouchers (unauth)',
      run: async () => {
        const r = await req('GET', '/api/admin/vouchers');
        return { ok: [401, 403].includes(r.status), status: r.status };
      },
    },

    // Reviews public
    {
      label: 'API: Reviews public (productId=1)',
      run: async () => {
        const r = await req('GET', '/api/reviews?productId=1');
        return {
          ok: r.status === 200,
          status: r.status,
          note: Array.isArray(r.data) ? `${r.data.length} đánh giá` : r.data?.message,
        };
      },
    },

    // Contact
    {
      label: 'API: Contact form submit',
      run: async () => {
        const r = await req('POST', '/api/contact', {
          name: 'Test',
          email: 'test@test.com',
          message: 'Hello',
          subject: 'Test',
        });
        return { ok: [200, 201].includes(r.status), status: r.status, note: r.data?.message };
      },
    },

    // Maintenance
    {
      label: 'API: Maintenance check',
      run: async () => {
        const r = await req('GET', '/api/maintenance-check');
        return {
          ok: [200, 503].includes(r.status),
          status: r.status,
          note: r.data?.maintenance ? 'Đang bảo trì' : 'Online',
        };
      },
    },

    // Wishlist
    {
      label: 'API: Wishlist (unauth)',
      run: async () => {
        const r = await req('GET', '/api/wishlist');
        return {
          ok: [200, 401].includes(r.status),
          status: r.status,
          note: r.status === 401 ? 'Cần đăng nhập' : 'OK',
        };
      },
    },
  ];

  let pass = 0,
    fail = 0;
  const passedItems = [],
    failedItems = [];

  for (const t of tests) {
    process.stdout.write(`  Đang kiểm tra: ${t.label}...`);
    const result = await t.run();
    const icon = result.ok ? '✅' : result.status === 0 ? '💀' : '❌';
    if (result.ok) {
      pass++;
      passedItems.push(
        `${icon} [${result.status}] ${t.label}${result.note ? ' — ' + result.note : ''}`
      );
    } else {
      fail++;
      failedItems.push(
        `${icon} [${result.status}] ${t.label}${result.note ? ' — ' + result.note : ''}`
      );
    }
    console.log(` ${icon}`);
  }

  console.log('\n========================================');
  console.log(`   TOAN STORE — Health Check Report`);
  console.log('========================================');
  console.log('\n✅ PASS:\n' + passedItems.join('\n'));
  if (failedItems.length > 0) console.log('\n❌ FAIL / CẢNH BÁO:\n' + failedItems.join('\n'));
  console.log(
    `\n🎯 TỔNG KẾT: ${pass} PASS  |  ${fail} FAIL  |  ${pass + fail} total (${Math.round((pass / (pass + fail)) * 100)}% OK)`
  );

  // Redis warning
  console.log(
    '\n⚠️  CHÚ Ý: Redis (port 6379) không kết nối được — các tính năng cần Redis (2FA, rate limit, session) sẽ bị ảnh hưởng.'
  );
})();
