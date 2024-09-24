const express = require("express");
const bodyParser = require("body-parser");
const PORT = 8082;
const app = express();
const cors = require('cors');
app.use(cors());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

let items = [{
    id: 1,
    itemName: 'Sugar',
    unitPrice: 40,
    qty: 2,
    isPurchased: false
},
{
    id: 2,
    itemName: 'Chocolate',
    unitPrice: 40,
    qty: 5,
    isPurchased: false
},
{
    id: 3,
    itemName: 'Guitar',
    unitPrice: 1500,
    qty: 1,
    isPurchased: false
},
{
    id: 4,
    itemName: 'Oil',
    unitPrice: 40,
    qty: 1,
    isPurchased: false
}]

app.get('/get_items', (req, res) => {
    res.json(items);
});

app.post("/add_item", (req, res) => {
    console.log(req.body)
    const { itemName, unitPrice, qty } = req.body;
    if (itemName && unitPrice && qty) {
        let obj = {
            id: items.length + 1,
            itemName: itemName,
            unitPrice: unitPrice,
            qty: qty,
            isPurchased: false,
        };
        items.push(obj);
        res.status(201).json({ success: "y", data: items });
    } else {
        res.status(400).json({ success: "n", message: "Missing required fields" });
    }
});

app.patch("/update_status/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const { isPurchased } = req.body;

    const itemIndex = items.findIndex(item => item.id === id);

    if (itemIndex === -1) {
        return res.status(404).json({ success: "n", message: "Item not found" });
    }

    if (isPurchased === undefined) {
        return res.status(400).json({ success: "n", message: "isPurchased status is required" });
    }

    items[itemIndex].isPurchased = isPurchased;

    res.json({ success: "y", data: items[itemIndex] });
});

app.put("/update_item/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const { itemName, unitPrice, qty } = req.body;
  
    const itemIndex = items.findIndex((item) => item.id === id);
  
    if (itemIndex === -1) {
      return res.status(404).json({ success: "n", message: "Item not found" });
    }
  
    items[itemIndex] = {
      ...items[itemIndex],
      itemName: itemName || items[itemIndex].itemName,
      unitPrice: unitPrice || items[itemIndex].unitPrice,
      qty: qty || items[itemIndex].qty,
    };
  
    res.json({ success: "y", data: items[itemIndex] });
  });
  
  app.delete("/delete_item/:id", (req, res) => {
    const id = parseInt(req.params.id);
  
    const initialLength = items.length;
    items = items.filter((item) => item.id !== id);
  
    if (items.length === initialLength) {
      return res.status(404).json({ success: "n", message: "Item not found" });
    }
  
    res.json({ success: "y", message: "Item deleted successfully" });
  });

app.listen(PORT, () => {
    console.log(`Server is running at ${PORT}`);
});