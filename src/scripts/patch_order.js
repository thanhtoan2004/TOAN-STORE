/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');

const filePath = 'd:\\nike-clone\\src\\lib\\db\\repositories\\order.ts';
let content = fs.readFileSync(filePath, 'utf-8');

const cancelOrderIndex = content.indexOf('export async function cancelOrder');

if (cancelOrderIndex === -1) {
    console.error('Could not find cancelOrder function');
    process.exit(1);
}

const commitString = 'await connection.commit();';
const commitIndex = content.lastIndexOf(commitString, cancelOrderIndex);

if (commitIndex === -1) {
    console.error('Could not find commit() call before cancelOrder');
    process.exit(1);
}

// Verify it's not too far away (e.g. belonging to a previous function)
// updateOrderStatus is the function immediately before cancelOrder.
// It should be within the last 500 characters
if (cancelOrderIndex - commitIndex > 500) {
    console.warn('Warning: commit() seems far from cancelOrder. Distance:', cancelOrderIndex - commitIndex);
    // Continue anyway as it's the valid last one
}

// Check if already patched
if (content.substring(commitIndex, cancelOrderIndex).includes('EMIT EVENT: Order Updated')) {
    console.log('Already patched');
    process.exit(0);
}

const eventLogic = `

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
        }`;

const insertionPoint = commitIndex + commitString.length;
const newContent = content.substring(0, insertionPoint) + eventLogic + content.substring(insertionPoint);

fs.writeFileSync(filePath, newContent);
console.log('Successfully patched order.ts');
