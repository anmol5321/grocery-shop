const itemsGrid = document.getElementById('items-grid');
const emptyState = document.getElementById('empty-state');
const errorState = document.getElementById('error-state');
const sectionTitle = document.getElementById('section-title');
const sectionSub = document.getElementById('section-sub');
const categoryPills = document.getElementById('category-pills');

const categoryModal = document.getElementById('category-modal');
const categoryForm = document.getElementById('category-form');
const categoryIdInput = document.getElementById('category-id');
const categoryNameInput = document.getElementById('category-name');
const categoryModalTitle = document.getElementById('category-modal-title');

const itemModal = document.getElementById('item-modal');
const itemForm = document.getElementById('item-form');
const itemIdInput = document.getElementById('item-id');
const itemNameInput = document.getElementById('item-name');
const itemCategorySelect = document.getElementById('item-category-id');
const itemFlavorInput = document.getElementById('item-flavor');
const itemPriceInput = document.getElementById('item-price');
const itemStockInput = document.getElementById('item-stock');
const itemImageInput = document.getElementById('item-image');
const itemModalTitle = document.getElementById('item-modal-title');

const PLACEHOLDER_IMG = 'https://placehold.co/400x400/eeede9/78716c?text=No+Image';

let categories = [];
let currentCategoryId = '';

async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || res.statusText);
  }
  if (res.status === 204) return null;
  return res.json();
}

async function fetchCategories() {
  const list = await api('/api/categories');
  categories = list;
  return list;
}

async function fetchItems(categoryId = '') {
  const url = categoryId
    ? `/api/items?category_id=${encodeURIComponent(categoryId)}`
    : '/api/items';
  return api(url);
}

function renderCategoryPills() {
  categoryPills.innerHTML = '';
  categories.forEach((cat) => {
    const wrap = document.createElement('span');
    wrap.className = 'pill-wrap';
    wrap.innerHTML = `
      <button type="button" class="pill" data-category-id="${cat.id}">${escapeHtml(cat.name)}</button>
      <span class="pill-category-actions">
        <button type="button" class="btn btn-ghost btn-sm pill-edit" data-id="${cat.id}" data-name="${escapeHtml(cat.name)}" title="Edit category">Edit</button>
        <button type="button" class="btn btn-danger btn-sm pill-delete" data-id="${cat.id}" title="Delete category">Delete</button>
      </span>
    `;
    categoryPills.appendChild(wrap);
  });
  categoryPills.querySelectorAll('.pill[data-category-id]').forEach((btn) => {
    btn.addEventListener('click', () => setFilter(btn.dataset.categoryId));
  });
  categoryPills.querySelectorAll('.pill-edit').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openCategoryForm({ id: btn.dataset.id, name: btn.dataset.name });
    });
  });
  categoryPills.querySelectorAll('.pill-delete').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteCategory(Number(btn.dataset.id));
    });
  });
}

function setFilter(categoryId) {
  currentCategoryId = categoryId || '';
  document.querySelectorAll('.nav-categories .pill').forEach((p) => p.classList.remove('pill-active'));
  const target = document.querySelector(`.nav-categories .pill[data-category-id="${categoryId}"]`);
  if (target) target.classList.add('pill-active');
  const allPill = document.querySelector('.nav-categories .pill[data-category-id=""]');
  if (allPill) allPill.classList.toggle('pill-active', !categoryId);
  updateSectionHeading();
  loadItems();
}

function updateSectionHeading() {
  if (!currentCategoryId) {
    sectionTitle.textContent = 'All products';
    sectionSub.textContent = categories.length ? `Browse by category above` : '';
    return;
  }
  const cat = categories.find((c) => String(c.id) === String(currentCategoryId));
  sectionTitle.textContent = cat ? cat.name : 'Products';
  sectionSub.textContent = '';
}

function escapeHtml(s) {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

function renderItem(item) {
  const card = document.createElement('article');
  card.className = 'card';
  const imgUrl = item.image_url || PLACEHOLDER_IMG;
  card.innerHTML = `
    <div class="card-image-wrap">
      <img class="card-image" src="${escapeHtml(imgUrl)}" alt="${escapeHtml(item.name)}" loading="lazy" onerror="this.src='${PLACEHOLDER_IMG}'">
    </div>
    <div class="card-body">
      <span class="card-category">${escapeHtml(item.category_name || '')}</span>
      <h3 class="card-title">${escapeHtml(item.name)}</h3>
      ${item.flavor ? `<p class="card-flavor">${escapeHtml(item.flavor)}</p>` : ''}
      <p class="card-price">₹ ${Number(item.price).toFixed(2)}</p>
    </div>
    <div class="card-actions">
      <button type="button" class="btn btn-secondary card-edit" data-id="${item.id}">Edit</button>
      <button type="button" class="btn btn-danger card-delete" data-id="${item.id}">Delete</button>
    </div>
  `;
  card.querySelector('.card-edit').addEventListener('click', () => openItemForm(item));
  card.querySelector('.card-delete').addEventListener('click', () => deleteItem(item.id));
  return card;
}

function renderItems(items) {
  itemsGrid.innerHTML = '';
  errorState.hidden = true;
  if (items.length === 0) {
    emptyState.hidden = false;
    return;
  }
  emptyState.hidden = true;
  items.forEach((item) => itemsGrid.appendChild(renderItem(item)));
}

async function loadItems() {
  try {
    const items = await fetchItems(currentCategoryId);
    renderItems(items);
  } catch (e) {
    itemsGrid.innerHTML = '';
    emptyState.hidden = true;
    errorState.hidden = false;
    errorState.querySelector('p').textContent = 'Could not load products. ' + (e.message || '');
  }
}

async function loadCategories() {
  try {
    await fetchCategories();
    renderCategoryPills();
    fillCategorySelect();
    updateSectionHeading();
  } catch (e) {
    console.error(e);
  }
}

function fillCategorySelect() {
  const value = itemCategorySelect.value;
  itemCategorySelect.innerHTML = '<option value="">Select category</option>';
  categories.forEach((c) => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = c.name;
    itemCategorySelect.appendChild(opt);
  });
  if (value) itemCategorySelect.value = value;
}

document.querySelector('.nav-categories .pill[data-category-id=""]').addEventListener('click', () => setFilter(''));

document.querySelector('.open-category-form').addEventListener('click', () => openCategoryForm(null));
document.querySelector('.open-item-form').addEventListener('click', () => openItemForm(null));
document.querySelector('.empty-state .open-item-form')?.addEventListener('click', () => openItemForm(null));

document.querySelector('.open-category-form-inline').addEventListener('click', () => {
  openCategoryForm(null, () => {
    closeModal(categoryModal);
    openItemForm(null, categories[categories.length - 1]?.id);
  });
});

function openCategoryForm(category, onSave) {
  categoryModalTitle.textContent = category ? 'Edit category' : 'New category';
  categoryIdInput.value = category ? category.id : '';
  categoryNameInput.value = category ? category.name : '';
  categoryModal.setAttribute('aria-hidden', 'false');
  categoryNameInput.focus();
  if (onSave) window._categoryOnSave = onSave;
}

function closeCategoryForm() {
  categoryModal.setAttribute('aria-hidden', 'true');
  if (window._categoryOnSave) {
    window._categoryOnSave();
    window._categoryOnSave = null;
  }
}

categoryForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = categoryNameInput.value.trim();
  const id = categoryIdInput.value;
  try {
    if (id) {
      await api(`/api/categories/${id}`, { method: 'PUT', body: JSON.stringify({ name }) });
    } else {
      await api('/api/categories', { method: 'POST', body: JSON.stringify({ name }) });
    }
    await fetchCategories();
    renderCategoryPills();
    fillCategorySelect();
    closeCategoryForm();
    if (window._categoryOnSave) window._categoryOnSave();
    window._categoryOnSave = null;
  } catch (err) {
    alert(err.message || 'Failed to save category');
  }
});

async function deleteCategory(id) {
  if (!confirm('Delete this category? Products in it will be moved to another category.')) return;
  try {
    await api(`/api/categories/${id}`, { method: 'DELETE' });
    await fetchCategories();
    renderCategoryPills();
    fillCategorySelect();
    if (String(currentCategoryId) === String(id)) setFilter('');
    else loadItems();
  } catch (err) {
    alert(err.message || 'Failed to delete category');
  }
}

function openItemForm(item, selectCategoryId) {
  itemModalTitle.textContent = item ? 'Edit product' : 'Add product';
  itemIdInput.value = item ? item.id : '';
  itemNameInput.value = item ? item.name : '';
  itemFlavorInput.value = item ? (item.flavor || '') : '';
  itemPriceInput.value = item ? item.price : '';
  itemStockInput.value = item ? (item.stock ?? '') : '';
  itemImageInput.value = item ? (item.image_url || '') : '';
  fillCategorySelect();
  itemCategorySelect.value = selectCategoryId != null ? selectCategoryId : (item ? item.category_id : '');
  itemModal.setAttribute('aria-hidden', 'false');
  itemNameInput.focus();
}

function closeItemForm() {
  itemModal.setAttribute('aria-hidden', 'true');
}

itemForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    name: itemNameInput.value.trim(),
    category_id: Number(itemCategorySelect.value),
    flavor: itemFlavorInput.value.trim(),
    price: parseFloat(itemPriceInput.value) || 0,
    image_url: itemImageInput.value.trim(),
    stock: parseInt(itemStockInput.value, 10) || 0,
  };
  const id = itemIdInput.value;
  try {
    if (id) {
      await api(`/api/items/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
    } else {
      await api('/api/items', { method: 'POST', body: JSON.stringify(payload) });
    }
    closeItemForm();
    loadItems();
  } catch (err) {
    alert(err.message || 'Failed to save product');
  }
});

async function deleteItem(id) {
  if (!confirm('Delete this product?')) return;
  try {
    await api(`/api/items/${id}`, { method: 'DELETE' });
    loadItems();
  } catch (err) {
    alert(err.message || 'Failed to delete');
  }
}

function closeModal(modal) {
  modal.setAttribute('aria-hidden', 'true');
}

document.querySelectorAll('.modal').forEach((modal) => {
  modal.querySelectorAll('.modal-backdrop, [data-close]').forEach((el) => {
    el.addEventListener('click', () => closeModal(modal));
  });
});

document.getElementById('category-modal').querySelectorAll('[data-close]').forEach((el) => {
  el.addEventListener('click', () => closeCategoryForm());
});

document.getElementById('item-modal').querySelectorAll('[data-close]').forEach((el) => {
  el.addEventListener('click', () => closeItemForm());
});

loadCategories().then(() => loadItems());
