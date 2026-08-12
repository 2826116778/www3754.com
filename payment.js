function getUrlParameter(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

function getProducts() {
  const saved = window.localStorage.getItem('modern-shop-products');
  if (!saved) {
    return window.defaultProducts || [];
  }
  try {
    return JSON.parse(saved) || window.defaultProducts || [];
  } catch (error) {
    console.error('读取商品数据失败：', error);
    return window.defaultProducts || [];
  }
}

function formatPrice(value) {
  return `¥${value.toFixed(2)}`;
}

function renderProductDetail(product) {
  const detail = document.querySelector('#product-detail');
  if (!detail) return;
  detail.innerHTML = `
    <div class="payment-summary">
      <div class="payment-summary-card">
        <h2>${product.name}</h2>
        <p>${product.description}</p>
        <div class="product-meta">
          <span class="product-tag">${product.category}</span>
          <span class="price-tag">${formatPrice(product.price)}</span>
        </div>
        <p class="payment-note">请选择支付方式并完成支付操作。</p>
      </div>
    </div>
  `;
}

// Replace these QR code file names with your actual payment code images if needed.
// 例如：u-payment-qrcode.png 是真实 U 地址二维码，已在项目中生成。
const paymentMethods = {
  usdt: {
    title: 'USDT 扫码支付',
    note: '请使用支持 USDT 的钱包扫描二维码完成付款。收款地址：TXRR6yqPVaKKnrHvxxNFvDGsU6DeENMS8Q。',
    qr: 'u-payment-qrcode.png',
    alt: 'USDT 收款二维码'
  }
};

function setPaymentQRCode(channel) {
  const image = document.querySelector('#payment-qr-image');
  const note = document.querySelector('.payment-qr-note');
  if (!image || !note) return;
  const method = paymentMethods[channel] || paymentMethods.usdt;
  image.src = method.qr;
  image.alt = method.alt;
  note.textContent = method.note;
}

function initializePaymentPage() {
  const productId = getUrlParameter('product');
  const products = getProducts();
  const product = products.find(item => item.id === productId) || products[0];

  if (!product) {
    document.querySelector('#product-detail').innerHTML = '<p>未找到商品，请返回首页重新选择。</p>';
    return;
  }

  renderProductDetail(product);

  const paymentCards = document.querySelectorAll('.payment-card');
  let selectedChannel = 'usdt';

  paymentCards.forEach(card => {
    card.addEventListener('click', () => {
      paymentCards.forEach(node => node.classList.remove('payment-active'));
      card.classList.add('payment-active');
      selectedChannel = card.dataset.channel;
      setPaymentQRCode(selectedChannel);
    });
  });

  setPaymentQRCode(selectedChannel);

  const confirmButton = document.querySelector('#confirm-order');
  confirmButton.addEventListener('click', () => {
    window.location.href = `confirm.html?product=${encodeURIComponent(product.id)}&channel=${encodeURIComponent(selectedChannel)}`;
  });
}

window.addEventListener('DOMContentLoaded', initializePaymentPage);
