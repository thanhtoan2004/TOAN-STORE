import fs from 'fs';
import path from 'path';

const filePath = 'd:\\nike-clone\\src\\lib\\db\\repositories\\order.ts';
const content = fs.readFileSync(filePath, 'utf-8');

const target = `        await connection.commit();
    } catch (error) {
        await connection.rollback();`;

const replacement = `        await connection.commit();

        // EMIT EVENT: Order Updated
        if (oldStatus !== status) {
             console.log(\`📡 Publishing order.updated: \${orderNumber} \${oldStatus} -> \${status}\`);
             await eventBus.publish('order.updated', {
                orderId: currentOrder[0].id,
                orderNumber,
                oldStatus,
                newStatus: status,
                timestamp: new Date()
            });
        }

    } catch (error) {
        await connection.rollback();`;

// We need to find the Instance of target that is inside updateOrderStatus
// updateOrderStatus starts around line 475. cancelOrder starts around 762.
// So we look for the target BEFORE "export async function cancelOrder"

const cancelOrderIndex = content.indexOf('export async function cancelOrder');

if (cancelOrderIndex === -1) {
    console.error('Could not find cancelOrder function');
    process.exit(1);
}

const lastCommitIndex = content.lastIndexOf(target, cancelOrderIndex);

if (lastCommitIndex === -1) {
    console.error('Could not find target block before cancelOrder');
    // Try to find just the commit line if indentation is different
    const looserTarget = 'await connection.commit();';
    const lastCommit = content.lastIndexOf(looserTarget, cancelOrderIndex);
    if (lastCommit === -1) {
        console.error('Could not find ANY commit before cancelOrder');
        process.exit(1);
    }
    console.log('Found looser target, check manual verification');
    // For now, abort to be safe
    process.exit(1);
}

// Check if already patched
if (content.includes('EMIT EVENT: Order Updated')) {
    console.log('Already patched');
    process.exit(0);
}

const newContent = content.substring(0, lastCommitIndex) + replacement + content.substring(lastCommitIndex + target.length);

fs.writeFileSync(filePath, newContent);
console.log('Successfully patched order.ts');
