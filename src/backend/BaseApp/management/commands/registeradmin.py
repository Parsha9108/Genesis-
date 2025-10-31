# BaseApp/management/commands/registeradmin.py
from django.core.management.base import BaseCommand
import getpass
import requests
import json
from urllib.parse import quote
from django.conf import settings

class Command(BaseCommand):
    help = 'Register admin user via existing API endpoint'
    print("raady to register admin user via API")
 

    def add_arguments(self, parser):
        parser.add_argument(
            '--host', 
            default='http://127.0.0.1:8001',  # ← Use nginx service (no SSL from inside Docker)
            help='API host URL (default: http://127.0.0.1:8001)'
        )
        parser.add_argument(
            '--endpoint',
            default='/api/webuser/signup/',
            help='Registration endpoint path'
        )
        parser.add_argument(
            '--interactive',
            action='store_true',
            help='Force interactive mode (ignore env vars)'
        )

    def handle(self, *args, **options):
        host = options['host'].rstrip('/')
        endpoint = options['endpoint']
        
        # Construct full URL
        api_url = f"{host}{endpoint}"

        self.stdout.write(self.style.SUCCESS('🚀 Admin Registration via API'))
        self.stdout.write('=' * 50)
        self.stdout.write(f'API URL: {api_url}')
        self.stdout.write('')

        # Collect user input with validation
        username = self.get_username()
        email = self.get_email()
        password = self.get_password()
        
        # Prepare payload for your existing API
        payload = {
            'username': username,
            'email': email,
            'password': password,
            'confirm_password': password,
            'role': 'admin',  # Set admin role
        }

        # Make API request
        try:
            self.stdout.write('Sending registration request...')
            
            response = requests.post(
                api_url,
                data=json.dumps(payload),
                headers={'Content-Type': 'application/json'},
                timeout=30
            )

            if response.status_code == 201:
                self.stdout.write(
                    self.style.SUCCESS(f'✅ Admin user "{username}" registered successfully!')
                )
                self.stdout.write(
                    self.style.SUCCESS('📧 Please check email for verification link.')
                )
            else:
                self.stdout.write(
                    self.style.ERROR('❌ Registration failed:')
                )
                try:
                    error_data = response.json()
                    if isinstance(error_data, dict):
                        for field, errors in error_data.items():
                            if isinstance(errors, list):
                                for error in errors:
                                    self.stdout.write(
                                        self.style.ERROR(f'   • {field}: {error}')
                                    )
                            else:
                                self.stdout.write(
                                    self.style.ERROR(f'   • {field}: {errors}')
                                )
                    else:
                        self.stdout.write(self.style.ERROR(f'   • {error_data}'))
                except json.JSONDecodeError:
                    self.stdout.write(
                        self.style.ERROR(f'   • HTTP {response.status_code}: {response.text}')
                    )

        except requests.exceptions.ConnectionError:
            self.stdout.write(
                self.style.ERROR('❌ Could not connect to the API server.')
            )
            self.stdout.write(
                self.style.ERROR('   Make sure the Django server is running.')
            )
        except requests.exceptions.Timeout:
            self.stdout.write(
                self.style.ERROR('❌ Request timed out. Please try again.')
            )
        except requests.exceptions.RequestException as e:
            self.stdout.write(
                self.style.ERROR(f'❌ API request failed: {str(e)}')
            )

    def get_username(self):
        """Get and validate username"""
        while True:
            username = input('Enter username: ').strip()
            
            if not username:
                self.stdout.write(self.style.ERROR('❌ Username cannot be empty.'))
                continue
                
            if len(username) < 3:
                self.stdout.write(self.style.ERROR('❌ Username must be at least 3 characters.'))
                continue
                
            return username

    def get_email(self):
        """Get and validate email"""
        while True:
            email = input('Enter email: ').strip()
            
            if not email:
                self.stdout.write(self.style.ERROR('❌ Email cannot be empty.'))
                continue
                
            # Basic email validation
            if '@' not in email or '.' not in email:
                self.stdout.write(self.style.ERROR('❌ Invalid email format.'))
                continue
                
            return email

    def get_password(self):
        """Get and validate password"""
        while True:
            password = getpass.getpass('Enter password: ')
            confirm_password = getpass.getpass('Confirm password: ')
            
            if password != confirm_password:
                self.stdout.write(self.style.ERROR('❌ Passwords do not match.'))
                continue
                
            if len(password) < 8:
                self.stdout.write(self.style.ERROR('❌ Password must be at least 8 characters.'))
                continue
                
            return password

