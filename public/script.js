// --- 1. DOM APP WRAPPER ELEMENT SELECTORS ---
const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');

// Auth Screen Inputs & Actions
const authUser = document.getElementById('auth-user');
const authPass = document.getElementById('auth-pass');
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const logoutBtn = document.getElementById('logout-btn');
const welcomeBanner = document.getElementById('welcome-banner');

// Tracker Hub Control Inputs
const submitBtn = document.getElementById('submit-btn');
const itemInput = document.getElementById('item-input');
const amountInput = document.getElementById('amount-input');
const categoryInput = document.getElementById('category-input');
const itemsList = document.getElementById('items-list');

// Metric Timeline Elements
const weeklyDisplay = document.getElementById('total-weekly');
const monthlyDisplay = document.getElementById('total-monthly');
const yearlyDisplay = document.getElementById('total-yearly');

let budgetChartInstance = null;

// --- 2. AUTHENTICATION PERSISTENCE CONTROLLER ACTIONS ---

// Sign Up Handler
registerBtn.addEventListener('click', async () => {
    const username = authUser.value.trim();
    const password = authPass.value.trim();
    if (!username || !password) return alert("Please fill out both username and password fields.");

    try {
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (data.error) return alert(data.error);
        
        alert("Registration successful! You can now Sign In.");
    } catch (err) {
        console.error("Registration structural link block error:", err);
    }
});

// Sign In Handler
loginBtn.addEventListener('click', async () => {
    const username = authUser.value.trim();
    const password = authPass.value.trim();
    if (!username || !password) return alert("Please fill out both username and password fields.");

    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (data.error) return alert(data.error);

        // Secure token parameters capsule injection save
        localStorage.setItem('budget_token', data.token);
        localStorage.setItem('budget_username', data.username);

        checkAuthSession(); // Smooth transition visibility layer states
    } catch (err) {
        console.error("Login route communication crash:", err);
    }
});

// Logout Handler
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('budget_token');
    localStorage.removeItem('budget_username');
    checkAuthSession();
});

// Lifecycle Security Check Session Router Configuration
function checkAuthSession() {
    const token = localStorage.getItem('budget_token');
    const username = localStorage.getItem('budget_username');

    if (token) {
        authContainer.style.display = 'none';
        appContainer.style.display = 'block';
        welcomeBanner.textContent = `👋 Welcome back, ${username}!`;
        loadItems(); // Automatically pull user profile specific datasets
    } else {
        authContainer.style.display = 'block';
        appContainer.style.display = 'none';
        if (budgetChartInstance) budgetChartInstance.destroy();
    }
}

// --- 3. SECURED BUDGET LEDGER MATH DATA LAYER ENGINE ---

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
            plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 12 } } } }
        }
    });
}

// Fetch Items with Attached Security Token Header Parameters
async function loadItems() {
    const token = localStorage.getItem('budget_token');
    try {
        const response = await fetch('/api/items', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const items = await response.json();
        if (response.status === 401) return logoutBtn.click(); // Force session kill if invalid

        itemsList.innerHTML = '';
        calculateTimeframes(items);

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
        console.error("Error loading secure history ledger dataset fields:", error);
    }
}

// Add Expense Transaction Handler
submitBtn.addEventListener('click', async () => {
    const token = localStorage.getItem('budget_token');
    const textValue = itemInput.value.trim();
    const amountValue = parseFloat(amountInput.value);
    const categoryValue = categoryInput.value;

    if (!textValue || isNaN(amountValue) || amountValue <= 0) {
        return alert("Please enter a valid item name and numerical cost value parameter.");
    }

    try {
        await fetch('/api/items', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ itemName: textValue, itemAmount: amountValue, itemCategory: categoryValue })
        });

        itemInput.value = '';
        amountInput.value = '';
        loadItems();
    } catch (error) {
        console.error("Error writing expense:", error);
    }
});

// Initialization Bootstrap Run hook
checkAuthSession();
