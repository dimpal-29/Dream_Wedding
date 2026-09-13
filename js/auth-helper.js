/**
 * Dream Wedding - Auth Helper
 * Login check for booking restriction
 */

var AUTH_KEYS = {
  LOGGED_IN: 'dreamWedding_loggedIn',
  USER: 'dreamWedding_user',
  USERS_LIST: 'dreamWedding_usersList'
};

function getRegisteredUsers() {
  try {
    var data = localStorage.getItem(AUTH_KEYS.USERS_LIST);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

function registerNewUser(user) {
  var users = getRegisteredUsers();
  for (var i = 0; i < users.length; i++) {
    if (users[i].email === user.email) return false;
  }
  users.push(user);
  localStorage.setItem(AUTH_KEYS.USERS_LIST, JSON.stringify(users));
  return true;
}

function authenticateUser(email, password) {
  var users = getRegisteredUsers();
  for (var i = 0; i < users.length; i++) {
    if (users[i].email === email && users[i].password === password) {
      return users[i];
    }
  }
  return null;
}

function isUserLoggedIn() {
  return localStorage.getItem(AUTH_KEYS.LOGGED_IN) === 'true';
}

function setUserLoggedIn(user) {
  localStorage.setItem(AUTH_KEYS.LOGGED_IN, 'true');
  if (user) {
    localStorage.setItem(AUTH_KEYS.USER, JSON.stringify(user));
  }
}

function logoutUser() {
  localStorage.removeItem(AUTH_KEYS.LOGGED_IN);
  localStorage.removeItem(AUTH_KEYS.USER);
}

function getLoggedInUser() {
  try {
    var data = localStorage.getItem(AUTH_KEYS.USER);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
}

function getRedirectUrl() {
  var params = {};
  var search = window.location.search.substring(1);
  if (!search) return null;
  var pairs = search.split('&');
  for (var i = 0; i < pairs.length; i++) {
    var pair = pairs[i].split('=');
    params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
  }
  return params.redirect || null;
}
