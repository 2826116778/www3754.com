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

  if (selectedFile) {
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
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    imageHiddenInput.value = reader.result;
    imagePreviewImg.src = reader.result;
    imagePreview.style.display = 'block';
  };
  reader.onerror = () => {
    alert('图片读取失败，请重试。');
  };
  reader.readAsDataURL(file);
}

window.addEventListener('DOMContentLoaded', initializeAdminPage);
