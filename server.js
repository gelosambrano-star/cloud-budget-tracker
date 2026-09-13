const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']); 

const express = require('express');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT = 3000;

app.use(express.static('public'));
app.use(express.json());

// HARDCODED CONSTANT STRING (Notice the different variable name 'myDirectLink')
// UPDATED WITH SIMPLIFIED TEST PASSWORD
const myDirectLink = "mongodb+srv://gelosambrano_db_user:hellofullstack123@cluster0.auzbimk.mongodb.net/fullstack_practice?retryWrites=true&w=majority";


// Use our unique custom variable here:
mongoose.connect(myDirectLink)
  .then(() => console.log('✅ Connected successfully to your Cloud Portfolio DB!'))
  .catch(err => console.error('❌ Cloud connection error:', err));



// 6. Define Data Blueprint (Schema & Model)
// --- (Keep your DNS patches, Express imports, and Mongoose connection lines at the top exactly the same) ---

// 1. Upgraded Data Blueprint to track numeric prices and logging dates
//const ItemSchema = new mongoose.Schema({
  //  text: { type: String, required: true },
    //amount: { type: Number, required: true }, // Stores the cost as a number
    //createdAt: { type: Date, default: Date.now } // Track when it was bought
//});

//const Item = mongoose.model('Item', ItemSchema);

// 2. Upgraded API Endpoint to handle name AND numeric cost parameters
//app.post('/api/items', async (req, res) => {
  //  try {
    //    const newItem = new Item({ 
        //    text: req.body.itemName,
      //      amount: parseFloat(req.body.itemAmount) // Ensure it saves as a clean number
        //});
        //const savedItem = await newItem.save();
        //res.json({ message: "Successfully saved to Cloud!", item: savedItem });
    //} catch (error) {
      //  res.status(500).json({ error: "Failed to save item." });
    //}
//});





const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// A placeholder strong secret token signature for local verification steps
const JWT_SECRET = process.env.JWT_SECRET || "SUPER_SECRET_SECURITY_NODE_SIGNATURE";

// 1. Brand New User Identity Profile Blueprint
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true }
});
const User = mongoose.model('User', UserSchema);

// 2. Upgraded Item Blueprint linked straight to an owner id string parameter
const ItemSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Ties to owner account
    text: { type: String, required: true },
    amount: { type: Number, required: true },
    category: { type: String, default: "🍔 Food" },
    createdAt: { type: Date, default: Date.now }
});
const Item = mongoose.model('Item', ItemSchema);
/ A. Helper Security Gateway Middleware verification layer
const authMiddleware = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) return res.status(401).json({ error: "Access Denied. Please log in first." });
        
        const verified = jwt.verify(token, JWT_SECRET);
        req.user = verified; // Injects validated user information fields package
        next();
    } catch (err) {
        res.status(401).json({ error: "Invalid login token." });
    }
};

// B. REGISTER EndPoint Route API
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();
        res.json({ message: "Registration successful!" });
    } catch (err) {
        res.status(400).json({ error: "Username already exists." });
    }
});

// C. LOGIN EndPoint Route API
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ error: "User not found." });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: "Incorrect security password mapping parameters." });

        const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, username: user.username });
    } catch (err) {
        res.status(500).json({ error: "Login server pipeline failure error." });
    }
});
// --- (Keep your app.get, app.delete, and app.listen blocks below exactly the same) ---

// CRITICAL: Make sure it says '/api/items/:id' (with a colon)
app.delete('/api/items/:id', async (req, res) => {
    try {
        const itemId = req.params.id;
        
        // Remove document from MongoDB Atlas Cloud
        const deletedItem = await Item.findByIdAndDelete(itemId);
        
        if (!deletedItem) {
            return res.status(404).json({ error: "Item not found in database." });
        }
        
        res.json({ message: "Successfully deleted!", item: deletedItem });
    } catch (error) {
        console.error("Delete endpoint crashed:", error);
        res.status(500).json({ error: "Failed to delete item." });
    }
});

// FETCH all items (GET)
app.get('/api/items', async (req, res) => {
    try {
        const allItems = await Item.find().sort({ createdAt: -1 });
        res.json(allItems);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch items." });
    }
});


// 8. Start Server Listeners
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:3000`);
});
