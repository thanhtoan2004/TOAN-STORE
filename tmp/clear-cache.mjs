import { createClient } from 'redis';
const client = createClient({ url: 'redis://127.0.0.1:6379' });
async function run() {
  await client.connect();
  const keys = await client.keys('products:list:*');
  for (const key of keys) {
    await client.del(key);
    console.log('Deleted:', key);
  }
  await client.disconnect();
}
run();
