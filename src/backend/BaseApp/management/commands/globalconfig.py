# BaseApp/management/commands/init_global_config.py
from django.core.management.base import BaseCommand
from BaseApp.models import GlobalConfig

class Command(BaseCommand):
    help = 'Manage Global Configuration Settings'
    
    # Default values
    DEFAULT_VALUES = {
        'monitoring.cpuThreshold': '80',
        'monitoring.ramThreshold': '85',
        'monitoring.diskThreshold': '90',
        'monitoring.networkThreshold': '80',
        'monitoring.repeatFrequency': '5',
        'monitoring.ip_ping_interval':'60',
        'monitoring.ip_ping_count':'2',
        'monitoring.ip_ping_timeout':'4'     
    }

    def add_arguments(self, parser):
        parser.add_argument(
            '--bootstrap',
            action='store_true',
            help='Create default global configuration entries',
        )

    def handle(self, *args, **options):
        if options['bootstrap']:
            self.stdout.write(self.style.NOTICE('Bootstrapping global configuration...'))
            for item_key in GlobalConfig.ALLOWED_KEYS:
                default_value = Command.DEFAULT_VALUES.get(item_key, '')
                
                if not GlobalConfig.objects.filter(item_key=item_key).exists():
                    GlobalConfig.objects.create(item_key=item_key, item_value=default_value)
                    self.stdout.write(self.style.SUCCESS(f'Successfully created config: {item_key}'))
                else:
                    self.stdout.write(self.style.WARNING(f'Config already exists: {item_key}'))

