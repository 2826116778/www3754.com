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

function getChannelName(channel) {
  if (channel === 'usdt') return 'USDT 支付';
  return 'USDT 支付';
}

function renderConfirmDetail(product, channel, orderId) {
  const detail = document.querySelector('#confirm-detail');
  if (!detail) return;
  detail.innerHTML = `
    <div class="payment-summary-card">
      <h2>确认订单信息</h2>
      <p><strong>订单号：</strong>${orderId}</p>
      <p><strong>商品：</strong>${product.name}</p>
      <p><strong>分类：</strong>${product.category}</p>
      <p><strong>单价：</strong>${formatPrice(product.price)}</p>
      <p><strong>支付方式：</strong>${getChannelName(channel)}</p>
    </div>
  `;
}

function initializeConfirmPage() {
  const productId = getUrlParameter('product');
  const channel = getUrlParameter('channel') || 'usdt';
  const products = getProducts();
  const product = products.find(item => item.id === productId) || products[0];

  if (!product) {
    document.querySelector('#confirm-detail').innerHTML = '<p>未找到商品，请返回首页重新选择。</p>';
    return;
  }

  const orderId = `ORD${Date.now()}`;
  renderConfirmDetail(product, channel, orderId);

  const screenshotInput = document.querySelector('#screenshot-file');
  const screenshotPreview = document.querySelector('#screenshot-preview');
  const screenshotPreviewImg = document.querySelector('#screenshot-preview-img');
  const payButton = document.querySelector('#pay-now');
  let screenshotData = '';

  const setPayButtonState = () => {
    if (payButton) {
      payButton.disabled = !screenshotData;
      payButton.classList.toggle('button-disabled', !screenshotData);
    }
  };

  if (screenshotInput) {
    screenshotInput.addEventListener('change', () => {
      const file = screenshotInput.files?.[0];
      if (!file) {
        screenshotData = '';
        screenshotPreview.style.display = 'none';
        screenshotPreviewImg.src = '';
        setPayButtonState();
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        screenshotData = reader.result;
        screenshotPreviewImg.src = screenshotData;
        screenshotPreview.style.display = 'block';
        setPayButtonState();
      };
      reader.onerror = () => {
        alert('截图读取失败，请重试。');
      };
      reader.readAsDataURL(file);
    });
  }

  const actions = document.querySelector('#confirm-actions');
  actions.className = 'confirm-actions';
  actions.innerHTML = `
    <button class="button button-primary button-disabled" id="pay-now" disabled>上传截图并完成</button>
    <a class="button button-secondary" href="payment.html?product=${encodeURIComponent(product.id)}">返回支付页面</a>
  `;

  const currentPayButton = document.querySelector('#pay-now');
  if (currentPayButton) {
    currentPayButton.addEventListener('click', () => {
      if (!screenshotData) {
        alert('请先上传支付成功截图，然后再完成支付。');
        return;
      }
      sessionStorage.setItem(`paymentScreenshot-${orderId}`, screenshotData);
      window.location.href = `success.html?product=${encodeURIComponent(product.id)}&channel=${encodeURIComponent(channel)}&order=${encodeURIComponent(orderId)}`;
    });
  }
}

window.addEventListener('DOMContentLoaded', initializeConfirmPage);
