import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db, storage } from '../../../firebase';
import { collection, addDoc, onSnapshot, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Toast from '../../Toast';

function AdminProducts() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', category: '', price: '', image: null, quantity: '', price6: '', price12: '', price30: '', pricePerEgg: '' });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState(null);
  const [editingPriceId, setEditingPriceId] = useState(null);
  const [newPrice, setNewPrice] = useState('');
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateProduct, setDuplicateProduct] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const LOW_STOCK_THRESHOLD = 30;

  useEffect(() => {
    if (!authLoading && (!user || !user.isAdmin)) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'products'), (querySnapshot) => {
      setProducts(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (err) => {
      setError('Failed to load products. ' + (err.message || ''));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  };

  const handleChange = e => {
    const { name, value, files } = e.target;
    if (name === "image" && files && files[0]) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm(f => ({ ...f, image: reader.result }));
      };
      reader.readAsDataURL(files[0]);
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    
    // 1. Validate all fields are filled
    if (form.category === 'eggs') {
      if (!form.name || !form.category || !form.pricePerEgg || !form.quantity || (!form.image && !editingId)) {
        showToast("Please fill out all product details, including the image.", "error");
        return;
      }
    } else {
      if (!form.name || !form.category || !form.price || !form.quantity || (!form.image && !editingId)) {
        showToast("Please fill out all product details, including the image.", "error");
        return;
      }
    }

    // 2. Check for duplicate product name (only when adding a new product)
    if (!editingId) {
      const productNameLower = form.name.toLowerCase().trim();
      const isDuplicate = products.some(p => p.name.toLowerCase().trim() === productNameLower);
      
      if (isDuplicate) {
        showToast("A product with this name already exists.", "error");
        return;
      }
    }
    
    try {
      let imageUrl = form.image; // In this version, image is a base64 string or existing URL
      
      const productData = {
        name: form.name,
        category: form.category,
        price: Number(form.price),
        quantity: Number(form.quantity),
        imageUrl: imageUrl, // Directly use the image URL or base64 data
        ...(form.category === 'eggs' && {
          pricePerEgg: Number(form.pricePerEgg),
        })
      };

      if (editingId) {
        await updateDoc(doc(db, 'products', editingId), productData);
        showToast("Product updated successfully", "success");
      } else {
        await addDoc(collection(db, 'products'), productData);
        showToast("Product added successfully", "success");
      }

      setForm({ name: '', category: '', price: '', image: null, quantity: '', price6: '', price12: '', price30: '', pricePerEgg: '' });
      setEditingId(null);
    } catch (err) {
      showToast("Failed to save product. Please try again.", "error");
      console.error('Product save error:', err);
    }
  };

  const handleEdit = p => {
    setForm({
      name: p.name,
      category: p.category,
      price: p.price,
      image: p.imageUrl,
      quantity: p.quantity,
      price6: p.price6 || '',
      price12: p.price12 || '',
      price30: p.price30 || '',
      pricePerEgg: p.pricePerEgg || '',
    });
    setEditingId(p.id);
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to top to see the form
  };

  const handleDelete = async id => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await deleteDoc(doc(db, 'products', id));
      showToast("Product deleted successfully", "success");
    } catch (err) {
      showToast("Failed to delete product.", "error");
    }
  };

  const handlePriceEdit = (id, price) => {
    setEditingPriceId(id);
    setNewPrice(price);
  };

  const handlePriceSave = async (id) => {
    try {
      await updateDoc(doc(db, 'products', id), { price: Number(newPrice) });
      setEditingPriceId(null);
      setNewPrice('');
    } catch (err) {
      showToast("Failed to update price.", 'error');
    }
  };

  return (
    <div className="relative main-content min-h-screen bg-green-100">
      <Toast 
        message={toast.message} 
        show={toast.show} 
        onClose={() => setToast({ ...toast, show: false })} 
        type={toast.type} 
      />
      <div className="relative z-10 responsive-p-4 sm:responsive-p-8 max-w-7xl mx-auto">
        {/* Enhanced Page Header */}
        <div className="mb-8 pb-6 border-b border-white/20">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/20">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="responsive-text-3xl sm:responsive-text-4xl font-bold text-slate-800 mb-2 flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-slate-600 to-slate-700 rounded-xl flex items-center justify-center text-white text-xl shadow-lg">
                    📦
                  </div>
                  Product Management
                </h2>
                <p className="text-slate-600 responsive-text-base sm:responsive-text-lg font-medium">
                  Add, edit, and manage your product inventory with ease
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg font-semibold text-sm">
                  📊 {products.length} Products
                </div>
                <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg font-semibold text-sm">
                  ✅ Active
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Add/Edit Form */}
        <form onSubmit={handleSubmit} className="mb-8 space-y-4 bg-white/95 backdrop-blur-md p-6 rounded-2xl shadow-xl animate-fade-in-up border border-white/20">
          <h3 className="text-lg font-bold mb-4 text-slate-800 flex items-center gap-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            <div className="w-8 h-8 bg-slate-600 rounded-lg flex items-center justify-center text-white text-sm">🛠️</div>
            Add/Edit Product
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <input 
              name="name" 
              value={form.name} 
              onChange={handleChange} 
              placeholder="Product Name" 
              className="p-3 border-2 border-slate-200 rounded-xl w-full focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all duration-200 bg-white/90 text-slate-900 font-medium shadow-sm" 
              style={{ fontFamily: 'Inter, sans-serif' }}
              required 
            />
            <select 
              name="category" 
              value={form.category} 
              onChange={handleChange} 
              className="p-3 border-2 border-slate-200 rounded-xl w-full focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all duration-200 bg-white/90 text-slate-900 font-medium shadow-sm" 
              style={{ fontFamily: 'Inter, sans-serif' }}
              required
            >
              <option value="" disabled>Select Category</option>
              <option value="chicken">Chicken</option>
              <option value="mutton">Mutton</option>
              <option value="goat">Goat</option>
              <option value="eggs">Eggs</option>
              <option value="masalas">Masalas</option>
            </select>
            {form.category === 'eggs' ? (
              <>
                <input
                  name="pricePerEgg"
                  value={form.pricePerEgg}
                  onChange={handleChange}
                  placeholder="Price (₹) per Egg"
                  type="number"
                  className="p-3 border-2 border-slate-200 rounded-xl w-full focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all duration-200 bg-white/90 text-slate-900 font-medium shadow-sm"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                  required
                />
                <input
                  name="quantity"
                  value={form.quantity}
                  onChange={handleChange}
                  placeholder="Total Eggs in Stock (pieces)"
                  type="number"
                  className="p-3 border-2 border-slate-200 rounded-xl w-full focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all duration-200 bg-white/90 text-slate-900 font-medium shadow-sm"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                  required
                />
              </>
            ) : (
              <>
                <input 
                  name="price" 
                  value={form.price} 
                  onChange={handleChange} 
                  placeholder="Price (₹/kg)" 
                  type="number" 
                  className="p-3 border-2 border-slate-200 rounded-xl w-full focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all duration-200 bg-white/90 text-slate-900 font-medium shadow-sm" 
                  style={{ fontFamily: 'Inter, sans-serif' }}
                  required 
                />
                <input 
                  name="quantity" 
                  value={form.quantity} 
                  onChange={handleChange} 
                  placeholder="Stock (kg)" 
                  type="number" 
                  min="0" 
                  className="p-3 border-2 border-slate-200 rounded-xl w-full focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all duration-200 bg-white/90 text-slate-900 font-medium shadow-sm" 
                  style={{ fontFamily: 'Inter, sans-serif' }}
                  required 
                />
              </>
            )}
          </div>
          <div className="flex items-center gap-4">
            <input 
              name="image" 
              type="file" 
              accept="image/*" 
              onChange={handleChange} 
              className="p-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all duration-200 bg-white/90 text-slate-900 font-medium shadow-sm" 
              style={{ fontFamily: 'Inter, sans-serif' }}
            />
            {form.image && (
              <img src={form.image} alt="Preview" className="w-16 h-16 object-cover rounded-xl border-2 border-slate-200 shadow-sm" />
            )}
          </div>
          <div className="flex gap-2">
            <button 
              className="bg-slate-600 text-white px-6 py-3 rounded-xl shadow-lg hover:bg-slate-700 transition font-semibold" 
              type="submit"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              {editingId ? 'Update' : 'Add'} Product
            </button>
            {editingId && (
              <button 
                type="button" 
                className="px-6 py-3 text-slate-600 hover:text-slate-800 border border-slate-300 rounded-xl hover:bg-slate-50 transition shadow-sm" 
                onClick={() => { setForm({ name: '', category: '', price: '', image: null, quantity: '', price6: '', price12: '', price30: '', pricePerEgg: '' }); setEditingId(null); }}
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
        
        {error && <div className="mb-4 p-4 bg-red-100 border border-red-300 text-red-700 rounded-xl shadow-sm">{error}</div>}
        
        {/* Products List Section */}
        <div className="bg-white/95 backdrop-blur-md p-6 rounded-2xl shadow-xl animate-fade-in-up border border-white/20">
          <h3 className="text-lg font-bold mb-4 text-slate-800 flex items-center gap-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            <div className="w-8 h-8 bg-slate-600 rounded-lg flex items-center justify-center text-white text-sm">📋</div>
            Product Inventory
          </h3>
          {loading ? (
            <div className="text-center py-8"><div className="text-slate-600 responsive-text-lg font-medium">🔄 Loading products...</div></div>
          ) : products.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-slate-600 responsive-text-lg font-medium">📦 No products available</div>
              <p className="text-slate-500 responsive-text-sm mt-2">Add your first product using the form above.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map(product => (
                <div key={product.id} className="group relative bg-yellow-100 backdrop-blur-md border-2 border-white/20 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden flex flex-col">
                  <img src={product.imageUrl} alt={product.name} className="w-full h-48 object-cover" />
                  
                  <div className="p-4 flex flex-col flex-grow">
                    <div>
                      <h4 className="font-bold text-slate-900 responsive-text-lg mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>{product.name}</h4>
                      <p className="text-slate-600 responsive-text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                        Category: <span className="font-medium text-slate-700">{product.category}</span>
                      </p>
                      {product.category === 'eggs' ? (
                        <>
                          <p className="text-slate-600 responsive-text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                            Price: <span className="font-medium text-slate-700">₹{product.pricePerEgg}/egg</span>
                          </p>
                          <p className="text-slate-600 responsive-text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                            Stock: <span className="font-medium text-slate-700">{product.quantity} pieces</span>
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-slate-600 responsive-text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                            Price: <span className="font-medium text-slate-700">₹{product.price}/kg</span>
                          </p>
                          <p className="text-slate-600 responsive-text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                            Stock: <span className="font-medium text-slate-700">{product.quantity} kg</span>
                          </p>
                        </>
                      )}
                    </div>

                    <div className="flex-grow" />

                    <div className="mt-4">
                      {product.category === 'eggs' ? null : (
                        editingPriceId === product.id ? (
                          <div className="space-y-2">
                            <input type="number" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-400 focus:border-slate-400" placeholder="New Price"/>
                            <div className="flex gap-2">
                              <button onClick={() => handlePriceSave(product.id)} className="flex-1 bg-slate-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-slate-700 shadow-sm">Save</button>
                              <button onClick={() => setEditingPriceId(null)} className="flex-1 bg-slate-400 text-white px-3 py-1 rounded-lg text-sm hover:bg-slate-500 shadow-sm">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-700 responsive-text-lg" style={{ fontFamily: 'Inter, sans-serif' }}>₹{product.price}/kg</span>
                            <button onClick={() => handlePriceEdit(product.id, product.price)} className="bg-slate-200 text-slate-800 px-3 py-1 rounded-lg text-xs font-semibold hover:bg-slate-300 transition shadow-sm">Edit Price</button>
                          </div>
                        )
                      )}
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-slate-200 flex gap-2">
                      <button onClick={() => handleEdit(product)} className="flex-1 bg-slate-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-slate-700 transition shadow-sm font-semibold">Edit Details</button>
                      <button onClick={() => handleDelete(product.id)} className="flex-1 bg-red-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-red-700 transition shadow-sm font-semibold">Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Duplicate Product Warning Modal */}
      {showDuplicateModal && duplicateProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-200 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-800" 
                  style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Product Already Exists
              </h3>
            </div>
            
            <div className="mb-6">
              <p className="text-slate-600 mb-3" 
                 style={{ fontFamily: 'Inter, sans-serif' }}>
                A product with the same name and image already exists in your inventory.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <img 
                    src={duplicateProduct.imageUrl} 
                    alt={duplicateProduct.name} 
                    className="w-12 h-12 object-cover rounded-lg border border-yellow-200" 
                  />
                  <div>
                    <p className="text-sm text-yellow-800 font-medium" 
                       style={{ fontFamily: 'Inter, sans-serif' }}>
                      {duplicateProduct.name}
                    </p>
                    <p className="text-sm text-yellow-700" 
                       style={{ fontFamily: 'Inter, sans-serif' }}>
                      Category: {duplicateProduct.category}
                    </p>
                    <p className="text-sm text-yellow-700" 
                       style={{ fontFamily: 'Inter, sans-serif' }}>
                      Price: ₹{duplicateProduct.price}/kg
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-slate-500 mt-3" 
                 style={{ fontFamily: 'Inter, sans-serif' }}>
                Please use a different product name or image to add a new product.
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => { setShowDuplicateModal(false); setDuplicateProduct(null); }}
                className="flex-1 bg-slate-500 text-white px-4 py-2 rounded-xl hover:bg-slate-600 transition font-semibold"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                OK, I Understand
              </button>
              <button
                onClick={() => {
                  setShowDuplicateModal(false);
                  setDuplicateProduct(null);
                  setForm({ name: '', category: '', price: '', image: null, quantity: '', price6: '', price12: '', price30: '', pricePerEgg: '' });
                }}
                className="flex-1 bg-yellow-600 text-white px-4 py-2 rounded-xl hover:bg-yellow-700 transition font-semibold"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Clear Form
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminProducts; 