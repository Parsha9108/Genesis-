# #!/bin/bash
# GENESIS Monitoring Tool - Auto Installation & Deployment Script
# This script installs Docker, Docker Compose, and deploys the application

set -e  # Exit on any error

echo "=========================================="
echo "GENESIS Monitoring Tool Installer"
echo "=========================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_success() {
    echo -e "${BLUE}[SUCCESS]${NC} $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_error "Please don't run this script as root. Use a regular user with sudo privileges."
    exit 1
fi

# Detect OS
detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
        VERSION=$VERSION_ID
        VERSION_CODENAME=${VERSION_CODENAME:-}
    else
        print_error "Cannot detect OS. This script supports Ubuntu/Debian/CentOS/Fedora."
        exit 1
    fi
    print_status "Detected OS: $PRETTY_NAME"
}

# Install Docker
install_docker() {
    print_status "Checking Docker installation..."
    
    if command -v docker &> /dev/null; then
        print_warning "Docker is already installed. Skipping Docker installation."
        return
    fi

    print_status "Installing Docker..."
    
    case $OS in
        ubuntu|debian)
            # Update package index
            sudo apt-get update
            
            # Install required packages
            sudo apt-get install -y \
                apt-transport-https \
                ca-certificates \
                curl \
                gnupg \
                lsb-release \
                software-properties-common

            # Add Docker's official GPG key
            sudo install -m 0755 -d /etc/apt/keyrings
            curl -fsSL https://download.docker.com/linux/$OS/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
            sudo chmod a+r /etc/apt/keyrings/docker.gpg

            # Add Docker repository
            echo \
                "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/$OS \
                $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
                sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

            # Update package index
            sudo apt-get update

            # Install Docker Engine
            sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
            ;;
            
        centos|rhel)
            # Install required packages
            sudo yum install -y yum-utils device-mapper-persistent-data lvm2
            
            # Add Docker repository
            sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
            
            # Install Docker
            sudo yum install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
            ;;
            
        fedora)
            # Install required packages
            sudo dnf -y install dnf-plugins-core
            
            # Add Docker repository
            sudo dnf config-manager --add-repo https://download.docker.com/linux/fedora/docker-ce.repo
            
            # Install Docker
            sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
            ;;
            
        *)
            print_error "Unsupported OS: $OS"
            exit 1
            ;;
    esac

    # Start and enable Docker service
    sudo systemctl start docker
    sudo systemctl enable docker

    # Add current user to docker group
    sudo usermod -aG docker $USER
    
    print_status "Docker installed successfully!"
}

# Install Docker Compose (for older Docker versions)
install_docker_compose() {
    print_status "Checking Docker Compose..."
    
    # Check if docker compose plugin is available (newer Docker versions)
    if docker compose version &> /dev/null; then
        print_status "Docker Compose plugin is already available."
        return
    fi
    
    # Check if docker-compose is installed (standalone version)
    if command -v docker-compose &> /dev/null; then
        print_status "Docker Compose (standalone) is already installed."
        return
    fi

    print_status "Installing Docker Compose..."
    
    # Get latest Docker Compose version
    COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')
    
    # Download and install Docker Compose
    sudo curl -L "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    
    # Make it executable
    sudo chmod +x /usr/local/bin/docker-compose
    
    print_status "Docker Compose installed successfully!"
}

# Verify installations
verify_installation() {
    print_status "Verifying installations..."
    
    # Test Docker
    if ! docker --version &> /dev/null; then
        print_error "Docker installation failed!"
        exit 1
    fi
    
    # Test Docker Compose and set command
    if docker compose version &> /dev/null; then
        COMPOSE_CMD="docker compose"
    elif docker-compose --version &> /dev/null; then
        COMPOSE_CMD="docker-compose"
    else
        print_error "Docker Compose installation failed!"
        exit 1
    fi
    
    print_status "Docker version: $(docker --version)"
    print_status "Docker Compose version: $($COMPOSE_CMD --version)"
}

# Setup application
setup_application() {
    print_status "Setting up GENESIS application..."
    
    # Get project root directory (parent of scripts directory)
    PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
    SRC_DIR="$PROJECT_ROOT/Centralserver"
    
    # Change to src directory where docker-compose.yml is located
    cd "$SRC_DIR"
    
    # Check if docker-compose.yml exists
    if [ ! -f "docker-compose.yml" ]; then
        print_error "docker-compose.yml not found in $SRC_DIR!"
        print_error "Please make sure your project structure is correct."
        exit 1
    fi
    
    print_status "Application setup completed!"
}

# Start services
start_services() {
    print_status "Starting GENESIS services..."
    
    # Stop any existing containers
    $COMPOSE_CMD down --remove-orphans 2>/dev/null || true
    
    # Pull latest images
    print_status "Pulling Docker images..."
    $COMPOSE_CMD pull
    
    # Build custom images
    print_status "Building custom images..."
    $COMPOSE_CMD build --no-cache
    
    # Start services
    print_status "Starting all services..."
    $COMPOSE_CMD up -d
    
    # Wait for services to start
    print_status "Waiting for services to start..."
    sleep 10
    
    # Check service status
    print_status "Service status:"
    $COMPOSE_CMD ps
}

# Check backend health
check_backend_health() {
    print_status "Checking backend health..."
    
    MAX_RETRIES=30
    RETRY_COUNT=0
    
    while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        if $COMPOSE_CMD exec -T backend python manage.py check --database default > /dev/null 2>&1; then
            print_success "Backend is healthy and ready!"
            return 0
        fi
        echo -ne "${YELLOW}[WAIT]${NC} Waiting for backend to be ready... ($((RETRY_COUNT+1))/$MAX_RETRIES)\r"
        sleep 2
        RETRY_COUNT=$((RETRY_COUNT+1))
    done
    
    echo ""
    print_error "Backend failed to become ready within expected time."
    return 1
}

# Setup admin user
setup_admin_user() {
    echo ""
    echo "=========================================="
    echo -e "${BLUE}Admin User Registration${NC}"
    echo "=========================================="
    echo ""
    
    read -p "Do you want to register an admin user now? (y/n): " -n 1 -r
    echo ""
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Admin registration skipped."
        print_status "You can register an admin later by running:"
        print_status "  cd $SRC_DIR"
        print_status "  $COMPOSE_CMD exec -it backend python manage.py registeradmin"
        return 0
    fi
    
    echo ""
    print_status "Starting admin user registration..."
    print_status "You will be prompted to enter username, email, and password."
    echo ""
    
    # Run interactive admin registration
    if $COMPOSE_CMD exec -it backend python manage.py registeradmin  --host http://127.0.0.1:8001; then
        echo ""
        print_status "Assigning admin permissions..."
        
        if $COMPOSE_CMD exec -T backend python manage.py assign_admin_permissions ; then
            print_success "Admin permissions assigned successfully!"
        else
            print_warning "Permission assignment failed or already assigned."
        fi
        
        print_success "Admin user setup completed!"
    else
        print_warning "Admin registration failed or was cancelled."
        print_status "You can try again later by running:"
        print_status "  $COMPOSE_CMD exec -it backend python manage.py registeradmin"
    fi
    
    echo ""
}

# Setup system service (optional)
setup_system_service() {
    echo "=========================================="
    read -p "Do you want to create a system service to auto-start GENESIS on boot? (y/n): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Creating system service..."
        
        PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
        SRC_DIR="$PROJECT_ROOT/Centralserver"
        
        # Create systemd service file
        sudo tee /etc/systemd/system/genesis-monitoring.service > /dev/null <<EOF
[Unit]
Description=GENESIS Monitoring Tool
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$SRC_DIR
ExecStart=$COMPOSE_CMD up -d
ExecStop=$COMPOSE_CMD down
TimeoutStartSec=0
User=$USER
Group=docker

[Install]
WantedBy=multi-user.target
EOF

        # Reload systemd and enable service
        sudo systemctl daemon-reload
        sudo systemctl enable genesis-monitoring.service
        
        print_success "System service created and enabled!"
        print_status "GENESIS will now start automatically on system boot."
    else
        print_status "System service setup skipped."
    fi
    echo ""
}

# Main installation process
main() {
    print_status "Starting deployment process..."
    
    detect_os
    install_docker
    install_docker_compose
    verify_installation
    
    # Check if user needs to log out/in for Docker permissions
    if ! groups $USER | grep -q docker; then
        print_warning "You need to log out and log back in (or restart) for Docker permissions to take effect."
        read -p "Do you want to continue with deployment now using sudo? (y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_status "Installation completed. Please log out/in and rerun this script to deploy."
            exit 0
        fi
        # Use sudo for docker commands if user not in docker group yet
        COMPOSE_CMD="sudo $COMPOSE_CMD"
    fi
    
    setup_application
    start_services
    
    # Check backend health before admin setup
    if check_backend_health; then
        setup_admin_user
    else
        print_warning "Skipping admin setup due to backend health check failure."
        print_status "You can set up admin later once the backend is healthy."
    fi
    
    setup_system_service
    
    echo "=========================================="
    print_success "GENESIS Deployment Completed Successfully!"
    echo "=========================================="
    
    echo ""
    print_status "Access your application at:"
    print_status "  WEB UI: https://$(hostname -I | awk '{print $1}')/app/"
    print_status "  Backend API: https://$(hostname -I | awk '{print $1}')/api/"
    echo ""
    print_status "Useful commands:"
    print_status "  View logs: $COMPOSE_CMD logs -f"
    print_status "  View specific service logs: $COMPOSE_CMD logs -f backend"
    print_status "  Stop services: $COMPOSE_CMD down"
    print_status "  Restart services: $COMPOSE_CMD restart"
    print_status "  View status: $COMPOSE_CMD ps"
    print_status "  Register admin: $COMPOSE_CMD exec -it backend python manage.py registeradmin"
    echo ""
    print_status "For help and documentation, check the docs/ directory."
    echo "=========================================="
}

# Run main function
main "$@"
