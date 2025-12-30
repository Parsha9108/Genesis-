from django.db import models
import uuid
from django.db import models
from django.core.exceptions import ValidationError
from django.core.validators import validate_email, validate_ipv4_address, validate_ipv6_address
import re
import logging
from BaseApp.models.base_audit_model import BaseAuditModel
logger = logging.getLogger("agent_monitoring")

class GlobalConfig(BaseAuditModel):
    #  Generic key/value config storage.
    # - key: unique identifier
    # - value: stored as string (or JSON for structured)
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    item_key = models.CharField(max_length=128)
    item_value = models.CharField(max_length=128)

    ALLOWED_KEYS = [
        'smtp.host',
        'smtp.port',
        'smtp.username',
        'smtp.password',
        'smtp.encryption_type',
        'smtp.from_email', 
        'alert.to_emails',
        'alert.cc_emails',
        'monitoring.cpuThreshold',
        'monitoring.ramThreshold',
        'monitoring.diskThreshold',
        'monitoring.networkThreshold',
        'monitoring.repeatFrequency',
    ]

    def __str__(self):
            return self.item_key
    
    @classmethod
    def validate_config(cls, key, value):
        """
        Single function to validate BOTH key and value
        
        Args:
            key: Configuration key
            value: Configuration value
        
        Returns:
            tuple: (is_valid, error_message, cleaned_value)
        """
        # ✅ STEP 1: Validate key exists
        if key not in cls.ALLOWED_KEYS:
            return False, f"Invalid key '{key}'. Allowed: {', '.join(cls.ALLOWED_KEYS)}", None
        
        # ✅ STEP 2: Validate value based on key
        str_value = str(value).strip()
        
        # Empty value check
        if not str_value:
            return False, f"{key}: Value cannot be empty", None
        
        # SMTP host - IP or domain
        if key == 'smtp.host':
            if cls._is_valid_hostname(str_value):
                return True, None, str_value
            return False, f"{key}: Must be a valid IP address or domain name", None
        
        # SMTP port - 1-65535
        elif key == 'smtp.port':
            try:
                port = int(str_value)
                if 1 <= port <= 65535:
                    return True, None, str(port)
                return False, f"{key}: Port must be between 1 and 65535", None
            except ValueError:
                return False, f"{key}: Must be a valid integer", None
        
        # Email fields
        elif key in ['smtp.from_email']:
            try:
                validate_email(str_value)
                return True, None, str_value
            except ValidationError:
                return False, f"{key}: Must be a valid email address", None
        

        
        # Encryption type - TLS/SSL/NONE
        elif key == 'smtp.encryption_type':
            if str_value.upper() in ['TLS', 'SSL', 'NONE']:
                return True, None, str_value.upper()
            return False, f"{key}: Must be TLS, SSL, or NONE", None
        
        # Email lists - comma-separated
        elif key in ['alert.to_emails', 'alert.cc_emails']:
            # Handle array input
            if isinstance(value, list):
                emails = [str(e).strip() for e in value if e]
            else:
                # Handle comma-separated string
                emails = [e.strip() for e in str_value.split(',') if e.strip()]
            
            if not emails:
                return False, f"{key}: At least one email required", None
            
            # Validate each email
            invalid_emails = []
            for email in emails:
                try:
                    validate_email(email)
                except ValidationError:
                    invalid_emails.append(email)
            
            if invalid_emails:
                return False, f"{key}: Invalid email(s): {', '.join(invalid_emails)}", None
            
            # Return as comma-separated string for storage
            return True, None, ','.join(emails)
        
        # Monitoring thresholds - 0-100
        elif key in ['monitoring.cpuThreshold', 'monitoring.ramThreshold', 
                     'monitoring.diskThreshold', 'monitoring.networkThreshold']:
            try:
                threshold = int(str_value)
                if 0 <= threshold <= 100:
                    return True, None, str(threshold)
                return False, f"{key}: Must be between 0 and 100", None
            except ValueError:
                return False, f"{key}: Must be a valid integer", None
        
        # Repeat frequency - positive integer
        elif key == 'monitoring.repeatFrequency':
            try:
                freq = int(str_value)
                if freq > 0:
                    return True, None, str(freq)
                return False, f"{key}: Must be greater than 0", None
            except ValueError:
                return False, f"{key}: Must be a valid integer", None
        
        # Default: accept as string
        return True, None, str_value
    
   
    @staticmethod
    def _is_valid_hostname(hostname):
        """Helper: Check if valid IP or domain"""
        if not hostname:
            return False
        
        # IPv4
        try:
            validate_ipv4_address(hostname)
            return True
        except ValidationError:
            pass
        
        # IPv6
        try:
            validate_ipv6_address(hostname)
            return True
        except ValidationError:
            pass
        
        # Domain name
        domain_regex = re.compile(
            r'^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$'
        )
        simple_hostname = re.compile(r'^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$')
        
        return bool(domain_regex.match(hostname) or simple_hostname.match(hostname))
     # ✅ Validate each key-value pair with single function
    

    @classmethod
    def get_smtp_config(cls):
        smtp_keys=[key for key in cls.ALLOWED_KEYS if key.startswith('smtp.')]
        smtp_config= {}
        for key in smtp_keys:
            try:
                config_obj=cls.objects.get(item_key=key)
                smtp_config[key]=config_obj.item_value
            except cls.DoesNotExist:
                logger.warning(f"SMTP config '{key}' not found in database.")
        return smtp_config
    # BaseApp/models.py (add to your GlobalConfig class)

    @classmethod
    def get_config(cls, key, default=None):
        """Get a single config value"""
        try:
            return cls.objects.get(item_key=key).item_value
        except cls.DoesNotExist:
            logger.warning(f"Config '{key}' not found, using default: {default}")
            return default
