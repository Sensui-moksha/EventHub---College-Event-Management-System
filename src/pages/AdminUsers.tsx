import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  User as UserIcon,
  Mail as MailIcon,
  Lock as LockIcon,
  Phone,
  Briefcase,
  X
} from 'lucide-react';

interface User {
  _id: string;
  name: string;
  email: string;
  department: string;
  section: string;
  roomNo?: string;
  mobile: string;
  year: string;
  regId: string;
  avatar?: string;
  role: 'admin' | 'user' | 'organizer' | 'faculty' | 'student';
  createdAt?: string;
}

interface UserFormData {
  name: string;
  email: string;
  password: string;
  department: string;
  section: string;
  roomNo?: string;
  mobile: string;
  year: string;
  regId: string;
  role: 'admin' | 'user' | 'organizer' | 'faculty' | 'student';
}

interface EditUserData {
  name: string;
  email: string;
  department: string;
  section: string;
  roomNo?: string;
  mobile: string;
  year: string;
  regId: string;
  role: 'admin' | 'user' | 'organizer' | 'faculty' | 'student';
}

const AdminUsers: React.FC = () => {
  const { user } = useAuth();
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [createForm, setCreateForm] = useState<UserFormData>({
    name: '',
    email: '',
    password: '',
    department: '',
    section: '',
    roomNo: '',
    mobile: '',
    year: '',
    regId: '',
    role: 'student'
  });
  
  const [editForm, setEditForm] = useState<EditUserData>({
    name: '',
    email: '',
    department: '',
    section: '',
    roomNo: '',
    mobile: '',
    year: '',
    regId: '',
    role: 'student'
  });
  
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  // Simple toast notification
  const showToast = (message: string, _type: 'success' | 'error' = 'success') => {
    alert(message); // Simple alert for now - can be enhanced later
  };

  // Fetch all users
  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      
      if (response.ok) {
        setUsers(data.users);
      } else {
        showToast(data.error || 'Failed to fetch users', 'error');
      }
    } catch (_error) {
      showToast('Failed to fetch users', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Check if user is admin (after hooks)
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  // Create new user
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (createForm.password.length < 6) {
      showToast('Password must be at least 6 characters long', 'error');
      return;
    }
    // Validation similar to Register page
    if (!createForm.name.trim()) { showToast('Full Name Required', 'error'); return; }
    if (!createForm.email.trim()) { showToast('Email Required', 'error'); return; }
    if (!createForm.department.trim()) { showToast('Department Required', 'error'); return; }
    if (createForm.role === 'student' && (!createForm.year || isNaN(Number(createForm.year)) || Number(createForm.year) < 1 || Number(createForm.year) > 4)) { showToast('Please select a valid year (1-4)', 'error'); return; }
    if (createForm.role === 'student' && !createForm.section.trim()) { showToast('Section Required', 'error'); return; }
    if (createForm.role === 'faculty' && !(createForm as any).roomNo?.trim()) { showToast('Room No Required', 'error'); return; }
    if (!createForm.mobile.trim() || !/^\d{10}$/.test(createForm.mobile)) { showToast('Please enter a valid 10-digit mobile number', 'error'); return; }
    if ((createForm.role === 'student' || createForm.role === 'faculty') && !createForm.regId.trim()) { showToast('Registration ID Required', 'error'); return; }
    
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ...createForm,
            // don't send year for faculty or admin roles
            year: createForm.role === 'faculty' || createForm.role === 'admin' ? undefined as unknown as string : createForm.year,
            roomNo: (createForm as any).roomNo,
          })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        showToast('User created successfully', 'success');
        setShowCreateForm(false);
        setCreateForm({
          name: '',
          email: '',
          password: '',
          department: '',
          section: '',
          mobile: '',
          year: '',
          regId: '',
          role: 'user'
        });
        fetchUsers();
      } else {
        showToast(data.error || 'Failed to create user', 'error');
      }
    } catch (error) {
      showToast('Failed to create user', 'error');
    }
  };

  // Edit user
  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser) return;
    // Validation similar to Register page for edits
    if (!editForm.name.trim()) { showToast('Full Name Required', 'error'); return; }
    if (!editForm.email.trim()) { showToast('Email Required', 'error'); return; }
    if (!editForm.department.trim()) { showToast('Department Required', 'error'); return; }
    if (editForm.role === 'student' && (!editForm.year || isNaN(Number(editForm.year)) || Number(editForm.year) < 1 || Number(editForm.year) > 4)) { showToast('Please select a valid year (1-4)', 'error'); return; }
    if (editForm.role === 'student' && !editForm.section.trim()) { showToast('Section Required', 'error'); return; }
    if (editForm.role === 'faculty' && !(editForm as any).roomNo?.trim()) { showToast('Room No Required', 'error'); return; }
    if (!editForm.mobile.trim() || !/^\d{10}$/.test(editForm.mobile)) { showToast('Please enter a valid 10-digit mobile number', 'error'); return; }
    if ((editForm.role === 'student' || editForm.role === 'faculty') && !editForm.regId.trim()) { showToast('Registration ID Required', 'error'); return; }
    
    try {
      const response = await fetch(`/api/users/${selectedUser._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ...editForm,
            // don't send year for faculty or admin roles
            year: editForm.role === 'faculty' || editForm.role === 'admin' ? undefined as unknown as string : editForm.year,
            roomNo: (editForm as any).roomNo,
          })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        showToast('User updated successfully', 'success');
        setShowEditForm(false);
        setSelectedUser(null);
        fetchUsers();
      } else {
        showToast(data.error || 'Failed to update user', 'error');
      }
    } catch (error) {
      showToast('Failed to update user', 'error');
    }
  };

  // Change user password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser) return;
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      showToast('Password must be at least 6 characters long', 'error');
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/user/${selectedUser._id}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: passwordForm.newPassword })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        showToast('Password changed successfully', 'success');
        setShowPasswordForm(false);
        setSelectedUser(null);
        setPasswordForm({ newPassword: '', confirmPassword: '' });
      } else {
        showToast(data.error || 'Failed to change password', 'error');
      }
    } catch (error) {
      showToast('Failed to change password', 'error');
    }
  };

  // Delete user
  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/user/${userId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (response.ok) {
        showToast('User deleted successfully', 'success');
        fetchUsers();
      } else {
        showToast(data.error || 'Failed to delete user', 'error');
      }
    } catch (error) {
      showToast('Failed to delete user', 'error');
    }
  };

  // Open edit form
  const openEditForm = (user: User) => {
    setSelectedUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      department: user.department,
      section: user.section,
      roomNo: (user as any).roomNo || '',
      mobile: user.mobile,
      year: user.year,
      regId: user.regId,
      role: user.role
    });
    setShowEditForm(true);
  };

  // Open password form
  const openPasswordForm = (user: User) => {
    setSelectedUser(user);
    setPasswordForm({ newPassword: '', confirmPassword: '' });
    setShowPasswordForm(true);
  };

  // Filter users based on search query
  // Custom regId filter: prefer numbers, then alphabets, then fallback
  let filteredUsers: User[] = [];
  if (searchQuery.trim() !== '') {
    // 1. regId: numbers only
    filteredUsers = users.filter(user =>
      user.regId && user.regId.match(/\d+/) && user.regId.includes(searchQuery)
    );
    // 2. regId: alphabets only (if no number matches)
    if (filteredUsers.length === 0) {
      filteredUsers = users.filter(user =>
        user.regId && user.regId.match(/[a-zA-Z]+/) && user.regId.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    // 3. fallback to other fields if still no match
    if (filteredUsers.length === 0) {
      filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.department.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
  } else {
    filteredUsers = users;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="mt-2 text-gray-600">
            Manage all users in the system. Total: {users.length} users
          </p>
        </div>

        {/* Controls */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search users by name, email, reg ID, or department..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create New User
          </button>
        </div>

        {/* Users Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Academic Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((userData) => (
                  <tr key={userData._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                            <span className="text-white font-medium">
                              {userData.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {userData.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {userData.regId}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{userData.email}</div>
                      <div className="text-sm text-gray-500">{userData.mobile}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{userData.department}</div>
                      <div className="text-sm text-gray-500">
                        {userData.role === 'faculty' ? (
                          <>
                            Room: {(userData as any).roomNo || '-'}
                          </>
                        ) : (
                          <>
                            {userData.section} - {userData.year}
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        userData.role === 'admin' 
                          ? 'bg-purple-100 text-purple-800'
                          : userData.role === 'organizer'
                          ? 'bg-blue-100 text-blue-800'
                          : userData.role === 'faculty'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {userData.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openEditForm(userData)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => openPasswordForm(userData)}
                          className="text-yellow-600 hover:text-yellow-900"
                        >
                          Password
                        </button>
                        {userData._id !== user._id && (
                          <button
                            onClick={() => handleDeleteUser(userData._id, userData.name)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {searchQuery ? 'No users found matching your search.' : 'No users found.'}
              </p>
            </div>
          )}
        </div>

        {/* Create User Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-6 z-50">
            <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-md bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                    <UserIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create New User</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Add a new user to EventHub with role specific details</p>
                  </div>
                </div>
                <button onClick={() => setShowCreateForm(false)} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                  <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Name *</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><UserIcon className="w-4 h-4" /></div>
                    <input
                      className="pl-10 pr-3 py-2 w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      value={createForm.name}
                      onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email *</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><MailIcon className="w-4 h-4" /></div>
                    <input
                      type="email"
                      className="pl-10 pr-3 py-2 w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      value={createForm.email}
                      onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Password *</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><LockIcon className="w-4 h-4" /></div>
                    <input
                      type="password"
                      minLength={6}
                      className="pl-10 pr-3 py-2 w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      value={createForm.password}
                      onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500">Password must be at least 6 characters.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Registration ID *</label>
                  <input
                    className="pr-3 py-2 w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    value={createForm.regId}
                    onChange={(e) => setCreateForm({ ...createForm, regId: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Department *</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Briefcase className="w-4 h-4" /></div>
                    <input
                      className="pl-10 pr-3 py-2 w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      value={createForm.department}
                      onChange={(e) => setCreateForm({ ...createForm, department: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Mobile *</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Phone className="w-4 h-4" /></div>
                    <input
                      className="pl-10 pr-3 py-2 w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      value={createForm.mobile}
                      onChange={(e) => setCreateForm({ ...createForm, mobile: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Role specific */}
                {createForm.role === 'student' && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Section *</label>
                      <input
                        className="pr-3 py-2 w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        value={createForm.section}
                        onChange={(e) => setCreateForm({ ...createForm, section: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Year *</label>
                      <select
                        className="pr-3 py-2 w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        value={createForm.year}
                        onChange={(e) => setCreateForm({ ...createForm, year: e.target.value })}
                        required
                      >
                        <option value="1">1st Year</option>
                        <option value="2">2nd Year</option>
                        <option value="3">3rd Year</option>
                        <option value="4">4th Year</option>
                      </select>
                    </div>
                  </>
                )}

                {createForm.role === 'faculty' && (
                  <div className="col-span-2 space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Room No *</label>
                    <input
                      className="pr-3 py-2 w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      value={(createForm as any).roomNo || ''}
                      onChange={(e) => setCreateForm({ ...createForm, roomNo: e.target.value })}
                      required
                    />
                  </div>
                )}

                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Role *</label>
                  <select
                    className="mt-1 w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2 px-3"
                    value={createForm.role}
                    onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as 'admin' | 'user' | 'organizer' | 'faculty' | 'student' })}
                    required
                  >
                    <option value="student">Student</option>
                    <option value="organizer">Organizer</option>
                    <option value="faculty">Faculty</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="col-span-2 flex justify-end space-x-3 mt-2">
                  <button type="button" onClick={() => setShowCreateForm(false)} className="px-5 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200">Cancel</button>
                  <button type="submit" className="px-6 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">Create User</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditForm && selectedUser && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Edit User: {selectedUser.name}
              </h2>
              
              <form onSubmit={handleEditUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Registration ID *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    value={editForm.regId}
                    onChange={(e) => setEditForm({ ...editForm, regId: e.target.value })}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Department *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      value={editForm.department}
                      onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {editForm.role === 'faculty' ? 'Room No *' : 'Section'}
                    </label>
                    <input
                      type="text"
                      required={editForm.role === 'faculty'}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      value={(editForm.role === 'faculty' ? (editForm as any).roomNo : editForm.section) || ''}
                      onChange={(e) => setEditForm({ ...editForm, ...(editForm.role === 'faculty' ? { roomNo: e.target.value } : { section: e.target.value }) })}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {editForm.role === 'student' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Year *</label>
                      <select
                        required
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        value={editForm.year}
                        onChange={(e) => setEditForm({ ...editForm, year: e.target.value })}
                      >
                        <option value="1">1st Year</option>
                        <option value="2">2nd Year</option>
                        <option value="3">3rd Year</option>
                        <option value="4">4th Year</option>
                      </select>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Mobile *
                    </label>
                    <input
                      type="tel"
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      value={editForm.mobile}
                      onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Role *
                  </label>
                  <select
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value as 'admin' | 'user' | 'organizer' | 'faculty' | 'student' })}
                  >
                    <option value="student">Student</option>
                    <option value="organizer">Organizer</option>
                    <option value="faculty">Faculty</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Update User
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditForm(false);
                      setSelectedUser(null);
                    }}
                    className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Change Password Modal */}
        {showPasswordForm && selectedUser && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Change Password for: {selectedUser.name}
              </h2>
              
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    New Password *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Confirm New Password *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  />
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors"
                  >
                    Change Password
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordForm(false);
                      setSelectedUser(null);
                      setPasswordForm({ newPassword: '', confirmPassword: '' });
                    }}
                    className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;
