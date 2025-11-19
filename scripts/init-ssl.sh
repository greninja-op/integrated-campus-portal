#!/bin/bash

# SSL Certificate Setup Script
# Generates self-signed certificates for development or sets up Let's Encrypt for production

set -e

DOMAIN=${1:-localhost}
SSL_DIR="./ssl"

echo "SSL Certificate Setup"
echo "====================="
echo ""

# Create SSL directory
mkdir -p "${SSL_DIR}"

if [ "$DOMAIN" = "localhost" ]; then
    echo "Generating self-signed certificate for development..."
    
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "${SSL_DIR}/private.key" \
        -out "${SSL_DIR}/certificate.crt" \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=${DOMAIN}"
    
    echo "Self-signed certificate generated!"
    echo "Files created:"
    echo "  - ${SSL_DIR}/private.key"
    echo "  - ${SSL_DIR}/certificate.crt"
    echo ""
    echo "Note: Browsers will show security warnings for self-signed certificates."
else
    echo "Setting up Let's Encrypt for production..."
    echo "Domain: ${DOMAIN}"
    echo ""
    
    if ! command -v certbot &> /dev/null; then
        echo "Error: certbot is not installed"
        echo "Install with: sudo apt-get install certbot"
        exit 1
    fi
    
    echo "Running certbot..."
    sudo certbot certonly --standalone -d "${DOMAIN}" \
        --non-interactive --agree-tos --email admin@${DOMAIN}
    
    # Copy certificates
    sudo cp "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" "${SSL_DIR}/certificate.crt"
    sudo cp "/etc/letsencrypt/live/${DOMAIN}/privkey.pem" "${SSL_DIR}/private.key"
    sudo chown $(whoami):$(whoami) "${SSL_DIR}"/*
    
    echo "Let's Encrypt certificate installed!"
    echo ""
    echo "Auto-renewal is configured via certbot."
fi

echo ""
echo "Update docker-compose.yml to enable HTTPS on port 443"
