import json
import base64
from datetime import datetime, timedelta
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.asymmetric import padding

def load_private_key():
    with open("private.key", "rb") as f:
        return serialization.load_pem_private_key(f.read(), password=None)

def decrypt_request_file(req_file):
    private_key = load_private_key()

    with open(req_file, "r") as f:
        encrypted_data = base64.b64decode(f.read())

    decrypted = private_key.decrypt(
        encrypted_data,
        padding.OAEP(
            mgf=padding.MGF1(hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None
        )
    )

    request_info = json.loads(decrypted.decode())
    return request_info



def prepare_license_payload(request_info):
    print("\n=== REQUEST FILE DETAILS ===")
    print(json.dumps(request_info, indent=4))

    system_uuid = request_info.get("system_uuid")
    hostname = request_info.get("hostname")
    mac = request_info.get("mac")

 
    binding = {
        "system_uuid": system_uuid if system_uuid else None,
        "hostname": hostname if hostname else None,
        "mac": mac if mac else None
    }

    print("\n=== LICENSE SETUP ===")

    max_devices = int(input("Enter allowed agent count: ").strip())
    license_type = input("License Type (trial/enterprise): ").strip().lower()

    if license_type == "trial":
        expiry = datetime.utcnow() + timedelta(days=30)
    else:
        days = int(input("Enter validity days: ").strip())
        expiry = datetime.utcnow() + timedelta(days=days)

    expiry_iso = expiry.strftime("%Y-%m-%dT%H:%M:%SZ")

    payload = {
        "system_uuid": binding["system_uuid"],
        "hostname": binding["hostname"],
        "mac": binding["mac"],
        "license_type":license_type,
        "max_devices": max_devices,
        "expiry": expiry_iso,
    }

    return payload



def sign_license(payload):
    private_key = load_private_key()

    message = json.dumps(payload, sort_keys=True).encode()

    signature = private_key.sign(
        message,
        padding.PSS(
            mgf=padding.MGF1(hashes.SHA256()),
            salt_length=padding.PSS.MAX_LENGTH,
        ),
        hashes.SHA256(),
    )

    license_data = {
        "payload": payload,
        "signature": base64.b64encode(signature).decode()
    }

    encoded = base64.b64encode(json.dumps(license_data).encode()).decode()
    return encoded


def save_license(encoded):
    with open("license.key", "w") as f:
        f.write(encoded)

    print("\n✅ License generated → license.key\n")


if __name__ == "__main__":

    print("\n=== Vendor License Generator ===")
    req_file = input("Enter path to license_request.req file: ").strip()

    request_info = decrypt_request_file(req_file)

    payload = prepare_license_payload(request_info)

    encoded_key = sign_license(payload)
    save_license(encoded_key)

    print("Final Payload:")
    print(json.dumps(payload, indent=4))
