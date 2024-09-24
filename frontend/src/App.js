import React, { useState, useEffect, useMemo, useCallback, createContext, useContext } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Grid,
  IconButton,
} from '@mui/material';
import { Add, Close, LocalGroceryStore, Edit, Delete } from '@mui/icons-material';
import { createTheme, ThemeProvider } from '@mui/material/styles';

const theme = createTheme();

const GlobalStoreContext = createContext();

const GlobalStoreProvider = ({ children }) => {
  const [items, setItems] = useState([]);

  const fetchItems = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:8082/get_items`);
      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  }, []);

  const addItem = useCallback(async (newItem) => {
    try {
      const response = await fetch(`http://localhost:8082/add_item`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newItem),
      });
      const data = await response.json();
      if (data.success === "y") {
        setItems(data.data);
        return true;
      } else {
        console.error('Error adding item:', data.message);
        return false;
      }
    } catch (error) {
      console.error('Error adding item:', error);
      return false;
    }
  }, []);

  const updateItemStatus = useCallback(async (id) => {
    try {
      const response = await fetch(`http://localhost:8082/update_status/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isPurchased: true }),
      });
      const data = await response.json();
      if (data.success === "y") {
        setItems(prevItems => prevItems.map(item =>
          item.id === id ? { ...item, isPurchased: true } : item
        ));
        return true;
      } else {
        console.error('Error updating purchase status:', data.message);
        return false;
      }
    } catch (error) {
      console.error('Error updating purchase status:', error);
      return false;
    }
  }, []);

  const editItem = useCallback(async (id, updatedItem) => {
    try {
      const response = await fetch(`http://localhost:8082/update_item/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedItem),
      });
      const data = await response.json();
      if (data.success === "y") {
        setItems(prevItems => prevItems.map(item =>
          item.id === id ? { ...item, ...data.data } : item
        ));
        return true;
      } else {
        console.error('Error editing item:', data.message);
        return false;
      }
    } catch (error) {
      console.error('Error editing item:', error);
      return false;
    }
  }, []);

  const deleteItem = useCallback(async (id) => {
    try {
      const response = await fetch(`http://localhost:8082/delete_item/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success === "y") {
        setItems(prevItems => prevItems.filter(item => item.id !== id));
        return true;
      } else {
        console.error('Error deleting item:', data.message);
        return false;
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      return false;
    }
  }, []);

  const value = {
    items,
    fetchItems,
    addItem,
    updateItemStatus,
    editItem,
    deleteItem,
  };

  return (
    <GlobalStoreContext.Provider value={value}>
      {children}
    </GlobalStoreContext.Provider>
  );
};

const Modal = ({ isOpen, onClose, children, title }) => {
  return (
    <Dialog open={isOpen} onClose={onClose}>
      <DialogTitle>
        {title}
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
          }}
        >
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent>{children}</DialogContent>
    </Dialog>
  );
};

function App() {
  const { items, fetchItems, addItem, updateItemStatus, editItem, deleteItem } = useContext(GlobalStoreContext);
  const [currentItem, setCurrentItem] = useState({
    itemName: '',
    unitPrice: '',
    qty: ''
  });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);

  // useEffect(() => {
  //   fetchItems();
  // }, [fetchItems]);

  const handleInput = (e) => {
    const { name, value } = e.target;
    setCurrentItem(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleAddItem = async () => {
    const success = await addItem(currentItem);
    if (success) {
      setCurrentItem({ itemName: '', unitPrice: '', qty: '' });
      setIsAddModalOpen(false);
    }
  };

  const handleEditItem = async () => {
    const success = await editItem(editingItemId, currentItem);
    if (success) {
      setCurrentItem({ itemName: '', unitPrice: '', qty: '' });
      setIsEditModalOpen(false);
      setEditingItemId(null);
    }
  };

  const handleDeleteItem = async (id) => {
    const confirmed = window.confirm("Are you sure you want to delete this item?");
    if (confirmed) {
      await deleteItem(id);
    }
  };

  const openEditModal = (item) => {
    setCurrentItem({
      itemName: item.itemName,
      unitPrice: item.unitPrice,
      qty: item.qty
    });
    setEditingItemId(item.id);
    setIsEditModalOpen(true);
  };

  const handlePurchase = (id) => {
    updateItemStatus(id);
  };

  const totalAmount = useMemo(() => {
    return items
      .filter(item => item.isPurchased)
      .reduce((total, item) => total + (parseFloat(item.unitPrice) * parseFloat(item.qty)), 0)
      .toFixed(2);
  }, [items]);

  return (
    <ThemeProvider theme={theme}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Shopping List
          </Typography>
        </Toolbar>
      </AppBar>
      <Container>
        <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Item">
          <DialogContent>
            <TextField
              fullWidth
              margin="dense"
              label="Item Name"
              type="text"
              name="itemName"
              value={currentItem.itemName}
              onChange={handleInput}
            />
            <TextField
              fullWidth
              margin="dense"
              label="Unit Price"
              type="text"
              name="unitPrice"
              value={currentItem.unitPrice}
              onChange={handleInput}
            />
            <TextField
              fullWidth
              margin="dense"
              label="Quantity"
              type="text"
              name="qty"
              value={currentItem.qty}
              onChange={handleInput}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleAddItem} variant="contained" startIcon={<Add />}>
              Add Item
            </Button>
          </DialogActions>
        </Modal>

        <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Item">
          <DialogContent>
            <TextField
              fullWidth
              margin="dense"
              label="Item Name"
              type="text"
              name="itemName"
              value={currentItem.itemName}
              onChange={handleInput}
            />
            <TextField
              fullWidth
              margin="dense"
              label="Unit Price"
              type="text"
              name="unitPrice"
              value={currentItem.unitPrice}
              onChange={handleInput}
            />
            <TextField
              fullWidth
              margin="dense"
              label="Quantity"
              type="text"
              name="qty"
              value={currentItem.qty}
              onChange={handleInput}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleEditItem} variant="contained" startIcon={<Edit />}>
              Update Item
            </Button>
          </DialogActions>
        </Modal>

        <Typography variant="h4" component="h2" gutterBottom>
         Total Amount : Rs {totalAmount}
        </Typography>

        <Button variant="contained" onClick={fetchItems} sx={{ my: 2 }}>
          Get Data
        </Button>

        <Grid container spacing={2}>
          {items.map((curr) => (
            <Grid item xs={12} sm={6} md={4} key={curr.id}>
              <Card>
                <CardContent>
                  <LocalGroceryStore sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                  <Typography gutterBottom variant="h5" component="div">
                    {curr.itemName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Quantity: {curr.qty}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Price: {curr.unitPrice * curr.qty}
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handlePurchase(curr.id)}
                    disabled={curr.isPurchased}
                    sx={{ mt: 2, mr: 1 }}
                  >
                    Purchase
                  </Button>
                  {!curr.isPurchased && (
                    <>
                      <IconButton onClick={() => openEditModal(curr)} color="primary">
                        <Edit />
                      </IconButton>
                      <IconButton onClick={() => handleDeleteItem(curr.id)} color="error">
                        <Delete />
                      </IconButton>
                    </>
                  )}
                  
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
        
        <Button
          variant="contained"
          color="primary"
          onClick={() => setIsAddModalOpen(true)}
          startIcon={<Add />}
          sx={{ mt: 4, mb: 2 }}
        >
          Add Items
        </Button>
      </Container>
    </ThemeProvider>
  );
}

const AppWrapper = () => (
  <GlobalStoreProvider>
    <App />
  </GlobalStoreProvider>
);

export default AppWrapper;