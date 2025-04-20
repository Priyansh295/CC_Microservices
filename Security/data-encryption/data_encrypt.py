from flask import Flask, request, jsonify
from cryptography.fernet import Fernet
import os
import base64
import hashlib
import time

app = Flask(__name__)

KEY_FILE = "keys/encryption_key.key"

def get_or_create_key():
    if not os.path.exists("keys"):
        os.makedirs("keys")
    
    if not os.path.exists(KEY_FILE):
        key = Fernet.generate_key()
        with open(KEY_FILE, "wb") as key_file:
            key_file.write(key)
    else:
        with open(KEY_FILE, "rb") as key_file:
            key = key_file.read()
    
    return key

ENCRYPTION_KEY = get_or_create_key()
cipher_suite = Fernet(ENCRYPTION_KEY)

# Function to encrypt text - can be used by other modules
def encrypt_text(plaintext, metadata=None):
    if metadata is None:
        metadata = {}
        
    metadata.update({
        "encrypted_at": time.time(),
        "encryption_version": "1.0"
    })
    
    encrypted_data = cipher_suite.encrypt(plaintext.encode()).decode()
    return encrypted_data

# Function to decrypt text - can be used by other modules
def decrypt_text(encrypted_data):
    decrypted_data = cipher_suite.decrypt(encrypted_data.encode()).decode()
    return decrypted_data

@app.route("/", methods=["GET"])
def root():
    return jsonify({
        "service": "data-encryption",
        "status": "running",
        "endpoints": [
            "/health",
            "/encrypt",
            "/decrypt",
            "/hash",
            "/password-recovery/encrypt",
            "/password-recovery/reset"
        ]
    })

@app.route("/encrypt", methods=["POST"])
def encrypt_data():
    data = request.get_json()
    
    if not data or "plaintext" not in data:
        return jsonify({"error": "Missing plaintext data"}), 400
    
    plaintext = data["plaintext"]
    metadata = data.get("metadata", {})
    
    try:
        encrypted_data = encrypt_text(plaintext, metadata)
        
        return jsonify({
            "encrypted": encrypted_data,
            "metadata": metadata
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/decrypt", methods=["POST"])
def decrypt_data():
    data = request.get_json()
    
    if not data or "encrypted" not in data:
        return jsonify({"error": "Missing encrypted data"}), 400
    
    encrypted_data = data["encrypted"]
    
    try:
        decrypted_data = decrypt_text(encrypted_data)
        
        return jsonify({
            "decrypted": decrypted_data
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/hash", methods=["POST"])
def hash_data():
    data = request.get_json()
    
    if not data or "plaintext" not in data:
        return jsonify({"error": "Missing plaintext data"}), 400
    
    plaintext = data["plaintext"]
    algorithm = data.get("algorithm", "sha256")
    
    try:
        if algorithm == "sha256":
            hash_obj = hashlib.sha256(plaintext.encode())
        elif algorithm == "sha512":
            hash_obj = hashlib.sha512(plaintext.encode())
        elif algorithm == "md5":
            hash_obj = hashlib.md5(plaintext.encode())
        else:
            return jsonify({"error": "Unsupported hash algorithm"}), 400
        
        hashed_data = hash_obj.hexdigest()
        
        return jsonify({
            "hashed": hashed_data,
            "algorithm": algorithm
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Password recovery integration endpoints
@app.route("/password-recovery/encrypt", methods=["POST"])
def encrypt_recovery_password():
    data = request.get_json()
    
    if not data or "password" not in data or "user_id" not in data:
        return jsonify({"error": "Missing password or user_id"}), 400
    
    try:
        from password_recovery import encrypt_new_password
        result = encrypt_new_password(data["password"], data["user_id"])
        
        if result["success"]:
            return jsonify(result)
        else:
            return jsonify({"error": result["error"]}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/password-recovery/reset", methods=["POST"])
def reset_password():
    data = request.get_json()
    
    if not data or "token" not in data or "encrypted_password" not in data:
        return jsonify({"error": "Missing token or encrypted_password"}), 400
    
    try:
        from password_recovery import secure_password_reset
        result = secure_password_reset(data["token"], data["encrypted_password"])
        
        if result["success"]:
            return jsonify(result)
        else:
            return jsonify({"error": result.get("error") or result.get("reason")}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({"status": "healthy", "service": "data-encryption"})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=3004)
