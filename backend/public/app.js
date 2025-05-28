// DOM elementleri
const homeSection = document.getElementById('home-section');
const shoppingListSection = document.getElementById('shopping-list-section');
const productCatalogSection = document.getElementById('product-catalog-section');
const oldListsSection = document.getElementById('old-lists-section');
const checklistSection = document.getElementById('checklist-section');

const btnCreateList = document.getElementById('btn-create-list');
const btnProductsList = document.getElementById('btn-products-list');
const btnContinue = document.getElementById('btn-continue');
const btnShowOldLists = document.getElementById('btn-show-old-lists');
const btnBackHome = document.getElementById('btn-back-home');
const btnBackProducts = document.getElementById('btn-back-products');
const btnBackHomeFromOld = document.getElementById('btn-back-home-from-old');
const btnBackHomeFromChecklist = document.getElementById('btn-back-home-from-checklist');
const navProducts = document.getElementById('nav-products');
const btnBoughtAll = document.getElementById('btn-bought-all');

const addItemForm = document.getElementById('add-item-form');
const itemNameInput = document.getElementById('item-name');
const itemQuantityInput = document.getElementById('item-quantity');
const itemUnitInput = document.getElementById('item-unit');
const listEl = document.getElementById('shopping-list');
const checklistContent = document.getElementById('checklist-content');
const oldListsContent = document.getElementById('old-lists-content');
const navbarToggle = document.getElementById('navbar-toggle');
const navbarLinks = document.getElementById('navbar-links');

if (navbarToggle && navbarLinks) {
  navbarToggle.addEventListener('click', function () {
    navbarLinks.classList.toggle('show');
  });

  // Menü dışına tıklayınca kapansın
  document.addEventListener('click', function (e) {
    if (
      window.innerWidth <= 770 &&
      !navbarLinks.contains(e.target) &&
      !navbarToggle.contains(e.target)
    ) {
      navbarLinks.classList.remove('show');
    }
  });
}

// Yardımcı fonksiyonlar
function capitalizeFirst(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Alışveriş listesi verilerini fetch et
async function fetchItems() {
  const res = await fetch('/items');
  return await res.json();
}

// Ürün sil
async function deleteItem(id) {
  await fetch(`/items/${id}`, { method: 'DELETE' });
}

// Alışveriş listesini ekranda göster (checkbox yok!)
function renderList(items) {
  listEl.innerHTML = '';
  if (items.length === 0) {
    const emptyMsg = document.createElement('p');
    emptyMsg.textContent = "Your shopping list is empty. You can add products.";
    emptyMsg.classList.add('empty-message');
    listEl.appendChild(emptyMsg);
    return;
  }
  items.forEach(item => {
    const li = document.createElement('li');
    li.setAttribute('data-id', item.id);

    // Checkbox YOK

    // Ürün adı ve birimi ayrıştır
    let name = item.name;
    let unit = '';
    const match = name.match(/^(.*)\s\((.+)\)$/);
    if (match) {
      name = match[1];
      unit = match[2];
    }

    // Sol: ürün adı
    const label = document.createElement('label');
    label.textContent = name;

    // Sağ: miktar ve birim
    const qtyDiv = document.createElement('span');
    qtyDiv.style.marginLeft = "12px";
    qtyDiv.style.fontWeight = "bold";
    qtyDiv.style.minWidth = "60px";
    qtyDiv.style.display = "inline-block";
    qtyDiv.textContent = unit ? `${item.quantity} ${unit}` : `${item.quantity}`;

    // Sil butonu
    const deleteBtn = document.createElement('button');
    deleteBtn.classList.add('delete-btn');
    deleteBtn.setAttribute('aria-label', 'Delete ' + item.name);
    deleteBtn.innerHTML = '&times;';
    deleteBtn.addEventListener('click', async () => {
      await deleteItem(item.id);
      const updatedItems = await fetchItems();
      renderList(updatedItems);
    });

    // Satırı hizala
    const leftDiv = document.createElement('div');
    leftDiv.style.display = "flex";
    leftDiv.style.alignItems = "center";
    leftDiv.appendChild(label);

    const rightDiv = document.createElement('div');
    rightDiv.style.display = "flex";
    rightDiv.style.alignItems = "center";
    rightDiv.appendChild(qtyDiv);
    rightDiv.appendChild(deleteBtn);

    li.style.display = "flex";
    li.style.justifyContent = "space-between";
    li.style.alignItems = "center";

    li.appendChild(leftDiv);
    li.appendChild(rightDiv);

    listEl.appendChild(li);
  });
}

// Ürün ekleme formu
addItemForm.onsubmit = async (e) => {
  e.preventDefault();
  const name = itemNameInput.value.trim();
  const quantity = parseInt(itemQuantityInput.value, 10) || 1;
  const unit = itemUnitInput.value;
  if (!name) return;

  const item = {
    name: unit ? `${capitalizeFirst(name)} (${unit})` : capitalizeFirst(name),
    quantity
  };

  await fetch('/items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item)
  });

  itemNameInput.value = '';
  itemQuantityInput.value = 1;
  itemUnitInput.value = '';

  const items = await fetchItems();
  renderList(items);
};

// "Create New Shopping List" butonu
btnCreateList.onclick = async () => {
  showSection(shoppingListSection);
  homeSection.style.display = 'none';
  shoppingListSection.style.display = 'block';
  productCatalogSection.style.display = 'none';
  oldListsSection.style.display = 'none';
  checklistSection.style.display = 'none';
  const items = await fetchItems();
  renderList(items);
};

// CONTINUE butonu: alışveriş listesini checklist'e kaydet ve sıfırla
btnContinue.onclick = async () => {
  const items = await fetchItems();
  if (!items.length) {
    alert('There is nothing to continue!');
    return;
  }

  // Previous lists'e kaydet
  await fetch('/save-list', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items })
  });

  // Checklist'i backend'e kaydet
  await fetch('/checklist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items })
  });

  // Alışveriş listesini sıfırla
  await fetch('/items', { method: 'DELETE' });

  shoppingListSection.style.display = 'none';
  checklistSection.style.display = 'block';
  btnBoughtAll.style.display = 'inline-block';

  // Checklist içeriğini güncelle (backend'den çek)
  const res = await fetch('/checklist');
  const checklistToShow = await res.json();

  if (!checklistToShow.length) {
    checklistContent.innerHTML = '<p>Your checklist is now empty.</p>';
    btnBoughtAll.style.display = 'none';
    return;
  }

  checklistContent.innerHTML = `
      <div class="card mb-3">
        <div class="card-header">
          <span class="fw-bold text-dark" style="font-size:1.1rem;">
            ${new Date().toLocaleString()}
          </span>
        </div>
        <ul class="list-group list-group-flush">
          ${checklistToShow.map(item => `
            <li class="list-group-item">
              <input type="checkbox" class="form-check-input me-2" />
              <span>${item.name} - ${item.quantity}</span>
            </li>
          `).join('')}
        </ul>
      </div>
    `;
};

// "Checklist" butonu: checklist'i backend'den oku ve göster
btnProductsList.onclick = async () => {
  showSection(checklistSection);
  homeSection.style.display = 'none';
  shoppingListSection.style.display = 'none';
  productCatalogSection.style.display = 'none';
  oldListsSection.style.display = 'none';
  checklistSection.style.display = 'block';

  btnBoughtAll.style.display = 'inline-block';

  // Checklist'i backend'den çek
  const res = await fetch('/checklist');
  const checklistToShow = await res.json();

  if (!checklistToShow.length) {
    checklistContent.innerHTML = '<p>Your checklist is now empty.</p>';
    btnBoughtAll.style.display = 'none';
    return;
  }

  checklistContent.innerHTML = `
      <div class="card mb-3">
        <div class="card-header">
          <span class="fw-bold text-dark" style="font-size:1.1rem;">
            ${new Date().toLocaleString()}
          </span>
        </div>
        <ul class="list-group list-group-flush">
          ${checklistToShow.map(item => `
            <li class="list-group-item">
              <input type="checkbox" class="form-check-input me-2" />
              <span>${item.name} - ${item.quantity}</span>
            </li>
          `).join('')}
        </ul>
      </div>
    `;
};

// "I bought all items" butonu: checklist'i sadece sıfırla (previous lists'e tekrar ekleme YOK)
btnBoughtAll.onclick = async () => {
  // Checklist'i backend'den çek
  const res = await fetch('/checklist');
  const checklistToSave = await res.json();

  if (!checklistToSave.length) {
    checklistContent.innerHTML = '<p>Your checklist is now empty.</p>';
    btnBoughtAll.style.display = 'none';
    return;
  }

  // Checklist'i backend'de sıfırla
  await fetch('/checklist', { method: 'DELETE' });

  // Checklist ekranını temizle
  checklistContent.innerHTML = '<p>Your checklist is now empty.</p>';
  btnBoughtAll.style.display = 'none';
};

// Checklist ekranından ana sayfaya dönüş
btnBackHomeFromChecklist.onclick = () => {
  checklistSection.style.display = 'none';
  homeSection.style.display = 'block';
};

// "Show Previous Lists" butonu
btnShowOldLists.onclick = async () => {
  showSection(oldListsSection);
  homeSection.style.display = 'none';
  shoppingListSection.style.display = 'none';
  productCatalogSection.style.display = 'none';
  checklistSection.style.display = 'none';
  oldListsSection.style.display = 'block';

  // Eski listeleri getir
  const res = await fetch('/old-lists');
  let lists = await res.json();

  // En yeni en üstte olacak şekilde ters çevir
  lists = lists.reverse();

  if (!lists.length) {
    oldListsContent.innerHTML = '<p>No previous lists found.</p>';
    return;
  }

  oldListsContent.innerHTML = lists.map(list => `
      <div class="card mb-3">
        <div class="card-header">
          <span class="fw-bold text-dark" style="font-size:1.1rem;">
            ${new Date(list.date).toLocaleString()}
          </span>
        </div>
        <ul class="list-group list-group-flush">
          ${list.items.map(item => `<li class="list-group-item">${item.name} - ${item.quantity}</li>`).join('')}
        </ul>
      </div>
    `).join('');
};

// Previous Lists ekranından ana sayfaya dönüş
btnBackHomeFromOld.onclick = () => {
  showSection(homeSection);
  oldListsSection.style.display = 'none';
  homeSection.style.display = 'block';
};

// "Products" butonuna tıklayınca ürün kataloğu açılır
navProducts.onclick = (e) => {
  e.preventDefault();
  shoppingListSection.style.display = 'none';
  productCatalogSection.style.display = 'block';
  oldListsSection.style.display = 'none';
  checklistSection.style.display = 'none';
  showProductCatalogView();
};

// Products ekranında geri tuşu ile alışveriş listesine dön
btnBackProducts.onclick = () => {
  productCatalogSection.style.display = 'none';
  shoppingListSection.style.display = 'block';
  fetchItems().then(renderList);
};

// "Back" butonu ile ana sayfaya dönüş
btnBackHome.onclick = () => {
  showSection(homeSection);
  shoppingListSection.style.display = 'none';
  homeSection.style.display = 'block';
};

// Ürün kataloğu fonksiyonları
async function showProductCatalogView() {
  const categoriesDiv = document.querySelector('.categories');
  const productsListDiv = document.querySelector('.products-list');
  categoriesDiv.innerHTML = '';
  productsListDiv.innerHTML = 'Loading...';

  // Ürünleri backend'den çek
  const res = await fetch('/products');
  const products = await res.json();

  if (!products.length) {
    productsListDiv.innerHTML = '<p>No products found.</p>';
    return;
  }

  // Kategorileri bul
  const categories = [...new Set(products.map(p => p.category || 'Other'))];

  // Kategori butonları
  categoriesDiv.innerHTML = categories.map(cat =>
    `<button class="btn modern-btn btn-sm m-1" data-cat="${cat}">${cat}</button>`
  ).join('');

  // Varsayılan olarak ilk kategoriyi göster
  let currentCategory = categories[0];
  renderProducts(currentCategory);

  // Kategori butonlarına tıklama
  categoriesDiv.querySelectorAll('button').forEach(btn => {
    btn.onclick = () => {
      currentCategory = btn.getAttribute('data-cat');
      renderProducts(currentCategory);
    };
  });

  function renderProducts(category) {
    const filtered = products.filter(p => (p.category || 'Other') === category);
    productsListDiv.innerHTML = filtered.map((p, idx) =>
      `<div class="product-card">
         <span class="product-name">${p.name}</span>
         <span class="product-actions">
           <input type="number" min="1" value="1" class="form-control form-control-sm product-qty-input"
             id="qty-${idx}">
           <select class="form-select form-select-sm product-unit-select"
             id="unit-${idx}">
             <option value="">Unit</option>
             <option value="g">g</option>
             <option value="kg">kg</option>
             <option value="ml">ml</option>
             <option value="l">l</option>
             <option value="piece">piece</option>
             <option value="pack">pack</option>
             <option value="can">can</option>
             <option value="bottle">bottle</option>
             <option value="box">box</option>
             <option value="jar">jar</option>
             <option value="bag">bag</option>
             <option value="dozen">dozen</option>
           </select>
           <button class="btn modern-btn btn-sm add-product-btn"
             data-name="${p.name}" data-unit="${p.unit || ''}" data-idx="${idx}">Ekle</button>
         </span>
       </div>`
    ).join('');

    // Ekle butonlarına tıklama
    document.querySelectorAll('.add-product-btn').forEach(btn => {
      btn.onclick = function () {
        const idx = btn.getAttribute('data-idx');
        const name = btn.getAttribute('data-name');
        const qty = parseInt(document.getElementById(`qty-${idx}`).value, 10) || 1;
        const unitSelect = document.getElementById(`unit-${idx}`);
        const unit = unitSelect.value || btn.getAttribute('data-unit') || '';
        addItemToList({ name, quantity: qty, unit });
      };
    });
  }
}

function addItemToList({ name, quantity, unit }) {
  fetch('/items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, quantity, unit })
  })
  .then(res => res.json())
  .then(async () => {
    // Alışveriş listesi görünümüne geç ve listeyi güncelle
    showSection(shoppingListSection);
    const items = await fetchItems();
    renderList(items);
  });
}

// Bölüm (section) gösterme fonksiyonu
function showSection(section) {
  homeSection.style.display = 'none';
  shoppingListSection.style.display = 'none';
  productCatalogSection.style.display = 'none';
  oldListsSection.style.display = 'none';
  checklistSection.style.display = 'none';
  section.style.display = 'block';
  localStorage.setItem('lastSection', section.id);
}

// Sayfa ilk yüklendiğinde son açık sekmeyi göster
window.addEventListener('DOMContentLoaded', async () => {
  const last = localStorage.getItem('lastSection');
  if (last && document.getElementById(last)) {
    showSection(document.getElementById(last));
    // Eğer alışveriş listesi sekmesi ise, listeyi çek ve göster
    if (last === 'shopping-list-section') {
      const items = await fetchItems();
      renderList(items);
    }
  } else {
    showSection(homeSection);
  }
});

const appTitle = document.getElementById('app-title');
if (appTitle) {
  appTitle.addEventListener('click', () => {
    showSection(homeSection);
    homeSection.style.display = 'block';
    shoppingListSection.style.display = 'none';
    productCatalogSection.style.display = 'none';
    oldListsSection.style.display = 'none';
    checklistSection.style.display = 'none';
  });
}
document.getElementById('btn-contact').addEventListener('click', function (e) {
  e.preventDefault();
  document.getElementById('contactModal').style.display = 'flex';
});
document.getElementById('closeContactModal').onclick = function () {
  document.getElementById('contactModal').style.display = 'none';
};

document.getElementById('contactForm').onsubmit = async function (e) {
  e.preventDefault();
  const email = document.getElementById('contactEmail').value;
  const message = document.getElementById('contactMessage').value;
  const resultDiv = document.getElementById('contactResult');
  resultDiv.textContent = "Sending...";
  try {
    const res = await fetch('/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, message })
    });
    if (res.ok) {
      resultDiv.textContent = "Your message has been sent!";
      this.reset();
    } else {
      resultDiv.textContent = "An error occurred. Please try again.";
    }
  } catch {
    resultDiv.textContent = "An error occurred. Please try again.";
  }
};