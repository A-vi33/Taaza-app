import React, { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { db } from "../../../firebase";
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  serverTimestamp,
  where 
} from "firebase/firestore";
import Toast from "../../Toast";

function AdminEmployees() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [leaveLoading, setLeaveLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [activeTab, setActiveTab] = useState("employees"); // "employees" or "leaves"
  const [employeeForm, setEmployeeForm] = useState({
    name: "",
    phone: "",
    email: "",
    position: "",
    salary: "",
    joinDate: "",
    leaveBalance: 20
  });
  const [leaveForm, setLeaveForm] = useState({
    employeeId: "",
    startDate: "",
    endDate: "",
    reason: "",
    leaveType: "casual"
  });
  const [editingEmployeeId, setEditingEmployeeId] = useState(null);

  useEffect(() => {
    if (!user || !user.isAdmin) {
      navigate("/login");
      return;
    }
    fetchEmployees();
    fetchLeaveRequests();
  }, [user, navigate]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, "employees"));
      const employeesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEmployees(employeesData);
    } catch (error) {
      console.error("Error fetching employees:", error);
      showToast("Error loading employees", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaveRequests = async () => {
    try {
      setLeaveLoading(true);
      const querySnapshot = await getDocs(collection(db, "leaveRequests"));
      const leaveData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setLeaveRequests(leaveData);
    } catch (error) {
      console.error("Error fetching leave requests:", error);
      showToast("Error loading leave requests", "error");
    } finally {
      setLeaveLoading(false);
    }
  };

  const handleEmployeeFormChange = (e) => {
    const { name, value } = e.target;
    setEmployeeForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLeaveFormChange = (e) => {
    const { name, value } = e.target;
    setLeaveForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEmployeeSubmit = async (e) => {
    e.preventDefault();
    try {
      const employeeData = {
        name: employeeForm.name,
        phone: employeeForm.phone,
        email: employeeForm.email,
        position: employeeForm.position,
        salary: Number(employeeForm.salary),
        joinDate: employeeForm.joinDate,
        leaveBalance: Number(employeeForm.leaveBalance),
        updatedAt: serverTimestamp()
      };

      if (editingEmployeeId) {
        await updateDoc(doc(db, "employees", editingEmployeeId), employeeData);
        showToast("Employee updated successfully");
      } else {
        employeeData.createdAt = serverTimestamp();
        await addDoc(collection(db, "employees"), employeeData);
        showToast("Employee added successfully");
      }

      setEmployeeForm({
        name: "",
        phone: "",
        email: "",
        position: "",
        salary: "",
        joinDate: "",
        leaveBalance: 20
      });
      setEditingEmployeeId(null);
      fetchEmployees();
    } catch (error) {
      console.error("Error saving employee:", error);
      showToast("Error saving employee", "error");
    }
  };

  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    try {
      const startDate = new Date(leaveForm.startDate);
      const endDate = new Date(leaveForm.endDate);
      const daysRequested = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

      const selectedEmployee = employees.find(emp => emp.id === leaveForm.employeeId);
      if (!selectedEmployee) {
        showToast("Please select a valid employee", "error");
        return;
      }

      if (daysRequested > selectedEmployee.leaveBalance) {
        showToast(`Employee only has ${selectedEmployee.leaveBalance} days leave balance`, "error");
        return;
      }

      const leaveData = {
        employeeId: leaveForm.employeeId,
        employeeName: selectedEmployee.name,
        startDate: leaveForm.startDate,
        endDate: leaveForm.endDate,
        daysRequested,
        reason: leaveForm.reason,
        leaveType: leaveForm.leaveType,
        status: "pending",
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, "leaveRequests"), leaveData);
      showToast("Leave request submitted successfully");
      
      setLeaveForm({
        employeeId: "",
        startDate: "",
        endDate: "",
        reason: "",
        leaveType: "casual"
      });
      fetchLeaveRequests();
    } catch (error) {
      console.error("Error submitting leave request:", error);
      showToast("Error submitting leave request", "error");
    }
  };

  const handleLeaveAction = async (leaveId, action) => {
    try {
      const leaveRequest = leaveRequests.find(leave => leave.id === leaveId);
      if (!leaveRequest) return;

      const employee = employees.find(emp => emp.id === leaveRequest.employeeId);
      if (!employee) return;

      if (action === "approve") {
        // Update leave request status
        await updateDoc(doc(db, "leaveRequests", leaveId), {
          status: "approved",
          approvedAt: serverTimestamp(),
          approvedBy: user.email
        });

        // Update employee leave balance
        const newBalance = employee.leaveBalance - leaveRequest.daysRequested;
        await updateDoc(doc(db, "employees", leaveRequest.employeeId), {
          leaveBalance: newBalance,
          updatedAt: serverTimestamp()
        });

        showToast("Leave request approved successfully");
      } else if (action === "reject") {
        await updateDoc(doc(db, "leaveRequests", leaveId), {
          status: "rejected",
          rejectedAt: serverTimestamp(),
          rejectedBy: user.email
        });
        showToast("Leave request rejected");
      }

      fetchLeaveRequests();
      fetchEmployees();
    } catch (error) {
      console.error("Error processing leave request:", error);
      showToast("Error processing leave request", "error");
    }
  };

  const handleEditEmployee = (employee) => {
    setEmployeeForm({
      name: employee.name || "",
      phone: employee.phone || "",
      email: employee.email || "",
      position: employee.position || "",
      salary: employee.salary || "",
      joinDate: employee.joinDate || "",
      leaveBalance: employee.leaveBalance || 20
    });
    setEditingEmployeeId(employee.id);
  };

  const handleDeleteEmployee = async (employeeId) => {
    if (!window.confirm("Are you sure you want to delete this employee?")) {
      return;
    }
    try {
      await deleteDoc(doc(db, "employees", employeeId));
      showToast("Employee deleted successfully");
      fetchEmployees();
    } catch (error) {
      console.error("Error deleting employee:", error);
      showToast("Error deleting employee", "error");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "approved": return "bg-green-100 text-green-800";
      case "rejected": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getLeaveTypeColor = (type) => {
    switch (type) {
      case "casual": return "bg-blue-100 text-blue-800";
      case "sick": return "bg-red-100 text-red-800";
      case "annual": return "bg-green-100 text-green-800";
      case "maternity": return "bg-pink-100 text-pink-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type }), 3000);
  };

  return (
    <div className="relative main-content min-h-screen bg-white">
      <div className="relative z-10 responsive-p-4 sm:responsive-p-8 max-w-6xl mx-auto">
        <Toast 
          message={toast.message} 
          show={toast.show} 
          onClose={() => setToast({ ...toast, show: false })} 
          type={toast.type} 
        />
        
        <div className="mb-8 pb-6 border-b border-white/20">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/20">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="responsive-text-3xl sm:responsive-text-4xl font-bold text-slate-800 mb-2 flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-slate-600 to-slate-700 rounded-xl flex items-center justify-center text-white text-xl shadow-lg">
                    👥
                  </div>
                  Employee & Leave Management
                </h2>
                <p className="text-slate-600 responsive-text-base sm:responsive-text-lg font-medium">
                  Manage employee information and leave requests
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg font-semibold text-sm">
                  📊 {employees.length} Employees
                </div>
                <div className="bg-orange-100 text-orange-800 px-4 py-2 rounded-lg font-semibold text-sm">
                  📋 {leaveRequests.filter(l => l.status === "pending").length} Pending Leaves
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("employees")}
              className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
                activeTab === "employees"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              👥 Employees
            </button>
            <button
              onClick={() => setActiveTab("leaves")}
              className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
                activeTab === "leaves"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              📋 Leave Management
            </button>
          </div>
        </div>

        {activeTab === "employees" && (
          <>
            {/* Employee Form */}
            <div className="responsive-card responsive-p-6 mb-8 animate-fade-in bg-white/95 backdrop-blur-md border border-white/20 shadow-xl rounded-2xl">
              <h3 className="responsive-text-lg sm:responsive-text-xl font-bold mb-4 text-slate-800 flex items-center gap-2">
                <div className="w-8 h-8 bg-slate-600 rounded-lg flex items-center justify-center text-white text-sm">
                  ➕
                </div>
                {editingEmployeeId ? "Edit Employee" : "Add New Employee"}
              </h3>
              
              <form onSubmit={handleEmployeeSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <input
                    name="name"
                    value={employeeForm.name}
                    onChange={handleEmployeeFormChange}
                    placeholder="Employee Name"
                    className="responsive-btn border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all duration-200 bg-white/90 text-slate-900 font-medium shadow-sm"
                    required
                  />
                  <input
                    name="phone"
                    value={employeeForm.phone}
                    onChange={handleEmployeeFormChange}
                    placeholder="Phone Number"
                    className="responsive-btn border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all duration-200 bg-white/90 text-slate-900 font-medium shadow-sm"
                    required
                  />
                  <input
                    name="email"
                    value={employeeForm.email}
                    onChange={handleEmployeeFormChange}
                    placeholder="Email Address"
                    type="email"
                    className="responsive-btn border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all duration-200 bg-white/90 text-slate-900 font-medium shadow-sm"
                    required
                  />
                  <input
                    name="position"
                    value={employeeForm.position}
                    onChange={handleEmployeeFormChange}
                    placeholder="Position/Role"
                    className="responsive-btn border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all duration-200 bg-white/90 text-slate-900 font-medium shadow-sm"
                    required
                  />
                  <input
                    name="salary"
                    value={employeeForm.salary}
                    onChange={handleEmployeeFormChange}
                    placeholder="Salary (₹)"
                    type="number"
                    className="responsive-btn border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all duration-200 bg-white/90 text-slate-900 font-medium shadow-sm"
                    required
                  />
                  <input
                    name="joinDate"
                    value={employeeForm.joinDate}
                    onChange={handleEmployeeFormChange}
                    placeholder="Join Date"
                    type="date"
                    className="responsive-btn border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all duration-200 bg-white/90 text-slate-900 font-medium shadow-sm"
                    required
                  />
                </div>
                
                <div className="flex gap-2">
                  <button
                    className="bg-slate-600 text-white px-6 py-3 rounded-xl shadow-lg hover:bg-slate-700 transition font-semibold"
                    type="submit"
                  >
                    {editingEmployeeId ? "Update Employee" : "Add Employee"}
                  </button>
                  {editingEmployeeId && (
                    <button
                      type="button"
                      className="px-6 py-3 text-slate-600 hover:text-slate-800 border border-slate-300 rounded-xl hover:bg-slate-50 transition shadow-sm"
                      onClick={() => {
                        setEmployeeForm({
                          name: "",
                          phone: "",
                          email: "",
                          position: "",
                          salary: "",
                          joinDate: "",
                          leaveBalance: 20
                        });
                        setEditingEmployeeId(null);
                      }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Employee Directory */}
            <div className="bg-white/95 backdrop-blur-md p-6 rounded-2xl shadow-xl animate-fade-in-up border border-white/20">
              <h3 className="responsive-text-lg sm:responsive-text-xl font-bold mb-6 text-slate-800 flex items-center gap-2">
                <div className="w-8 h-8 bg-slate-600 rounded-lg flex items-center justify-center text-white text-sm">
                  📋
                </div>
                Employee Directory
              </h3>
              
              {loading ? (
                <div className="text-center py-8">
                  <div className="text-slate-600 responsive-text-lg font-medium">
                    Loading employees...
                  </div>
                </div>
              ) : employees.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-slate-600 responsive-text-lg font-medium">
                    No employees found
                  </div>
                  <p className="text-slate-500 responsive-text-sm mt-2">
                    Add your first employee using the form above.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {employees.map(employee => (
                    <div key={employee.id} className="p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200 hover:bg-slate-200/50 transition-colors shadow-sm">
                      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-bold text-slate-900 responsive-text-lg">
                              {employee.name}
                            </h4>
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-600 text-white">
                              {employee.position}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              employee.leaveBalance > 10 ? "bg-green-100 text-green-800" :
                              employee.leaveBalance > 5 ? "bg-yellow-100 text-yellow-800" :
                              "bg-red-100 text-red-800"
                            }`}>
                              {employee.leaveBalance} days leave
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-slate-600 font-medium">Phone:</p>
                              <p className="font-semibold text-slate-900">{employee.phone}</p>
                            </div>
                            <div>
                              <p className="text-slate-600 font-medium">Email:</p>
                              <p className="font-semibold text-slate-900">{employee.email}</p>
                            </div>
                            <div>
                              <p className="text-slate-600 font-medium">Salary:</p>
                              <p className="font-bold text-slate-900">₹{employee.salary?.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-slate-600 font-medium">Join Date:</p>
                              <p className="font-semibold text-slate-900">{employee.joinDate}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => handleEditEmployee(employee)}
                            className="bg-slate-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-slate-700 transition shadow-sm font-semibold"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteEmployee(employee.id)}
                            className="bg-red-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-red-700 transition shadow-sm font-semibold"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === "leaves" && (
          <>
            {/* Leave Request Form */}
            <div className="responsive-card responsive-p-6 mb-8 animate-fade-in bg-white/95 backdrop-blur-md border border-white/20 shadow-xl rounded-2xl">
              <h3 className="responsive-text-lg sm:responsive-text-xl font-bold mb-4 text-slate-800 flex items-center gap-2">
                <div className="w-8 h-8 bg-slate-600 rounded-lg flex items-center justify-center text-white text-sm">
                  📝
                </div>
                Submit Leave Request
              </h3>
              
              <form onSubmit={handleLeaveSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <select
                    name="employeeId"
                    value={leaveForm.employeeId}
                    onChange={handleLeaveFormChange}
                    className="responsive-btn border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all duration-200 bg-white/90 text-slate-900 font-medium shadow-sm"
                    required
                  >
                    <option value="">Select Employee</option>
                    {employees.map(employee => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name} ({employee.leaveBalance} days left)
                      </option>
                    ))}
                  </select>
                  <select
                    name="leaveType"
                    value={leaveForm.leaveType}
                    onChange={handleLeaveFormChange}
                    className="responsive-btn border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all duration-200 bg-white/90 text-slate-900 font-medium shadow-sm"
                    required
                  >
                    <option value="casual">Casual Leave</option>
                    <option value="sick">Sick Leave</option>
                    <option value="annual">Annual Leave</option>
                    <option value="maternity">Maternity Leave</option>
                  </select>
                  <input
                    name="startDate"
                    value={leaveForm.startDate}
                    onChange={handleLeaveFormChange}
                    placeholder="Start Date"
                    type="date"
                    className="responsive-btn border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all duration-200 bg-white/90 text-slate-900 font-medium shadow-sm"
                    required
                  />
                  <input
                    name="endDate"
                    value={leaveForm.endDate}
                    onChange={handleLeaveFormChange}
                    placeholder="End Date"
                    type="date"
                    className="responsive-btn border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all duration-200 bg-white/90 text-slate-900 font-medium shadow-sm"
                    required
                  />
                  <input
                    name="reason"
                    value={leaveForm.reason}
                    onChange={handleLeaveFormChange}
                    placeholder="Reason for Leave"
                    className="responsive-btn border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all duration-200 bg-white/90 text-slate-900 font-medium shadow-sm col-span-2"
                    required
                  />
                </div>
                
                <div className="flex gap-2">
                  <button
                    className="bg-slate-600 text-white px-6 py-3 rounded-xl shadow-lg hover:bg-slate-700 transition font-semibold"
                    type="submit"
                  >
                    Submit Leave Request
                  </button>
                </div>
              </form>
            </div>

            {/* Leave Requests List */}
            <div className="bg-white/95 backdrop-blur-md p-6 rounded-2xl shadow-xl animate-fade-in-up border border-white/20">
              <h3 className="responsive-text-lg sm:responsive-text-xl font-bold mb-6 text-slate-800 flex items-center gap-2">
                <div className="w-8 h-8 bg-slate-600 rounded-lg flex items-center justify-center text-white text-sm">
                  📋
                </div>
                Leave Requests
              </h3>
              
              {leaveLoading ? (
                <div className="text-center py-8">
                  <div className="text-slate-600 responsive-text-lg font-medium">
                    Loading leave requests...
                  </div>
                </div>
              ) : leaveRequests.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-slate-600 responsive-text-lg font-medium">
                    No leave requests found
                  </div>
                  <p className="text-slate-500 responsive-text-sm mt-2">
                    Submit a leave request using the form above.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {leaveRequests.map(leave => (
                    <div key={leave.id} className="p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200 hover:bg-slate-200/50 transition-colors shadow-sm">
                      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-bold text-slate-900 responsive-text-lg">
                              {leave.employeeName}
                            </h4>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(leave.status)}`}>
                              {leave.status?.toUpperCase() || "PENDING"}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${getLeaveTypeColor(leave.leaveType)}`}>
                              {leave.leaveType?.toUpperCase() || "CASUAL"}
                            </span>
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                              {leave.daysRequested} days
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-slate-600 font-medium">Start Date:</p>
                              <p className="font-semibold text-slate-900">{leave.startDate}</p>
                            </div>
                            <div>
                              <p className="text-slate-600 font-medium">End Date:</p>
                              <p className="font-semibold text-slate-900">{leave.endDate}</p>
                            </div>
                            <div>
                              <p className="text-slate-600 font-medium">Reason:</p>
                              <p className="font-semibold text-slate-900">{leave.reason}</p>
                            </div>
                            <div>
                              <p className="text-slate-600 font-medium">Submitted:</p>
                              <p className="font-semibold text-slate-900">
                                {leave.createdAt?.toDate?.()?.toLocaleDateString() || "N/A"}
                              </p>
                            </div>
                          </div>
                        </div>
                        {leave.status === "pending" && (
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => handleLeaveAction(leave.id, "approve")}
                              className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-green-700 transition shadow-sm font-semibold"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleLeaveAction(leave.id, "reject")}
                              className="bg-red-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-red-700 transition shadow-sm font-semibold"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AdminEmployees;