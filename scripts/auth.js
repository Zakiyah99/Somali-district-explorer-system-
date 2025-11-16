

function isLoggedIn() {
  return localStorage.getItem('loggedInUser') !== null;
}

function getLoggedInUser() {
  const user = localStorage.getItem('loggedInUser');
  return user ? JSON.parse(user) : null;
}

function setLoggedInUser(user) {
  localStorage.setItem('loggedInUser', JSON.stringify(user));
}

function logout() {
  localStorage.removeItem('loggedInUser');
}

function validateLogin(email, password) {
  const users = getUsers();
  const user = users.find(u => u.email === email && u.password === password);
  return user || null;
}

function login(email, password) {
  
  if (!email || !password) {
    return {
      success: false,
      message: 'Please enter both email and password',
      user: null
    };
  }

  
  const user = validateLogin(email, password);
  
  if (user) {
    
    const { password: _, ...userWithoutPassword } = user;
    setLoggedInUser(userWithoutPassword);
    return {
      success: true,
      message: 'Login successful',
      user: userWithoutPassword
    };
  } else {
    return {
      success: false,
      message: 'Invalid email or password',
      user: null
    };
  }
}

function requireAuth(redirectTo = '../login/login.html') {
  if (!isLoggedIn()) {
    window.location.href = redirectTo;
    return false;
  }
  return true;
}


if (window.location.pathname.includes('login.html') && isLoggedIn()) {
  
  window.location.href = '../dashboard/dashboard.html';
}

