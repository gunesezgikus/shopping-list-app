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

// "I bought all items" butonu: checklist'i previous lists'e ekle ve sıfırla
btnBoughtAll.onclick = async () => {
    // Checklist'i backend'den çek
    const res = await fetch('/checklist');
    const checklistToSave = await res.json();

    if (!checklistToSave.length) {
        checklistContent.innerHTML = '<p>Your checklist is now empty.</p>';
        btnBoughtAll.style.display = 'none';
        return;
    }

    // Previous lists'e tekrar ekle
    await fetch('/save-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: checklistToSave })
    });

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

// Ürün kataloğu fonksiyonları (örnek, kendi kodunuza göre uyarlayın)
function showProductCatalogView() {
    // Ürün kataloğu gösterme kodunuz buraya gelecek
}

// ...dosyanın sonunda, diğer kodlardan sonra ekleyin...

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