const storageKey = 'modern-shop-products';
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

function getProducts() {
  const saved = window.localStorage.getItem(storageKey);
  if (!saved) {
    window.localStorage.setItem(storageKey, JSON.stringify(window.defaultProducts));
    return window.defaultProducts;
  }
  try {
    return JSON.parse(saved) || window.defaultProducts;
  } catch (error) {
    console.error('读取本地商品数据失败：', error);
    return window.defaultProducts;
  }
}

function saveProducts(products) {
  window.localStorage.setItem(storageKey, JSON.stringify(products));
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

      saveProducts(sanitized);
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

function initializeAdminPage() {
  if (!window.localStorage.getItem(storageKey)) {
    window.localStorage.setItem(storageKey, JSON.stringify(window.defaultProducts));
  }
  refreshList();
  form.addEventListener('submit', handleFormSubmit);
  resetButton.addEventListener('click', clearForm);
  tableBody.addEventListener('click', handleTableClick);
  searchInput.addEventListener('input', refreshList);
  exportButton.addEventListener('click', handleExport);
  importFile.addEventListener('change', handleImport);
  imageFileInput.addEventListener('change', handleImageFileChange);
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
