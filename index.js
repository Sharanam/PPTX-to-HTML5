import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import Converter from 'ppt-png';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.NODE_PORT || 3000;

// Multer setup for file uploads
const upload = multer({ dest: 'uploads/' });

// POST endpoint to accept PPTX file
app.post('/upload', upload.any('pptx'), async (req, res) => {
    console.log(`Received files: ${JSON.stringify(req.files)}`);
    req.file = req.files[0]
    if (!req.file) {
        return res.status(400).json({ error: 'No PPTX file uploaded.' });
    }
    req.file.path = path.join(__dirname, req.file.path);
    // Generate random output directory
    const outputDir = path.join(__dirname, 'output', uuidv4());
    console.debug(`Creating output directory at ${outputDir}`);
    fs.mkdirSync(outputDir, { recursive: true });

    try {
        console.debug(`Converting ${req.file.path} to PNG...`);
        // Convert PPTX to PNG images (one per slide)
        const converter = Converter.create({
            files: [req.file.path],
            output: outputDir
        });
        console.debug(`Starting conversion...`);

        await converter.convert();
        console.debug(`Conversion completed.`);
        // List generated PNG files
        const pngFiles = fs.readdirSync(outputDir)
            .filter(f => f.endsWith('.png'))
            .map(f => path.join(outputDir, f));

        res.json({
            message: 'PPTX converted to PNG successfully.',
            outputDir,
            pngFiles
        });
    } catch (err) {
        console.error('Conversion error:', err);
        res.status(500).json({ error: 'Failed to convert PPTX to PNG.', details: err.message });
    } finally {
        // Clean up uploaded PPTX file
        fs.unlinkSync(req.file.path);
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});