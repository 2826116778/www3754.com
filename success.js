function getUrlParameter(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

function formatPrice(value) {
  return `¥${value.toFixed(2)}`;
}

function getChannelName(channel) {
  if (channel === 'usdt') return 'USDT 支付';
  return 'USDT 支付';
}

async function initializeSuccessPage() {
  const productId = getUrlParameter('product');
  const channel = getUrlParameter('channel') || 'usdt';
  const orderId = getUrlParameter('order') || `ORD${Date.now()}`;
  const products = await getAllProducts();
  const product = products.find(item => item.id === productId) || products[0];

  const message = document.querySelector('#success-message');
  const screenshotContainer = document.querySelector('#success-screenshot');
  const screenshotImg = document.querySelector('#success-screenshot-img');
  if (!message) return;

  const screenshotData = sessionStorage.getItem(`paymentScreenshot-${orderId}`);
  if (screenshotData && screenshotImg && screenshotContainer) {
    screenshotImg.src = screenshotData;
    screenshotContainer.style.display = 'block';
  }

  if (!product) {
    message.innerHTML = `<strong>订单号：</strong>${orderId}<br>支付已完成，订单信息已提交。`;
    return;
  }

  message.innerHTML = `
    <strong>订单号：</strong>${orderId}<br>
    支付成功，您已使用 <strong>${getChannelName(channel)}</strong> 支付了 <strong>${product.name}</strong>，金额为 <strong>${formatPrice(product.price)}</strong>。
  `;
}

window.addEventListener('DOMContentLoaded', initializeSuccessPage);
