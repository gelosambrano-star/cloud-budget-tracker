const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');
const authUser = document.getElementById('auth-user');
const authPass = document.getElementById('auth-pass');
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const logoutBtn = document.getElementById('logout-btn');
const welcomeBanner = document.getElementById('welcome-banner');
const submitBtn = document.getElementById('submit-btn');
const itemInput = document.getElementById('item-input');
const amountInput = document.getElementById('amount-input');
const categoryInput = document.getElementById('category-input');
const itemsList = document.getElementById('items-list');
const exportBtn = document.getElementById('export-btn');
const visualBreakdownBox = document.getElementById('visual-breakdown-box');
const weeklyDisplay = document.getElementById('total-weekly');
const monthlyDisplay = document.getElementById('total-monthly');
const yearlyDisplay = document.getElementById('total-yearly');
const predictTotalDisplay = document.getElementById('predict-total');
const predictConfidenceDisplay = document.getElementById('predict-confidence');
let currentLoadedItemsCachedArray = [];

registerBtn.addEventListener('click', async () => {
    const username = authUser.value.trim();
    const password = authPass.value.trim();
    if (!username || !password) return alert("Please fill out username and password.");
    try {
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (data.error) return alert(data.error);
        alert("Registration complete! You can now Sign In.");
    } catch (err) { console.error(err); }
});

loginBtn.addEventListener('click', async () => {
    const username = authUser.value.trim();
    const password = authPass.value.trim();
    if (!username || !password) return alert("Please fill out username and password.");
    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (data.error) return alert(data.error);
        localStorage.setItem('budget_token', data.token);
        localStorage.setItem('budget_username', data.username);
        checkAuthSession();
    } catch (err) { console.error(err); }
});

logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('budget_token');
    localStorage.removeItem('budget_username');
    checkAuthSession();
});

function checkAuthSession() {
    const token = localStorage.getItem('budget_token');
    const username = localStorage.getItem('budget_username');
    if (token) {
        authContainer.style.display = 'none';
        appContainer.style.display = 'block';
        welcomeBanner.textContent = `\uD83D\uDC4B Welcome back, ${username}!`;
        loadItems();
    } else {
        authContainer.style.display = 'block';
        appContainer.style.display = 'none';
    }
}

function calculateTimeframes(items) {
    const now = new Date();
    let weeklySum = 0, monthlySum = 0, yearlySum = 0;
    const categoryTotals = { "🍔 Food": 0, "🚗 Transport": 0, "💡 Bills": 0, "🎮 Entertainment": 0 };
    items.forEach(item => {
        const itemDate = new Date(item.createdAt);
        const amount = item.amount || 0;
        const cat = item.category || "🍔 Food";
        if (categoryTotals[cat] !== undefined) categoryTotals[cat] += amount;
        if (itemDate.getFullYear() === now.getFullYear()) {
            yearlySum += amount;
            if (itemDate.getMonth() === now.getMonth()) monthlySum += amount;
            const daysDifference = (now.getTime() - itemDate.getTime()) / (1000 * 3600 * 24);
            if (daysDifference <= 7) weeklySum += amount;
        }
    });
    weeklyDisplay.textContent = `₱${weeklySum.toFixed(2)}`;
    monthlyDisplay.textContent = `₱${monthlySum.toFixed(2)}`;
    yearlyDisplay.textContent = `₱${yearlySum.toFixed(2)}`;
    renderPureVisualBars(categoryTotals, yearlySum);
}

function renderPureVisualBars(categoryTotals, totalYearlySum) {
    if (!visualBreakdownBox) return;
    visualBreakdownBox.innerHTML = '';
    const colors = { "🍔 Food": "#ff7675", "🚗 Transport": "#74b9ff", "💡 Bills": "#ffeaa7", "🎮 Entertainment": "#a29bfe" };
    Object.keys(categoryTotals).forEach(cat => {
        const amount = categoryTotals[cat];
        const percentage = totalYearlySum > 0 ? ((amount / totalYearlySum) * 100).toFixed(0) : 0;
        const row = document.createElement('div');
        row.style.margin = '4px 0';
        row.innerHTML = `
            <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 4px; font-weight: 600;">
                <span>${cat}</span>
                <span style="color: #555;">₱${amount.toFixed(2)} (${percentage}%)</span>
            </div>
            <div style="width: 100%; background: rgba(0,0,0,0.05); height: 10px; border-radius: 20px; overflow: hidden;">
                <div style="width: ${percentage}%; background: ${colors[cat]}; height: 100%; border-radius: 20px; transition: width 0.4s ease;"></div>
            </div>
        `;
        visualBreakdownBox.appendChild(row);
    });
}

async function loadForecastMetrics() {
    const token = localStorage.getItem('budget_token');
    try {
        const response = await fetch('/api/predict', { headers: { 'Authorization': `Bearer ${token}` } });
        const forecastData = await response.json();
        predictTotalDisplay.textContent = `₱${(forecastData.prediction || 0).toFixed(2)}`;
        predictConfidenceDisplay.textContent = forecastData.confidence || "Baseline Model";
    } catch (err) { console.error(err); }
}

exportBtn.addEventListener('click', () => {
    if (currentLoadedItemsCachedArray.length === 0) return alert("Ledger empty.");
    let csvContent = "data:text/csv;charset=utf-8,ID,Expense Item Name,Cost Amount (PHP),Category Tag,Timestamp\n";
    currentLoadedItemsCachedArray.forEach((item, index) => {
        const sanitizedText = item.text.replace(/,/g, " ");
        csvContent += `${index + 1},${sanitizedText},${item.amount},${item.category},${item.createdAt}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", encodedUri);
    downloadAnchor.setAttribute("download", `report.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
});

async function loadItems() {
    const token = localStorage.getItem('budget_token');
    try {
        const response = await fetch('/api/items', { headers: { 'Authorization': `Bearer ${token}` } });
        const items = await response.json();
        if (response.status === 401) return logoutBtn.click();
        currentLoadedItemsCachedArray = items;
        itemsList.innerHTML = '';
        calculateTimeframes(items);
        loadForecastMetrics();
        items.forEach(item => {
            const li = document.createElement('li');
            const leftContainer = document.createElement('div');
            leftContainer.style.display = 'flex';
            leftContainer.style.flexDirection = 'column';
            leftContainer.style.gap = '4px';
            const spanText = document.createElement('span');
            spanText.className = 'item-text';
            spanText.textContent = item.text;
            const spanCategory = document.createElement('span');
            spanCategory.style.fontSize = '12px';
            spanCategory.style.color = '#7f8c8d';
            spanCategory.style.fontWeight = '500';
            spanCategory.textContent = item.category || "🍔 Food";
            leftContainer.appendChild(spanText);
            leftContainer.appendChild(spanCategory);
            const rightContainer = document.createElement('div');
            rightContainer.style.display = 'flex';
            rightContainer.style.alignItems = 'center';
            const spanPrice = document.createElement('span');
            spanPrice.className = 'item-price';
            spanPrice.textContent = `₱${(item.amount || 0).toFixed(2)}`;
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '❌';
            deleteBtn.className = 'delete-btn';
            deleteBtn.addEventListener('click', async () => {
                await fetch(`/api/items/${item._id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
                loadItems();
            });
            rightContainer.appendChild(spanPrice);
            rightContainer.appendChild(deleteBtn);
            li.appendChild(leftContainer);
            li.appendChild(rightContainer);
            itemsList.appendChild(li);
        });
    } catch (error) { console.error(error); }
}

submitBtn.addEventListener('click', async () => {
    const token = localStorage.getItem('budget_token');
    const textValue = itemInput.value.trim();
    const amountValue = parseFloat(amountInput.value);
    const categoryValue = categoryInput.value;
    if (!textValue || isNaN(amountValue) || amountValue <= 0) return alert("Enter valid item name and amount!");
    try {
        await fetch('/api/items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ itemName: textValue, itemAmount: amountValue, itemCategory: categoryValue })
        });
        itemInput.value = '';
        amountInput.value = '';
        loadItems();
