#!/bin/bash

# PPTX-to-HTML5 Service Examples
# This script demonstrates various ways to use the service

echo "PPTX-to-HTML5 Service Usage Examples"
echo "====================================="

# Example 1: Start the service with default settings
echo ""
echo "1. Start service with default settings (localhost:3000):"
echo "   pnpm start"
echo "   # or"
echo "   node src/index.js"

# Example 2: Start with custom port and host
echo ""
echo "2. Start service with custom port and host:"
echo "   node src/index.js --port 4000 --host 0.0.0.0"

# Example 3: Development mode
echo ""
echo "3. Start in development mode (auto-reload):"
echo "   pnpm run dev"
echo "   # or"
echo "   node src/index.js --dev"

# Example 4: CLI conversion
echo ""
echo "4. Convert PPTX file via command line:"
echo "   node src/index.js --input presentation.pptx"
echo "   node src/index.js --input presentation.pptx --output ./my-output"

# Example 5: API usage
echo ""
echo "5. Use HTTP API for conversion:"
echo "   # Start the service first:"
echo "   pnpm start"
echo ""
echo "   # Then in another terminal:"
echo "   curl -X POST -F \"pptx=@presentation.pptx\" http://localhost:3000/convert"

# Example 6: Health check
echo ""
echo "6. Check service health:"
echo "   curl http://localhost:3000/health"

# Example 7: Get service info
echo ""
echo "7. Get service information:"
echo "   curl http://localhost:3000/"

echo ""
echo "For more options, run: node src/index.js --help"