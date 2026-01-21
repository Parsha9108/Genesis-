from django.core.management.base import BaseCommand
import json, base64
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.asymmetric import padding
from django.conf import settings

from BaseApp.utils import (
    get_system_uuid,
    get_hostname,
    get_mac,
    write_uuid_to_config
)


class Command(BaseCommand):
    help = "Initial setup to collect machine info & generate request file"

    def handle(self, *args, **kwargs):

        system_uuid = get_system_uuid()
        write_uuid_to_config(system_uuid)
        data = {
            "system_uuid": system_uuid,
            "hostname": get_hostname(),
            "mac": get_mac()
        }


        with open(settings.LICENSE_PUBLIC_KEY_PATH, "rb") as f:
            public_key = serialization.load_pem_public_key(f.read())


        encrypted = public_key.encrypt(
            json.dumps(data).encode(),
            padding.OAEP(
                mgf=padding.MGF1(hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None
            )
        )

        request_file = base64.b64encode(encrypted).decode()

        with open("license_request.req", "w") as f:
            f.write(request_file)

        self.stdout.write(self.style.SUCCESS(
            "\nSetup complete. Generated → license_request.req\n"
        ))
        self.stdout.write("Send this file to vendor to activate license.\n")
