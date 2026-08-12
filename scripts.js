const storageKey = 'modern-shop-products';

function getStoredProducts() {
  const saved = window.localStorage.getItem(storageKey);
  if (!saved) {
    window.localStorage.setItem(storageKey, JSON.stringify(window.defaultProducts));
    return window.defaultProducts;
  }
  try {
    return JSON.parse(saved) || window.defaultProducts;
  } catch (error) {
    console.error('加载商品数据失败：', error);
    return window.defaultProducts;
  }
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
    const resp = await fetchWithTimeout('products-export.json', { cache: 'no-store', timeout: 5000 });
    if (!resp.ok) throw new Error(`请求失败：${resp.status}`);
    const data = await resp.json();
    if (!Array.isArray(data)) throw new Error('返回数据格式不是数组');
    return data;
  } catch (err) {
    console.warn('无法从 products-export.json 加载商品，回退到本地：', err);
    return null;
  }
}

function formatPrice(value) {
  return `¥${value.toFixed(2)}`;
}

function renderProductCard(product) {
  const card = document.createElement('article');
  card.className = 'product-card';
  card.innerHTML = `
    <a class="product-card-link" href="payment.html?product=${encodeURIComponent(product.id)}" title="购买 ${product.name}">
      <div class="product-card-image" style="background-image: url('${product.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'}')"></div>
      <div class="product-card-body">
        <h3>${product.name}</h3>
        <p>${product.description}</p>
        <div class="product-meta">
          <span class="product-tag">${product.category}</span>
          <span class="price-tag">${formatPrice(product.price)}</span>
        </div>
        <div class="product-meta product-stock">
          <span>库存 ${product.stock}</span>
        </div>
        <div class="product-card-footer">
          <span class="button button-primary">立即购买</span>
        </div>
      </div>
    </a>
  `;
  return card;
}

function renderProductGrid(products) {
  const grid = document.querySelector('#product-grid');
  grid.innerHTML = '';
  products.forEach(product => grid.appendChild(renderProductCard(product)));
}

function renderElectronicsSection(products) {
  const electronics = products.filter(item => item.category.includes('电子'));
  const grid = document.querySelector('#electronics-grid');
  if (!grid) return;

  if (electronics.length === 0) {
    grid.innerHTML = '<p class="empty-message">当前暂无电子类商品，请前往后台补充。</p>';
    return;
  }

  grid.innerHTML = '';
  electronics.slice(0, 4).forEach(product => grid.appendChild(renderProductCard(product)));
}

async function initializeLandingPage() {
  let products = await tryLoadRepoProducts();
  if (!products) products = getStoredProducts();
  renderElectronicsSection(products);
  renderProductGrid(products);
}

window.addEventListener('DOMContentLoaded', initializeLandingPage);
