const SITE_ACCESS_PASSWORD = 'MyShop@2026#888';
const SITE_AUTH_STORAGE_KEY = 'site_authenticated';

function verifyAccessPassword(password) {
  return String(password || '') === SITE_ACCESS_PASSWORD;
}

function getSiteAuthenticated() {
  try {
    return window.sessionStorage.getItem(SITE_AUTH_STORAGE_KEY) === 'true';
  } catch (error) {
    return false;
  }
}

function setSiteAuthenticated() {
  try {
    window.sessionStorage.setItem(SITE_AUTH_STORAGE_KEY, 'true');
    return true;
  } catch (error) {
    return false;
  }
}

function getSiteAccessReturnPath() {
  var page = window.location.pathname.split('/').pop();
  if (!page || page.indexOf('.') === -1) page = 'index.html';
  return page + window.location.search;
}

function requireSiteAccess() {
  if (window.location.pathname.indexOf('access.html') !== -1) return;
  if (getSiteAuthenticated()) return;
  var returnPath = getSiteAccessReturnPath();
  window.location.replace('access.html?return=' + encodeURIComponent(returnPath));
}

requireSiteAccess();
