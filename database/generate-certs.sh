#!/bin/bash
set -e
echo "Generating SSL certificates for PostgreSQL..."

# Generate private key
openssl genrsa -out certs/server.key 2048

# Generate certificate signing request
openssl req -new -key certs/server.key -out certs/server.csr \
  -subj "/C=US/ST=State/L=City/O=Organization/OU=Database/CN=postgresql"

# Generate self-signed certificate
openssl x509 -req -days 365 -in certs/server.csr \
  -signkey certs/server.key -out certs/server.crt

# Set proper permissions
chmod 600 certs/server.key
chmod 644 certs/server.crt
rm certs/server.csr

echo "SSL certificates generated successfully!"
