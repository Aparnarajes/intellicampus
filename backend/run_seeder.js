import seedAdmin from './utils/adminSeeder.js';

async function run() {
    console.log('Running Admin Seeder Upgrade...');
    await seedAdmin();
    console.log('Seeder COMPLETE.');
    process.exit();
}

run();
