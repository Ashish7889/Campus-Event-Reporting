#!/bin/bash

# Campus Event Reporting System - Deployment Script
# This script builds and deploys the application using Docker

set -e  # Exit on any error

echo "🚀 Starting Campus Event Reporting System deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed and running
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi

    if ! docker info &> /dev/null; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi

    print_success "Docker is installed and running"
}

# Check if Docker Compose is available
check_docker_compose() {
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not available. Please install Docker Compose."
        exit 1
    fi
    print_success "Docker Compose is available"
}

# Create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    mkdir -p data logs ssl
    print_success "Directories created"
}

# Build the Docker image
build_image() {
    print_status "Building Docker image..."
    docker build -t campus-event-reporting:latest .
    print_success "Docker image built successfully"
}

# Deploy with Docker Compose
deploy() {
    print_status "Deploying application..."
    
    # Stop existing containers
    docker-compose down 2>/dev/null || true
    
    # Start the application
    if [ "$1" == "production" ]; then
        print_status "Deploying with production profile (includes Nginx)..."
        docker-compose --profile production up -d
    else
        print_status "Deploying development setup..."
        docker-compose up -d campus-events
    fi
    
    print_success "Application deployed successfully"
}

# Health check
health_check() {
    print_status "Performing health check..."
    
    # Wait for application to start
    sleep 10
    
    # Check if the application is responding
    if curl -f http://localhost:4000/api/health > /dev/null 2>&1; then
        print_success "Application is healthy and responding"
    else
        print_warning "Application might still be starting up. Check logs with:"
        echo "docker-compose logs campus-events"
    fi
}

# Show deployment information
show_info() {
    print_success "🎉 Campus Event Reporting System deployed!"
    echo ""
    echo "📱 Application URL: http://localhost:4000"
    echo "🔗 API Health Check: http://localhost:4000/api/health"
    echo "📊 Admin Panel: http://localhost:4000 (click ADMIN)"
    echo "🔑 Admin Token: admin123456"
    echo ""
    echo "📋 Useful commands:"
    echo "  View logs:     docker-compose logs -f campus-events"
    echo "  Stop app:      docker-compose down"
    echo "  Restart app:   docker-compose restart campus-events"
    echo "  Update app:    ./scripts/deploy.sh"
    echo ""
}

# Main deployment flow
main() {
    echo "🏫 Campus Event Reporting System - Docker Deployment"
    echo "=================================================="
    
    check_docker
    check_docker_compose
    create_directories
    build_image
    deploy $1
    health_check
    show_info
}

# Run main function with all arguments
main "$@"
