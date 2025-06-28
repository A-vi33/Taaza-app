import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db, storage } from '../../../firebase';
import { collection, addDoc, onSnapshot, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import bgImg from '../../../assets/bg.jpg';

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
    if (!user || user.type !== 'admin') {
      navigate('/login');
      return;
    }
    const unsubscribe = onSnapshot(collection(db, 'products'), (querySnapshot) => {
      setProducts(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (err) => {
      setError('Failed to load products. ' + (err.message || ''));
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user, navigate]);

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
    <div className="relative main-content" style={{ backgroundImage: `url(${bgImg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="absolute inset-0 bg-black/60 z-0"></div>
      <div className="relative z-10 responsive-p-4 sm:responsive-p-8 max-w-3xl mx-auto">
        {/* Page Title */}
        <div className="mb-6 pb-4 border-b border-gray-200">
          <h2 className="responsive-text-2xl sm:responsive-text-3xl font-bold text-gray-800 text-center sm:text-left">
            📦 Product Management
          </h2>
          <p className="text-gray-600 responsive-text-sm sm:responsive-text-base text-center sm:text-left mt-2">
            Add, edit, and manage your product inventory
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="mb-8 space-y-4 bg-white/90 p-6 rounded-xl shadow-lg animate-fade-in-up">
          <div className="flex gap-4">
            <input name="name" value={form.name} onChange={handleChange} placeholder="Name" className="p-2 border rounded w-full focus:ring-2 focus:ring-purple-400 transition bg-white/90 text-gray-900" required />
            <select name="category" value={form.category} onChange={handleChange} className="p-2 border rounded w-full focus:ring-2 focus:ring-purple-400 transition bg-white/90 text-gray-900" required>
              <option value="" disabled>Select Category</option>
              <option value="chicken">Chicken</option>
              <option value="fish">Fish</option>
              <option value="mutton">Mutton</option>
              <option value="goat">Goat</option>
              <option value="duck">Duck</option>
              <option value="quail">Quail</option>
            </select>
            <input name="price" value={form.price} onChange={handleChange} placeholder="Price" type="number" className="p-2 border rounded w-full focus:ring-2 focus:ring-purple-400 transition bg-white/90 text-gray-900" required />
            <input name="quantity" value={form.quantity} onChange={handleChange} placeholder="Stock (kg)" type="number" min="0" className="p-2 border rounded w-full focus:ring-2 focus:ring-purple-400 transition bg-white/90 text-gray-900" required />
          </div>
          <div>
            <input name="image" type="file" accept="image/*" onChange={handleChange} className="p-2" />
          </div>
          <button className="bg-purple-600 text-white px-4 py-2 rounded shadow hover:bg-purple-700 transition" type="submit">{editingId ? 'Update' : 'Add'} Product</button>
          {editingId && <button type="button" className="ml-2 text-gray-200 hover:underline" onClick={() => { setForm({ name: '', category: '', price: '', image: null, quantity: '' }); setEditingId(null); }}>Cancel</button>}
          {error && <div className="text-red-200 mt-2 animate-fade-in">{error}</div>}
        </form>
        <h2 className="responsive-text-lg sm:responsive-text-xl font-bold mb-2 text-white drop-shadow-lg animate-fade-in" style={{textShadow:'0 2px 8px #000'}}>All Products</h2>
        {error && <div className="text-red-200 mb-4 animate-fade-in bg-red-900/50 p-3 rounded-lg">{error}</div>}
        {loading ? (
          <div className="text-center py-12 animate-fade-in text-white drop-shadow-lg bg-white/10 p-6 rounded-lg" style={{textShadow:'0 2px 8px #000'}}>
            🔄 Loading products...
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 animate-fade-in text-white drop-shadow-lg bg-white/10 p-6 rounded-lg" style={{textShadow:'0 2px 8px #000'}}>
            📦 No products available. Add your first product above!
          </div>
        ) : (
          <div className="bg-white/90 rounded-xl shadow-lg p-6 animate-fade-in-up">
            <table className="w-full rounded overflow-hidden">
              <thead>
                <tr className="bg-purple-100">
                  <th className="p-2">Image</th>
                  <th className="p-2">Name</th>
                  <th className="p-2">Category</th>
                  <th className="p-2">Price</th>
                  <th className="p-2">Stock (kg)</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product.id} className="border-t hover:bg-gray-50 transition-colors">
                    <td className="p-2">
                      <img src={product.imageUrl} alt={product.name} className="w-12 h-12 object-cover rounded" />
                    </td>
                    <td className="p-2 font-semibold">{product.name}</td>
                    <td className="p-2 capitalize">{product.category}</td>
                    <td className="p-2">
                      {editingPriceId === product.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={newPrice}
                            onChange={(e) => setNewPrice(e.target.value)}
                            className="w-16 p-1 border rounded text-sm"
                          />
                          <button onClick={() => handlePriceSave(product.id)} className="text-green-600 hover:text-green-800">✓</button>
                          <button onClick={() => setEditingPriceId(null)} className="text-red-600 hover:text-red-800">✕</button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span>₹{product.price}</span>
                          <button onClick={() => handlePriceEdit(product.id, product.price)} className="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
                        </div>
                      )}
                    </td>
                    <td className="p-2">{product.quantity}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        product.quantity > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {product.quantity > 0 ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </td>
                    <td className="p-2">
                      <button onClick={() => handleEdit(product)} className="text-blue-600 hover:text-blue-800 mr-2">Edit</button>
                      <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-800">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminProducts; 