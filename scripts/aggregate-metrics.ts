import { aggregateDailyMetrics } from '../src/lib/analytics/aggregation';
import { logger } from '../src/lib/logger';

async function main() {
    const args = process.argv.slice(2);
    const mode = args[0] || 'today';

    if (mode === 'range') {
        const startStr = args[1];
        const endStr = args[2];

        if (!startStr || !endStr) {
            console.error('Usage: npx tsx scripts/aggregate-metrics.ts range YYYY-MM-DD YYYY-MM-DD');
            process.exit(1);
        }

        const start = new Date(startStr);
        const end = new Date(endStr);

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            await aggregateDailyMetrics(dateStr);
        }
    } else {
        const dateStr = mode === 'today' ? new Date().toISOString().split('T')[0] : mode;
        await aggregateDailyMetrics(dateStr);
    }
}

main().catch(err => {
    logger.error(err, 'Aggregation script failed');
    process.exit(1);
});
