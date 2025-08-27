const fs = require('fs');
const path = require('path');
const yauzl = require('yauzl');
const JSZip = require('jszip');

/**
 * Convert PPTX file to HTML5 components
 * @param {string} inputPath - Path to the PPTX file
 * @param {string} outputDir - Directory to save HTML5 output
 * @returns {Promise<Object>} Conversion result
 */
async function convertPPTXToHTML(inputPath, outputDir) {
  try {
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Read and parse PPTX file
    const pptxData = await parsePPTX(inputPath);
    
    // Extract media files (images, fonts, etc.)
    const mediaFiles = await extractMediaFiles(inputPath, outputDir);
    
    // Generate HTML5 components
    const htmlComponents = await generateHTML5Components(pptxData, mediaFiles, outputDir);
    
    // Generate CSS for animations and styling
    const cssFiles = await generateCSS(pptxData, outputDir);
    
    // Generate main HTML file
    const mainHtmlFile = await generateMainHTML(htmlComponents, cssFiles, outputDir);
    
    return {
      success: true,
      slides: pptxData.slides.length,
      mediaFiles: mediaFiles.length,
      htmlFile: mainHtmlFile,
      cssFiles,
      outputDirectory: outputDir
    };
  } catch (error) {
    throw new Error(`PPTX conversion failed: ${error.message}`);
  }
}

/**
 * Parse PPTX file and extract slide data
 * @param {string} inputPath - Path to PPTX file
 * @returns {Promise<Object>} Parsed PPTX data
 */
async function parsePPTX(inputPath) {
  return new Promise((resolve, reject) => {
    const data = fs.readFileSync(inputPath);
    JSZip.loadAsync(data).then(zip => {
      const slides = [];
      const slidePromises = [];
      
      // Find all slide files
      zip.forEach((relativePath, file) => {
        if (relativePath.startsWith('ppt/slides/slide') && relativePath.endsWith('.xml')) {
          slidePromises.push(
            file.async('text').then(content => {
              const slideNumber = parseInt(relativePath.match(/slide(\d+)\.xml/)[1]);
              return { number: slideNumber, content, path: relativePath };
            })
          );
        }
      });
      
      Promise.all(slidePromises).then(slideData => {
        slideData.sort((a, b) => a.number - b.number);
        resolve({
          slides: slideData,
          zip: zip
        });
      }).catch(reject);
    }).catch(reject);
  });
}

/**
 * Extract media files from PPTX
 * @param {string} inputPath - Path to PPTX file
 * @param {string} outputDir - Output directory
 * @returns {Promise<Array>} List of extracted media files
 */
async function extractMediaFiles(inputPath, outputDir) {
  return new Promise((resolve, reject) => {
    const data = fs.readFileSync(inputPath);
    const mediaDir = path.join(outputDir, 'media');
    
    if (!fs.existsSync(mediaDir)) {
      fs.mkdirSync(mediaDir, { recursive: true });
    }
    
    JSZip.loadAsync(data).then(zip => {
      const mediaFiles = [];
      const extractPromises = [];
      
      zip.forEach((relativePath, file) => {
        if (relativePath.startsWith('ppt/media/')) {
          const fileName = path.basename(relativePath);
          const outputPath = path.join(mediaDir, fileName);
          
          extractPromises.push(
            file.async('nodebuffer').then(buffer => {
              fs.writeFileSync(outputPath, buffer);
              mediaFiles.push({
                originalPath: relativePath,
                fileName: fileName,
                outputPath: outputPath,
                relativePath: path.join('media', fileName)
              });
            })
          );
        }
      });
      
      Promise.all(extractPromises).then(() => {
        resolve(mediaFiles);
      }).catch(reject);
    }).catch(reject);
  });
}

/**
 * Generate HTML5 components for slides
 * @param {Object} pptxData - Parsed PPTX data
 * @param {Array} mediaFiles - Extracted media files
 * @param {string} outputDir - Output directory
 * @returns {Promise<Array>} Generated HTML components
 */
async function generateHTML5Components(pptxData, mediaFiles, outputDir) {
  const components = [];
  
  for (const slide of pptxData.slides) {
    const slideHtml = generateSlideHTML(slide, mediaFiles);
    const slideFileName = `slide-${slide.number}.html`;
    const slideFilePath = path.join(outputDir, slideFileName);
    
    fs.writeFileSync(slideFilePath, slideHtml);
    
    components.push({
      slideNumber: slide.number,
      fileName: slideFileName,
      filePath: slideFilePath
    });
  }
  
  return components;
}

/**
 * Generate HTML for a single slide
 * @param {Object} slide - Slide data
 * @param {Array} mediaFiles - Media files
 * @returns {string} HTML content for the slide
 */
function generateSlideHTML(slide, mediaFiles) {
  // Basic slide HTML structure
  // This is a simplified version - in a real implementation, you'd parse the XML more thoroughly
  return `
    <div class="slide" data-slide="${slide.number}">
      <div class="slide-content">
        <!-- Slide content will be parsed from XML and inserted here -->
        <h2>Slide ${slide.number}</h2>
        <p>Content parsed from PPTX slide XML</p>
        <!-- Note: Full XML parsing implementation would go here -->
      </div>
    </div>
  `;
}

/**
 * Generate CSS files for styling and animations
 * @param {Object} pptxData - Parsed PPTX data
 * @param {string} outputDir - Output directory
 * @returns {Promise<Array>} Generated CSS files
 */
async function generateCSS(pptxData, outputDir) {
  const cssContent = `
/* PPTX to HTML5 Converter - Generated Styles */

.presentation-container {
  width: 100%;
  height: 100vh;
  overflow: hidden;
  position: relative;
  background: #000;
}

.slide {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.5s ease-in-out;
  background: white;
}

.slide.active {
  opacity: 1;
}

.slide-content {
  max-width: 90%;
  max-height: 90%;
  text-align: center;
}

.slide h2 {
  font-size: 2.5em;
  margin-bottom: 1em;
  color: #333;
}

.slide p {
  font-size: 1.2em;
  line-height: 1.6;
  color: #666;
}

/* Navigation controls */
.nav-controls {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
}

.nav-btn {
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  padding: 10px 20px;
  margin: 0 5px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
}

.nav-btn:hover {
  background: rgba(0, 0, 0, 0.9);
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Slide indicator */
.slide-indicator {
  position: fixed;
  top: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 10px 15px;
  border-radius: 5px;
  font-size: 14px;
  z-index: 1000;
}

/* Media elements */
img {
  max-width: 100%;
  height: auto;
}

/* Animation classes */
.fade-in {
  animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.slide-in-left {
  animation: slideInLeft 0.5s ease-out;
}

@keyframes slideInLeft {
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
}

.slide-in-right {
  animation: slideInRight 0.5s ease-out;
}

@keyframes slideInRight {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}
`;

  const cssFileName = 'presentation.css';
  const cssFilePath = path.join(outputDir, cssFileName);
  
  fs.writeFileSync(cssFilePath, cssContent);
  
  return [{
    fileName: cssFileName,
    filePath: cssFilePath
  }];
}

/**
 * Generate main HTML file that ties everything together
 * @param {Array} htmlComponents - Generated HTML components
 * @param {Array} cssFiles - Generated CSS files
 * @param {string} outputDir - Output directory
 * @returns {Promise<string>} Main HTML file path
 */
async function generateMainHTML(htmlComponents, cssFiles, outputDir) {
  const slidesHtml = htmlComponents.map((component, index) => 
    `<div class="slide ${index === 0 ? 'active' : ''}" data-slide="${component.slideNumber}">
      <div class="slide-content">
        <h2>Slide ${component.slideNumber}</h2>
        <p>Content from converted PPTX slide</p>
      </div>
    </div>`
  ).join('\n');

  const mainHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PPTX to HTML5 Presentation</title>
    <link rel="stylesheet" href="presentation.css">
</head>
<body>
    <div class="presentation-container">
        ${slidesHtml}
        
        <div class="nav-controls">
            <button class="nav-btn" id="prevBtn" onclick="prevSlide()">Previous</button>
            <button class="nav-btn" id="nextBtn" onclick="nextSlide()">Next</button>
        </div>
        
        <div class="slide-indicator">
            <span id="currentSlide">1</span> / <span id="totalSlides">${htmlComponents.length}</span>
        </div>
    </div>

    <script>
        let currentSlideIndex = 0;
        const slides = document.querySelectorAll('.slide');
        const totalSlides = slides.length;
        
        document.getElementById('totalSlides').textContent = totalSlides;
        
        function showSlide(index) {
            slides.forEach(slide => slide.classList.remove('active'));
            slides[index].classList.add('active');
            document.getElementById('currentSlide').textContent = index + 1;
            
            // Update navigation buttons
            document.getElementById('prevBtn').disabled = index === 0;
            document.getElementById('nextBtn').disabled = index === totalSlides - 1;
        }
        
        function nextSlide() {
            if (currentSlideIndex < totalSlides - 1) {
                currentSlideIndex++;
                showSlide(currentSlideIndex);
            }
        }
        
        function prevSlide() {
            if (currentSlideIndex > 0) {
                currentSlideIndex--;
                showSlide(currentSlideIndex);
            }
        }
        
        // Keyboard navigation
        document.addEventListener('keydown', function(e) {
            if (e.key === 'ArrowRight' || e.key === ' ') {
                nextSlide();
            } else if (e.key === 'ArrowLeft') {
                prevSlide();
            }
        });
        
        // Initialize
        showSlide(0);
    </script>
</body>
</html>`;

  const mainHtmlPath = path.join(outputDir, 'index.html');
  fs.writeFileSync(mainHtmlPath, mainHtml);
  
  return mainHtmlPath;
}

module.exports = {
  convertPPTXToHTML
};