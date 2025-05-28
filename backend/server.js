const cors = require('cors');
const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(cors());

// Veri dosyası yolları
const DATA_FILE = path.join(__dirname, 'items.json');
const PRODUCTS_FILE = path.join(__dirname, 'public', 'products.json');
const OLD_LISTS_FILE = path.join(__dirname, 'old-lists.json');
const CHECKLIST_FILE = path.join(__dirname, 'checklist.json');

// Checklist dosyası yardımcı fonksiyonları
function readChecklist() {
  try {
    if (!fs.existsSync(CHECKLIST_FILE)) {
      fs.writeFileSync(CHECKLIST_FILE, JSON.stringify([]));
    }
    const data = fs.readFileSync(CHECKLIST_FILE);
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading checklist file:', err);
    return [];
  }
}
function writeChecklist(data) {
  try {
    fs.writeFileSync(CHECKLIST_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error writing checklist file:', err);
  }
}

// Checklist endpointleri
app.get('/checklist', (req, res) => {
  res.json(readChecklist());
});
app.post('/checklist', (req, res) => {
  const items = req.body.items || [];
  writeChecklist(items);
  res.json({ message: 'Checklist updated' });
});
app.delete('/checklist', (req, res) => {
  writeChecklist([]);
  res.json({ message: 'Checklist cleared' });
});

// Eski kodlarınız:
function readOldLists() {
  try {
    if (!fs.existsSync(OLD_LISTS_FILE)) {
      fs.writeFileSync(OLD_LISTS_FILE, JSON.stringify([]));
    }
    const data = fs.readFileSync(OLD_LISTS_FILE);
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading old lists file:', err);
    return [];
  }
}
function writeOldLists(data) {
  try {
    fs.writeFileSync(OLD_LISTS_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error writing old lists file:', err);
  }
}

// POST /save-list - mevcut alışveriş listesini kaydet
app.post('/save-list', (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'No items to save' });
  }
  const oldLists = readOldLists();
  oldLists.push({
    id: Date.now().toString(),
    date: new Date().toISOString(),
    items
  });
  writeOldLists(oldLists);
  res.json({ success: true });
});

// Dosyadan veri okuma (Alışveriş listesi)
function readData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify([]));
    }
    const data = fs.readFileSync(DATA_FILE);
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading data file:', err);
    return [];
  }
}

// Veri dosyasına yazma (Alışveriş listesi)
function writeData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error writing data file:', err);
  }
}

// Ürün dosyasından veri okuma (Ürün kataloğu)
function readProducts() {
  try {
    if (!fs.existsSync(PRODUCTS_FILE)) {
      fs.writeFileSync(PRODUCTS_FILE, JSON.stringify([]));
    }
    const data = fs.readFileSync(PRODUCTS_FILE);
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading products file:', err);
    return [];
  }
}

// Ürün dosyasına yazma (isteğe bağlı)
function writeProducts(data) {
  try {
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error writing products file:', err);
  }
}

// GET /items - alışveriş listesi ürünlerini getir
app.get('/items', (req, res) => {
  const items = readData();
  res.json(items);
});

// POST /items - yeni ürün ekle
app.post('/items', (req, res) => {
  const items = readData();
  const { name, quantity } = req.body;

  if (!name || typeof quantity !== 'number' || quantity < 1) {
    return res.status(400).json({ error: 'Geçersiz ürün verisi' });
  }

  const newItem = {
    id: Date.now().toString(),
    name,
    quantity,
    checked: false,
  };

  items.push(newItem);
  writeData(items);
  res.status(201).json(newItem);
});

// PUT /items/:id - ürün güncelle
app.put('/items/:id', (req, res) => {
  const items = readData();
  const itemId = req.params.id;
  const { name, quantity, checked } = req.body;

  const index = items.findIndex(i => i.id === itemId);
  if (index === -1) {
    return res.status(404).json({ error: 'Ürün bulunamadı' });
  }
  if (name !== undefined) items[index].name = name;
  if (quantity !== undefined) items[index].quantity = quantity;
  if (checked !== undefined) items[index].checked = checked;

  writeData(items);
  res.json(items[index]);
});

// DELETE /items/:id - ürün sil
app.delete('/items/:id', (req, res) => {
  let items = readData();
  const itemId = req.params.id;
  const initialLength = items.length;
  items = items.filter(i => i.id !== itemId);

  if (items.length === initialLength) {
    return res.status(404).json({ error: 'Ürün bulunamadı' });
  }

  writeData(items);
  res.json({ message: 'Ürün silindi' });
});

// DELETE /items - tüm alışveriş listesini sil
app.delete('/items', (req, res) => {
  writeData([]);
  res.json({ message: 'Tüm alışveriş listesi silindi' });
});

// GET /products - ürün kataloğunu getir
app.get('/products', (req, res) => {
  const products = readProducts();
  res.json(products);
});

app.get('/old-lists', (req, res) => {
  const oldLists = readOldLists();
  res.json(oldLists);
});

app.listen(PORT, () => {
  console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor`);
});