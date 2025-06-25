import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db, storage } from '../../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

function AdminProducts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', category: '', price: '', image: null });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState(null);
  const [editingPriceId, setEditingPriceId] = useState(null);
  const [newPrice, setNewPrice] = useState('');

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
    setForm(f => ({ ...f, [name]: files ? files[0] : value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError(null);
    try {
      let imageUrl = form.image;
      if (form.image && typeof form.image !== 'string') {
        console.log('Uploading image:', form.image);
        const imgRef = ref(storage, `products/${Date.now()}_${form.image.name}`);
        await uploadBytes(imgRef, form.image);
        imageUrl = await getDownloadURL(imgRef);
        console.log('Image uploaded, URL:', imageUrl);
      }
      if (editingId) {
        await updateDoc(doc(db, 'products', editingId), {
          name: form.name,
          category: form.category,
          price: Number(form.price),
          imageUrl,
        });
      } else {
        await addDoc(collection(db, 'products'), {
          name: form.name,
          category: form.category,
          price: Number(form.price),
          imageUrl,
        });
      }
      setForm({ name: '', category: '', price: '', image: null });
      setEditingId(null);
    } catch (err) {
      setError('Failed to save product.');
      console.error('Image upload or product save error:', err);
    }
  };

  const handleEdit = p => {
    setForm({ name: p.name, category: p.category, price: p.price, image: p.imageUrl });
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
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Product Management</h1>
      <form onSubmit={handleSubmit} className="mb-8 space-y-4 bg-white p-4 rounded shadow">
        <div className="flex gap-4">
          <input name="name" value={form.name} onChange={handleChange} placeholder="Name" className="p-2 border rounded w-full" required />
          <input name="category" value={form.category} onChange={handleChange} placeholder="Category" className="p-2 border rounded w-full" required />
          <input name="price" value={form.price} onChange={handleChange} placeholder="Price" type="number" className="p-2 border rounded w-full" required />
        </div>
        <div>
          <input name="image" type="file" accept="image/*" onChange={handleChange} className="p-2" />
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded" type="submit">{editingId ? 'Update' : 'Add'} Product</button>
        {editingId && <button type="button" className="ml-2 text-gray-600" onClick={() => { setForm({ name: '', category: '', price: '', image: null }); setEditingId(null); }}>Cancel</button>}
        {error && <div className="text-red-600 mt-2">{error}</div>}
      </form>
      <h2 className="text-lg font-bold mb-2">All Products</h2>
      {error && <div className="text-red-600 mb-4">{error}</div>}
      {loading ? <div>Loading...</div> : (
        <table className="w-full bg-white rounded shadow">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2">Image</th>
              <th className="p-2">Name</th>
              <th className="p-2">Category</th>
              <th className="p-2">Price</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id} className="border-t">
                <td className="p-2"><img src={p.image || p.imageUrl} alt={p.name} className="w-16 h-16 object-cover rounded" /></td>
                <td className="p-2">{p.name}</td>
                <td className="p-2">{p.category}</td>
                <td className="p-2">
                  {editingPriceId === p.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={newPrice}
                        onChange={e => setNewPrice(e.target.value)}
                        className="p-1 border rounded w-20"
                      />
                      <button className="text-green-600" onClick={() => handlePriceSave(p.id)}>Save</button>
                      <button className="text-gray-500" onClick={() => setEditingPriceId(null)}>Cancel</button>
                    </div>
                  ) : (
                    <span>
                      ₹{p.price}{' '}
                      <button className="text-blue-600 ml-2" onClick={() => handlePriceEdit(p.id, p.price)}>Edit</button>
                    </span>
                  )}
                </td>
                <td className="p-2">
                  <button className="text-blue-600 mr-2" onClick={() => handleEdit(p)}>Edit</button>
                  <button className="text-red-600" onClick={() => handleDelete(p.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default AdminProducts; 