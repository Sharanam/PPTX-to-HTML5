# PPTX-to-HTML5

A node service to convert PPTX to HTML5 components along with animations, media and fonts in it.

## Installation

This project uses pnpm as the package manager. Make sure you have Node.js installed, then install pnpm:

```bash
npm install -g pnpm
```

Install project dependencies:

```bash
pnpm install
```

## Usage

### Server Mode (HTTP API)

Start the service as an HTTP server:

```bash
# Default: http://localhost:3000
pnpm start

# Custom port and host
pnpm run server
# or
node src/index.js --port 4000 --host 0.0.0.0

# Development mode with auto-reload
pnpm run dev
```

#### API Endpoints

- `GET /` - Service information and available endpoints
- `GET /health` - Health check endpoint
- `POST /convert` - Upload and convert PPTX file to HTML5

Example API usage:

```bash
# Upload and convert a PPTX file
curl -X POST -F "pptx=@presentation.pptx" http://localhost:3000/convert
```

### Command Line Mode

Convert a PPTX file directly from the command line:

```bash
# Convert with default output directory (./output)
node src/index.js --input presentation.pptx

# Convert with custom output directory
node src/index.js --input presentation.pptx --output ./my-output

# Get help
node src/index.js --help
```

### Command Line Options

- `-p, --port <number>` - Port to run the service on (default: 3000)
- `-h, --host <string>` - Host to bind the service to (default: localhost)
- `--dev` - Run in development mode
- `-i, --input <file>` - Input PPTX file to convert (CLI mode)
- `-o, --output <dir>` - Output directory for HTML5 files (default: ./output)
- `--help` - Display help information

## Features

- ✅ HTTP API for PPTX upload and conversion
- ✅ Command line interface for batch processing
- ✅ Extracts media files (images, fonts) from PPTX
- ✅ Generates responsive HTML5 presentation
- ✅ CSS animations and transitions
- ✅ Keyboard navigation (arrow keys, spacebar)
- ✅ Navigation controls
- ✅ Slide indicators
- 🚧 Full PPTX XML parsing (basic implementation included)
- 🚧 Advanced animations and transitions
- 🚧 Font extraction and embedding

## Output Structure

When a PPTX file is converted, the following structure is created:

```
output/
├── index.html          # Main presentation HTML file
├── presentation.css    # Generated styles and animations
├── media/              # Extracted media files
│   ├── image1.png
│   ├── image2.jpg
│   └── ...
└── slide-1.html        # Individual slide components
    slide-2.html
    ...
```

## Development

Run in development mode with auto-reload:

```bash
pnpm run dev
```

## License

Apache License 2.0 - see LICENSE file for details.
