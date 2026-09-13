// --- 1. CORE DEPENDENCIES & ENVIRONMENT SETUP ---
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']); // Custom DNS routing lock patch

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;

// Security Signature Token Key Parameter Mask Fallback
const JWT_SECRET = process.env.JWT_SECRET || "SUPER_SECRET_SECURITY_NODE_SIGNATURE";

// Middleware Configurations
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- 2. DATABASE CLUSTER HANDSHAKE LINK ---
const myDirectLink = process.env.MONGODB_URI || "mongodb+srv://gelosambrano_db_user:NreRCKLmTpPicouv@cluster0.auzbimk.mongodb.net/fullstack_practice?retryWrites=true&w=majority";

mongoose.connect(myDirectLink)
    .then(() => console.log('✅ Connected successfully to your Cloud Portfolio DB!'))
    .catch(err => console.error('❌ Cloud connection error:', err));

// --- 3. MONGOOSE STRUCTURAL DATA SCHEMAS ---

// User Account Identity Profile Blueprint
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true }
});
const User = mongoose.model('User', UserSchema);

// Budget Entry Ledger Blueprint (Linked directly to an Owner User ID)
const ItemSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
    amount: { type: Number, required: true },
    category: { type: String, default: "🍔 Food" },
    createdAt: { type: Date, default: Date.now }
});
const Item = mongoose.model('Item', ItemSchema);

// --- 4. SECURE AUTHENTICATION INTERCEPTOR MIDDLEWARE ---
const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ error: "Access Denied. Please sign in first." });
        }
        
        const token = authHeader.split(" ")[1];
        const verified = jwt.verify(token, JWT_SECRET);
        req.user = verified; // Injects validated user identity fields into the request
        next();
    } catch (err) {
        res.status(401).json({ error: "Invalid login session parameters." });
    }
};

// --- 5. AUTHENTICATION ROUTE ENDPOINTS ---

// REGISTER API: Account Creation & Encryption Gateway
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: "Please type a valid username and password configuration!" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();
        res.json({ message: "Account created successfully! You can now sign in." });
    } catch (err) {
        res.status(400).json({ error: "Username already exists in security index maps." });
    }
});

// LOGIN API: Authentication Token Generation Gateway
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ error: "Invalid profile username credentials." });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: "Incorrect security password parameters configuration." });

        // Sign token session mapping logic
        const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, username: user.username });
    } catch (err) {
        res.status(500).json({ error: "Login server pipeline connection fault error." });
    }
});

// --- 6. SECURED TRANSACTIONAL LEDGER API ROUTES ---

// GET: Fetches Only the Authenticated User's Expenses
app.get('/api/items', authMiddleware, async (req, res) => {
    try {
        const userItems = await Item.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json(userItems);
    } catch (error) {
        res.status(500).json({ error: "Failed to pull secured database ledger documents maps." });
    }
});

// POST: Saves Entry and Binds it to the Logged User's ID Parameter
app.post('/api/items', authMiddleware, async (req, res) => {
    try {
        const newItem = new Item({ 
            userId: req.user.id,
            text: req.body.itemName,
            amount: parseFloat(req.body.itemAmount),
            category: req.body.itemCategory
        });
        const savedItem = await newItem.save();
        res.json({ message: "Successfully logged item to secure storage space!", item: savedItem });
    } catch (error) {
        res.status(500).json({ error: "Cloud asset save transaction failure structural block map error." });
    }
});

// DELETE: Clears Entry Only If It Belongs to the Verified Request User
app.delete('/api/items/:id', authMiddleware, async (req, res) => {
    try {
        const deletedItem = await Item.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        if (!deletedItem) {
            return res.status(404).json({ error: "Unauthorized operation or record entry mapping not found." });
        }
        res.json({ message: "Item cleared from profile schema history ledger parameters!" });
    } catch (error) {
        res.status(500).json({ error: "Failed to erase document target asset from cloud index node map." });
    }
});

// Catch-all frontend interface static router mapping parameters
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- 7. SERVER COMPILE BOOT LISTEN CHANNEL ---
app.listen(PORT, () => {
    console.log(`🚀 Server executing live at http://0.0.0:${PORT}`);
});
