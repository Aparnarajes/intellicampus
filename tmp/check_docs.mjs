import { listDocuments } from '../backend/services/ingestionService.js';

async function checkDocs() {
    try {
        const docs = await listDocuments();
        console.log('Ingested Documents:', JSON.stringify(docs, null, 2));
    } catch (err) {
        console.error('Error listing docs:', err);
    }
    process.exit();
}

checkDocs();
