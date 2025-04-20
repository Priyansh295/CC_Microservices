import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import '../styles/AdminPanel.css';

const AdminPanel = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // For adding new roles/permissions
  const [newRole, setNewRole] = useState({ role_name: '', description: '' });
  const [newPermission, setNewPermission] = useState({ permission_name: '', description: '' });
  
  // For assigning roles to users
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedRole, setSelectedRole] = useState('');

  // API config with token
  const apiConfig = {
    headers: { Authorization: `Bearer ${token}` }
  };

  // Fetch users from auth service
  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_AUTH_API_URL}/users`, apiConfig);
      setUsers(response.data);
    } catch (err) {
      setError('Error fetching users: ' + err.message);
      console.error('Error fetching users:', err);
    }
  };

  // Fetch roles from RBAC service
  const fetchRoles = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_RBAC_API_URL}/roles`, apiConfig);
      setRoles(response.data);
    } catch (err) {
      setError('Error fetching roles: ' + err.message);
      console.error('Error fetching roles:', err);
    }
  };

  // Fetch permissions from RBAC service
  const fetchPermissions = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_RBAC_API_URL}/permissions`, apiConfig);
      setPermissions(response.data);
    } catch (err) {
      setError('Error fetching permissions: ' + err.message);
      console.error('Error fetching permissions:', err);
    }
  };

  // Fetch all data on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchUsers(), fetchRoles(), fetchPermissions()]);
      } catch (err) {
        setError('Failed to fetch data');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Create a new role
  const handleCreateRole = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_RBAC_API_URL}/roles`, 
        newRole,
        apiConfig
      );
      setRoles([...roles, response.data]);
      setNewRole({ role_name: '', description: '' });
    } catch (err) {
      setError('Error creating role: ' + err.message);
      console.error('Error creating role:', err);
    }
  };

  // Create a new permission
  const handleCreatePermission = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_RBAC_API_URL}/permissions`, 
        newPermission,
        apiConfig
      );
      setPermissions([...permissions, response.data]);
      setNewPermission({ permission_name: '', description: '' });
    } catch (err) {
      setError('Error creating permission: ' + err.message);
      console.error('Error creating permission:', err);
    }
  };

  // Assign a role to a user
  const handleAssignRole = async (e) => {
    e.preventDefault();
    if (!selectedUser || !selectedRole) {
      setError('Please select both a user and a role');
      return;
    }

    try {
      await axios.post(
        `${process.env.REACT_APP_RBAC_API_URL}/users/${selectedUser}/roles`,
        { role_id: selectedRole },
        apiConfig
      );
      setError(null);
      alert('Role assigned successfully');
      // Reset selection
      setSelectedUser('');
      setSelectedRole('');
    } catch (err) {
      setError('Error assigning role: ' + err.message);
      console.error('Error assigning role:', err);
    }
  };

  // Assign permission to role
  const handleAssignPermission = async (roleId, permissionId) => {
    try {
      await axios.post(
        `${process.env.REACT_APP_RBAC_API_URL}/roles/${roleId}/permissions`,
        { permission_id: permissionId },
        apiConfig
      );
      // Refresh roles to show updated permissions
      await fetchRoles();
    } catch (err) {
      setError('Error assigning permission: ' + err.message);
      console.error('Error assigning permission:', err);
    }
  };

  // Remove a role from a user
  const handleRemoveUserRole = async (userId, roleId) => {
    try {
      await axios.delete(
        `${process.env.REACT_APP_RBAC_API_URL}/users/${userId}/roles/${roleId}`,
        apiConfig
      );
      alert('Role removed successfully');
      // Refresh user data
      await fetchUsers();
    } catch (err) {
      setError('Error removing role: ' + err.message);
      console.error('Error removing role:', err);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="admin-panel">
      <h1>Admin Panel</h1>
      
      <div className="tabs">
        <button 
          className={activeTab === 'users' ? 'active' : ''} 
          onClick={() => setActiveTab('users')}
        >
          Users
        </button>
        <button 
          className={activeTab === 'roles' ? 'active' : ''} 
          onClick={() => setActiveTab('roles')}
        >
          Roles
        </button>
        <button 
          className={activeTab === 'permissions' ? 'active' : ''} 
          onClick={() => setActiveTab('permissions')}
        >
          Permissions
        </button>
        <button 
          className={activeTab === 'assignments' ? 'active' : ''} 
          onClick={() => setActiveTab('assignments')}
        >
          Role Assignments
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'users' && (
          <div className="users-tab">
            <h2>User Management</h2>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Roles</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                    <td>
                      {user.roles && user.roles.map(role => (
                        <span key={role.role_id} className="role-badge">
                          {role.role_name}
                          <button 
                            className="remove-btn" 
                            onClick={() => handleRemoveUserRole(user.id, role.role_id)}
                          >
                            x
                          </button>
                        </span>
                      ))}
                    </td>
                    <td>
                      <button onClick={() => setSelectedUser(user.id)}>Assign Role</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'roles' && (
          <div className="roles-tab">
            <h2>Role Management</h2>
            
            <form onSubmit={handleCreateRole} className="create-form">
              <h3>Create New Role</h3>
              <div className="form-group">
                <label>Role Name:</label>
                <input 
                  type="text" 
                  value={newRole.role_name} 
                  onChange={(e) => setNewRole({...newRole, role_name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description:</label>
                <input 
                  type="text" 
                  value={newRole.description} 
                  onChange={(e) => setNewRole({...newRole, description: e.target.value})}
                />
              </div>
              <button type="submit">Create Role</button>
            </form>

            <div className="data-table">
              <h3>Existing Roles</h3>
              <table>
                <thead>
                  <tr>
                    <th>Role ID</th>
                    <th>Role Name</th>
                    <th>Description</th>
                    <th>Permissions</th>
                  </tr>
                </thead>
                <tbody>
                  {roles.map(role => (
                    <tr key={role.role_id}>
                      <td>{role.role_id}</td>
                      <td>{role.role_name}</td>
                      <td>{role.description}</td>
                      <td>
                        {role.permissions && role.permissions.map(perm => (
                          <span key={perm.permission_id} className="permission-badge">
                            {perm.permission_name}
                          </span>
                        ))}
                        <select 
                          onChange={(e) => {
                            if (e.target.value) {
                              handleAssignPermission(role.role_id, e.target.value);
                              e.target.value = '';
                            }
                          }}
                        >
                          <option value="">Add permission...</option>
                          {permissions.map(perm => (
                            <option key={perm.permission_id} value={perm.permission_id}>
                              {perm.permission_name}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'permissions' && (
          <div className="permissions-tab">
            <h2>Permission Management</h2>
            
            <form onSubmit={handleCreatePermission} className="create-form">
              <h3>Create New Permission</h3>
              <div className="form-group">
                <label>Permission Name:</label>
                <input 
                  type="text" 
                  value={newPermission.permission_name} 
                  onChange={(e) => setNewPermission({...newPermission, permission_name: e.target.value})}
                  placeholder="resource:action (e.g. users:read)"
                  required
                />
              </div>
              <div className="form-group">
                <label>Description:</label>
                <input 
                  type="text" 
                  value={newPermission.description} 
                  onChange={(e) => setNewPermission({...newPermission, description: e.target.value})}
                />
              </div>
              <button type="submit">Create Permission</button>
            </form>

            <div className="data-table">
              <h3>Existing Permissions</h3>
              <table>
                <thead>
                  <tr>
                    <th>Permission ID</th>
                    <th>Permission Name</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {permissions.map(perm => (
                    <tr key={perm.permission_id}>
                      <td>{perm.permission_id}</td>
                      <td>{perm.permission_name}</td>
                      <td>{perm.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'assignments' && (
          <div className="assignments-tab">
            <h2>Role Assignment</h2>
            <form onSubmit={handleAssignRole} className="create-form">
              <div className="form-group">
                <label>User:</label>
                <select 
                  value={selectedUser} 
                  onChange={(e) => setSelectedUser(e.target.value)}
                  required
                >
                  <option value="">Select User</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.username} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Role:</label>
                <select 
                  value={selectedRole} 
                  onChange={(e) => setSelectedRole(e.target.value)}
                  required
                >
                  <option value="">Select Role</option>
                  {roles.map(role => (
                    <option key={role.role_id} value={role.role_id}>
                      {role.role_name}
                    </option>
                  ))}
                </select>
              </div>
              <button type="submit">Assign Role</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel; 