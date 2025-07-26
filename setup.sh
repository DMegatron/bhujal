#!/bin/bash

echo "=========================================="
echo "   Bhujal Groundwater Management Setup"
echo "=========================================="
echo

echo "Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found! Please install Node.js v16+ from https://nodejs.org/"
    exit 1
fi

# Check NPM
if ! command -v npm &> /dev/null; then
    echo "❌ NPM not found! Please install NPM"
    exit 1
fi

echo "✅ Node.js and NPM found"

# Show versions
echo "Node.js version: $(node --version)"
echo "NPM version: $(npm --version)"

echo
echo "Installing dependencies..."

# Install dependencies
npm install

if [ $? -ne 0 ]; then
    echo "❌ Dependency installation failed"
    exit 1
fi

echo "✅ Dependencies installed successfully!"

echo
echo "Setting up environment..."

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Created .env file from template"
    echo "⚠️  Please edit .env file with your configuration"
else
    echo "✅ .env file already exists"
fi

echo
echo "=========================================="
echo "        Setup Complete! 🎉"
echo "=========================================="
echo
echo "Next steps:"
echo "1. Edit .env file with your MongoDB URI and secrets"
echo "2. Start development server: npm run dev"
echo "3. Open http://localhost:3000"
echo
echo "For detailed instructions, see INSTALL.md"
echo

# Make the script executable
chmod +x setup.sh
