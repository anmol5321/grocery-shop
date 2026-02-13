const itemsGrid = document.getElementById('items-grid');
const emptyState = document.getElementById('empty-state');
const errorState = document.getElementById('error-state');
const sectionTitle = document.getElementById('section-title');
const sectionSub = document.getElementById('section-sub');
const categoryPills = document.getElementById('category-pills');
const categoryPillsMobile = document.getElementById('category-pills-mobile');
const hamburger = document.getElementById('hamburger');
const drawer = document.getElementById('drawer');
const drawerBackdrop = document.getElementById('drawer-backdrop');
const drawerClose = document.getElementById('drawer-close');

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

// Wholesaler order list: { id, name, category_name, price, quantity }
let orderList = [];

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
  if (categoryPillsMobile) categoryPillsMobile.innerHTML = '';
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
    if (categoryPillsMobile) {
      const wrapM = document.createElement('span');
      wrapM.className = 'pill-wrap';
      wrapM.innerHTML = `<button type="button" class="pill" data-category-id="${cat.id}" data-drawer>${escapeHtml(cat.name)}</button>`;
      categoryPillsMobile.appendChild(wrapM);
    }
  });
  categoryPills.querySelectorAll('.pill[data-category-id]').forEach((btn) => {
    btn.addEventListener('click', () => setFilter(btn.dataset.categoryId));
  });
  categoryPillsMobile && categoryPillsMobile.querySelectorAll('.pill[data-category-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      setFilter(btn.dataset.categoryId);
      closeDrawer();
    });
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
  syncPillActiveState();
}

function syncPillActiveState() {
  document.querySelectorAll('.pill[data-category-id]').forEach((p) => {
    const isActive = String(p.dataset.categoryId || '') === String(currentCategoryId);
    p.classList.toggle('pill-active', isActive);
  });
}

function setFilter(categoryId) {
  currentCategoryId = categoryId || '';
  syncPillActiveState();
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

function getOrderEntry(itemId) {
  return orderList.find((e) => String(e.id) === String(itemId));
}

function addToOrderList(item) {
  const entry = getOrderEntry(item.id);
  if (entry) {
    entry.quantity += 1;
  } else {
    orderList.push({
      id: item.id,
      name: item.name,
      category_name: item.category_name || '',
      price: Number(item.price) || 0,
      quantity: 1,
    });
  }
  updateOrderBadge();
  loadItems(); // re-render cards so "Add to order" shows "In order (qty)"
}

function renderItem(item) {
  const card = document.createElement('article');
  card.className = 'card';
  const imgUrl = item.image_url || PLACEHOLDER_IMG;
  const entry = getOrderEntry(item.id);
  const inOrder = !!entry;
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
      <button type="button" class="btn btn-order card-add-to-order ${inOrder ? 'in-order' : ''}" data-id="${item.id}">${inOrder ? `In order (${entry.quantity})` : 'Add to order'}</button>
      <button type="button" class="btn btn-secondary card-edit" data-id="${item.id}">Edit</button>
      <button type="button" class="btn btn-danger card-delete" data-id="${item.id}">Delete</button>
    </div>
  `;
  card.querySelector('.card-add-to-order').addEventListener('click', () => addToOrderList(item));
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

function updateOrderBadge() {
  const total = orderList.reduce((s, e) => s + e.quantity, 0);
  document.querySelectorAll('.order-badge').forEach((el) => { el.textContent = total; });
}

function openOrderListModal() {
  closeDrawer();
  renderOrderListModal();
  document.getElementById('order-list-modal').setAttribute('aria-hidden', 'false');
}

function closeOrderListModal() {
  document.getElementById('order-list-modal').setAttribute('aria-hidden', 'true');
}

function removeFromOrderList(itemId) {
  orderList = orderList.filter((e) => String(e.id) !== String(itemId));
  updateOrderBadge();
  renderOrderListModal();
  loadItems();
}

function updateOrderQty(itemId, qty) {
  const n = parseInt(qty, 10) || 0;
  const entry = orderList.find((e) => String(e.id) === String(itemId));
  if (!entry) return;
  if (n <= 0) {
    removeFromOrderList(itemId);
    return;
  }
  entry.quantity = n;
  renderOrderListModal();
}

function getOrderListText() {
  const lines = ['Wholesaler order list', '-------------------', ''];
  orderList.forEach((e, i) => {
    lines.push(`${i + 1}. ${e.name} (${e.category_name}) - Qty: ${e.quantity} @ ₹${Number(e.price).toFixed(2)} = ₹${(e.quantity * e.price).toFixed(2)}`);
  });
  const totalQty = orderList.reduce((s, e) => s + e.quantity, 0);
  const totalAmt = orderList.reduce((s, e) => s + e.quantity * e.price, 0);
  lines.push('');
  lines.push(`Total items: ${totalQty}`);
  lines.push(`Total amount: ₹${totalAmt.toFixed(2)}`);
  return lines.join('\n');
}

function renderOrderListModal() {
  const body = document.getElementById('order-list-body');
  const empty = document.getElementById('order-list-empty');
  const footer = document.getElementById('order-list-footer');
  const totalQtyEl = document.getElementById('order-list-total-qty');
  body.innerHTML = '';
  if (orderList.length === 0) {
    empty.hidden = false;
    footer.hidden = true;
    return;
  }
  empty.hidden = true;
  footer.hidden = false;
  const totalQty = orderList.reduce((s, e) => s + e.quantity, 0);
  totalQtyEl.textContent = totalQty;
  orderList.forEach((e) => {
    const row = document.createElement('div');
    row.className = 'order-list-row';
    row.innerHTML = `
      <div class="order-list-row-main">
        <span class="order-list-name">${escapeHtml(e.name)}</span>
        <span class="order-list-meta">${escapeHtml(e.category_name)} · ₹${Number(e.price).toFixed(2)} each</span>
      </div>
      <div class="order-list-row-qty">
        <label class="sr-only" for="order-qty-${e.id}">Quantity</label>
        <input type="number" min="1" value="${e.quantity}" id="order-qty-${e.id}" data-id="${e.id}" class="order-qty-input">
      </div>
      <div class="order-list-row-total">₹${(e.quantity * e.price).toFixed(2)}</div>
      <button type="button" class="btn btn-danger btn-sm order-list-remove" data-id="${e.id}" aria-label="Remove">✕</button>
    `;
    body.appendChild(row);
    row.querySelector('.order-qty-input').addEventListener('change', (ev) => updateOrderQty(ev.target.dataset.id, ev.target.value));
    row.querySelector('.order-list-remove').addEventListener('click', () => removeFromOrderList(e.id));
  });
}

document.getElementById('order-list-clear').addEventListener('click', () => {
  if (!orderList.length) return;
  if (confirm('Clear the whole order list?')) {
    orderList = [];
    updateOrderBadge();
    renderOrderListModal();
    loadItems();
  }
});
document.getElementById('order-list-copy').addEventListener('click', () => {
  const text = getOrderListText();
  navigator.clipboard.writeText(text).then(() => alert('Order list copied to clipboard.')).catch(() => alert('Could not copy. Try Print instead.'));
});
document.getElementById('order-list-print').addEventListener('click', () => {
  const win = window.open('', '_blank');
  win.document.write('<pre style="font-family: sans-serif; padding: 1rem;">' + escapeHtml(getOrderListText()) + '</pre>');
  win.document.close();
  win.print();
  win.close();
});

document.querySelectorAll('.open-order-list').forEach((btn) => {
  btn.addEventListener('click', () => { openOrderListModal(); });
});

document.querySelector('.nav-categories .pill[data-category-id=""]').addEventListener('click', () => setFilter(''));
document.querySelector('.drawer-pills .pill[data-category-id=""]')?.addEventListener('click', () => { setFilter(''); closeDrawer(); });

function openDrawer() {
  drawer.setAttribute('aria-hidden', 'false');
  drawerBackdrop.setAttribute('aria-hidden', 'false');
  hamburger.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
}
function closeDrawer() {
  drawer.setAttribute('aria-hidden', 'true');
  drawerBackdrop.setAttribute('aria-hidden', 'true');
  hamburger.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}

hamburger.addEventListener('click', () => {
  const open = drawer.getAttribute('aria-hidden') !== 'false';
  if (open) openDrawer(); else closeDrawer();
});
drawerBackdrop.addEventListener('click', closeDrawer);
drawerClose.addEventListener('click', closeDrawer);

document.querySelectorAll('.open-category-form').forEach((btn) => {
  btn.addEventListener('click', () => { closeDrawer(); openCategoryForm(null); });
});
document.querySelectorAll('.open-item-form').forEach((btn) => {
  btn.addEventListener('click', () => { closeDrawer(); openItemForm(null); });
});

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

document.getElementById('order-list-modal').querySelectorAll('.modal-backdrop, [data-close]').forEach((el) => {
  el.addEventListener('click', () => closeOrderListModal());
});

loadCategories().then(() => loadItems());
