// ============ PWA ============
let deferredPrompt;
const pwaInstallBanner = document.getElementById('pwaInstallBanner');
const pwaInstallBtn = document.getElementById('pwaInstallBtn');
const pwaDismissBtn = document.getElementById('pwaDismissBtn');

// SVG Fallback للشعار
const logoFallbackSVG = `<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><defs><linearGradient id='logoGrad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'><stop offset='0%25' style='stop-color:#3b82f6;stop-opacity:1' /><stop offset='100%25' style='stop-color:#06b6d4;stop-opacity:1' /></linearGradient></defs><rect width='100' height='100' rx='22' fill='url(#logoGrad)'/><text x='50' y='62' font-family='Arial, sans-serif' font-size='38' font-weight='bold' fill='white' text-anchor='middle'>FA</text><circle cx='28' cy='28' r='6' fill='white' opacity='0.3'/><circle cx='72' cy='72' r='6' fill='white' opacity='0.3'/><line x1='30' y1='50' x2='70' y2='50' stroke='white' stroke-width='3' stroke-linecap='round' opacity='0.6'/></svg>`;

const logoFallbackSVGSmall = `<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><defs><linearGradient id='logoGrad2' x1='0%25' y1='0%25' x2='100%25' y2='100%25'><stop offset='0%25' style='stop-color:#3b82f6;stop-opacity:1' /><stop offset='100%25' style='stop-color:#06b6d4;stop-opacity:1' /></linearGradient></defs><rect width='100' height='100' rx='18' fill='url(#logoGrad2)'/><text x='50' y='60' font-family='Arial, sans-serif' font-size='36' font-weight='bold' fill='white' text-anchor='middle'>FA</text></svg>`;

// تسجيل Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').then(registration => {
            console.log('SW registered:', registration.scope);
        }).catch(err => {
            console.log('SW registration failed:', err);
        });
    });
}

// الاستماع لحدث beforeinstallprompt
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    setTimeout(() => {
        if (deferredPrompt && !isAppInstalled()) {
            pwaInstallBanner.classList.add('active');
        }
    }, 3000);
});

// التحقق مما إذا كان التطبيق مثبتاً بالفعل
function isAppInstalled() {
    return window.matchMedia('(display-mode: standalone)').matches || 
           window.navigator.standalone === true;
}

// تثبيت التطبيق
pwaInstallBtn.addEventListener('click', async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response: ${outcome}`);
        deferredPrompt = null;
        pwaInstallBanner.classList.remove('active');
    } else {
        showInstallInstructions();
    }
});

// إغلاق راية التثبيت
pwaDismissBtn.addEventListener('click', () => {
    pwaInstallBanner.classList.remove('active');
    localStorage.setItem('pwaBannerDismissed', Date.now());
});

// إظهار تعليمات التثبيت
function showInstallInstructions() {
    const isIOS = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
    const isAndroid = /android/.test(window.navigator.userAgent.toLowerCase());
    let message = '';
    if (isIOS) {
        message = '📱 لتثبيت التطبيق: اضغط على زر المشاركة 📤 ثم "إضافة إلى الشاشة الرئيسية"';
    } else if (isAndroid) {
        message = '📱 لتثبيت التطبيق: اضغط على ⁝ في المتصفح ثم "تثبيت التطبيق" أو "إضافة إلى الشاشة الرئيسية"';
    } else {
        message = '📱 لتثبيت التطبيق: استخدم خيار "تثبيت" أو "إضافة إلى الشاشة الرئيسية" في متصفحك';
    }
    showNotification(message, 'info');
}

// ============ STATE ============
let clients = {};
let employees = {};
let suppliers = {};
let debtors = {};
let others = {};
let invoices = [];
let currentUser = null;
let isDarkMode = true;
let currentEntityType = null;
let currentEntityName = null;
let voucherType = 'credit';
let invoiceCurrency = 'ر.س';
let invoiceCounter = 1000;
let databases = [];
let activeDatabaseId = 'default';
let storageModeNoticeShown = false;

// ============ ACTIONS MENU ============
function toggleActionsMenu(event, type) {
    event.stopPropagation();
    const menu = document.getElementById(type + 'ActionsMenu');
    const btn = document.getElementById(type + 'ActionsToggle');
    
    document.querySelectorAll('.actions-horizontal-menu').forEach(m => {
        if (m !== menu) m.classList.remove('active');
    });
    document.querySelectorAll('.actions-toggle-btn').forEach(b => {
        if (b !== btn) b.classList.remove('active');
    });
    
    menu.classList.toggle('active');
    btn.classList.toggle('active');
}

function closeAllActionsMenus() {
    document.querySelectorAll('.actions-horizontal-menu').forEach(m => m.classList.remove('active'));
    document.querySelectorAll('.actions-toggle-btn').forEach(b => b.classList.remove('active'));
}

// ============ SIDEBAR ============
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('active');
    document.getElementById('sidebarOverlay').classList.toggle('active');
}

function closeSidebar() {
    document.getElementById('sidebar').classList.remove('active');
    document.getElementById('sidebarOverlay').classList.remove('active');
}

function navigateFromSidebar(page) {
    closeSidebar();
    showPage(page);
}

// ============ INIT ============
document.addEventListener('DOMContentLoaded', () => {
    updateDateTime();
    setInterval(updateDateTime, 60000);
    loadData();
    initTheme();
    checkLoginStatus();
    
    document.getElementById('loginForm').addEventListener('submit', login);
    document.getElementById('registerForm').addEventListener('submit', register);
    document.getElementById('entityForm').addEventListener('submit', addEntity);
    document.getElementById('themeToggleTop').addEventListener('click', toggleTheme);
    document.getElementById('searchInput').addEventListener('input', searchData);
    document.addEventListener('click', handleOutsideClick);
    initInvoicePage();
    
    // إعادة إظهار راية التثبيت إذا لم يتم تثبيت التطبيق بعد
    const dismissed = localStorage.getItem('pwaBannerDismissed');
    if (!isAppInstalled() && deferredPrompt && (!dismissed || Date.now() - dismissed > 7 * 24 * 60 * 60 * 1000)) {
        setTimeout(() => {
            if (deferredPrompt) pwaInstallBanner.classList.add('active');
        }, 5000);
    }
});

function updateDateTime() {
    const now = new Date();
    document.getElementById('currentDate').innerText = now.toLocaleDateString('ar-SA', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    document.getElementById('currentTime').innerText = now.toLocaleTimeString('ar-SA', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
}

function initTheme() {
    localStorage.getItem('theme') === 'light' ? enableLightMode() : enableDarkMode();
}

function enableDarkMode() {
    document.body.classList.remove('light-theme');
    document.getElementById('themeIconTop').className = 'icon icon-sun';
    isDarkMode = true;
    localStorage.setItem('theme', 'dark');
    document.querySelector('meta[name="theme-color"]').setAttribute('content', '#0a0a1a');
}

function enableLightMode() {
    document.body.classList.add('light-theme');
    document.getElementById('themeIconTop').className = 'icon icon-moon';
    isDarkMode = false;
    localStorage.setItem('theme', 'light');
    document.querySelector('meta[name="theme-color"]').setAttribute('content', '#f0f4ff');
}

function toggleTheme() {
    isDarkMode ? enableLightMode() : enableDarkMode();
}

function loadData() {
    try {
        initDatabases();
        
        const dbDataKey = `db_data_${activeDatabaseId}`;
        const dbDataRaw = localStorage.getItem(dbDataKey);
        
        if (dbDataRaw) {
            const data = JSON.parse(dbDataRaw);
            clients = data.clients || {};
            employees = data.employees || {};
            suppliers = data.suppliers || {};
            debtors = data.debtors || {};
            others = data.others || {};
            invoices = data.invoices || [];
            invoiceCounter = data.invoiceCounter || 1000;
        } else {
            resetData();
        }
        
        updateActiveDbSelectorUI();
    } catch (e) {
        resetData();
    }
}

function resetData() {
    clients = {};
    employees = {};
    suppliers = {};
    debtors = {};
    others = {};
    invoices = [];
    invoiceCounter = 1000;
}

function saveData() {
    try {
        const dbDataKey = `db_data_${activeDatabaseId}`;
        const data = {
            clients,
            employees,
            suppliers,
            debtors,
            others,
            invoices,
            invoiceCounter
        };
        localStorage.setItem(dbDataKey, JSON.stringify(data));
        localStorage.setItem('saved_databases', JSON.stringify(databases));
        localStorage.setItem('active_database_id', activeDatabaseId);
    } catch (e) {
        console.error("Failed to save database:", e);
    }
}

function getEntityStore(type) {
    if (type === 'client') return clients;
    if (type === 'supplier') return suppliers;
    if (type === 'debtor') return debtors;
    if (type === 'employee') return employees;
    if (type === 'other') return others;
    return null;
}

function checkLoginStatus() {
    localStorage.getItem('currentUser') ? 
        (currentUser = JSON.parse(localStorage.getItem('currentUser')), showMainApp()) : 
        showLoginScreen();
}

function showLoginScreen() {
    document.getElementById('login-page').style.display = 'flex';
    document.getElementById('main-app').style.display = 'none';
}

function showMainApp() {
    document.getElementById('login-page').style.display = 'none';
    document.getElementById('main-app').style.display = 'block';
    updateStats();
    renderAllLists();
}

function login(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    if (!email) return showNotification('أدخل البريد', 'error');
    currentUser = { email, name: email.split('@')[0] };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    showMainApp();
    showNotification('تم الدخول 🎉', 'success');
}

function register(e) {
    e.preventDefault();
    const pwd = document.getElementById('registerPassword').value;
    if (pwd !== document.getElementById('registerConfirmPassword').value) {
        return showNotification('كلمة المرور غير متطابقة', 'error');
    }
    currentUser = {
        name: document.getElementById('registerName').value,
        email: document.getElementById('registerEmail').value
    };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    closeModal('registerModal');
    showMainApp();
    showNotification('تم إنشاء الحساب ✅', 'success');
}

function loginWithGoogle() {
    currentUser = { name: 'مستخدم جوجل', type: 'google' };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    showMainApp();
}

function loginAsGuest() {
    currentUser = { name: 'ضيف', type: 'guest' };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    showMainApp();
}

function logout() {
    if (confirm('تسجيل الخروج؟')) {
        localStorage.removeItem('currentUser');
        showLoginScreen();
    }
}

// ============ NAVIGATION ============
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const targetPage = document.getElementById(pageId + '-page');
    if (targetPage) targetPage.classList.add('active');
    
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    if (pageId === 'home') {
        document.querySelector('.bottom-nav>.nav-item:first-child').classList.add('active');
    } else if (pageId === 'settings') {
        document.querySelector('.bottom-nav>.nav-item:last-child').classList.add('active');
    }

    const fabContainer = document.getElementById('fabContainer');
    const entityFab = document.getElementById('entityFabContainer');
    const fabInvoiceInPage = document.getElementById('fabInvoiceInPage');
    const isRecordPage = ['client-records', 'supplier-records', 'debtor-records', 'employee-records', 'other-records'].includes(pageId);
    const isListPage = ['clients', 'suppliers', 'debts', 'employees', 'others'].includes(pageId);
    const isInvoicesPage = pageId === 'invoices';

    fabContainer.style.display = isRecordPage ? 'block' : 'none';
    if (!isRecordPage) document.getElementById('voucherPopover').classList.remove('active');
    entityFab.style.display = isListPage ? 'block' : 'none';
    if (!isListPage) closeEntityAddPopover();
    fabInvoiceInPage.style.display = isInvoicesPage ? 'block' : 'none';

    closeAllActionsMenus();

    if (pageId === 'clients') { currentEntityType = 'client'; renderEntityList('client'); }
    else if (pageId === 'suppliers') { currentEntityType = 'supplier'; renderEntityList('supplier'); }
    else if (pageId === 'debts') { currentEntityType = 'debtor'; renderEntityList('debtor'); }
    else if (pageId === 'employees') { currentEntityType = 'employee'; renderEntityList('employee'); }
    else if (pageId === 'others') { currentEntityType = 'other'; renderEntityList('other'); }
    else if (pageId === 'client-records') { currentEntityType = 'client'; renderEntityRecords(); }
    else if (pageId === 'supplier-records') { currentEntityType = 'supplier'; renderEntityRecords(); }
    else if (pageId === 'debtor-records') { currentEntityType = 'debtor'; renderEntityRecords(); }
    else if (pageId === 'employee-records') { currentEntityType = 'employee'; renderEntityRecords(); }
    else if (pageId === 'other-records') { currentEntityType = 'other'; renderEntityRecords(); }
    else if (pageId === 'invoice') initInvoicePage();
    else if (pageId === 'invoices') renderInvoicesList();
    else if (pageId === 'home') updateStats();

    window.scrollTo({ top: 0, behavior: 'smooth' });
    closeNavSemiMenu();
    closeSidebar();
}

function openEntityRecords(entityName, type) {
    currentEntityType = type;
    currentEntityName = entityName;
    const titles = {
        client: 'سجل العميل',
        supplier: 'سجل المورد',
        debtor: 'سجل الدين',
        employee: 'سجل الموظف',
        other: 'سجل أخرى'
    };
    document.getElementById(type + 'RecordsTitle').innerText = `${titles[type]}: ${entityName}`;
    showPage(type + '-records');
}

// ============ INVOICE FUNCTIONS ============
function initInvoicePage() {
    invoiceCounter++;
    const invNum = '#' + invoiceCounter;
    document.querySelector('.print-footer-invoice .editable').textContent = invNum;
    document.getElementById('invPaymentType').value = 'cash';
    toggleInvoicePayment();
    updateInvoiceDateTime();
    populateClientSelect();
    document.getElementById('invClientSelect').addEventListener('change', onClientSelectChange);
    document.getElementById('invTbody').innerHTML = `
        <tr>
            <td class="col-item-inv" contenteditable="true" data-placeholder="اسم الصنف..."></td>
            <td><input type="number" class="invQty" value="1" min="0" step="any" oninput="calcInvoice()"></td>
            <td><input type="number" class="invPrice" value="0" min="0" step="any" oninput="calcInvoice()"></td>
            <td class="invRowTotal">0.00</td>
            <td class="no-print"><button class="btn-del-inv" onclick="this.closest('tr').remove(); calcInvoice()">✕</button></td>
        </tr>`;
    document.getElementById('invPaid').value = 0;
    document.getElementById('invCurrency').value = 'ر.س';
    invoiceCurrency = 'ر.س';
    document.querySelectorAll('.invCur').forEach(el => el.textContent = 'ر.س');
    calcInvoice();
}

function populateClientSelect() {
    const select = document.getElementById('invClientSelect');
    select.innerHTML = '<option value="">-- اختر عميلاً --</option>';
    Object.keys(clients).forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        select.appendChild(option);
    });
}

function onClientSelectChange() {
    const selectedClient = document.getElementById('invClientSelect').value;
    const phoneSpan = document.getElementById('invClientPhone');
    if (selectedClient && clients[selectedClient]) {
        phoneSpan.textContent = clients[selectedClient].phone || '---';
    } else {
        phoneSpan.textContent = '---';
    }
}

function updateInvoiceCurrency() {
    invoiceCurrency = document.getElementById('invCurrency').value;
    document.querySelectorAll('.invCur').forEach(el => el.textContent = invoiceCurrency);
    calcInvoice();
}

function toggleInvoicePayment() {
    const isCredit = document.getElementById('invPaymentType').value === 'credit';
    document.getElementById('invCreditSection').style.display = isCredit ? 'block' : 'none';
    document.getElementById('invCashSection').style.display = isCredit ? 'none' : 'block';
    if (isCredit) populateClientSelect();
}

function updateInvoiceDateTime() {
    const now = new Date();
    document.getElementById('invMDate').innerText = now.toLocaleDateString('en-GB').replace(/\//g, '/');
    try {
        document.getElementById('invHDate').innerText = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }).format(now);
    } catch (e) {
        document.getElementById('invHDate').innerText = '---';
    }
    document.getElementById('invPTime').innerText = now.toLocaleTimeString('ar-SA', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showInvoiceLogo(e) {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = ev => {
        document.getElementById('invoiceLogoImg').src = ev.target.result;
        document.getElementById('invoiceLogoImg').style.display = 'block';
        document.getElementById('invoiceLogoTxt').style.display = 'none';
    };
    reader.readAsDataURL(file);
}

function addInvoiceRow() {
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td class="col-item-inv" contenteditable="true" data-placeholder="اسم الصنف..."></td>
        <td><input type="number" class="invQty" value="1" min="0" step="any" oninput="calcInvoice()"></td>
        <td><input type="number" class="invPrice" value="0" min="0" step="any" oninput="calcInvoice()"></td>
        <td class="invRowTotal">0.00</td>
        <td class="no-print"><button class="btn-del-inv" onclick="this.closest('tr').remove(); calcInvoice()">✕</button></td>`;
    document.getElementById('invTbody').appendChild(tr);
    tr.querySelector('.invQty').focus();
}

function calcInvoice() {
    let total = 0;
    document.querySelectorAll('#invTbody tr').forEach(row => {
        const q = parseFloat(row.querySelector('.invQty')?.value) || 0;
        const p = parseFloat(row.querySelector('.invPrice')?.value) || 0;
        const sub = Math.max(0, q) * Math.max(0, p);
        row.querySelector('.invRowTotal').innerText = sub.toFixed(2);
        total += sub;
    });
    document.getElementById('invGTotal').innerText = total.toFixed(2);
    const paid = parseFloat(document.getElementById('invPaid').value) || 0;
    const balance = total - paid;
    const balEl = document.getElementById('invBalance');
    balEl.innerText = balance.toFixed(2);
    balEl.style.color = balance < 0 ? 'var(--danger)' : '';
}

function collectInvoiceData() {
    updateInvoiceDateTime();
    const invId = document.querySelector('.print-footer-invoice .editable')?.textContent?.trim() || ('#' + invoiceCounter);
    const items = [];
    document.querySelectorAll('#invTbody tr').forEach(row => {
        const itemName = row.querySelector('.col-item-inv')?.textContent?.trim();
        const qty = parseFloat(row.querySelector('.invQty')?.value) || 0;
        const price = parseFloat(row.querySelector('.invPrice')?.value) || 0;
        if (itemName && qty > 0) {
            items.push({ item: itemName, qty, price, total: qty * price });
        }
    });
    const total = parseFloat(document.getElementById('invGTotal').innerText) || 0;
    const paid = parseFloat(document.getElementById('invPaid').value) || 0;
    const balance = total - paid;
    const paymentType = document.getElementById('invPaymentType').value;
    let clientName = '';
    if (paymentType === 'credit') {
        clientName = document.getElementById('invClientSelect').value;
    } else {
        clientName = document.querySelector('#invCashSection .editable')?.textContent?.trim() || 'نقدي';
    }
    return {
        id: invId,
        date: new Date().toISOString(),
        paymentType,
        currency: invoiceCurrency,
        total,
        paid,
        balance,
        client: clientName,
        items
    };
}

function printInvoiceOnly() {
    updateInvoiceDateTime();
    const invId = document.querySelector('.print-footer-invoice .editable')?.textContent?.trim();
    if (invId && invId.startsWith('#') && parseInt(invId.substring(1)) === invoiceCounter) {
        saveData();
    }
    setTimeout(() => window.print(), 300);
}

function saveInvoiceOnly() {
    const data = collectInvoiceData();
    if (data.items.length === 0) return showNotification('أضف صنفاً واحداً على الأقل', 'warning');
    invoices.push(data);
    saveData();
    updateStats();
    renderInvoicesList();
    if (data.paymentType === 'credit' && data.client && clients[data.client] && data.balance > 0) {
        if (!clients[data.client].records) clients[data.client].records = [];
        clients[data.client].records.push({
            item: `فاتورة ${data.id}`,
            date: new Date().toISOString().split('T')[0],
            valueSAR: data.currency === 'ر.س' ? data.balance : 0,
            valueYER: data.currency === 'ر.ي' ? data.balance : 0,
            voucherType: 'debit'
        });
        saveData();
        updateStats();
        showNotification(`تم حفظ الفاتورة وتسجيل دين بقيمة ${data.balance.toFixed(2)} ${data.currency} ✅`, 'success');
    } else {
        showNotification('تم حفظ الفاتورة بنجاح ✅', 'success');
    }
    initInvoicePage();
}

function renderInvoicesList() {
    const container = document.getElementById('invoicesList');
    if (!container) return;
    if (invoices.length === 0) {
        container.innerHTML = '<div class="list-item empty-list-item">لا توجد فواتير محفوظة</div>';
        return;
    }
    container.innerHTML = invoices.map((inv, index) => `
        <div class="list-item" style="flex-direction:column;align-items:flex-start;gap:8px;">
            <div style="display:flex;justify-content:space-between;width:100%;">
                <span style="font-weight:700;">فاتورة ${inv.id}</span>
                <span style="color:var(--text-muted);font-size:12px;">${new Date(inv.date).toLocaleDateString('ar-SA')}</span>
            </div>
            <div style="display:flex;justify-content:space-between;width:100%;font-size:13px;">
                <span>${inv.client || 'نقدي'}</span>
                <span style="color:var(--primary-light);">${inv.total.toFixed(2)} ${inv.currency}</span>
            </div>
            <div style="display:flex;gap:5px;">
                <button class="btn-outline btn-sm" onclick="viewInvoice(${index})">👁️ عرض</button>
                <button class="btn-outline btn-sm" style="color:var(--danger);border-color:var(--danger);" onclick="deleteInvoice(${index})">🗑️ حذف</button>
            </div>
        </div>
    `).join('');
}

function viewInvoice(index) {
    const inv = invoices[index];
    if (!inv) return;
    showPage('invoice');
    setTimeout(() => {
        document.getElementById('invPaymentType').value = inv.paymentType;
        toggleInvoicePayment();
        document.getElementById('invCurrency').value = inv.currency;
        updateInvoiceCurrency();
        document.getElementById('invPaid').value = inv.paid;
        document.querySelector('.print-footer-invoice .editable').textContent = inv.id;
        if (inv.paymentType === 'credit') {
            document.getElementById('invClientSelect').value = inv.client;
            onClientSelectChange();
        } else {
            const cashNameSpan = document.querySelector('#invCashSection .editable');
            if (cashNameSpan) cashNameSpan.textContent = inv.client !== 'نقدي' ? inv.client : '';
        }
        const tbody = document.getElementById('invTbody');
        tbody.innerHTML = '';
        inv.items.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="col-item-inv" contenteditable="true">${item.item}</td>
                <td><input type="number" class="invQty" value="${item.qty}" min="0" step="any" oninput="calcInvoice()"></td>
                <td><input type="number" class="invPrice" value="${item.price}" min="0" step="any" oninput="calcInvoice()"></td>
                <td class="invRowTotal">${item.total.toFixed(2)}</td>
                <td class="no-print"><button class="btn-del-inv" onclick="this.closest('tr').remove(); calcInvoice()">✕</button></td>`;
            tbody.appendChild(tr);
        });
        calcInvoice();
    }, 200);
}

function deleteInvoice(index) {
    if (confirm('هل أنت متأكد من حذف هذه الفاتورة؟')) {
        invoices.splice(index, 1);
        saveData();
        updateStats();
        renderInvoicesList();
        showNotification('تم حذف الفاتورة ✅', 'success');
    }
}

// ============ ENTITY LIST & ADD ============
function renderAllLists() {
    ['client', 'supplier', 'debtor', 'employee', 'other'].forEach(t => renderEntityList(t));
}

function renderEntityList(type) {
    const store = getEntityStore(type);
    const listId = type === 'client' ? 'clientsList' : 
                   type === 'supplier' ? 'suppliersList' : 
                   type === 'debtor' ? 'debtorsList' : 
                   type === 'employee' ? 'employeesList' : 'othersList';
    const container = document.getElementById(listId);
    if (!container) return;
    const names = Object.keys(store);
    if (names.length === 0) {
        container.innerHTML = '<div class="list-item empty-list-item">لا توجد بيانات</div>';
        return;
    }
    const iconMap = {
        client: 'users',
        supplier: 'truck',
        debtor: 'file-invoice-dollar',
        employee: 'user-tie',
        other: 'receipt'
    };
    container.innerHTML = names.map(name => `
        <div class="list-item" onclick="openEntityRecords('${name.replace(/'/g, "\\'")}', '${type}')">
            <div class="item-info">
                <div class="item-icon"><span class="icon icon-${iconMap[type]}"></span></div>
                <div class="item-details">
                    <div class="item-name">${name}</div>
                    <div class="item-desc">${store[name].phone || ''}</div>
                </div>
            </div>
            <span class="icon icon-chevron-left" style="color:var(--text-muted);"></span>
        </div>
    `).join('');
}

function toggleEntityAddPopover(e) {
    e.stopPropagation();
    const pop = document.getElementById('entityAddPopover');
    const btn = document.getElementById('entityFabMain');
    pop.classList.toggle('active');
    btn.classList.toggle('active');
    const typeLabels = { client: 'عميل', supplier: 'مورد', debtor: 'دين', employee: 'موظف', other: 'أخرى' };
    document.getElementById('entityPopoverTitle').innerText = `➕ إضافة ${typeLabels[currentEntityType] || ''}`;
}

function closeEntityAddPopover() {
    document.getElementById('entityAddPopover').classList.remove('active');
    document.getElementById('entityFabMain').classList.remove('active');
}

async function addEntityFromContact() {
    if (!navigator.contacts?.select) return showNotification('متصفحك لا يدعم جهات الاتصال', 'warning');
    try {
        const contacts = await navigator.contacts.select(['name', 'tel'], { multiple: false });
        if (!contacts.length) return;
        const name = contacts[0].name?.[0]?.trim();
        const phone = contacts[0].tel?.[0]?.replace(/\s/g, '').trim();
        if (!name || !phone) return showNotification('يجب أن تحتوي جهة الاتصال على اسم ورقم', 'warning');
        const store = getEntityStore(currentEntityType);
        if (Object.values(store).some(e => e.phone === phone)) {
            return showNotification('رقم الهاتف موجود مسبقاً', 'error');
        }
        store[name] = {
            phone,
            email: '',
            joinDate: new Date().toISOString().split('T')[0],
            records: [],
            deliveredAmounts: []
        };
        saveData();
        renderEntityList(currentEntityType);
        updateStats();
        showNotification('تمت الإضافة ✅', 'success');
    } catch (e) {
        showNotification('تعذر الوصول لجهات الاتصال', 'error');
    }
}

function showEntityModal() {
    const typeLabels = { client: 'عميل', supplier: 'مورد', debtor: 'دين', employee: 'موظف', other: 'أخرى' };
    document.getElementById('entityModalTitle').innerText = `إضافة ${typeLabels[currentEntityType] || ''}`;
    openModal('entityModal');
}

function addEntity(e) {
    e.preventDefault();
    const name = document.getElementById('entityName').value.trim();
    const phone = document.getElementById('entityPhone').value.trim();
    const email = document.getElementById('entityEmail').value.trim();
    if (!name || !phone) return showNotification('الاسم ورقم الهاتف مطلوبان', 'error');
    const store = getEntityStore(currentEntityType);
    if (Object.values(store).some(e => e.phone === phone)) {
        return showNotification('رقم الهاتف موجود مسبقاً', 'error');
    }
    store[name] = {
        phone,
        email,
        joinDate: new Date().toISOString().split('T')[0],
        records: [],
        deliveredAmounts: []
    };
    saveData();
    renderEntityList(currentEntityType);
    closeModal('entityModal');
    document.getElementById('entityForm').reset();
    updateStats();
    showNotification('تمت الإضافة ✅', 'success');
}

// ============ RECORDS & VOUCHERS ============
function renderEntityRecords() {
    const store = getEntityStore(currentEntityType);
    if (!currentEntityName || !store[currentEntityName]) return;
    const entity = store[currentEntityName];
    const records = entity.records || [];
    const payments = entity.deliveredAmounts || [];
    
    let allTransactions = [];
    
    records.forEach((rec, i) => {
        let currencySymbol = '';
        let amount = 0;
        if (rec.valueSAR && rec.valueSAR !== 0) {
            currencySymbol = 'ر.س';
            amount = rec.voucherType === 'debit' ? -(rec.valueSAR) : rec.valueSAR;
        } else if (rec.valueYER && rec.valueYER !== 0) {
            currencySymbol = 'ر.ي';
            amount = rec.voucherType === 'debit' ? -(rec.valueYER) : rec.valueYER;
        }
        allTransactions.push({
            type: rec.voucherType === 'debit' ? 'سند (عليه)' : 'سند (له)',
            date: rec.date,
            amount: amount,
            currency: currencySymbol,
            amountSAR: rec.voucherType === 'debit' ? -(rec.valueSAR || 0) : (rec.valueSAR || 0),
            amountYER: rec.voucherType === 'debit' ? -(rec.valueYER || 0) : (rec.valueYER || 0),
            originalIndex: i,
            isRecord: true,
            description: rec.item || ''
        });
    });
    
    payments.forEach((pay, i) => {
        let currencySymbol = pay.amountSAR ? 'ر.س' : 'ر.ي';
        let amount = pay.amountSAR ? -(pay.amountSAR) : -(pay.amountYER);
        allTransactions.push({
            type: 'دفعة',
            date: pay.date,
            amount: amount,
            currency: currencySymbol,
            amountSAR: -(pay.amountSAR || 0),
            amountYER: -(pay.amountYER || 0),
            originalIndex: i,
            isRecord: false,
            description: ''
        });
    });
    
    allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    const totalSAR = allTransactions.reduce((sum, t) => sum + t.amountSAR, 0);
    const totalYER = allTransactions.reduce((sum, t) => sum + t.amountYER, 0);
    const hasSARTransactions = allTransactions.some(t => t.currency === 'ر.س');
    const hasYERTransactions = allTransactions.some(t => t.currency === 'ر.ي');
    
    const tbodyId = currentEntityType + 'UnifiedRecords';
    const placeholderId = 'no' + currentEntityType.charAt(0).toUpperCase() + currentEntityType.slice(1) + 'RecordsPlaceholder';
    const tfootId = currentEntityType + 'TotalRow';
    
    const tbody = document.getElementById(tbodyId);
    const placeholder = document.getElementById(placeholderId);
    const tfoot = document.getElementById(tfootId);
    
    if (!tbody) return;
    
    if (allTransactions.length === 0) {
        tbody.innerHTML = '';
        if (placeholder) placeholder.style.display = 'block';
        if (tfoot) tfoot.innerHTML = '';
    } else {
        if (placeholder) placeholder.style.display = 'none';
        tbody.innerHTML = allTransactions.map(t => {
            const sign = t.amount >= 0 ? '+' : '';
            let badgeColor, textColor;
            if (t.type.includes('عليه')) {
                badgeColor = 'rgba(239,68,68,0.2)';
                textColor = 'var(--accent-glow)';
            } else if (t.type.includes('له')) {
                badgeColor = 'rgba(16,185,129,0.2)';
                textColor = 'var(--success-glow)';
            } else {
                badgeColor = 'rgba(16,185,129,0.2)';
                textColor = 'var(--success-glow)';
            }
            const itemDescription = t.description || '—';
            const currencyClass = t.currency === 'ر.س' ? 'currency-sar' : 'currency-yer';
            return `<tr>
                <td>${t.date}</td>
                <td><span style="background:${badgeColor};color:${textColor};padding:3px 10px;border-radius:15px;font-size:12px;">${t.type}</span></td>
                <td>
                    <span style="color:${t.amount >= 0 ? 'var(--success-glow)' : 'var(--accent-glow)'};">${sign}${Math.abs(t.amount).toFixed(2)}</span>
                    <span class="currency-badge ${currencyClass}" style="margin-right:5px;">${t.currency}</span>
                </td>
                <td>${itemDescription}</td>
                <td><button class="btn-outline btn-sm" onclick="deleteEntityTransaction('${t.type}', ${t.originalIndex}, ${t.isRecord})">🗑️</button></td>
            </tr>`;
        }).join('');
        
        if (tfoot) {
            let totalContent = '';
            if (hasSARTransactions) {
                const sarColor = totalSAR >= 0 ? 'var(--success-glow)' : 'var(--accent-glow)';
                const sarSign = totalSAR >= 0 ? '+' : '';
                totalContent += `<div class="total-amount-item">
                    <span style="color:${sarColor};">${sarSign}${totalSAR.toFixed(2)}</span>
                    <span class="currency-badge currency-sar">ر.س</span>
                </div>`;
            }
            if (hasYERTransactions) {
                const yerColor = totalYER >= 0 ? 'var(--success-glow)' : 'var(--accent-glow)';
                const yerSign = totalYER >= 0 ? '+' : '';
                totalContent += `<div class="total-amount-item">
                    <span style="color:${yerColor};">${yerSign}${totalYER.toFixed(2)}</span>
                    <span class="currency-badge currency-yer">ر.ي</span>
                </div>`;
            }
            tfoot.innerHTML = `<tr class="total-row">
                <td colspan="2"><strong>💰 الإجمالي النهائي</strong></td>
                <td>${totalContent}</td>
                <td>-</td>
                <td></td>
            </tr>`;
        }
    }
    
    document.getElementById(currentEntityType + 'BalanceSAR').innerText = `${totalSAR.toFixed(2)} ر.س`;
    document.getElementById(currentEntityType + 'BalanceYER').innerText = `${totalYER.toFixed(2)} ر.ي`;
}

function deleteEntityTransaction(type, index, isRecord) {
    if (!currentEntityName) return;
    const store = getEntityStore(currentEntityType);
    if (isRecord) {
        store[currentEntityName].records.splice(index, 1);
    } else {
        store[currentEntityName].deliveredAmounts.splice(index, 1);
    }
    saveData();
    renderEntityRecords();
    updateStats();
}

function setVoucherType(type, btn) {
    voucherType = type;
    document.querySelectorAll('.voucher-type-btn').forEach(b => b.classList.remove('active', 'credit', 'debit'));
    btn.classList.add('active', type);
}

function toggleVoucherPopover(e) {
    e.stopPropagation();
    document.getElementById('voucherPopover').classList.toggle('active');
}

function addVoucherFromPopover() {
    if (!currentEntityName) return showNotification('الرجاء فتح سجل أولاً', 'error');
    const amount = parseFloat(document.getElementById('voucherAmount').value);
    const currency = document.getElementById('voucherCurrency').value;
    const item = document.getElementById('voucherItem').value.trim();
    if (isNaN(amount) || amount <= 0) return showNotification('أدخل مبلغاً صحيحاً', 'error');
    const store = getEntityStore(currentEntityType);
    if (!store[currentEntityName].records) store[currentEntityName].records = [];
    store[currentEntityName].records.push({
        item: item || (voucherType === 'credit' ? 'سند قبض' : 'سند صرف'),
        date: new Date().toISOString().split('T')[0],
        valueSAR: currency === 'SAR' ? amount : 0,
        valueYER: currency === 'YER' ? amount : 0,
        voucherType
    });
    saveData();
    renderEntityRecords();
    updateStats();
    document.getElementById('voucherAmount').value = '';
    document.getElementById('voucherItem').value = '';
    document.getElementById('voucherPopover').classList.remove('active');
}

function sendEntityStatement(type, method) {
    if (!currentEntityName) return;
    const store = getEntityStore(type);
    const entity = store[currentEntityName];
    const records = entity.records || [];
    const payments = entity.deliveredAmounts || [];
    
    const totalSAR = records.reduce((s, r) => s + (r.voucherType === 'debit' ? -(r.valueSAR || 0) : (r.valueSAR || 0)), 0) - payments.reduce((s, p) => s + (p.amountSAR || 0), 0);
    const totalYER = records.reduce((s, r) => s + (r.voucherType === 'debit' ? -(r.valueYER || 0) : (r.valueYER || 0)), 0) - payments.reduce((s, p) => s + (p.amountYER || 0), 0);
    
    const now = new Date();
    const dateStr = now.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });
    const totalAmount = totalSAR !== 0 ? totalSAR : totalYER;
    const currencySymbol = totalSAR !== 0 ? 'ر.س' : 'ر.ي';
    
    let msg = '';
    if (totalAmount < 0) {
        msg = `📊 *محاسب المستقبل*\n📅 *رصيد حسابكم* / ${dateStr}\n⚠️ *عليكم:* ${Math.abs(totalAmount).toFixed(2)} ${currencySymbol}`;
    } else if (totalAmount > 0) {
        msg = `📊 *محاسب المستقبل*\n📅 *رصيد حسابكم* / ${dateStr}\n✅ *لكم:* ${totalAmount.toFixed(2)} ${currencySymbol}`;
    } else {
        msg = `📊 *محاسب المستقبل*\n📅 *رصيد حسابكم* / ${dateStr}\n💰 *الرصيد:* 0.00 ${currencySymbol}`;
    }
    
    const phone = entity.phone.replace(/\D/g, '');
    if (method === 'whatsapp') {
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
    } else {
        window.location.href = `sms:${phone}?body=${encodeURIComponent(msg)}`;
    }
}

function deleteEntity(type) {
    if (!currentEntityName) return;
    if (confirm(`⚠️ حذف ${currentEntityName}؟`)) {
        delete getEntityStore(type)[currentEntityName];
        saveData();
        const redirectMap = { client: 'clients', supplier: 'suppliers', debtor: 'debts', employee: 'employees', other: 'others' };
        showPage(redirectMap[type]);
        updateStats();
    }
}

function exportEntityStatementPDF(type) {
    if (!currentEntityName) return;
    const store = getEntityStore(type);
    const entity = store[currentEntityName];
    const records = entity.records || [];
    const payments = entity.deliveredAmounts || [];
    
    let allTransactions = [];
    records.forEach(rec => {
        let currencySymbol = rec.valueSAR ? 'ر.س' : 'ر.ي';
        let amount = rec.valueSAR || rec.valueYER || 0;
        if (rec.voucherType === 'debit') amount = -amount;
        allTransactions.push({
            date: rec.date,
            desc: (rec.voucherType === 'debit' ? 'سند (عليه)' : 'سند (له)') + (rec.item ? ' - ' + rec.item : ''),
            amount: amount,
            currency: currencySymbol,
            amountSAR: rec.voucherType === 'debit' ? -(rec.valueSAR || 0) : (rec.valueSAR || 0),
            amountYER: rec.voucherType === 'debit' ? -(rec.valueYER || 0) : (rec.valueYER || 0)
        });
    });
    payments.forEach(pay => {
        let currencySymbol = pay.amountSAR ? 'ر.س' : 'ر.ي';
        let amount = pay.amountSAR || pay.amountYER || 0;
        allTransactions.push({
            date: pay.date,
            desc: 'دفعة',
            amount: -amount,
            currency: currencySymbol,
            amountSAR: -(pay.amountSAR || 0),
            amountYER: -(pay.amountYER || 0)
        });
    });
    allTransactions.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    const totalSAR = allTransactions.reduce((sum, t) => sum + t.amountSAR, 0);
    const totalYER = allTransactions.reduce((sum, t) => sum + t.amountYER, 0);
    const hasSARTransactions = allTransactions.some(t => t.currency === 'ر.س');
    const hasYERTransactions = allTransactions.some(t => t.currency === 'ر.ي');
    
    const rows = allTransactions.map(t => {
        const sign = t.amount >= 0 ? '+' : '';
        const itemDescription = t.desc.includes(' - ') ? t.desc.split(' - ')[1] : '—';
        return `<tr>
            <td>${t.date}</td>
            <td>${t.desc}</td>
            <td>${sign}${Math.abs(t.amount).toFixed(2)} ${t.currency}</td>
            <td>${itemDescription}</td>
        </tr>`;
    }).join('');
    
    let pdfTotalContent = '';
    if (hasSARTransactions) pdfTotalContent += `${totalSAR >= 0 ? '+' : ''}${totalSAR.toFixed(2)} ر.س`;
    if (hasYERTransactions) {
        if (hasSARTransactions) pdfTotalContent += '<br>';
        pdfTotalContent += `${totalYER >= 0 ? '+' : ''}${totalYER.toFixed(2)} ر.ي`;
    }
    
    const totalRowPDF = (hasSARTransactions || hasYERTransactions) ? 
        `<tr style="background:#f0f0f0;font-weight:bold;">
            <td colspan="2">💰 الإجمالي النهائي</td>
            <td>${pdfTotalContent}</td>
            <td>-</td>
        </tr>` : '';
    
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    printWindow.document.write(`<html dir="rtl"><head><meta charset="UTF-8"><title>كشف حساب - ${currentEntityName}</title>
        <style>body{font-family:'Segoe UI',Tahoma,sans-serif;padding:20px;color:#1e293b;}h2{color:#3b82f6;text-align:center;}.meta{text-align:center;color:#64748b;margin-bottom:20px;}table{width:100%;border-collapse:collapse;margin:20px 0;}th,td{border:1px solid #ddd;padding:8px;text-align:center;font-size:13px;}th{background:#3b82f6;color:#fff;}.footer{margin-top:30px;font-size:12px;text-align:center;color:#94a3b8;}@media print{body{-webkit-print-color-adjust:exact;}}</style></head>
        <body><h2>📊 محاسب المستقبل</h2><div class="meta">كشف حساب: <strong>${currentEntityName}</strong> | ${new Date().toLocaleDateString('ar-SA')}</div>
        <table><thead><tr><th>التاريخ</th><th>النوع</th><th>المبلغ</th><th>الصنف</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="4">لا توجد حركات</td></tr>'}</tbody>
        <tfoot>${rows ? totalRowPDF : ''}</tfoot></table>
        <div class="footer">تم إنشاء هذا الكشف بواسطة تطبيق محاسب المستقبل - عبد الوهاب الريمي</div>
        <script>window.onload=function(){window.print();}<\/script></body></html>`);
    printWindow.document.close();
}

// ============ تحديث الإحصائيات ============
function updateStats() {
    document.getElementById('clientsCount').innerText = Object.keys(clients).length;
    document.getElementById('suppliersCount').innerText = Object.keys(suppliers).length;
    document.getElementById('debtsCount').innerText = Object.keys(debtors).length;
    document.getElementById('employeesCount').innerText = Object.keys(employees).length;
    document.getElementById('othersCount').innerText = Object.keys(others).length;
    document.getElementById('invoicesCount').innerText = invoices.length;
    
    let revSAR = 0, revYER = 0, expSAR = 0, expYER = 0;
    [clients, suppliers, debtors, employees, others].forEach(store => {
        Object.values(store).forEach(e => {
            (e.records || []).forEach(r => {
                if (r.voucherType === 'credit') {
                    revSAR += (r.valueSAR || 0);
                    revYER += (r.valueYER || 0);
                } else {
                    expSAR += (r.valueSAR || 0);
                    expYER += (r.valueYER || 0);
                }
            });
        });
    });
    
    const profitSAR = revSAR - expSAR;
    const profitYER = revYER - expYER;
    
    document.getElementById('revenueValueSAR').innerText = revSAR.toFixed(2);
    document.getElementById('revenueValueYER').innerText = revYER.toFixed(2);
    document.getElementById('expensesValueSAR').innerText = expSAR.toFixed(2);
    document.getElementById('expensesValueYER').innerText = expYER.toFixed(2);
    document.getElementById('profitValueSAR').innerText = profitSAR.toFixed(2);
    document.getElementById('profitValueYER').innerText = profitYER.toFixed(2);
    document.getElementById('balanceValueSAR').innerText = profitSAR.toFixed(2);
    document.getElementById('balanceValueYER').innerText = profitYER.toFixed(2);
}

// ============ SEARCH ============
function searchData() {
    const query = document.getElementById('searchInput').value.trim().toLowerCase();
    if (!query) return;
    showNotification('وظيفة البحث قيد التطوير', 'info');
}

// ============ EVENT HANDLERS ============
function handleOutsideClick(e) {
    if (!e.target.closest('.actions-toggle-container')) {
        closeAllActionsMenus();
    }
    
    const voucherPop = document.getElementById('voucherPopover');
    const fabMain = document.getElementById('fabMain');
    if (voucherPop && voucherPop.classList.contains('active') && !voucherPop.contains(e.target) && e.target !== fabMain && !fabMain.contains(e.target)) {
        voucherPop.classList.remove('active');
    }
    
    const entityPop = document.getElementById('entityAddPopover');
    const entityFab = document.getElementById('entityFabMain');
    if (entityPop && entityPop.classList.contains('active') && !entityPop.contains(e.target) && e.target !== entityFab && !entityFab.contains(e.target)) {
        closeEntityAddPopover();
    }
    
    const navSemi = document.getElementById('navSemiMenu');
    const navPlus = document.getElementById('navPlusBtn');
    if (navSemi && navSemi.classList.contains('active') && !navSemi.contains(e.target) && e.target !== navPlus && !navPlus.contains(e.target)) {
        closeNavSemiMenu();
    }
}

function toggleNavSemiMenu(e) {
    e.stopPropagation();
    const menu = document.getElementById('navSemiMenu');
    const btn = document.getElementById('navPlusBtn');
    menu.classList.toggle('active');
    btn.classList.toggle('active');
}

function closeNavSemiMenu() {
    document.getElementById('navSemiMenu').classList.remove('active');
    document.getElementById('navPlusBtn').classList.remove('active');
}

function openModal(id) {
    document.getElementById(id).classList.add('active');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

function showRegisterModal() {
    openModal('registerModal');
}

function showNotification(msg, type = 'info') {
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
    };
    const notif = document.createElement('div');
    notif.className = 'notification';
    notif.style.backgroundColor = colors[type] || colors.info;
    notif.textContent = msg;
    document.body.appendChild(notif);
    setTimeout(() => {
        notif.style.animation = 'slideUpNotif 0.35s ease forwards';
        setTimeout(() => notif.remove(), 350);
    }, 2800);
}

function exportData() {
    const data = {
        clients,
        suppliers,
        debtors,
        employees,
        others,
        invoices,
        invoiceCounter,
        exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'محاسب_المستقبل_نسخ.json';
    a.click();
}

function importData(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (data.clients) clients = data.clients;
            if (data.suppliers) suppliers = data.suppliers;
            if (data.debtors) debtors = data.debtors;
            if (data.employees) employees = data.employees;
            if (data.others) others = data.others;
            if (data.invoices) invoices = data.invoices;
            if (data.invoiceCounter) invoiceCounter = data.invoiceCounter;
            saveData();
            updateStats();
            renderAllLists();
            renderInvoicesList();
            showNotification('تم الاستيراد ✅', 'success');
        } catch (err) {
            showNotification('ملف غير صالح', 'error');
        }
    };
    reader.readAsText(file);
}

// ============ MULTIPLE DATABASE MANAGEMENT ============

function initDatabases() {
    try {
        const storedDbs = localStorage.getItem('saved_databases');
        const storedActiveId = localStorage.getItem('active_database_id');
        
        if (storedDbs) {
            databases = JSON.parse(storedDbs);
            activeDatabaseId = storedActiveId || databases[0].id;
            
            if (!databases.some(db => db.id === activeDatabaseId)) {
                activeDatabaseId = databases[0].id;
            }
        } else {
            // Check if there is existing data in localStorage (migration scenario)
            const hasExistingData = localStorage.getItem('clients') || 
                                    localStorage.getItem('suppliers') || 
                                    localStorage.getItem('invoices');
            
            if (hasExistingData) {
                databases = [{
                    id: 'default',
                    name: 'الافتراضية',
                    createdAt: new Date().toISOString()
                }];
                activeDatabaseId = 'default';
                
                const oldData = {
                    clients: JSON.parse(localStorage.getItem('clients') || '{}'),
                    suppliers: JSON.parse(localStorage.getItem('suppliers') || '{}'),
                    debtors: JSON.parse(localStorage.getItem('debtors') || '{}'),
                    employees: JSON.parse(localStorage.getItem('employees') || '{}'),
                    others: JSON.parse(localStorage.getItem('others') || '{}'),
                    invoices: JSON.parse(localStorage.getItem('invoices') || '[]'),
                    invoiceCounter: parseInt(localStorage.getItem('invoiceCounter') || '1000')
                };
                localStorage.setItem('db_data_default', JSON.stringify(oldData));
                
                // Clear old keys to clean up storage
                localStorage.removeItem('clients');
                localStorage.removeItem('suppliers');
                localStorage.removeItem('debtors');
                localStorage.removeItem('employees');
                localStorage.removeItem('others');
                localStorage.removeItem('invoices');
                localStorage.removeItem('invoiceCounter');
            } else {
                databases = [{
                    id: 'default',
                    name: 'الافتراضية',
                    createdAt: new Date().toISOString()
                }];
                activeDatabaseId = 'default';
                
                const emptyData = {
                    clients: {}, suppliers: {}, debtors: {}, employees: {}, others: {}, invoices: [], invoiceCounter: 1000
                };
                localStorage.setItem('db_data_default', JSON.stringify(emptyData));
            }
            
            localStorage.setItem('saved_databases', JSON.stringify(databases));
            localStorage.setItem('active_database_id', activeDatabaseId);
        }
    } catch (e) {
        console.error("Failed to initialize databases:", e);
        databases = [{ id: 'default', name: 'الافتراضية', createdAt: new Date().toISOString() }];
        activeDatabaseId = 'default';
    }
}

function updateActiveDbSelectorUI() {
    const selector = document.getElementById('activeDbSelector');
    if (!selector) return;
    
    selector.innerHTML = databases.map(db => 
        `<option value="${db.id}" ${db.id === activeDatabaseId ? 'selected' : ''}>${db.name}</option>`
    ).join('');
}

function openDatabaseManager() {
    closeSidebar();
    updateDbListUI();
    openModal('dbManagerModal');
}

function updateDbListUI() {
    const container = document.getElementById('dbListContainer');
    if (!container) return;
    
    if (databases.length === 0) {
        container.innerHTML = '<div style="color: var(--text-muted); text-align: center; padding: 15px;">لا توجد قواعد بيانات</div>';
        return;
    }
    
    container.innerHTML = databases.map(db => {
        const isActive = db.id === activeDatabaseId;
        const deleteButton = databases.length > 1 
            ? `<button class="db-action-btn btn-delete-db" onclick="deleteDatabase('${db.id}')" title="حذف">🗑️</button>` 
            : '';
        const activeBadge = isActive ? '<span class="db-active-badge">نشطة</span>' : '';
        const formattedDate = new Date(db.createdAt).toLocaleDateString('ar-SA', {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric'
        });
        
        return `
            <div class="db-item ${isActive ? 'active' : ''}">
                <div class="db-item-details">
                    <div class="db-item-name">
                        <span>${db.name}</span>
                        ${activeBadge}
                    </div>
                    <div class="db-item-meta">تاريخ الإنشاء: ${formattedDate}</div>
                </div>
                <div class="db-item-actions">
                    <button class="db-action-btn" onclick="renameDatabase('${db.id}')" title="تعديل الاسم">✏️</button>
                    <button class="db-action-btn" onclick="exportDatabase('${db.id}')" title="تصدير">📥</button>
                    ${deleteButton}
                    ${!isActive ? `<button class="db-action-btn" onclick="switchDatabase('${db.id}'); closeModal('dbManagerModal');" title="تبديل" style="color: var(--primary-light); border-color: var(--border-glow);">🔌</button>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function createNewDatabase() {
    const input = document.getElementById('newDbNameInput');
    const name = input.value.trim();
    if (!name) return showNotification('الرجاء إدخال اسم قاعدة البيانات', 'error');
    
    if (databases.some(db => db.name.toLowerCase() === name.toLowerCase())) {
        return showNotification('اسم قاعدة البيانات موجود مسبقاً', 'error');
    }
    
    const dbId = `db_${Date.now()}`;
    databases.push({
        id: dbId,
        name: name,
        createdAt: new Date().toISOString()
    });
    
    const emptyData = {
        clients: {},
        suppliers: {},
        debtors: {},
        employees: {},
        others: {},
        invoices: [],
        invoiceCounter: 1000
    };
    
    localStorage.setItem(`db_data_${dbId}`, JSON.stringify(emptyData));
    localStorage.setItem('saved_databases', JSON.stringify(databases));
    
    input.value = '';
    showNotification('تم إنشاء قاعدة البيانات بنجاح ✅', 'success');
    
    switchDatabase(dbId);
    updateDbListUI();
}

function switchDatabase(id) {
    if (id === activeDatabaseId) return;
    
    activeDatabaseId = id;
    localStorage.setItem('active_database_id', activeDatabaseId);
    
    loadData();
    updateActiveDbSelectorUI();
    
    updateStats();
    renderAllLists();
    renderInvoicesList();
    
    const activePage = document.querySelector('.page.active');
    if (activePage) {
        const pageId = activePage.id.replace('-page', '');
        if (pageId.endsWith('-records')) {
            const redirectMap = { 
                'client-records': 'clients', 
                'supplier-records': 'suppliers', 
                'debtor-records': 'debts', 
                'employee-records': 'employees', 
                'other-records': 'others' 
            };
            showPage(redirectMap[pageId] || 'home');
        } else {
            showPage(pageId);
        }
    }
    
    showNotification('تم تبديل قاعدة البيانات النشطة بنجاح 🔌', 'success');
}

function renameDatabase(id) {
    const db = databases.find(d => d.id === id);
    if (!db) return;
    
    const newName = prompt('تعديل اسم قاعدة البيانات:', db.name);
    if (newName === null) return;
    const finalName = newName.trim();
    if (!finalName) return showNotification('الاسم لا يمكن أن يكون فارغاً', 'error');
    
    if (databases.some(d => d.id !== id && d.name.toLowerCase() === finalName.toLowerCase())) {
        return showNotification('اسم قاعدة البيانات مستخدم بالفعل', 'error');
    }
    
    db.name = finalName;
    localStorage.setItem('saved_databases', JSON.stringify(databases));
    
    updateActiveDbSelectorUI();
    updateDbListUI();
    showNotification('تم تعديل اسم قاعدة البيانات بنجاح ✅', 'success');
}

function deleteDatabase(id) {
    if (databases.length <= 1) {
        return showNotification('لا يمكن حذف قاعدة البيانات الأخيرة المتبقية', 'error');
    }
    
    const db = databases.find(d => d.id === id);
    if (!db) return;
    
    if (confirm(`⚠️ هل أنت متأكد من حذف قاعدة البيانات "${db.name}"؟\nسيتم مسح جميع البيانات المتعلقة بها نهائياً!`)) {
        databases = databases.filter(d => d.id !== id);
        localStorage.removeItem(`db_data_${id}`);
        localStorage.setItem('saved_databases', JSON.stringify(databases));
        
        if (id === activeDatabaseId) {
            switchDatabase(databases[0].id);
        } else {
            updateActiveDbSelectorUI();
            updateDbListUI();
        }
        
        showNotification('تم حذف قاعدة البيانات بنجاح 🗑️', 'success');
    }
}

function exportDatabase(id) {
    const db = databases.find(d => d.id === id);
    if (!db) return;
    
    const rawData = localStorage.getItem(`db_data_${id}`);
    if (!rawData) return showNotification('لا توجد بيانات لتصديرها', 'error');
    
    const data = JSON.parse(rawData);
    data.dbName = db.name;
    data.exportDate = new Date().toISOString();
    
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `محاسب_المستقبل_${db.name}_نسخة.json`;
    a.click();
}

function onDbFileSelected(file) {
    if (!file) return;
    document.getElementById('importDbFileName').innerText = file.name;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (!data.clients && !data.suppliers && !data.invoices) {
                return showNotification('ملف غير صالح أو فارغ', 'error');
            }
            
            const originalName = file.name.replace('.json', '').replace('محاسب_المستقبل_', '').replace('_نسخة', '');
            const dbName = prompt('أدخل اسم قاعدة البيانات للملف المستورد:', originalName || 'قاعدة مستوردة');
            if (dbName === null) return;
            const finalDbName = dbName.trim() || 'قاعدة مستوردة';
            
            if (databases.some(db => db.name.toLowerCase() === finalDbName.toLowerCase())) {
                return showNotification('اسم قاعدة البيانات مستخدم بالفعل', 'error');
            }
            
            const dbId = `db_${Date.now()}`;
            databases.push({
                id: dbId,
                name: finalDbName,
                createdAt: new Date().toISOString()
            });
            
            const dbData = {
                clients: data.clients || {},
                suppliers: data.suppliers || {},
                debtors: data.debtors || {},
                employees: data.employees || {},
                others: data.others || {},
                invoices: data.invoices || [],
                invoiceCounter: data.invoiceCounter || 1000
            };
            
            localStorage.setItem(`db_data_${dbId}`, JSON.stringify(dbData));
            localStorage.setItem('saved_databases', JSON.stringify(databases));
            
            showNotification('تم استيراد قاعدة البيانات بنجاح ✅', 'success');
            
            switchDatabase(dbId);
            closeModal('dbManagerModal');
            document.getElementById('importDbFile').value = '';
            document.getElementById('importDbFileName').innerText = 'لم يتم اختيار ملف';
        } catch (err) {
            showNotification('حدث خطأ أثناء قراءة الملف', 'error');
        }
    };
    reader.readAsText(file);
}

// ==========================================
// ====== ADVANCED FEATURES (REAL APP) ======
// ==========================================

// --- 1. Splash Screen & Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // Hide splash screen after 1.5 seconds
    setTimeout(() => {
        document.getElementById('splashScreen').classList.add('hidden');
        checkPinLock();
    }, 1500);
});

// --- 2. PIN Lock System ---
let currentPin = '';
let settingNewPin = false;
let firstPinEntry = '';

function checkPinLock() {
    const savedPin = localStorage.getItem('appPin');
    const pinStatusText = document.getElementById('pinStatusText');
    if (pinStatusText) {
        pinStatusText.innerText = savedPin ? 'مفعل' : 'غير مفعل';
    }
    
    if (savedPin) {
        document.getElementById('pinLockScreen').style.display = 'flex';
        document.querySelector('.pin-lock-content p').innerText = 'أدخل رمز المرور للمتابعة';
        settingNewPin = false;
    } else {
        document.getElementById('pinLockScreen').style.display = 'none';
    }
}

function togglePinSetup() {
    const savedPin = localStorage.getItem('appPin');
    if (savedPin) {
        if(confirm('هل تريد إزالة رمز المرور الحالي؟')) {
            localStorage.removeItem('appPin');
            showNotification('تم إزالة رمز المرور', 'success');
            checkPinLock();
        }
    } else {
        settingNewPin = true;
        firstPinEntry = '';
        currentPin = '';
        updatePinDots();
        document.querySelector('.pin-lock-content h2').innerText = 'إعداد رمز المرور';
        document.querySelector('.pin-lock-content p').innerText = 'أدخل 4 أرقام لرمز المرور الجديد';
        document.getElementById('pinLockScreen').style.display = 'flex';
    }
}

function enterPin(num) {
    if (currentPin.length < 4) {
        currentPin += num.toString();
        updatePinDots();
        if (currentPin.length === 4) {
            setTimeout(processPinEntry, 200);
        }
    }
}

function deletePin() {
    if (currentPin.length > 0) {
        currentPin = currentPin.slice(0, -1);
        updatePinDots();
    }
}

function clearPin() {
    currentPin = '';
    updatePinDots();
}

function updatePinDots() {
    const dots = document.querySelectorAll('.pin-dot');
    dots.forEach((dot, index) => {
        if (index < currentPin.length) dot.classList.add('filled');
        else dot.classList.remove('filled');
    });
}

function processPinEntry() {
    if (settingNewPin) {
        if (!firstPinEntry) {
            firstPinEntry = currentPin;
            currentPin = '';
            updatePinDots();
            document.querySelector('.pin-lock-content p').innerText = 'أكد رمز المرور مرة أخرى';
        } else {
            if (currentPin === firstPinEntry) {
                localStorage.setItem('appPin', currentPin);
                showNotification('تم تعيين رمز المرور بنجاح ✅', 'success');
                document.getElementById('pinLockScreen').style.display = 'none';
                settingNewPin = false;
                checkPinLock();
            } else {
                showNotification('الرمز غير متطابق، حاول مجدداً', 'error');
                firstPinEntry = '';
                currentPin = '';
                updatePinDots();
                document.querySelector('.pin-lock-content p').innerText = 'أدخل 4 أرقام لرمز المرور الجديد';
            }
        }
    } else {
        const savedPin = localStorage.getItem('appPin');
        if (currentPin === savedPin) {
            document.getElementById('pinLockScreen').style.display = 'none';
            currentPin = '';
            updatePinDots();
        } else {
            showNotification('رمز المرور خاطئ!', 'error');
            currentPin = '';
            updatePinDots();
        }
    }
}

// --- 3. Chart.js Integration ---
let financeChartInstance = null;

// Hook into updateStats to update the chart
const originalUpdateStats = typeof updateStats === 'function' ? updateStats : function(){};
updateStats = function() {
    originalUpdateStats(); // Call original stats calculation
    
    // Extract calculated values from DOM (simplest way without rewriting core logic)
    setTimeout(() => {
        const revSAR = parseFloat(document.getElementById('revenueValueSAR').innerText.replace(/,/g, '')) || 0;
        const expSAR = parseFloat(document.getElementById('expensesValueSAR').innerText.replace(/,/g, '')) || 0;
        const profSAR = parseFloat(document.getElementById('profitValueSAR').innerText.replace(/,/g, '')) || 0;
        const balSAR = parseFloat(document.getElementById('balanceValueSAR').innerText.replace(/,/g, '')) || 0;
        
        renderFinanceChart(revSAR, expSAR, profSAR, balSAR);
    }, 100);
};

function renderFinanceChart(rev, exp, prof, bal) {
    const ctx = document.getElementById('financeChart');
    if (!ctx) return;
    
    if (financeChartInstance) {
        financeChartInstance.destroy();
    }
    
    financeChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['الإيرادات', 'المصروفات', 'الربح', 'الخزينة'],
            datasets: [{
                label: 'المبالغ (ر.س)',
                data: [rev, exp, prof, bal],
                backgroundColor: [
                    'rgba(16, 185, 129, 0.7)', // Green
                    'rgba(239, 68, 68, 0.7)',  // Red
                    'rgba(59, 130, 246, 0.7)', // Blue
                    'rgba(245, 158, 11, 0.7)'  // Orange
                ],
                borderColor: [
                    'rgb(16, 185, 129)',
                    'rgb(239, 68, 68)',
                    'rgb(59, 130, 246)',
                    'rgb(245, 158, 11)'
                ],
                borderWidth: 1,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
                    },
                    ticks: {
                        color: isDarkMode ? '#94a3b8' : '#64748b'
                    }
                },
                x: {
                    grid: { display: false },
                    ticks: {
                        color: isDarkMode ? '#94a3b8' : '#64748b',
                        font: { family: 'Cairo, sans-serif' }
                    }
                }
            }
        }
    });
}

// Ensure chart colors update on theme toggle
const originalToggleTheme = typeof toggleTheme === 'function' ? toggleTheme : function(){};
toggleTheme = function() {
    originalToggleTheme();
    updateStats(); // Re-render chart with new theme colors
};

// --- 4. PDF Export with html2pdf.js ---
function exportInvoiceToPDF() {
    const invoiceEl = document.getElementById('invoiceBox');
    const invoiceId = document.querySelector('.print-footer-invoice .editable')?.textContent?.trim() || 'فاتورة';
    
    // Temporarily hide actions for PDF
    const actions = invoiceEl.querySelector('.invoice-actions');
    if(actions) actions.style.display = 'none';
    
    const opt = {
        margin:       10,
        filename:     `محاسب_المستقبل_${invoiceId}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    showNotification('جاري تجهيز ملف PDF...', 'info');
    
    html2pdf().set(opt).from(invoiceEl).save().then(() => {
        if(actions) actions.style.display = 'flex';
        showNotification('تم تحميل الـ PDF ✅', 'success');
    }).catch(err => {
        if(actions) actions.style.display = 'flex';
        showNotification('حدث خطأ أثناء إنشاء PDF', 'error');
        console.error(err);
    });
}

// --- 5. IndexedDB Backup Integration ---
// Hook into saveData to asynchronously backup to IndexedDB using localforage
const originalSaveDataDB = typeof saveData === 'function' ? saveData : function(){};
saveData = function() {
    originalSaveDataDB(); // Keep localStorage synchronous save
    
    // Async backup to IndexedDB for safety
    if (typeof localforage !== 'undefined') {
        const dbDataKey = `db_data_${activeDatabaseId}`;
        const dataToSave = {
            clients, employees, suppliers, debtors, others, invoices, invoiceCounter,
            lastSaved: new Date().toISOString()
        };
        localforage.setItem(dbDataKey, dataToSave).catch(err => {
            console.warn('IndexedDB Backup failed:', err);
        });
    }
};

// --- 6. Real Local Database (IndexedDB Primary Storage) ---
const DB_STORAGE_KEYS = {
    catalog: 'fa_saved_databases',
    active: 'fa_active_database_id',
    prefix: 'fa_db_data_'
};

let dbBootstrapPromise = null;
let dbLoadPromise = null;

if (typeof localforage !== 'undefined') {
    localforage.config({
        name: 'future-accountant',
        storeName: 'accounting_data',
        description: 'Primary local database for Future Accountant'
    });
}

function createEmptyDatabasePayload() {
    return {
        clients: {},
        suppliers: {},
        debtors: {},
        employees: {},
        others: {},
        invoices: [],
        invoiceCounter: 1000
    };
}

function getDbStorageKey(id) {
    return `${DB_STORAGE_KEYS.prefix}${id}`;
}

function getCurrentDatabasePayload() {
    return {
        clients,
        suppliers,
        debtors,
        employees,
        others,
        invoices,
        invoiceCounter
    };
}

function hydrateStateFromPayload(payload = {}) {
    const safePayload = { ...createEmptyDatabasePayload(), ...payload };
    clients = safePayload.clients || {};
    suppliers = safePayload.suppliers || {};
    debtors = safePayload.debtors || {};
    employees = safePayload.employees || {};
    others = safePayload.others || {};
    invoices = Array.isArray(safePayload.invoices) ? safePayload.invoices : [];
    invoiceCounter = safePayload.invoiceCounter || 1000;
}

function syncUiAfterDataLoad() {
    updateActiveDbSelectorUI();
    if (document.getElementById('main-app')?.style.display !== 'none') {
        updateStats();
        renderAllLists();
        renderInvoicesList();
    }
}

function syncLegacyDatabaseMirror(dataMap = {}) {
    try {
        localStorage.setItem('saved_databases', JSON.stringify(databases));
        localStorage.setItem('active_database_id', activeDatabaseId);

        Object.entries(dataMap).forEach(([dbId, payload]) => {
            localStorage.setItem(`db_data_${dbId}`, JSON.stringify(payload));
        });
    } catch (error) {
        console.warn('Failed to sync legacy database mirror:', error);
    }
}

async function storageGet(key) {
    if (typeof localforage !== 'undefined') {
        return localforage.getItem(key);
    }

    const raw = localStorage.getItem(key);
    if (raw === null) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return raw;
    }
}

async function storageSet(key, value) {
    if (typeof localforage !== 'undefined') {
        return localforage.setItem(key, value);
    }

    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(key, serialized);
    return value;
}

async function storageRemove(key) {
    if (typeof localforage !== 'undefined') {
        return localforage.removeItem(key);
    }

    localStorage.removeItem(key);
}

async function migrateLegacyStorageToIndexedDb() {
    const mirroredPayloads = {};
    const storedDbsRaw = localStorage.getItem('saved_databases');
    const storedActiveId = localStorage.getItem('active_database_id');

    if (storedDbsRaw) {
        let legacyDatabases = [];

        try {
            legacyDatabases = JSON.parse(storedDbsRaw) || [];
        } catch (error) {
            console.warn('Failed to parse legacy database catalog:', error);
        }

        if (legacyDatabases.length > 0) {
            databases = legacyDatabases;
            activeDatabaseId = storedActiveId || legacyDatabases[0].id;

            for (const db of databases) {
                const payload = JSON.parse(localStorage.getItem(`db_data_${db.id}`) || 'null') || createEmptyDatabasePayload();
                mirroredPayloads[db.id] = payload;
                await storageSet(getDbStorageKey(db.id), payload);
            }

            await storageSet(DB_STORAGE_KEYS.catalog, databases);
            await storageSet(DB_STORAGE_KEYS.active, activeDatabaseId);
            syncLegacyDatabaseMirror(mirroredPayloads);
            return;
        }
    }

    const hasVeryOldData =
        localStorage.getItem('clients') ||
        localStorage.getItem('suppliers') ||
        localStorage.getItem('invoices');

    databases = [{
        id: 'default',
        name: 'الافتراضية',
        createdAt: new Date().toISOString()
    }];
    activeDatabaseId = 'default';

    const payload = hasVeryOldData
        ? {
            clients: JSON.parse(localStorage.getItem('clients') || '{}'),
            suppliers: JSON.parse(localStorage.getItem('suppliers') || '{}'),
            debtors: JSON.parse(localStorage.getItem('debtors') || '{}'),
            employees: JSON.parse(localStorage.getItem('employees') || '{}'),
            others: JSON.parse(localStorage.getItem('others') || '{}'),
            invoices: JSON.parse(localStorage.getItem('invoices') || '[]'),
            invoiceCounter: parseInt(localStorage.getItem('invoiceCounter') || '1000', 10)
        }
        : createEmptyDatabasePayload();

    await storageSet(DB_STORAGE_KEYS.catalog, databases);
    await storageSet(DB_STORAGE_KEYS.active, activeDatabaseId);
    await storageSet(getDbStorageKey('default'), payload);

    syncLegacyDatabaseMirror({ default: payload });
}

async function persistDatabaseMeta() {
    await storageSet(DB_STORAGE_KEYS.catalog, databases);
    await storageSet(DB_STORAGE_KEYS.active, activeDatabaseId);
    syncLegacyDatabaseMirror();
}

async function initDatabases() {
    if (dbBootstrapPromise) return dbBootstrapPromise;

    dbBootstrapPromise = (async () => {
        try {
            const storedCatalog = await storageGet(DB_STORAGE_KEYS.catalog);
            const storedActiveId = await storageGet(DB_STORAGE_KEYS.active);

            if (Array.isArray(storedCatalog) && storedCatalog.length > 0) {
                databases = storedCatalog;
                activeDatabaseId = storedActiveId || storedCatalog[0].id;

                if (!databases.some(db => db.id === activeDatabaseId)) {
                    activeDatabaseId = databases[0].id;
                    await storageSet(DB_STORAGE_KEYS.active, activeDatabaseId);
                }

                syncLegacyDatabaseMirror();
                return;
            }

            await migrateLegacyStorageToIndexedDb();
        } catch (error) {
            console.error('Failed to initialize IndexedDB storage:', error);
            databases = [{
                id: 'default',
                name: 'الافتراضية',
                createdAt: new Date().toISOString()
            }];
            activeDatabaseId = 'default';
            syncLegacyDatabaseMirror({ default: createEmptyDatabasePayload() });
        }
    })();

    return dbBootstrapPromise;
}

loadData = function() {
    dbLoadPromise = (async () => {
        try {
            await initDatabases();
            const payload = await storageGet(getDbStorageKey(activeDatabaseId));
            hydrateStateFromPayload(payload || createEmptyDatabasePayload());
            syncUiAfterDataLoad();
        } catch (error) {
            console.error('Failed to load database from IndexedDB:', error);
            resetData();
            syncUiAfterDataLoad();
        }
    })();

    return dbLoadPromise;
};

saveData = function() {
    const payload = getCurrentDatabasePayload();

    const persistPromise = (async () => {
        try {
            await initDatabases();
            await storageSet(getDbStorageKey(activeDatabaseId), payload);
            await persistDatabaseMeta();
            syncLegacyDatabaseMirror({ [activeDatabaseId]: payload });
        } catch (error) {
            console.error('Failed to save database to IndexedDB:', error);
        }
    })();

    return persistPromise;
};

createNewDatabase = function() {
    const input = document.getElementById('newDbNameInput');
    const name = input.value.trim();
    if (!name) return showNotification('الرجاء إدخال اسم قاعدة البيانات', 'error');

    if (databases.some(db => db.name.toLowerCase() === name.toLowerCase())) {
        return showNotification('اسم قاعدة البيانات موجود مسبقاً', 'error');
    }

    const dbId = `db_${Date.now()}`;
    const payload = createEmptyDatabasePayload();

    (async () => {
        databases.push({
            id: dbId,
            name,
            createdAt: new Date().toISOString()
        });

        await storageSet(getDbStorageKey(dbId), payload);
        await persistDatabaseMeta();
        syncLegacyDatabaseMirror({ [dbId]: payload });

        input.value = '';
        showNotification('تم إنشاء قاعدة البيانات بنجاح ✅', 'success');
        await switchDatabase(dbId);
        updateDbListUI();
    })().catch(error => {
        console.error('Failed to create database:', error);
        showNotification('تعذر إنشاء قاعدة البيانات', 'error');
    });
};

switchDatabase = async function(id) {
    if (id === activeDatabaseId) return;

    activeDatabaseId = id;

    try {
        await storageSet(DB_STORAGE_KEYS.active, activeDatabaseId);
        localStorage.setItem('active_database_id', activeDatabaseId);
        await loadData();
        updateActiveDbSelectorUI();

        const activePage = document.querySelector('.page.active');
        if (activePage) {
            const pageId = activePage.id.replace('-page', '');
            if (pageId.endsWith('-records')) {
                const redirectMap = {
                    'client-records': 'clients',
                    'supplier-records': 'suppliers',
                    'debtor-records': 'debts',
                    'employee-records': 'employees',
                    'other-records': 'others'
                };
                showPage(redirectMap[pageId] || 'home');
            } else {
                showPage(pageId);
            }
        }

        showNotification('تم تبديل قاعدة البيانات النشطة بنجاح 🔌', 'success');
    } catch (error) {
        console.error('Failed to switch database:', error);
        showNotification('تعذر تبديل قاعدة البيانات', 'error');
    }
};

renameDatabase = function(id) {
    const db = databases.find(d => d.id === id);
    if (!db) return;

    const newName = prompt('تعديل اسم قاعدة البيانات:', db.name);
    if (newName === null) return;
    const finalName = newName.trim();
    if (!finalName) return showNotification('الاسم لا يمكن أن يكون فارغاً', 'error');

    if (databases.some(d => d.id !== id && d.name.toLowerCase() === finalName.toLowerCase())) {
        return showNotification('اسم قاعدة البيانات مستخدم بالفعل', 'error');
    }

    (async () => {
        db.name = finalName;
        await persistDatabaseMeta();
        updateActiveDbSelectorUI();
        updateDbListUI();
        showNotification('تم تعديل اسم قاعدة البيانات بنجاح ✅', 'success');
    })().catch(error => {
        console.error('Failed to rename database:', error);
        showNotification('تعذر تعديل اسم قاعدة البيانات', 'error');
    });
};

deleteDatabase = function(id) {
    if (databases.length <= 1) {
        return showNotification('لا يمكن حذف قاعدة البيانات الأخيرة المتبقية', 'error');
    }

    const db = databases.find(d => d.id === id);
    if (!db) return;

    if (confirm(`⚠️ هل أنت متأكد من حذف قاعدة البيانات "${db.name}"؟\nسيتم مسح جميع البيانات المتعلقة بها نهائياً!`)) {
        (async () => {
            const wasActive = id === activeDatabaseId;
            databases = databases.filter(d => d.id !== id);
            await storageRemove(getDbStorageKey(id));
            localStorage.removeItem(`db_data_${id}`);

            if (wasActive) {
                activeDatabaseId = databases[0].id;
            }

            await persistDatabaseMeta();

            if (wasActive) {
                await loadData();
                updateActiveDbSelectorUI();
                updateDbListUI();
            } else {
                updateActiveDbSelectorUI();
                updateDbListUI();
            }

            showNotification('تم حذف قاعدة البيانات بنجاح 🗑️', 'success');
        })().catch(error => {
            console.error('Failed to delete database:', error);
            showNotification('تعذر حذف قاعدة البيانات', 'error');
        });
    }
};

exportDatabase = function(id) {
    const db = databases.find(d => d.id === id);
    if (!db) return;

    (async () => {
        const data = await storageGet(getDbStorageKey(id));
        if (!data) return showNotification('لا توجد بيانات لتصديرها', 'error');

        const exportPayload = {
            ...createEmptyDatabasePayload(),
            ...data,
            dbName: db.name,
            exportDate: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(exportPayload)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `محاسب_المستقبل_${db.name}_نسخة.json`;
        a.click();
        URL.revokeObjectURL(a.href);
    })().catch(error => {
        console.error('Failed to export database:', error);
        showNotification('تعذر تصدير قاعدة البيانات', 'error');
    });
};

onDbFileSelected = function(file) {
    if (!file) return;
    document.getElementById('importDbFileName').innerText = file.name;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (!data.clients && !data.suppliers && !data.invoices) {
                return showNotification('ملف غير صالح أو فارغ', 'error');
            }

            const originalName = file.name.replace('.json', '').replace('محاسب_المستقبل_', '').replace('_نسخة', '');
            const dbName = prompt('أدخل اسم قاعدة البيانات للملف المستورد:', originalName || 'قاعدة مستوردة');
            if (dbName === null) return;
            const finalDbName = dbName.trim() || 'قاعدة مستوردة';

            if (databases.some(db => db.name.toLowerCase() === finalDbName.toLowerCase())) {
                return showNotification('اسم قاعدة البيانات مستخدم بالفعل', 'error');
            }

            const dbId = `db_${Date.now()}`;
            const payload = {
                clients: data.clients || {},
                suppliers: data.suppliers || {},
                debtors: data.debtors || {},
                employees: data.employees || {},
                others: data.others || {},
                invoices: data.invoices || [],
                invoiceCounter: data.invoiceCounter || 1000
            };

            (async () => {
                databases.push({
                    id: dbId,
                    name: finalDbName,
                    createdAt: new Date().toISOString()
                });

                await storageSet(getDbStorageKey(dbId), payload);
                await persistDatabaseMeta();
                syncLegacyDatabaseMirror({ [dbId]: payload });

                showNotification('تم استيراد قاعدة البيانات بنجاح ✅', 'success');
                await switchDatabase(dbId);
                closeModal('dbManagerModal');
                document.getElementById('importDbFile').value = '';
                document.getElementById('importDbFileName').innerText = 'لم يتم اختيار ملف';
            })().catch(error => {
                console.error('Failed to import database file:', error);
                showNotification('حدث خطأ أثناء استيراد الملف', 'error');
            });
        } catch (error) {
            console.error('Failed to parse imported database file:', error);
            showNotification('حدث خطأ أثناء قراءة الملف', 'error');
        }
    };
    reader.readAsText(file);
};

exportData = function() {
    exportDatabase(activeDatabaseId);
};

importData = function(file) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            hydrateStateFromPayload({
                clients: data.clients || {},
                suppliers: data.suppliers || {},
                debtors: data.debtors || {},
                employees: data.employees || {},
                others: data.others || {},
                invoices: data.invoices || [],
                invoiceCounter: data.invoiceCounter || 1000
            });

            saveData();
            syncUiAfterDataLoad();
            showNotification('تم الاستيراد ✅', 'success');
        } catch (error) {
            console.error('Failed to import active database data:', error);
            showNotification('ملف غير صالح', 'error');
        }
    };
    reader.readAsText(file);
};

function exportDatabaseToFile() {
    exportDatabase(activeDatabaseId);
}

function importDatabaseFromFile(file) {
    importData(file);
}

// --- 7. SQLite Local API Adapter ---
const browserStorageGet = storageGet;
const browserStorageSet = storageSet;
const browserStorageRemove = storageRemove;
const browserInitDatabases = initDatabases;

const SQLITE_API_STATE = {
    checked: false,
    available: false,
    mode: null,
    bootstrapped: false,
    bootstrapPromise: null
};

function notifyStorageMode(isSqliteAvailable) {
    if (storageModeNoticeShown) return;

    storageModeNoticeShown = true;

    const message = isSqliteAvailable
        ? 'تم تشغيل التطبيق على قاعدة SQLite المحلية بنجاح'
        : 'الخادم المحلي غير متاح حالياً، سيتم الحفظ داخل مساحة التخزين المحلية على هذا الجهاز.';

    setTimeout(() => {
        showNotification(message, isSqliteAvailable ? 'success' : 'warning');
    }, 600);
}

async function ensureSqliteApiAvailability(force = false) {
    if (SQLITE_API_STATE.checked && !force) {
        return SQLITE_API_STATE.available;
    }

    try {
        const nativeBridge = getNativeStorageBridge();

        if (nativeBridge && typeof nativeBridge.ping === 'function') {
            const response = parseNativeBridgeResponse(nativeBridge.ping());
            SQLITE_API_STATE.available = Boolean(response && response.ok);
            SQLITE_API_STATE.mode = SQLITE_API_STATE.available ? 'android-native' : null;
        } else {
            const response = await fetch('/api/health', { cache: 'no-store' });
            SQLITE_API_STATE.available = response.ok;
            SQLITE_API_STATE.mode = response.ok ? 'http-api' : null;
        }
    } catch (error) {
        SQLITE_API_STATE.available = false;
        SQLITE_API_STATE.mode = null;
    }

    SQLITE_API_STATE.checked = true;
    notifyStorageMode(SQLITE_API_STATE.available);
    return SQLITE_API_STATE.available;
}

function getNativeStorageBridge() {
    if (typeof window === 'undefined') return null;
    return window.FutureAccountantNative || null;
}

function parseNativeBridgeResponse(rawResponse) {
    if (rawResponse === null || typeof rawResponse === 'undefined' || rawResponse === '') {
        return null;
    }

    if (typeof rawResponse === 'object') {
        return rawResponse;
    }

    try {
        return JSON.parse(rawResponse);
    } catch (error) {
        throw new Error(`Native SQLite bridge returned invalid JSON: ${error.message}`);
    }
}

function extractStorageKeyFromPath(path) {
    const prefix = '/api/storage/';
    if (!path.startsWith(prefix)) return null;
    return decodeURIComponent(path.slice(prefix.length));
}

async function nativeSqliteBridgeRequest(path, options = {}) {
    const nativeBridge = getNativeStorageBridge();
    if (!nativeBridge) {
        throw new Error('Native SQLite bridge is unavailable');
    }

    const method = (options.method || 'GET').toUpperCase();

    if (path === '/api/health') {
        const result = parseNativeBridgeResponse(nativeBridge.ping());
        if (!result?.ok) {
            throw new Error(result?.error || 'Native SQLite health check failed');
        }
        return result;
    }

    if (path === '/api/bootstrap' && method === 'POST') {
        const result = parseNativeBridgeResponse(
            nativeBridge.bootstrap(options.body || JSON.stringify({ entries: [] }))
        );
        if (!result?.ok) {
            throw new Error(result?.error || 'Native SQLite bootstrap failed');
        }
        return result;
    }

    const key = extractStorageKeyFromPath(path);
    if (key === null) {
        throw new Error(`Unsupported native SQLite path: ${path}`);
    }

    if (method === 'GET') {
        const result = parseNativeBridgeResponse(nativeBridge.getItem(key));
        if (result && result.ok === false) {
            throw new Error(result.error || 'Native SQLite read failed');
        }
        return result?.found === false ? null : result;
    }

    if (method === 'PUT') {
        const result = parseNativeBridgeResponse(
            nativeBridge.setItem(key, options.body || JSON.stringify({ value: null }))
        );
        if (!result?.ok) {
            throw new Error(result?.error || 'Native SQLite write failed');
        }
        return result;
    }

    if (method === 'DELETE') {
        const result = parseNativeBridgeResponse(nativeBridge.removeItem(key));
        if (!result?.ok) {
            throw new Error(result?.error || 'Native SQLite delete failed');
        }
        return result;
    }

    throw new Error(`Unsupported native SQLite method: ${method}`);
}

async function sqliteApiRequest(path, options = {}) {
    if (SQLITE_API_STATE.mode === 'android-native') {
        return nativeSqliteBridgeRequest(path, options);
    }

    const response = await fetch(path, {
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        },
        ...options
    });

    if (response.status === 404) {
        return null;
    }

    if (!response.ok) {
        throw new Error(`SQLite API request failed: ${response.status}`);
    }

    return response.json();
}

function readLegacyMirrorValue(key) {
    const raw = localStorage.getItem(key);
    if (raw === null) return null;

    try {
        return JSON.parse(raw);
    } catch {
        return raw;
    }
}

function hasMeaningfulPayloadData(payload) {
    if (!payload || typeof payload !== 'object') return false;

    return (
        Object.keys(payload.clients || {}).length > 0 ||
        Object.keys(payload.suppliers || {}).length > 0 ||
        Object.keys(payload.debtors || {}).length > 0 ||
        Object.keys(payload.employees || {}).length > 0 ||
        Object.keys(payload.others || {}).length > 0 ||
        (payload.invoices || []).length > 0 ||
        (payload.invoiceCounter || 1000) !== 1000
    );
}

async function collectBrowserBootstrapEntries() {
    const catalog =
        await browserStorageGet(DB_STORAGE_KEYS.catalog) ||
        readLegacyMirrorValue('saved_databases') ||
        defaultDatabaseCatalog();

    const active =
        await browserStorageGet(DB_STORAGE_KEYS.active) ||
        readLegacyMirrorValue('active_database_id') ||
        'default';

    const entries = [
        { key: DB_STORAGE_KEYS.catalog, value: catalog },
        { key: DB_STORAGE_KEYS.active, value: active }
    ];

    for (const db of catalog) {
        const payload =
            await browserStorageGet(getDbStorageKey(db.id)) ||
            readLegacyMirrorValue(`db_data_${db.id}`) ||
            createEmptyDatabasePayload();

        entries.push({
            key: getDbStorageKey(db.id),
            value: payload
        });
    }

    return entries;
}

async function bootstrapSqliteFromBrowserStorage() {
    if (SQLITE_API_STATE.bootstrapped) return;
    if (!await ensureSqliteApiAvailability()) return;

    if (!SQLITE_API_STATE.bootstrapPromise) {
        SQLITE_API_STATE.bootstrapPromise = (async () => {
            const entries = await collectBrowserBootstrapEntries();
            const hasRealData = entries.some(entry =>
                entry.key.startsWith(DB_STORAGE_KEYS.prefix) && hasMeaningfulPayloadData(entry.value)
            );

            if (!hasRealData && entries.length <= 3) {
                SQLITE_API_STATE.bootstrapped = true;
                return;
            }

            try {
                await sqliteApiRequest('/api/bootstrap', {
                    method: 'POST',
                    body: JSON.stringify({ entries })
                });
            } catch (error) {
                console.warn('SQLite bootstrap skipped:', error);
            } finally {
                SQLITE_API_STATE.bootstrapped = true;
            }
        })();
    }

    return SQLITE_API_STATE.bootstrapPromise;
}

function defaultDatabaseCatalog() {
    return [{
        id: 'default',
        name: 'الافتراضية',
        createdAt: new Date().toISOString()
    }];
}

storageGet = async function(key) {
    if (!await ensureSqliteApiAvailability()) {
        return browserStorageGet(key);
    }

    const result = await sqliteApiRequest(`/api/storage/${encodeURIComponent(key)}`, {
        method: 'GET'
    });

    return result ? result.value : null;
};

storageSet = async function(key, value) {
    if (!await ensureSqliteApiAvailability()) {
        return browserStorageSet(key, value);
    }

    await sqliteApiRequest(`/api/storage/${encodeURIComponent(key)}`, {
        method: 'PUT',
        body: JSON.stringify({ value })
    });

    return value;
};

storageRemove = async function(key) {
    if (!await ensureSqliteApiAvailability()) {
        return browserStorageRemove(key);
    }

    await sqliteApiRequest(`/api/storage/${encodeURIComponent(key)}`, {
        method: 'DELETE'
    });
};

initDatabases = async function() {
    await ensureSqliteApiAvailability();

    if (SQLITE_API_STATE.available) {
        await bootstrapSqliteFromBrowserStorage();
    }

    return browserInitDatabases();
};
