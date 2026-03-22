import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { protect } from '../middlewares/auth.js';

const router = express.Router();

// All notes routes require authentication
router.use(protect);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// @route   POST /api/notes/save
router.post('/save', async (req, res) => {
    try {
        const { title, subjectCode, content, unit, type = 'Note', results = null } = req.body;

        const notesRootDir = path.join(__dirname, '../../ai_generated_notes');
        let targetDir = path.join(notesRootDir, subjectCode);

        if (type === 'Test') {
            targetDir = path.join(targetDir, 'Tests');
        }

        if (!fs.existsSync(notesRootDir)) fs.mkdirSync(notesRootDir, { recursive: true });
        if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

        const timestamp = Date.now();
        const fileName = type === 'Test'
            ? `TestResult_${unit.replace(/\s+/g, '_')}_${timestamp}.md`
            : `${unit.replace(/\s+/g, '_')}_${timestamp}.md`;

        const filePath = path.join(targetDir, fileName);

        let fileContent = '';
        if (type === 'Test' && results) {
            fileContent = `# Mock Test Result: ${title}\n\nSubject: ${subjectCode}\nUnit: ${unit}\nDate: ${new Date().toLocaleString()}\nScore: ${results.score}/${results.total} (${results.percentage}%)\n\n---\n\n## Performance Review\n\n`;
            results.wrongAnswers.forEach((w, i) => {
                fileContent += `### Q${i + 1}: ${w.question}\n- **Your Answer:** ${w.selected}\n- **Correct Answer:** ${w.correct}\n- **Explanation:** ${w.explanation}\n\n`;
            });
        } else {
            fileContent = `# ${title}\n\nSubject Code: ${subjectCode}\nUnit: ${unit}\nGenerated At: ${new Date().toLocaleString()}\n\n---\n\n${content}`;
        }

        fs.writeFileSync(filePath, fileContent);

        return res.success({ path: filePath }, 'Note saved successfully to folder');
    } catch (error) {
        console.error('Save Note Error:', error);
        return res.error(error.message);
    }
});

// @route   GET /api/notes
router.get('/', async (req, res) => {
    try {
        const notesRootDir = path.join(__dirname, '../../ai_generated_notes');

        if (!fs.existsSync(notesRootDir)) {
            return res.success({ library: [] });
        }

        const folders = fs.readdirSync(notesRootDir).filter(f => fs.statSync(path.join(notesRootDir, f)).isDirectory());

        const library = folders.map(folder => {
            const folderPath = path.join(notesRootDir, folder);

            const getAllFiles = (dirPath, arrayOfFiles = []) => {
                const files = fs.readdirSync(dirPath);
                files.forEach(file => {
                    const fullPath = path.join(dirPath, file);
                    if (fs.statSync(fullPath).isDirectory()) {
                        arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
                    } else if (file.endsWith('.md')) {
                        arrayOfFiles.push({
                            name: file,
                            path: fullPath,
                            content: fs.readFileSync(fullPath, 'utf-8'),
                            savedAt: fs.statSync(fullPath).mtime,
                            relativeDir: path.relative(folderPath, dirPath)
                        });
                    }
                });
                return arrayOfFiles;
            };

            return {
                subjectCode: folder,
                notes: getAllFiles(folderPath)
            };
        });

        return res.success({ library });
    } catch (error) {
        console.error('List Notes Error:', error);
        return res.error(error.message);
    }
});

export default router;
