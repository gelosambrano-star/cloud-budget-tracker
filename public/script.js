// --- 1. CORE DOM COMPONENT INTERFACE ELEMENT SELECTORS ---
const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');

// Authentication Forms Elements
const authUser = document.getElementById('auth-user');
const authPass = document.getElementById('auth-pass');
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const logoutBtn = document.getElementById('logout-btn');
const welcomeBanner = document.getElementById('welcome-banner');

// Budget Entry Control Interface Elements
const submitBtn = document.getElementById('submit-btn');
const itemInput = document.getElementById('item-input');
const amountInput = document.getElementById('amount-input');
const categoryInput = document.getElementById('category-input');
const itemsList = document.getElementById('items-list');
const exportBtn = document.getElementById('export-btn');

// Timeline Calculations Summary Node Controls
const weeklyDisplay = document.getElementById('total-weekly');
const monthlyDisplay = document.getElementById('total-monthly');
const yearlyDisplay = document.getElementById('total-yearly');

// AI Predictions Components Modules Markers
const predictTotalDisplay = document.getElementById('predict-total');
const predictConfidenceDisplay = document.getElementById('predict-confidence');

let budgetChartInstance = null;
let currentLoadedItemsCachedArray = [];

// --- 2. AUTHENTICATION GATEWAY MIDDLEWARE STATE HANDLERS ---

registerBtn.addEventListener('click', async () => {
    const username = authUser.value.trim();
    const password = authPass.value.trim();
    if (!username || !password) return alert("Please fill out both username and password parameter blocks.");

    try {
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (data.error) return alert(data.error);
        alert("Registration complete! Welcome to the suite. You can now Sign In.");
    } catch (err) {
        console.error("Auth server connection fault error:", err);
    }
});

loginBtn.addEventListener('click', async () => {
    const username = authUser.value.trim();
    const password = authPass.value.trim();
    if (!username || !password) return alert("Please fill out both username and password parameter blocks.");

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
    } catch (err) {
        console.error("Login communication route breakdown:", err);
    }
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
        if (budgetChartInstance) budgetChartInstance.destroy();
    }
}

// --- 3. DYNAMIC DATA ACCUMULATION VISUALIZATIONS & TIME DATA MATHS ---

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

    renderChart(categoryTotals);
}

function renderChart(categoryTotals) {
    const canvas = document.getElementById('budgetChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (budgetChartInstance) budgetChartInstance.destroy();

    budgetChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(categoryTotals),
            datasets: [{
                data: Object.values(categoryTotals),
                backgroundColor: ['#ff7675', '#74b9ff', '#ffeaa7', '#a29bfe'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, padding: 12, font: { family: 'Segoe UI', size: 12 } } } }
        }
    });
}

// --- 4. NEW FEATURE A: FETCH AI DATA MODEL RUNWAY FORECAST ---
async function loadForecastMetrics() {
    const token = localStorage.getItem('budget_token');
    try {
        const response = await fetch('/api/predict', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const forecastData = await response.json();
        
        predictTotalDisplay.textContent = `₱${(forecastData.prediction || 0).toFixed(2)}`;
        predictConfidenceDisplay.textContent = forecastData.confidence || "Baseline Model";
    } catch (err) {
        console.error("Failed to load pipeline forecasting models data parameters:", err);
    }
}

// --- 5. NEW FEATURE B: SPREADSHEET EXPORTER (.CSV ENCODER INTERFACE) ---
exportBtn.addEventListener('click', () => {
    if (currentLoadedItemsCachedArray.length === 0) return alert("Your transactional history data array registry is empty. Log some spending logs first!");

    let csvContent = "data:text/csv;charset=utf-8,ID,Expense Item Name,Cost Amount (PHP),Category Tag,Logging Creation Timestamp\n";

    currentLoadedItemsCachedArray.forEach((item, index) => {
        const sanitizedText = item.text.replace(/,/g, " ");
        const rowLine = `${index + 1},${sanitizedText},${item.amount},${item.category},${item.createdAt}`;
        csvContent += rowLine + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", encodedUri);
    downloadAnchor.setAttribute("download", `budget_ledger_report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(downloadAnchor);
    
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
});

// --- 6. SECURED TRANSACTIONAL FETCH & INJECTION ACTIONS ENGINE ---

async function loadItems() {
    const token = localStorage.getItem('budget_token');
    try {
        const response = await fetch('/api/items', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
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
                await fetch(`/api/items/${item._id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                loadItems();
            });

            rightContainer.appendChild(spanPrice);
            rightContainer.appendChild(deleteBtn);

            li.appendChild(leftContainer);
            li.appendChild(rightContainer);
            itemsList.appendChild(li);
        });
    } catch (error) {
        console.error("Error compiling core server assets layers packages maps:", error);
    }
}

