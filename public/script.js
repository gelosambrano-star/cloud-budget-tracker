// HTML Element Selectors
const submitBtn = document.getElementById('submit-btn');
const itemInput = document.getElementById('item-input');
const amountInput = document.getElementById('amount-input');
const categoryInput = document.getElementById('category-input');
const itemsList = document.getElementById('items-list');

// Metric Summary Cards Display
const weeklyDisplay = document.getElementById('total-weekly');
const monthlyDisplay = document.getElementById('total-monthly');
const yearlyDisplay = document.getElementById('total-yearly');

// Function to calculate timeline spending metrics
function calculateTimeframes(items) {
    const now = new Date();
    
    let weeklySum = 0;
    let monthlySum = 0;
    let yearlySum = 0;

    items.forEach(item => {
        const itemDate = new Date(item.createdAt);
        const amount = item.amount || 0;

        // 1. Filter out items by Current Year
        if (itemDate.getFullYear() === now.getFullYear()) {
            yearlySum += amount;

            // 2. Filter out items by Current Month
            if (itemDate.getMonth() === now.getMonth()) {
                monthlySum += amount;
            }

            // 3. Filter out items by Last 7 Days (Weekly View)
            const timeDifference = now.getTime() - itemDate.getTime();
            const daysDifference = timeDifference / (1000 * 3600 * 24);
            if (daysDifference <= 7) {
                weeklySum += amount;
            }
        }
    });

    // Render aggregated math calculations into dashboard cards
    weeklyDisplay.textContent = `₱${weeklySum.toFixed(2)}`;
    monthlyDisplay.textContent = `₱${monthlySum.toFixed(2)}`;
    yearlyDisplay.textContent = `₱${yearlySum.toFixed(2)}`;
}

// Function to fetch data from cloud and build layout list elements
async function loadItems() {
    try {
        console.log("Fetching items from database...");
        const response = await fetch('/api/items');
        const items = await response.json();
        
        // Wipe old lists before rendering fresh copies
        itemsList.innerHTML = '';
        
        // Pass complete data array payload to calculate timeline card stats
        calculateTimeframes(items);
        
        items.forEach(item => {
            const li = document.createElement('li');
            
            // Left Container: Stacks Item Name and Category Tag vertically
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
            spanCategory.textContent = item.category || "💡 Bills"; // Fallback placeholder for old metadata entries

            leftContainer.appendChild(spanText);
            leftContainer.appendChild(spanCategory);

            // Right Container: Aligns item numeric price string and delete cross action inline
            const rightContainer = document.createElement('div');
            rightContainer.style.display = 'flex';
            rightContainer.style.alignItems = 'center';
            
            const spanPrice = document.createElement('span');
            spanPrice.className = 'item-price';
            spanPrice.textContent = `₱${(item.amount || 0).toFixed(2)}`; // Fallback fix avoiding crashes on old layout fields
            
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '❌';
            deleteBtn.className = 'delete-btn';
            
            // Delete listener connecting straight to Cloud Mongoose delete route parameters
            deleteBtn.addEventListener('click', async () => {
                try {
                    await fetch(`/api/items/${item._id}`, { method: 'DELETE' });
                    loadItems(); // Automatically recalculate metrics and list instantly on erase
                } catch (err) {
                    console.error("Error deleting database document:", err);
                }
            });

            rightContainer.appendChild(spanPrice);
            rightContainer.appendChild(deleteBtn);
            
            // Bind everything to parent list row wrapper frame
            li.appendChild(leftContainer);
            li.appendChild(rightContainer);
            itemsList.appendChild(li);
        });
    } catch (error) {
        console.error("Error loading items from cloud network:", error);
    }
}

// Click listener to handle adding an expense transaction payload package
submitBtn.addEventListener('click', async () => {
    const textValue = itemInput.value.trim();
    const amountValue = parseFloat(amountInput.value);
    const categoryValue = categoryInput.value;

    // Frontend validation form safeguard parameter limits
    if (!textValue || isNaN(amountValue) || amountValue <= 0) {
        return alert("Please enter a valid item name and numeric amount cost configuration!");
    }

    try {
        console.log("Sending organized transaction payload package to backend route...");
        
        // Ship unified structural parameters package across Express API port endpoints
        await fetch('/api/items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                itemName: textValue, 
                itemAmount: amountValue,
                itemCategory: categoryValue // Sends dropdown string item tag choice selections
            })
        });

        // Reset input fields interface states upon complete submission confirmation
        itemInput.value = '';
        amountInput.value = '';
        
        loadItems(); // Pull updated dataset maps from server logs grid dashboard parameters
    } catch (error) {
        console.error("Error creating record entry log:", error);
    }
});

// Primary lifecycle hook loading your application components data arrays on load
loadItems();
