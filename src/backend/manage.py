#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys
import hmac
import hashlib
import time

def generate_dynamic_token(secret, window_offset=0):
    # Create a time-step (e.g., changes every 60 seconds)
    interval = int(time.time() / 60) + window_offset
    message = str(interval).encode()
    return hmac.new(secret.encode(), message, hashlib.sha256).hexdigest()

def main():
    """Run administrative tasks."""
    # 1. Define the restricted 'Danger Zone' commands
    danger_zone = ['migrate','createsuperuser','dbshell', 'shell', 'flush']

    if len(sys.argv) > 1 and sys.argv[1] in danger_zone:
        # 1. Get the Master Key from your secure config environment
        master_key = os.environ.get('GENESIS_MASTER_KEY', 'default_fallback_change_this')
        user_token = os.environ.get('GENESIS_ADMIN_TOKEN')

        # 2. Check current token and previous token (to allow a small 1-minute grace period)
        valid_tokens = [
            generate_dynamic_token(master_key, window_offset=0),  # Current minute
            generate_dynamic_token(master_key, window_offset=-1) # Last minute
        ]

        if user_token not in valid_tokens:
            print("\033[91m[!] ACCESS DENIED:\033[0m Administrative commands are locked.")
            print("\033[91m[!] EXPIRED OR INVALID TOKEN.\033[0m")
            sys.exit(1)
            
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'CentralServer.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()
