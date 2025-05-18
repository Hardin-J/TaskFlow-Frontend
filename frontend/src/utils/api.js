// /app/utils/api.js

const API_URL = "/api";

// Function to login user
export async function loginUser(email, password) {
  try {
    // In a real application, this would be a fetch to your API
    // For this implementation, we're fetching from the JSON server
    const response = await fetch(`${API_URL}/users`);
    
    if (!response.ok) {
      throw new Error('Server error');
    }
    
    const users = await response.json();
    
    // Find the user with matching email
    const user = users.find(user => user.email === email);
    
    // Check if user exists and password matches
    // Note: In a real app, you would compare hashed passwords
    if (!user || user.password !== password) {
      throw new Error('Invalid email or password');
    }
    
    // Update last login time
    const updatedUser = {
      ...user,
      lastLogin: new Date().toISOString()
    };
    
    // Update the user in the database
    await fetch(`${API_URL}/users/${user.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ lastLogin: updatedUser.lastLogin })
    });
    
    // Return the user without password
    const { password: _, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
    
  } catch (error) {
    throw new Error(error.message || 'Authentication failed');
  }
}

// Function to register a new user
export async function registerUser(userData) {
  try {
    // Check if email already exists
    const checkResponse = await fetch(`${API_URL}/users?email=${userData.email}`);
    const existingUsers = await checkResponse.json();
    
    if (existingUsers.length > 0) {
      throw new Error('Email already exists');
    }
    
    // In a real app, you would hash the password here
    
    // Create new user
    const response = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });
    
    if (!response.ok) {
      throw new Error('Registration failed');
    }
    
    const newUser = await response.json();
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
    
  } catch (error) {
    throw new Error(error.message || 'Registration failed');
  }
}

// Set user session in localStorage
export function setUserSession(user) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('user', JSON.stringify(user));
  }
  return user;
}

// Get user from session
export function getUserSession() {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }
  return null;
}

// Logout user
export function logoutUser() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('user');
  }
  return true;
}