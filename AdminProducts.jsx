import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db, storage } from '../../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import bgImg from '../../assets/bg.jpg';

// Toast notification component
function Toast({ message, show, onClose, type = 'success' }) {
  return (
    <div
      className={`fixed top-6 right-6 z-50 transition-all duration-500 ${show ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-20'} ${type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white px-6 py-3 rounded shadow-lg flex items-center gap-2`}
      style={{ pointerEvents: show ? 'auto' : 'none' }}
    >
      {type === 'success' ? (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
      )}
      <span>{message}</span>
      <button className="ml-2 text-white/80 hover:text-white" onClick={onClose}>&times;</button>
    </div>
  );
}

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
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    if (!user || user.type !== 'admin') {
      navigate('/login');
      return;
    }
    // Real-time updates
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
      showToast('Product saved successfully!');
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
    showToast('Product deleted successfully!');
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
      showToast('Price updated successfully!');
    } catch (err) {
      setError('Failed to update price.');
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type }), 3000);
  };

  return (
    <div className="relative min-h-screen" style={{ backgroundImage: `url(${bgImg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="absolute inset-0 bg-black/60 z-0"></div>
      <div className="relative z-10 p-8 max-w-3xl mx-auto">
        <Toast message={toast.message} show={toast.show} onClose={() => setToast({ ...toast, show: false })} type={toast.type} />
        <h1 className="text-3xl font-extrabold mb-8 text-center text-white drop-shadow-lg tracking-tight animate-fade-in" style={{textShadow:'0 2px 8px #000'}}>Product Management</h1>
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
        <h2 className="text-lg font-bold mb-2 text-white drop-shadow-lg animate-fade-in" style={{textShadow:'0 2px 8px #000'}}>All Products</h2>
        {error && <div className="text-red-200 mb-4 animate-fade-in">{error}</div>}
        {loading ? <div className="text-center py-12 animate-fade-in text-white drop-shadow-lg" style={{textShadow:'0 2px 8px #000'}}>Loading...</div> : (
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
                {products.map((p, idx) => (
                  <tr key={p.id} className={`border-t transition-all duration-300 ${idx % 2 === 0 ? 'bg-purple-50/50' : 'bg-white'} hover:bg-purple-200/60 animate-fade-in-up`}>
                    <td className="p-2"><img src={p.imageUrl} alt={p.name} className="w-16 h-16 object-cover rounded shadow" /></td>
                    <td className="p-2 text-gray-900">{p.name}</td>
                    <td className="p-2 text-gray-900">{p.category}</td>
                    <td className="p-2 text-gray-900">₹{p.price}</td>
                    <td className="p-2 text-gray-900">{typeof p.quantity === 'number' ? p.quantity : (p.quantity ? Number(p.quantity) : 0)}</td>
                    <td className="p-2 text-gray-900 font-bold">{(typeof p.quantity === 'number' ? p.quantity : (p.quantity ? Number(p.quantity) : 0)) > 0 ? 'In Stock' : 'Out of Stock'}</td>
                    <td className="p-2">
                      <button className="text-blue-600 mr-2 hover:underline" onClick={() => handleEdit(p)}>Edit</button>
                      <button className="text-red-600 hover:underline" onClick={() => handleDelete(p.id)}>Delete</button>
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