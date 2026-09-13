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

// 2. Map incoming category values from frontend payload
app.post('/api/items', async (req, res) => {
    try {
        const newItem = new Item({ 
            text: req.body.itemName,
            amount: parseFloat(req.body.itemAmount),
            category: req.body.itemCategory // Capture the category selection
        });
        const savedItem = await newItem.save();
        res.json({ message: "Successfully saved!", item: savedItem });
    } catch (error) {
        res.status(500).json({ error: "Failed to save item." });
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
