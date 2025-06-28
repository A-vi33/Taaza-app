import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db, storage } from '../../../firebase';
import { collection, addDoc, onSnapshot, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Toast from '../../Toast';

function AdminProducts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', category: '', price: '', image: null, quantity: '' });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState(null);
  const [editingPriceId, setEditingPriceId] = useState(null);
  const [newPrice, setNewPrice] = useState('');

  useEffect(() => {
    if (!user || !user.isAdmin) {
      navigate('/login');
    }
  }, [user, navigate]);

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
    setError(null);
    try {
      let imageUrl = form.image;
      if (editingId) {
        await updateDoc(doc(db, 'products', editingId), {
          name: form.name,
          category: form.category,
          price: Number(form.price),
          imageUrl,
          quantity: Number(form.quantity),
        });
      } else {
        await addDoc(collection(db, 'products'), {
          name: form.name,
          category: form.category,
          price: Number(form.price),
          imageUrl,
          quantity: Number(form.quantity),
        });
      }
      setForm({ name: '', category: '', price: '', image: null, quantity: '' });
      setEditingId(null);
    } catch (err) {
      setError('Failed to save product.');
      console.error('Image upload or product save error:', err);
    }
  };

  const handleEdit = p => {
    setForm({ name: p.name, category: p.category, price: p.price, image: p.imageUrl, quantity: p.quantity });
    setEditingId(p.id);
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this product?')) return;
    await deleteDoc(doc(db, 'products', id));
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
      setError('Failed to update price.');
    }
  };

  return (
    <div className="relative main-content min-h-screen bg-white">
      <div className="relative z-10 responsive-p-4 sm:responsive-p-8 max-w-6xl mx-auto">
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
        
        <form onSubmit={handleSubmit} className="mb-8 space-y-4 bg-white/95 backdrop-blur-md p-6 rounded-2xl shadow-xl animate-fade-in-up border border-white/20">
          <h3 className="text-lg font-bold mb-4 text-slate-800 flex items-center gap-2" 
              style={{ fontFamily: 'Montserrat, sans-serif' }}>
            <div className="w-8 h-8 bg-slate-600 rounded-lg flex items-center justify-center text-white text-sm">
              🛠️
            </div>
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
              <option value="fish">Fish</option>
              <option value="mutton">Mutton</option>
              <option value="goat">Goat</option>
              <option value="duck">Duck</option>
              <option value="quail">Quail</option>
            </select>
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
                onClick={() => { setForm({ name: '', category: '', price: '', image: null, quantity: '' }); setEditingId(null); }}
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
        
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-300 text-red-700 rounded-xl shadow-sm" 
               style={{ fontFamily: 'Inter, sans-serif' }}>
            {error}
          </div>
        )}
        
        {/* Products List */}
        <div className="bg-white/95 backdrop-blur-md p-6 rounded-2xl shadow-xl animate-fade-in-up border border-white/20">
          <h3 className="text-lg font-bold mb-4 text-slate-800 flex items-center gap-2" 
              style={{ fontFamily: 'Montserrat, sans-serif' }}>
            <div className="w-8 h-8 bg-slate-600 rounded-lg flex items-center justify-center text-white text-sm">
              📋
            </div>
            Product Inventory
          </h3>
          {loading ? (
            <div className="text-center py-8">
              <div className="text-slate-600 responsive-text-lg font-medium" 
                   style={{ fontFamily: 'Inter, sans-serif' }}>
                🔄 Loading products...
              </div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-slate-600 responsive-text-lg font-medium" 
                   style={{ fontFamily: 'Inter, sans-serif' }}>
                📦 No products available
              </div>
              <p className="text-slate-500 responsive-text-sm mt-2" 
                 style={{ fontFamily: 'Inter, sans-serif' }}>
                Add your first product using the form above.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {products.map(product => (
                <div key={product.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors shadow-sm">
                  <div className="flex items-center gap-4">
                    <img 
                      src={product.imageUrl} 
                      alt={product.name} 
                      className="w-16 h-16 object-cover rounded-xl border-2 border-slate-200 shadow-sm" 
                    />
                    <div>
                      <h4 className="font-bold text-slate-900 responsive-text-lg" 
                          style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        {product.name}
                      </h4>
                      <p className="text-slate-600 responsive-text-sm" 
                         style={{ fontFamily: 'Inter, sans-serif' }}>
                        Category: {product.category}
                      </p>
                      <p className="text-slate-600 responsive-text-sm" 
                         style={{ fontFamily: 'Inter, sans-serif' }}>
                        Stock: {product.quantity} kg
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {editingPriceId === product.id ? (
                      <div className="flex items-center gap-2">
                        <input 
                          type="number" 
                          value={newPrice} 
                          onChange={(e) => setNewPrice(e.target.value)} 
                          className="w-20 p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
                        />
                        <button 
                          onClick={() => handlePriceSave(product.id)} 
                          className="bg-slate-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-slate-700 shadow-sm"
                        >
                          Save
                        </button>
                        <button 
                          onClick={() => setEditingPriceId(null)} 
                          className="bg-slate-400 text-white px-3 py-1 rounded-lg text-sm hover:bg-slate-500 shadow-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <span className="font-bold text-slate-700 responsive-text-lg" 
                            style={{ fontFamily: 'Inter, sans-serif' }}>
                        ₹{product.price}/kg
                      </span>
                    )}
                    <button 
                      onClick={() => handlePriceEdit(product.id, product.price)} 
                      className="bg-slate-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-slate-700 transition shadow-sm"
                    >
                      Edit Price
                    </button>
                    <button 
                      onClick={() => handleEdit(product)} 
                      className="bg-slate-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-slate-700 transition shadow-sm"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(product.id)} 
                      className="bg-red-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-700 transition shadow-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminProducts; 