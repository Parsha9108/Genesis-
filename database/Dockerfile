FROM postgres:16-alpine

# CIS Benchmark - Install required packages
RUN apk add --no-cache \
    openssl \
    bash \
    curl \
    postgresql16-contrib \
    && rm -rf /var/cache/apk/*

# CIS Benchmark - Create required directories with proper permissions
RUN mkdir -p \
    /etc/ssl/certs \
    /etc/ssl/private \
    /var/log/postgresql \
    /etc/postgresql \
    && chown -R postgres:postgres /var/log/postgresql /etc/ssl/private

# CIS Benchmark - Copy SSL certificates
COPY certs/server.crt /etc/ssl/certs/
COPY certs/server.key /etc/ssl/private/
RUN chown postgres:postgres /etc/ssl/certs/server.crt /etc/ssl/private/server.key \
    && chmod 644 /etc/ssl/certs/server.crt \
    && chmod 600 /etc/ssl/private/server.key

# CIS Benchmark - Copy configuration files
COPY config/postgresql.conf /etc/postgresql/postgresql.conf
COPY config/pg_hba.conf /etc/postgresql/pg_hba.conf
RUN chown postgres:postgres /etc/postgresql/postgresql.conf /etc/postgresql/pg_hba.conf \
    && chmod 600 /etc/postgresql/postgresql.conf \
    && chmod 600 /etc/postgresql/pg_hba.conf

# CIS Benchmark - Copy hardening script
COPY scripts/cis-hardening.sql /docker-entrypoint-initdb.d/99-cis-hardening.sql
RUN chmod 644 /docker-entrypoint-initdb.d/99-cis-hardening.sql

# CIS Benchmark - Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD pg_isready -U postgres -h localhost || exit 1

# CIS Benchmark - Set secure umask
RUN echo "umask 077" >> /etc/profile

EXPOSE 5432

# CIS Benchmark - Use custom configuration files
CMD ["postgres", "-c", "config_file=/etc/postgresql/postgresql.conf", "-c", "hba_file=/etc/postgresql/pg_hba.conf"]
