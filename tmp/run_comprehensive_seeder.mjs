import seedComprehensiveData from '../backend/utils/comprehensiveSeeder.js';

async function run() {
    try {
        await seedComprehensiveData();
        console.log('Seeder finished successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Seeder failed:', err);
        process.exit(1);
    }
}

run();
