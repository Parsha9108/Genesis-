#!/bin/bash
# Root level quick deploy wrapper script for project-genesis

set -e

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Get the directory where this script is located (project root)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

print_status "GENESIS Monitoring Tool - Quick Deploy"
print_status "============================================="

# Check if scripts directory exists
if [ ! -d "$SCRIPT_DIR/scripts" ]; then
    print_error "scripts/ directory not found!"
    print_error "Please make sure you're running this from the project root directory."
    exit 1
fi

# Check if main installation script exists
if [ ! -f "$SCRIPT_DIR/scripts/install_and_deploy.sh" ]; then
    print_error "install_and_deploy.sh not found in scripts/ directory!"
    exit 1
fi

# Make the script executable if it's not
chmod +x "$SCRIPT_DIR/scripts/install_and_deploy.sh"

# Run the main installation script
exec "$SCRIPT_DIR/scripts/install_and_deploy.sh" "$@"
