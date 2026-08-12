function formatPrice(value) {
  const price = Number(value);
  const safePrice = Number.isFinite(price) ? price : 0;
  return '\u00a5' + safePrice.toFixed(2);
}

function renderProductCard(product) {
  const card = document.createElement('article');
  card.className = 'product-card';
  const imageUrl = getProductImageUrl(product);
  const fallbackUrl = getProductImageUrl({});
  card.innerHTML = `
    <a class="product-card-link" href="payment.html?product=${encodeURIComponent(product.id)}" title="购买 ${product.name}">
      <div class="product-card-image" style="background-image: url('${imageUrl}'), url('${fallbackUrl}')"></div>
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
  if (!grid) return;
  grid.innerHTML = '';
  if (!Array.isArray(products) || products.length === 0) {
    grid.innerHTML = '<p class="empty-message">\u5546\u54c1\u6570\u636e\u52a0\u8f7d\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u5237\u65b0\u91cd\u8bd5\u3002</p>';
    return;
  }
  products.forEach(product => grid.appendChild(renderProductCard(product)));
}

function renderElectronicsSection(products) {
  if (!Array.isArray(products)) return;
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
  try {
    const products = await getAllProducts();
    const safeProducts = Array.isArray(products) ? products : [];
    renderElectronicsSection(safeProducts);
    renderProductGrid(safeProducts);
    if (safeProducts.length === 0) {
      console.error('Product data is empty; check data.js and products-export.json.');
    }
  } catch (error) {
    console.error('Product initialization failed:', error);
    const fallbackProducts = Array.isArray(window.defaultProducts) ? window.defaultProducts : [];
    renderElectronicsSection(fallbackProducts);
    renderProductGrid(fallbackProducts);
  }
}

window.addEventListener('DOMContentLoaded', initializeLandingPage);
