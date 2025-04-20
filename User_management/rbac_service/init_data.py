#!/usr/bin/env python3
"""
Script to initialize basic roles and permissions in the RBAC service.
"""
import sys
import requests
import json
import time

# Use direct connection to RBAC service for initialization
RBAC_API_URL = "http://localhost:3006"

# Initial roles
roles = [
    {
        "role_name": "admin",
        "description": "Administrator with full access"
    },
    {
        "role_name": "user",
        "description": "Regular user with limited access"
    },
    {
        "role_name": "moderator", 
        "description": "User with moderation capabilities"
    }
]

# Initial permissions
permissions = [
    {
        "permission_name": "users:read",
        "description": "Can read user information"
    },
    {
        "permission_name": "users:write",
        "description": "Can create and modify users"
    },
    {
        "permission_name": "users:delete",
        "description": "Can delete users"
    },
    {
        "permission_name": "roles:read",
        "description": "Can read role information"
    },
    {
        "permission_name": "roles:write",
        "description": "Can create and modify roles"
    },
    {
        "permission_name": "roles:delete",
        "description": "Can delete roles"
    },
    {
        "permission_name": "permissions:read",
        "description": "Can read permission information"
    },
    {
        "permission_name": "permissions:write",
        "description": "Can create and modify permissions"
    },
    {
        "permission_name": "permissions:delete",
        "description": "Can delete permissions"
    }
]

# Role-permission assignments
role_permissions = {
    "admin": [
        "users:read", "users:write", "users:delete",
        "roles:read", "roles:write", "roles:delete",
        "permissions:read", "permissions:write", "permissions:delete"
    ],
    "moderator": [
        "users:read", "roles:read", "permissions:read"
    ],
    "user": [
        "users:read"
    ]
}

def create_roles():
    """Create initial roles"""
    print("Creating roles...")
    created_roles = {}
    
    for role in roles:
        try:
            response = requests.post(f"{RBAC_API_URL}/api/v1/roles", json=role)
            if response.status_code == 201:
                role_data = response.json()
                created_roles[role["role_name"]] = role_data["role_id"]
                print(f"✅ Created role: {role['role_name']}")
            else:
                print(f"❌ Failed to create role {role['role_name']}: {response.status_code} - {response.text}")
        except Exception as e:
            print(f"❌ Error creating role {role['role_name']}: {str(e)}")
    
    return created_roles

def create_permissions():
    """Create initial permissions"""
    print("\nCreating permissions...")
    created_permissions = {}
    
    for permission in permissions:
        try:
            response = requests.post(f"{RBAC_API_URL}/api/v1/permissions", json=permission)
            if response.status_code == 201:
                perm_data = response.json()
                created_permissions[permission["permission_name"]] = perm_data["permission_id"]
                print(f"✅ Created permission: {permission['permission_name']}")
            else:
                print(f"❌ Failed to create permission {permission['permission_name']}: {response.status_code} - {response.text}")
        except Exception as e:
            print(f"❌ Error creating permission {permission['permission_name']}: {str(e)}")
    
    return created_permissions

def assign_permissions_to_roles(roles_dict, permissions_dict):
    """Assign permissions to roles"""
    print("\nAssigning permissions to roles...")
    
    for role_name, perm_names in role_permissions.items():
        if role_name not in roles_dict:
            print(f"⚠️ Role {role_name} not found, skipping permission assignments")
            continue
        
        role_id = roles_dict[role_name]
        
        for perm_name in perm_names:
            if perm_name not in permissions_dict:
                print(f"⚠️ Permission {perm_name} not found, skipping assignment to {role_name}")
                continue
            
            perm_id = permissions_dict[perm_name]
            
            try:
                response = requests.post(
                    f"{RBAC_API_URL}/api/v1/roles/{role_id}/permissions",
                    json={"permission_id": perm_id}
                )
                
                if response.status_code in [200, 201, 204]:
                    print(f"✅ Assigned {perm_name} to role {role_name}")
                else:
                    print(f"❌ Failed to assign {perm_name} to {role_name}: {response.status_code} - {response.text}")
            except Exception as e:
                print(f"❌ Error assigning {perm_name} to {role_name}: {str(e)}")

def main():
    """Main function to initialize RBAC data"""
    print("Initializing RBAC data...")
    
    # Wait for services to be ready
    print("Waiting for RBAC service to be ready...")
    retries = 5
    while retries > 0:
        try:
            response = requests.get(f"{RBAC_API_URL}/")
            if response.status_code == 200:
                print("RBAC service is ready!")
                break
        except requests.RequestException:
            print(f"Waiting for RBAC service... ({retries} retries left)")
            retries -= 1
            time.sleep(2)
    
    if retries == 0:
        print("❌ Could not connect to RBAC service. Exiting.")
        sys.exit(1)
    
    # Step 1: Create roles
    roles_dict = create_roles()
    
    # Step 2: Create permissions
    permissions_dict = create_permissions()
    
    # Step 3: Assign permissions to roles
    assign_permissions_to_roles(roles_dict, permissions_dict)
    
    print("\n✅ Initialization complete!")

if __name__ == "__main__":
    main() 