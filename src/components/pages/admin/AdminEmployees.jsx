import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../../../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import bgImg from '../../../assets/bg.jpg';

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

function AdminEmployees() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', role: '', salary: '', paid: '' });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    if (!user || user.type !== 'admin') {
      navigate('/login');
    }
  }, [user, navigate]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      console.log('Fetching employees...');
      const querySnapshot = await getDocs(collection(db, 'employees'));
      const employeesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log('Employees fetched:', employeesData.length);
      setEmployees(employeesData);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setError('Failed to load employees. ' + (error.message || ''));
    } finally {
      setLoading(false);
    }
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
      showToast('Employee saved successfully');
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
    showToast('Employee deleted successfully');
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type }), 3000);
  };

  return (
    <div className="relative main-content" style={{ backgroundImage: `url(${bgImg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="absolute inset-0 bg-black/40 z-0"></div>
      <div className="relative z-10 responsive-p-4 sm:responsive-p-8 max-w-3xl mx-auto">
        <Toast message={toast.message} show={toast.show} onClose={() => setToast({ ...toast, show: false })} type={toast.type} />
        
        {/* Page Title */}
        <div className="mb-6 pb-4 border-b border-gray-200">
          <h2 className="responsive-text-2xl sm:responsive-text-3xl font-bold text-gray-800 text-center sm:text-left">
            👥 Employee Management
          </h2>
          <p className="text-gray-600 responsive-text-sm sm:responsive-text-base text-center sm:text-left mt-2">
            Manage employee information and payroll
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="mb-8 space-y-4 bg-white p-6 rounded-xl shadow-lg animate-fade-in-up">
          <div className="flex gap-4">
            <input name="name" value={form.name} onChange={handleChange} placeholder="Name" className="p-2 border rounded w-full focus:ring-2 focus:ring-pink-400 transition" required />
            <input name="role" value={form.role} onChange={handleChange} placeholder="Role" className="p-2 border rounded w-full focus:ring-2 focus:ring-pink-400 transition" required />
          </div>
          <div className="flex gap-4">
            <input name="salary" value={form.salary} onChange={handleChange} placeholder="Monthly Salary" type="number" className="p-2 border rounded w-full focus:ring-2 focus:ring-pink-400 transition" required />
            <input name="paid" value={form.paid} onChange={handleChange} placeholder="Paid This Month" type="number" className="p-2 border rounded w-full focus:ring-2 focus:ring-pink-400 transition" required />
          </div>
          <button className="bg-pink-600 text-white px-4 py-2 rounded shadow hover:bg-pink-700 transition" type="submit">{editingId ? 'Update' : 'Add'} Employee</button>
          {editingId && <button type="button" className="ml-2 text-gray-600 hover:underline" onClick={() => { setForm({ name: '', role: '', salary: '', paid: '' }); setEditingId(null); }}>Cancel</button>}
          {error && <div className="text-red-600 mt-2 animate-fade-in">{error}</div>}
        </form>
        <h2 className="responsive-text-lg sm:responsive-text-xl font-bold mb-2 text-pink-700 animate-fade-in">All Employees</h2>
        {loading ? (
          <div className="text-center py-12 animate-fade-in bg-white/90 p-6 rounded-lg">
            🔄 Loading employees...
          </div>
        ) : employees.length === 0 ? (
          <div className="text-center py-12 animate-fade-in bg-white/90 p-6 rounded-lg">
            👥 No employees found. Add your first employee above!
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-6 animate-fade-in-up">
            <table className="w-full rounded overflow-hidden">
              <thead>
                <tr className="bg-pink-100">
                  <th className="p-2">Name</th>
                  <th className="p-2">Role</th>
                  <th className="p-2">Salary</th>
                  <th className="p-2">Paid</th>
                  <th className="p-2">Remaining</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp, idx) => (
                  <tr key={emp.id} className={`border-t transition-all duration-300 ${idx % 2 === 0 ? 'bg-pink-50/50' : 'bg-white'} hover:bg-pink-200/60 animate-fade-in-up`}>
                    <td className="p-2">{emp.name}</td>
                    <td className="p-2">{emp.role}</td>
                    <td className="p-2">₹{emp.salary}</td>
                    <td className="p-2">₹{emp.paid}</td>
                    <td className="p-2 font-bold">₹{emp.salary - emp.paid}</td>
                    <td className="p-2">
                      <button className="text-blue-600 mr-2 hover:underline" onClick={() => handleEdit(emp)}>Edit</button>
                      <button className="text-red-600 hover:underline" onClick={() => handleDelete(emp.id)}>Delete</button>
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

export default AdminEmployees; 