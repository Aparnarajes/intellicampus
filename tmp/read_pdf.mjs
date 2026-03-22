import pdf from '../backend/node_modules/pdf-parse/lib/pdf-parse.js';
import fs from 'fs';

async function readSyllabus() {
    const filePath = 'C:/Users/cyborg/Desktop/report body 8thsemAPPU.pdf';
    if (!fs.existsSync(filePath)) {
        console.log('PDF not found at ' + filePath);
        process.exit(1);
    }
    const dataBuffer = fs.readFileSync(filePath);
    try {
        const data = await pdf(dataBuffer);
        console.log('--- PDF TEXT START ---');
        console.log(data.text.substring(0, 5000));
        console.log('--- PDF TEXT END ---');
    } catch (err) {
        console.error('Error parsing PDF:', err);
    }
}

readSyllabus();
