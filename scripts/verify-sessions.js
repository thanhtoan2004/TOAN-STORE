const http = require('http');

const BASE_URL = 'http://localhost:3000';

async function runTests() {
    console.log('🚀 Starting Advanced Security Suite...\n');
    let failures = 0;

    try {
        // 1. Test Admin Login and Cookie Attributes
        failures += await testAdminLoginAttributes();

        // 2. Test Session Isolation
        failures += await testSessionIsolation();

        // 3. Test Session Expiry (Negative Case)
        // We'll simulate this by providing a malformed or "old" looking token if possible, 
        // but a real expired JWT test requires knowing the secret or having an expired one.
        // For now, we'll test a completely invalid token.
        failures += await testInvalidToken();

        // 4. Test CSRF (Negative Case - Content-Type check)
        failures += await testCSRFProtection();

        console.log('\n--- Final Result ---');
        if (failures === 0) {
            console.log('✅ ALL SECURITY TESTS PASSED');
            process.exit(0);
        } else {
            console.log(`❌ ${failures} TEST(S) FAILED`);
            process.exit(1);
        }
    } catch (err) {
        console.error('💥 Suite crashed:', err);
        process.exit(1);
    }
}

async function testAdminLoginAttributes() {
    console.log('--- Testing Admin Login & Cookie Attributes ---');
    let localFailures = 0;

    const loginData = JSON.stringify({
        email: 'admin@nike.com',
        password: 'admin123'
    });

    return new Promise((resolve) => {
        const req = http.request({
            hostname: 'localhost',
            port: 3000,
            path: '/api/auth/login-admin',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': loginData.length
            }
        }, (res) => {
            const cookies = res.headers['set-cookie'] || [];
            const adminCookie = cookies.find(c => c.startsWith('nike_admin_session='));

            if (!adminCookie) {
                console.log('❌ FAIL: nike_admin_session cookie not found');
                localFailures++;
            } else {
                console.log('✅ SUCCESS: nike_admin_session cookie found');

                // Check attributes
                if (!adminCookie.toLowerCase().includes('httponly')) {
                    console.log('❌ FAIL: HttpOnly flag missing');
                    localFailures++;
                } else {
                    console.log('✅ SUCCESS: HttpOnly flag present');
                }

                if (adminCookie.toLowerCase().includes('samesite=strict')) {
                    console.log('✅ SUCCESS: SameSite=Strict present');
                } else {
                    console.log('❌ FAIL: SameSite=Strict missing or incorrect');
                    localFailures++;
                }
            }
            resolve(localFailures);
        });
        req.write(loginData);
        req.end();
    });
}

async function testSessionIsolation() {
    console.log('\n--- Testing Session Isolation ---');
    let localFailures = 0;

    // Acquire admin token first
    const adminCookie = await getAdminCookie();

    return new Promise((resolve) => {
        const req = http.request({
            hostname: 'localhost',
            port: 3000,
            path: '/api/auth/user', // Public endpoint
            method: 'GET',
            headers: { 'Cookie': adminCookie }
        }, (res) => {
            if (res.statusCode === 200) {
                console.log('❌ FAIL: Public side accepts admin session (VULNERABILITY!)');
                localFailures++;
            } else {
                console.log(`✅ SUCCESS: Public side rejects admin session (Status: ${res.statusCode})`);
            }
            resolve(localFailures);
        });
        req.end();
    });
}

async function testInvalidToken() {
    console.log('\n--- Testing Invalid Token Rejection ---');
    return new Promise((resolve) => {
        const req = http.request({
            hostname: 'localhost',
            port: 3000,
            path: '/api/auth/admin',
            method: 'GET',
            headers: { 'Cookie': 'nike_admin_session=invalid.token.here' }
        }, (res) => {
            if (res.statusCode === 401) {
                console.log('✅ SUCCESS: Invalid token correctly rejected');
                resolve(0);
            } else {
                console.log(`❌ FAIL: Invalid token returned status ${res.statusCode}`);
                resolve(1);
            }
        });
        req.end();
    });
}

async function testCSRFProtection() {
    console.log('\n--- Testing CSRF Protection (Content-Type Enforcement) ---');
    // Simple check: Admin APIs often expect JSON. 
    // If we send a POST with text/plain, it should fail or error out if not expected.
    return new Promise((resolve) => {
        const req = http.request({
            hostname: 'localhost',
            port: 3000,
            path: '/api/auth/login-admin',
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain' // Suspicious content type for a JSON API
            }
        }, (res) => {
            // In many Next.js implementations, this might cause a parsing error (500) or 400.
            // If it returns 200, it might be vulnerable to simple CSRF via forms.
            if (res.statusCode >= 400) {
                console.log(`✅ SUCCESS: Suspicious Content-Type rejected/errored (Status: ${res.statusCode})`);
                resolve(0);
            } else {
                console.log('❌ WARNING: Suspicious Content-Type accepted with 200');
                resolve(1);
            }
        });
        req.write('{"plain":"text"}');
        req.end();
    });
}

// Helper to get cookie
function getAdminCookie() {
    return new Promise((resolve) => {
        const loginData = JSON.stringify({ email: 'admin@nike.com', password: 'admin123' });
        const req = http.request({
            hostname: 'localhost',
            port: 3000,
            path: '/api/auth/login-admin',
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': loginData.length }
        }, (res) => {
            const cookies = res.headers['set-cookie'] || [];
            resolve(cookies.join('; '));
        });
        req.write(loginData);
        req.end();
    });
}

runTests();
