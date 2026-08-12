const PRODUCT_DATA_KEY = 'modern-shop-products';
const PRODUCT_DATA_VERSION_KEY = 'modern-shop-products-version';
const PRODUCT_DATA_VERSION = '2026-08-12-v4';
const PRODUCT_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';
const STALE_LEGACY_DEFAULT_IDS = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10'];

function getDefaultProducts() {
  return Array.isArray(window.defaultProducts) ? window.defaultProducts : [];
}

function isStaleLegacyDefault(product) {
  return !!product && STALE_LEGACY_DEFAULT_IDS.indexOf(String(product.id)) !== -1;
}

function cleanStoredProducts(products) {
  return Array.isArray(products) ? products.filter(product => !isStaleLegacyDefault(product)) : products;
}

function normalizeProduct(product) {
  if (!product || typeof product !== 'object') return null;
  const id = String(product.id || '').trim();
  const name = String(product.name || '').trim();
  const category = String(product.category || '').trim();
  const price = Number(product.price || 0);
  const stock = Number(product.stock || 0);
  const description = String(product.description || '').trim();
  const image = product.image ? String(product.image).trim() : '';
  if (!id || !name || !category) return null;
  return { id, name, category, price, stock, description, image };
}

function mergeProducts(...lists) {
  const mergedMap = new Map();
  for (const list of lists) {
    if (!Array.isArray(list)) continue;
    for (const item of list) {
      const normalized = normalizeProduct(item);
      if (!normalized) continue;
      const existing = mergedMap.get(normalized.id);
      if (existing) {
        mergedMap.set(normalized.id, { ...existing, ...normalized });
      } else {
        mergedMap.set(normalized.id, normalized);
      }
    }
  }
  return Array.from(mergedMap.values());
}

function readLocalStorage(key) {
  try {
    if (!window.localStorage) return null;
    return window.localStorage.getItem(key);
  } catch (error) {
    console.warn('localStorage read failed:', error);
    return null;
  }
}

function writeLocalStorage(key, value) {
  try {
    if (!window.localStorage) return false;
    window.localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.warn('localStorage write failed:', error);
    return false;
  }
}

function parseStoredProducts() {
  const saved = readLocalStorage(PRODUCT_DATA_KEY);
  if (!saved) return null;
  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : null;
  } catch (error) {
    console.warn('解析本地商品数据失败：', error);
    return null;
  }
}

function saveAllProducts(products) {
  const merged = mergeProducts(products);
  writeLocalStorage(PRODUCT_DATA_KEY, JSON.stringify(merged));
  writeLocalStorage(PRODUCT_DATA_VERSION_KEY, PRODUCT_DATA_VERSION);
  return merged;
}

function saveProductsToStorage(products) {
  writeLocalStorage(PRODUCT_DATA_KEY, JSON.stringify(products));
  writeLocalStorage(PRODUCT_DATA_VERSION_KEY, PRODUCT_DATA_VERSION);
}

function getStoredProductsSync() {
  const stored = cleanStoredProducts(parseStoredProducts());
  if (stored && readLocalStorage(PRODUCT_DATA_VERSION_KEY) === PRODUCT_DATA_VERSION) {
    return stored;
  }
  return null;
}

function getStoredProducts() {
  return getAllProductsSync();
}

function fetchWithTimeout(resource, options = {}) {
  const { timeout = 5000 } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  return fetch(resource, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(id));
}

async function tryLoadRepoProducts() {
  try {
    const resp = await fetchWithTimeout('products-export.json', { timeout: 12000 });
    if (!resp.ok) throw new Error(`请求失败：${resp.status}`);
    const data = await resp.json();
    if (!Array.isArray(data)) throw new Error('返回数据格式不是数组');
    return data;
  } catch (error) {
    console.warn('无法从 products-export.json 加载商品，使用默认数据：', error);
    return [];
  }
}

async function getStaticProducts() {
  const defaultProducts = getDefaultProducts();
  const repoProducts = await tryLoadRepoProducts();
  return mergeProducts(defaultProducts, repoProducts);
}

async function getAllProducts() {
  const stored = cleanStoredProducts(parseStoredProducts());
  if (stored && readLocalStorage(PRODUCT_DATA_VERSION_KEY) === PRODUCT_DATA_VERSION) {
    return stored;
  }

  const staticProducts = await getStaticProducts();
  const merged = mergeProducts(staticProducts, stored || []);
  saveProductsToStorage(merged);
  return merged;
}

function getAllProductsSync() {
  const stored = getStoredProductsSync();
  if (stored) return stored;
  const defaultProducts = getDefaultProducts();
  const currentStored = cleanStoredProducts(parseStoredProducts()) || [];
  return mergeProducts(defaultProducts, currentStored);
}

function getProductById(productId) {
  const products = getAllProductsSync();
  return products.find(item => item.id === String(productId));
}

function getProductImageUrl(product) {
  return product && product.image ? product.image : PRODUCT_FALLBACK_IMAGE;
}
