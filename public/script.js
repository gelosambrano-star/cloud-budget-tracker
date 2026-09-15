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
    if (!username || !password) return alert("Fill out credentials.");
    try {
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (data.error) return alert(data.error);
        alert("Registered! You can now Sign In.");
    } catch (err) { console.error(err); }
});

loginBtn.addEventListener('click', async () => {
    const username = authUser.value.trim();
    const password = authPass.value.trim();
    if (!username || !password) return alert("Fill out credentials.");
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
        welcomeBanner.textContent = `👋 Welcome back, ${username}!`;
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
                <span>₱${amount.toFixed(2)} (${percentage}%)</span>
            </div>
            <div style="width: 100%; background: rgba(0,0,0,0.05); height: 10px; border-radius: 20px; overflow: hidden;">
                <div style="width: ${percentage}%; background: ${colors[cat]}; height: 100%; transition: width 0.4s ease;"></div>
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
    let csvContent = "data:text/csv;charset=utf-8,ID,Item Name,Amount,Category,Timestamp\n";
    currentLoadedItemsCachedArray.forEach((item, index) => {
        csvContent += `${index + 1},${item.text.replace(/,/g, " ")},${item.amount},${item.category},${item.createdAt}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", encodedUri);
    downloadAnchor.setAttribute("download", "report.csv");
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
            li.innerHTML = `
                <div style="display:flex; flex-direction:column; gap:4px;">
                    <span class="item-text">${item.text}</span>
                    <span style="font-size:12px; color:#7f8c8d; font-weight:500;">${item.category || "🍔 Food"}</span>
                </div>
                <div style="display:flex; align-items:center;">
                    <span class="item-price">₱${(item.amount || 0).toFixed(2)}</span>
                    <button class="delete-btn" onclick="deleteItem('${item._id}')">❌</button>
                </div>
            `;
            itemsList.appendChild(li);
        });
    } catch (error) { console.error(error); }
}

window.deleteItem = async (id) => {
    const token = localStorage.getItem('budget_token');
    await fetch(`/api/items/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
    loadItems();
};

submitBtn.addEventListener('click', async () => {
    const token = localStorage.getItem('budget_token');
    const textValue = itemInput.value.trim();
    const amountValue = parseFloat(amountInput.value);
    const categoryValue = categoryInput.value;
    if (!textValue || isNaN(amountValue) || amountValue <= 0) return alert("Enter valid name and amount!");
    try {
        await fetch('/api/items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ itemName: textValue, itemAmount: amountValue, itemCategory: categoryValue })
        });
        itemInput.value = '';
        amountInput.value = '';
        loadItems();
    } catch (error) { console.error(error); }
});

checkAuthSession();

