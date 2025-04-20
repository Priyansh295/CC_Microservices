#!/usr/bin/env python3
"""
password_recovery.py - Integration with User Management's password recovery service
"""
import requests
import json
import os
import logging
from data_encrypt import encrypt_text, decrypt_text

# Configuration
USER_MANAGEMENT_URL = os.environ.get('USER_MANAGEMENT_URL', 'http://user-management-backend:5000')

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def verify_recovery_token(token):
    """
    Verify a password recovery token with the user management service
    
    Args:
        token (str): The recovery token to verify
        
    Returns:
        dict: The verification result
    """
    try:
        response = requests.post(
            f"{USER_MANAGEMENT_URL}/password-recovery/verify",
            json={"token": token}
        )
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        logger.error(f"Error verifying recovery token: {str(e)}")
        return {"valid": False, "error": str(e)}

def encrypt_new_password(password, user_id):
    """
    Encrypt a new password for the password recovery process
    
    Args:
        password (str): The plain text password to encrypt
        user_id (str): The ID of the user
        
    Returns:
        dict: The encryption result
    """
    try:
        encrypted = encrypt_text(
            password, 
            metadata={
                "purpose": "password_recovery",
                "user_id": user_id
            }
        )
        return {
            "success": True,
            "encrypted": encrypted,
            "user_id": user_id
        }
    except Exception as e:
        logger.error(f"Error encrypting password: {str(e)}")
        return {"success": False, "error": str(e)}

def decrypt_stored_password(encrypted_password):
    """
    Decrypt a stored password
    
    Args:
        encrypted_password (str): The encrypted password
        
    Returns:
        dict: The decryption result
    """
    try:
        decrypted = decrypt_text(encrypted_password)
        return {
            "success": True,
            "decrypted": decrypted
        }
    except Exception as e:
        logger.error(f"Error decrypting password: {str(e)}")
        return {"success": False, "error": str(e)}

def secure_password_reset(token, encrypted_password):
    """
    Perform a secure password reset using the user management service
    
    Args:
        token (str): The recovery token
        encrypted_password (str): The encrypted new password
        
    Returns:
        dict: The password reset result
    """
    try:
        # First verify the token
        verify_result = verify_recovery_token(token)
        
        if not verify_result.get("valid", False):
            return {"success": False, "reason": "Invalid or expired token"}
        
        # If valid, reset the password with the encrypted value
        response = requests.post(
            f"{USER_MANAGEMENT_URL}/password-recovery/reset",
            json={
                "token": token,
                "new_password": encrypted_password,
                "is_encrypted": True
            }
        )
        response.raise_for_status()
        
        return {"success": True, "message": "Password reset successfully"}
    except requests.exceptions.RequestException as e:
        logger.error(f"Error in password reset: {str(e)}")
        return {"success": False, "error": str(e)} 