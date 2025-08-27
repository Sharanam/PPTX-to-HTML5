#!/usr/bin/env node

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { Command } = require('commander');
const path = require('path');
const fs = require('fs');
const { convertPPTXToHTML } = require('./converter');

// Command line argument parsing
const program = new Command();

program
  .name('PPTX-to-HTML5')
  .description('A node service to convert PPTX to HTML5 components along with animations, media and fonts in it.')
  .version('1.0.0')
  .option('-p, --port <number>', 'Port to run the service on', '3000')
  .option('-h, --host <string>', 'Host to bind the service to', 'localhost')
  .option('--dev', 'Run in development mode')
  .option('-i, --input <file>', 'Input PPTX file to convert (CLI mode)')
  .option('-o, --output <dir>', 'Output directory for HTML5 files (CLI mode)', './output')
  .parse();

const options = program.opts();

// Create Express app
const app = express();
const PORT = parseInt(options.port);
const HOST = options.host;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
        path.extname(file.originalname).toLowerCase() === '.pptx') {
      cb(null, true);
    } else {
      cb(new Error('Only PPTX files are allowed'), false);
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'PPTX to HTML5 Converter Service',
    version: '1.0.0',
    endpoints: {
      'POST /convert': 'Upload and convert PPTX file to HTML5',
      'GET /health': 'Health check endpoint'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.post('/convert', upload.single('pptx'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PPTX file uploaded' });
    }

    console.log(`Converting PPTX file: ${req.file.originalname}`);
    
    const outputDir = path.join('output', path.parse(req.file.filename).name);
    const result = await convertPPTXToHTML(req.file.path, outputDir);
    
    // Clean up uploaded file
    fs.unlinkSync(req.file.path);
    
    res.json({
      message: 'Conversion completed successfully',
      inputFile: req.file.originalname,
      outputDirectory: outputDir,
      result
    });
  } catch (error) {
    console.error('Conversion error:', error);
    
    // Clean up uploaded file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      error: 'Conversion failed', 
      details: error.message 
    });
  }
});

// CLI mode
if (options.input) {
  (async () => {
    try {
      if (!fs.existsSync(options.input)) {
        console.error(`Error: Input file ${options.input} does not exist`);
        process.exit(1);
      }
      
      console.log(`Converting ${options.input} to HTML5...`);
      const result = await convertPPTXToHTML(options.input, options.output);
      console.log('Conversion completed successfully!');
      console.log(`Output saved to: ${options.output}`);
      console.log('Result:', result);
    } catch (error) {
      console.error('Conversion failed:', error.message);
      process.exit(1);
    }
  })();
} else {
  // Server mode
  app.listen(PORT, HOST, () => {
    console.log(`PPTX to HTML5 Converter Service is running on http://${HOST}:${PORT}`);
    console.log(`Development mode: ${options.dev ? 'enabled' : 'disabled'}`);
    console.log('Use --help for command line options');
  });
}