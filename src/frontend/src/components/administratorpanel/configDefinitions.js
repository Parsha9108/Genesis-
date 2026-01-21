export const smtpConfigSections = [
  {
    title: '',
    columns: 'md:grid-cols-2',
    fields: [
      {
        key: 'smtpHost',
        apiKey: 'smtp.host',
        label: 'SMTP Host',
        type: 'text',
        placeholder: 'smtp.example.com',
        required: true,
        validation: 'text'
      },
      {
        key: 'smtpPort',
        apiKey: 'smtp.port',
        label: 'SMTP Port',
        type: 'number',
        placeholder: '587',
        required: true,
        validation: 'port',
        min: 1,
        max: 65535
      },
      {
        key: 'username',
        apiKey: 'smtp.username',
        label: 'Username',
        type: 'text',
        placeholder: 'your-email@example.com',
        required: true,
        validation: 'text'
      },
      {
        key: 'password',
        apiKey: 'smtp.password',
        label: 'Password',
        type: 'password',
        placeholder: '••••••••',
        required: true,
        validation: 'text'
      },
      {
        key: 'encryptionType',
        apiKey: 'smtp.encryption_type',
        label: 'Encryption Type',
        type: 'dropdown',
        required: true,
        transform: 'uppercase',
        options: [
          { value: '', label: 'Select encryption' },
          { value: 'tls', label: 'TLS' },
          { value: 'ssl', label: 'SSL' },
          { value: 'none', label: 'None' }
        ]
      },
      {
        key: 'fromEmail',
        apiKey: 'smtp.from_email',
        label: 'From Email',
        type: 'email',
        placeholder: 'noreply@example.com',
        required: true,
        validation: 'email'
      }
    ]
  },
  {
    title: 'Alert Configuration',
    columns: 'md:grid-cols-1',
    fields: [
      {
        key: 'toEmails',
        apiKey: 'alert.to_emails',
        label: 'To Emails',
        type: 'text',
        placeholder: 'email1@example.com, email2@example.com',
        required: true,
        validation: 'emails',
        helpText: 'Primary recipient email address(es). Separate multiple emails with commas'
      },
      {
        key: 'ccEmails',
        apiKey: 'alert.cc_emails',
        label: 'CC Emails',
        type: 'text',
        placeholder: 'email1@example.com, email2@example.com',
        required: false,
        validation: 'emails',
        helpText: 'Separate multiple emails with commas'
      }
    ]
  }
];

export const monitoringConfigSections = [
  {
    title: '',
    columns: 'md:grid-cols-2',
    fields: [
      {
        key: 'cpuThreshold',
        apiKey: 'monitoring.cpuThreshold',
        label: 'CPU Threshold (%)',
        type: 'number',
        placeholder: '98',
        required: true,
        validation: 'number',
        min: 0,
        max: 100,
        helpText: 'Alert when CPU usage exceeds this percentage'
      },
      {
        key: 'ramThreshold',
        apiKey: 'monitoring.ramThreshold',
        label: 'RAM Threshold (%)',
        type: 'number',
        placeholder: '60',
        required: true,
        validation: 'number',
        min: 0,
        max: 100,
        helpText: 'Alert when RAM usage exceeds this percentage'
      },
      {
        key: 'diskThreshold',
        apiKey: 'monitoring.diskThreshold',
        label: 'Disk Threshold (%)',
        type: 'number',
        placeholder: '89',
        required: true,
        validation: 'number',
        min: 0,
        max: 100,
        helpText: 'Alert when disk usage exceeds this percentage'
      },
      {
        key: 'networkThreshold',
        apiKey: 'monitoring.networkThreshold',
        label: 'Network Threshold (%)',
        type: 'number',
        placeholder: '10',
        required: true,
        validation: 'number',
        min: 0,
        max: 100,
        helpText: 'Alert when network usage exceeds this percentage'
      },
      {
        key: 'repeatFrequency',
        apiKey: 'monitoring.repeatFrequency',
        label: 'Repeat Frequency (minutes)',
        type: 'number',
        placeholder: '5',
        required: true,
        validation: 'number',
        min: 1,
        helpText: 'How often to repeat alerts for persistent issues (minimum 1 minute)'
      }
    ]
  },
  {
    title: 'IP Ping Interval (seconds)',
    columns: 'md:grid-cols-1',
    fields: [
      {
        key: 'ipMonitoringInterval',
        apiKey: 'monitoring.ip_ping_interval',
        label:"",
        type: 'number',
        placeholder: '60',
        required: true,
        validation: 'number',
        min: 5,
        helpText: 'How often to ping IP addresses for status checks (minimum 5 seconds)'
      }
    ]
  }
];

export const licenseConfigSections = [
  {
    title: '',
    columns: 'md:grid-cols-1',
    fields: [
      {
        key: 'licenseKey',
        apiKey: 'license.key', 
        label: 'License Key',
        type: 'textarea',
        placeholder: 'Enter your license key here',
        required: true,
        validation: 'text',
        helpText: 'Paste your license key provided after purchase'
      }
    ]
  }
];

export const licenseConfigSectionsWithDetails = [
  {
    title: '',
    columns: 'md:grid-cols-2',
    fields: [
      {
        key: 'licenseKey',
        apiKey: 'license.key',
        label: 'License Key',
        type: 'textarea',
        required: true,
        validation: 'text',
        helpText: 'Paste your license key provided after purchase'
      },
      {
        key: 'maxDevices',
        apiKey: 'license.max_devices',
        label: 'Max Devices',
        type: 'number',
        readOnly: true
      },
      {
        key: 'devicesOnboarded',
        apiKey: 'license.devices_onboarded',
        label: 'Devices Onboarded',
        type: 'number',
        readOnly: true
      },
      {
        key: 'devicesRemaining',
        apiKey: 'license.devices_remaining',
        label: 'Devices Remaining',
        type: 'number',
        readOnly: true
      },
      {
        key: 'status',
        apiKey: 'license.status',
        label: 'Status',
        type: 'text',
        readOnly: true
      },
      {
        key: 'expiryDate',
        apiKey: 'license.expiry_date',
        label: 'Expiry Date',
        type: 'text',
        readOnly: true
      }
    ]
  }
];

export const dataretentionConfigSections = [
  {
    title: '',
    columns: 'md:grid-cols-2',
    fields: [
      {
        key: 'dataretention.monitoring',
        apiKey: 'dataretention.monitoring',
        label: 'Monitoring Data Retention (days)',
        type: 'number',
        placeholder: '30',
        required: true,
        validation: 'number',
        min: 1,
        helpText: 'Number of days to retain monitoring and metrics data'
      },
      {
        key: 'dataretention.auditlogs',
        apiKey: 'dataretention.auditlogs',
        label: 'Audit Logs Data Retention (days)',
        type: 'number',
        placeholder: '90',
        required: true,
        validation: 'number',
        min: 1,
        helpText: 'Number of days to retain audit logs and user activity data'
      }
    ]
  }
];
