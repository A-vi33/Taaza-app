import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

function AdminEmployees() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', role: '', salary: '', paid: '' });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user || user.type !== 'admin') {
      navigate('/login');
    }
  }, [user, navigate]);

  const fetchEmployees = async () => {
    setLoading(true);
    const querySnapshot = await getDocs(collection(db, 'employees'));
    setEmployees(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    setLoading(false);
  };

  useEffect(() => { fetchEmployees(); }, []);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError(null);
    try {
      if (editingId) {
        await updateDoc(doc(db, 'employees', editingId), {
          name: form.name,
          role: form.role,
          salary: Number(form.salary),
          paid: Number(form.paid),
        });
      } else {
        await addDoc(collection(db, 'employees'), {
          name: form.name,
          role: form.role,
          salary: Number(form.salary),
          paid: Number(form.paid),
        });
      }
      setForm({ name: '', role: '', salary: '', paid: '' });
      setEditingId(null);
      fetchEmployees();
    } catch (err) {
      setError('Failed to save employee.');
    }
  };

  const handleEdit = emp => {
    setForm({ name: emp.name, role: emp.role, salary: emp.salary, paid: emp.paid });
    setEditingId(emp.id);
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this employee?')) return;
    await deleteDoc(doc(db, 'employees', id));
    fetchEmployees();
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Employee Management</h1>
      <form onSubmit={handleSubmit} className="mb-8 space-y-4 bg-white p-4 rounded shadow">
        <div className="flex gap-4">
          <input name="name" value={form.name} onChange={handleChange} placeholder="Name" className="p-2 border rounded w-full" required />
          <input name="role" value={form.role} onChange={handleChange} placeholder="Role" className="p-2 border rounded w-full" required />
        </div>
        <div className="flex gap-4">
          <input name="salary" value={form.salary} onChange={handleChange} placeholder="Monthly Salary" type="number" className="p-2 border rounded w-full" required />
          <input name="paid" value={form.paid} onChange={handleChange} placeholder="Paid This Month" type="number" className="p-2 border rounded w-full" required />
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded" type="submit">{editingId ? 'Update' : 'Add'} Employee</button>
        {editingId && <button type="button" className="ml-2 text-gray-600" onClick={() => { setForm({ name: '', role: '', salary: '', paid: '' }); setEditingId(null); }}>Cancel</button>}
        {error && <div className="text-red-600 mt-2">{error}</div>}
      </form>
      <h2 className="text-lg font-bold mb-2">All Employees</h2>
      {loading ? <div>Loading...</div> : (
        <table className="w-full bg-white rounded shadow">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2">Name</th>
              <th className="p-2">Role</th>
              <th className="p-2">Salary</th>
              <th className="p-2">Paid</th>
              <th className="p-2">Remaining</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map(emp => (
              <tr key={emp.id} className="border-t">
                <td className="p-2">{emp.name}</td>
                <td className="p-2">{emp.role}</td>
                <td className="p-2">₹{emp.salary}</td>
                <td className="p-2">₹{emp.paid}</td>
                <td className="p-2 font-bold">₹{emp.salary - emp.paid}</td>
                <td className="p-2">
                  <button className="text-blue-600 mr-2" onClick={() => handleEdit(emp)}>Edit</button>
                  <button className="text-red-600" onClick={() => handleDelete(emp.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default AdminEmployees; 