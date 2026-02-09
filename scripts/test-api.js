const fetch = require('node-fetch'); // Assuming node-fetch is available or using built-in fetch in newer Node
// If node-fetch is not installed, we can use http module or assume usage in environment with global fetch (Node 18+)

async function testApi() {
    const baseUrl = 'http://localhost:3000';
    const userId = 1; // Assuming user ID 1 exists

    // 1. Create a dummy address to delete
    console.log('Creating dummy address...');
    const createRes = await fetch(`${baseUrl}/api/addresses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userId,
            name: 'Test Delete',
            phone: '0123456789',
            address: 'Test Address',
            city: 'Test City',
            network: 'Test Network'
        })
    });

    if (!createRes.ok) {
        console.error('Failed to create address:', await createRes.text());
        return;
    }

    const createData = await createRes.json();
    const addressId = createData.id;
    console.log(`Created address ID: ${addressId}`);

    // 2. Test DELETE
    console.log(`Testing DELETE /api/addresses?userId=${userId}&addressId=${addressId}...`);
    const deleteRes = await fetch(`${baseUrl}/api/addresses?userId=${userId}&addressId=${addressId}`, {
        method: 'DELETE'
    });

    if (deleteRes.ok) {
        console.log('DELETE Successful (200 OK)');
    } else {
        console.error(`DELETE Failed: ${deleteRes.status} ${deleteRes.statusText}`);
        console.error(await deleteRes.text());
    }
}

testApi();
