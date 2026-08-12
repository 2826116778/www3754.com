const searchInput = document.querySelector('#product-search');
const tableBody = document.querySelector('#product-table');
const form = document.querySelector('#product-form');
const resetButton = document.querySelector('#reset-form');
const exportButton = document.querySelector('#export-btn');
const importFile = document.querySelector('#import-file');
const imageFileInput = document.querySelector('#product-image-file');
const imageHiddenInput = document.querySelector('#product-image');
const imagePreview = document.querySelector('#image-preview');
const imagePreviewImg = document.querySelector('#product-image-preview');
const backendUrlInput = document.querySelector('#backend-url');
const syncBackendButton = document.querySelector('#sync-backend-btn');
const publicUrlInput = document.querySelector('#public-url');
const setPublicUrlButton = document.querySelector('#set-public-url-btn');
const publishPublicButton = document.querySelector('#publish-public-btn');

function getProducts() {
  return getAllProductsSync();
}

function saveProducts(products) {
  saveProductsToStorage(products);
}

function createId() {
  return `p${Date.now()}`;
}

function clearForm() {
  form.reset();
  document.querySelector('#product-id').value = '';
  imageHiddenInput.value = '';
  imageFileInput.value = '';
  imagePreview.style.display = 'none';
  imagePreviewImg.src = '';
}

function renderTable(products) {
  tableBody.innerHTML = '';
  products.forEach(product => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${product.name}</td>
      <td>${product.category}</td>
      <td>¥${product.price.toFixed(2)}</td>
      <td>${product.stock}</td>
      <td>
        <div class="table-action">
          <button type="button" class="button button-secondary" data-action="edit" data-id="${product.id}">编辑</button>
          <button type="button" class="button button-secondary" data-action="delete" data-id="${product.id}">删除</button>
        </div>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

async function handleSyncFromBackend() {
  // 允许用户在输入框中填写后端数据地址，否则提示输入
  const url = (backendUrlInput && backendUrlInput.value && backendUrlInput.value.trim()) || '';
  if (!url) {
    const manual = prompt('请输入后端商品 JSON 的完整 URL（例如：https://example.com/products.json）：');
    if (!manual) return;
    return await fetchAndSaveProducts(manual.trim());
  }
  await fetchAndSaveProducts(url.trim());
}

async function fetchAndSaveProducts(url) {
  try {
    const resp = await fetch(url, { cache: 'no-store' });
    if (!resp.ok) throw new Error(`请求失败：${resp.status}`);
    const data = await resp.json();
    if (!Array.isArray(data)) throw new Error('返回的数据不是数组格式');

    const sanitized = data.map(item => ({
      id: item.id || createId(),
      name: String(item.name || '').trim(),
      category: String(item.category || '').trim(),
      price: Number(item.price || 0),
      stock: Number(item.stock || 0),
      image: item.image ? String(item.image).trim() : '',
      description: item.description ? String(item.description).trim() : ''
    })).filter(item => item.name && item.category);

    if (sanitized.length === 0) {
      alert('从后端获取的数据中未发现有效商品。');
      return;
    }

    const current = getAllProductsSync();
    const merged = mergeProducts(current, sanitized);
    saveProducts(merged);
    refreshList();
    clearForm();
    alert('已从后端同步并保存商品数据，本地前端已更新。');
  } catch (err) {
    console.error('从后端同步失败：', err);
    alert('从后端同步失败：' + (err.message || String(err)) + '\n可能存在跨域(CORS)限制或地址错误。');
  }
}
function handleSetPublicUrl() {
  const url = (publicUrlInput && publicUrlInput.value && publicUrlInput.value.trim()) || '';
  if (!url) {
    const manual = prompt('请输入公开产品 JSON 的 URL（前端将优先从该地址拉取商品）：');
    if (!manual) return;
    localStorage.setItem('modern-shop-public-url', manual.trim());
    alert('已保存公开数据 URL，前端将优先从该地址拉取商品（如可访问）。');
    return;
  }
  localStorage.setItem('modern-shop-public-url', url);
  alert('已保存公开数据 URL，前端将优先从该地址拉取商品（如可访问）。');
}

async function handlePublishToPublicUrl() {
  const url = (publicUrlInput && publicUrlInput.value && publicUrlInput.value.trim()) || localStorage.getItem('modern-shop-public-url') || '';
  if (!url) {
    alert('请先在输入框填写要发布到的 URL，或先设置公开 URL。');
    return;
  }
  if (!confirm('确认将当前本地商品数据以 JSON POST 到该 URL？请确保目标接口接受 POST 并允许跨域。')) return;
  const products = getProducts();
  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(products)
    });
    if (!resp.ok) throw new Error(`请求失败：${resp.status}`);
    alert('已成功发布到该 URL（服务器返回：' + resp.status + '）。');
  } catch (err) {
    console.error('发布到公开 URL 失败：', err);
    alert('发布失败：' + (err.message || String(err)) + '\n请检查目标接口是否允许 POST、是否支持 CORS。');
  }
}
function refreshList() {
  const products = getProducts();
  const query = searchInput.value.trim().toLowerCase();
  const filtered = products.filter(item => {
    return item.name.toLowerCase().includes(query) || item.category.toLowerCase().includes(query);
  });
  renderTable(filtered);
}

function populateForm(product) {
  document.querySelector('#product-id').value = product.id;
  document.querySelector('#product-name').value = product.name;
  document.querySelector('#product-category').value = product.category;
  document.querySelector('#product-price').value = product.price;
  document.querySelector('#product-stock').value = product.stock;
  imageHiddenInput.value = product.image || '';
  imageFileInput.value = '';
  if (product.image) {
    imagePreviewImg.src = product.image;
    imagePreview.style.display = 'block';
  } else {
    imagePreview.style.display = 'none';
    imagePreviewImg.src = '';
  }
  document.querySelector('#product-description').value = product.description || '';
}

function handleFormSubmit(event) {
  event.preventDefault();
  const id = document.querySelector('#product-id').value;
  const name = document.querySelector('#product-name').value.trim();
  const category = document.querySelector('#product-category').value.trim();
  const price = parseFloat(document.querySelector('#product-price').value);
  const stock = parseInt(document.querySelector('#product-stock').value, 10);
  const description = document.querySelector('#product-description').value.trim();
  const selectedFile = imageFileInput.files?.[0];
  const existingImage = imageHiddenInput.value.trim();

  if (!name || !category || Number.isNaN(price) || Number.isNaN(stock)) {
    alert('请填写完整的商品信息。');
    return;
  }

  const saveProduct = (imageData) => {
    const products = getProducts();
    if (id) {
      const index = products.findIndex(item => item.id === id);
      if (index >= 0) {
        products[index] = { id, name, category, price, stock, image: imageData, description };
      }
    } else {
      products.unshift({ id: createId(), name, category, price, stock, image: imageData, description });
    }

    saveProducts(products);
    refreshList();
    clearForm();
    alert('商品保存成功！');
  };

  // 优先使用已处理后的图片（imageHiddenInput），如果没有则使用已有 image 字段
  if (imageHiddenInput.value && imageHiddenInput.value.trim()) {
    saveProduct(imageHiddenInput.value.trim());
  } else if (selectedFile) {
    // 作为后备：直接读取原始文件（不推荐，通常已在选择时处理）
    const reader = new FileReader();
    reader.onload = () => saveProduct(reader.result);
    reader.onerror = () => alert('图片读取失败，请重试。');
    reader.readAsDataURL(selectedFile);
  } else {
    saveProduct(existingImage);
  }
}

function handleTableClick(event) {
  const button = event.target.closest('button');
  if (!button) return;
  const action = button.dataset.action;
  const id = button.dataset.id;
  const products = getProducts();
  const product = products.find(item => item.id === id);
  if (!product) return;

  if (action === 'edit') {
    populateForm(product);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (action === 'delete') {
    if (!confirm('确认删除该商品吗？')) return;
    const next = products.filter(item => item.id !== id);
    saveProducts(next);
    refreshList();
  }
}

function handleExport() {
  const products = getProducts();
  const blob = new Blob([JSON.stringify(products, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'products-export.json';
  document.body.appendChild(link);
  link.click();
  URL.revokeObjectURL(url);
  link.remove();
}

function handleImport(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(reader.result);
      if (!Array.isArray(imported)) throw new Error('文件格式不正确');
      const sanitized = imported.map(item => ({
        id: item.id || createId(),
        name: String(item.name || '').trim(),
        category: String(item.category || '').trim(),
        price: Number(item.price || 0),
        stock: Number(item.stock || 0),
        image: item.image ? String(item.image).trim() : '',
        description: item.description ? String(item.description).trim() : ''
      })).filter(item => item.name && item.category);

      const current = getAllProductsSync();
      const merged = mergeProducts(current, sanitized);
      saveProducts(merged);
      refreshList();
      clearForm();
      alert('商品导入成功！');
    } catch (error) {
      alert('导入失败，请确认这是有效的 JSON 商品文件。');
      console.error(error);
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

async function initializeAdminPage() {
  await getAllProducts();
  refreshList();
  form.addEventListener('submit', handleFormSubmit);
  resetButton.addEventListener('click', clearForm);
  tableBody.addEventListener('click', handleTableClick);
  searchInput.addEventListener('input', refreshList);
  exportButton.addEventListener('click', handleExport);
  importFile.addEventListener('change', handleImport);
  imageFileInput.addEventListener('change', handleImageFileChange);
  if (syncBackendButton) syncBackendButton.addEventListener('click', handleSyncFromBackend);
  if (setPublicUrlButton) setPublicUrlButton.addEventListener('click', handleSetPublicUrl);
  if (publishPublicButton) publishPublicButton.addEventListener('click', handlePublishToPublicUrl);
}

function handleImageFileChange() {
  const file = imageFileInput.files?.[0];
  if (!file) {
    imagePreview.style.display = 'none';
    imagePreviewImg.src = '';
    imageHiddenInput.value = '';
    return;
  }

  // 处理图片：裁剪并缩放为 800x600（覆盖式填充），保持中心对齐
  processImageFile(file, 800, 600, 0.85)
    .then(dataUrl => {
      imageHiddenInput.value = dataUrl;
      imagePreviewImg.src = dataUrl;
      imagePreview.style.display = 'block';
      // 清空 file input 避免重复读取原始大文件
      imageFileInput.value = '';
    })
    .catch(err => {
      console.error(err);
      alert('图片处理失败，请重试。');
    });
}

function processImageFile(file, targetWidth = 800, targetHeight = 600, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('图片加载失败'));
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          const ctx = canvas.getContext('2d');

          // 计算 cover 缩放（填满并裁剪）
          const ratio = Math.max(targetWidth / img.width, targetHeight / img.height);
          const sw = targetWidth / ratio;
          const sh = targetHeight / ratio;
          const sx = (img.width - sw) / 2;
          const sy = (img.height - sh) / 2;

          // 将裁剪后的原图绘制到目标 canvas
          ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetWidth, targetHeight);

          const mime = 'image/jpeg';
          const dataUrl = canvas.toDataURL(mime, quality);
          resolve(dataUrl);
        } catch (e) {
          reject(e);
        }
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

window.addEventListener('DOMContentLoaded', initializeAdminPage);
