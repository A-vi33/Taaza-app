import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { db, storage } from '../../../firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

function Cart(props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);

  const RAZORPAY_KEY_ID = 'rzp_test_Ty2fPZgb35aMIa';

  useEffect(() => {
    if (!user || user.type !== 'customer') {
      navigate('/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    const savedCart = localStorage.getItem('taazaCart');
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
  }, []);

  const updateQuantity = (id, weight, quantity) => {
    const updated = cartItems.map(item =>
      item.id === id && item.weight === weight ? { ...item, quantity } : item
    ).filter(item => item.quantity > 0);
    setCartItems(updated);
    localStorage.setItem('taazaCart', JSON.stringify(updated));
  };

  const removeItem = (id, weight) => {
    const updated = cartItems.filter(item => !(item.id === id && item.weight === weight));
    setCartItems(updated);
    localStorage.setItem('taazaCart', JSON.stringify(updated));
  };

  const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        resolve(true);
      };
      script.onerror = () => {
        resolve(false);
      };
      document.body.appendChild(script);
    });
  };

  const handleCheckout = async () => {
    if (!user?.name || !user?.phone) {
      alert('Please complete your profile with name and phone number.');
      return;
    }
    try {
      // Create order in Firestore with pending status
      const orderRef = await addDoc(collection(db, 'orders'), {
        cart: cartItems,
        user: { name: user?.name, phone: user?.phone, email: user?.email },
        paymentId: '',
        status: 'pending',
        createdAt: serverTimestamp(),
        fulfilled: false
      });
      // Load Razorpay script
      const res = await loadRazorpayScript();
      if (!res) {
        alert('Razorpay SDK failed to load.');
        return;
      }
      const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const options = {
        key: RAZORPAY_KEY_ID,
        amount: total * 100, // in paise
        currency: 'INR',
        name: 'Taaza Chicken',
        description: 'Order Payment',
        handler: async function (response) {
          const paymentId = response.razorpay_payment_id;
          // Save transaction
          await addDoc(collection(db, 'transactions'), {
            orderId: orderRef.id,
            transactionId: paymentId,
            amount: total,
            status: 'success',
            date: new Date(),
            customer: { name: user?.name, phone: user?.phone, email: user?.email },
            mode: 'Razorpay',
            user: user?.name || user?.email || 'Customer',
            cart: cartItems
          });
          // Update order with paymentId and status
          await updateDoc(doc(db, 'orders', orderRef.id), {
            paymentId,
            status: 'paid'
          });
          // Generate e-bill HTML
          const billHtml = `
            <div style='font-family:sans-serif;padding:24px;'>
              <h2 style='color:#27ae60;'>Tazza Chicken - E-Bill</h2>
              <p><strong>Name:</strong> ${user?.name}</p>
              <p><strong>Phone:</strong> ${user?.phone}</p>
              <p><strong>Email:</strong> ${user?.email}</p>
              <p><strong>Order ID:</strong> ${orderRef.id}</p>
              <p><strong>Transaction ID:</strong> ${paymentId}</p>
              <table border='1' cellpadding='8' cellspacing='0' style='margin-top:16px;width:100%;'>
                <thead><tr><th>Item</th><th>Weight</th><th>Qty</th><th>Price</th></tr></thead>
                <tbody>
                  ${cartItems.map(item => `<tr><td>${item.name}</td><td>${item.weight}g</td><td>${item.quantity}</td><td>₹${item.price * item.quantity}</td></tr>`).join('')}
                </tbody>
              </table>
              <p style='margin-top:16px;'><strong>Total:</strong> ₹${total}</p>
              <p style='margin-top:8px;'>Thank you for ordering from Tazza Chicken!</p>
            </div>
          `;
          // Convert HTML to PDF (html2pdf.js)
          const pdfBlob = await new Promise((resolve, reject) => {
            const iframe = document.createElement('iframe');
            document.body.appendChild(iframe);
            const docu = iframe.contentWindow.document;
            docu.open();
            docu.write(billHtml);
            docu.close();
            iframe.onload = () => {
              window.html2pdf()
                .from(iframe.contentWindow.document.body)
                .outputPdf('blob')
                .then(blob => {
                  document.body.removeChild(iframe);
                  resolve(blob);
                })
                .catch(err => {
                  document.body.removeChild(iframe);
                  reject(err);
                });
            };
          });
          // Upload PDF to Firebase Storage
          const billRef = ref(storage, `bills/${orderRef.id}.pdf`);
          await uploadBytes(billRef, pdfBlob, { contentType: 'application/pdf' });
          const billUrl = await getDownloadURL(billRef);
          await updateDoc(doc(db, 'orders', orderRef.id), { billUrl });
          // Decrease product stock for each item in cart
          for (const item of cartItems) {
            const productRef = doc(db, 'products', item.id);
            const productSnap = await getDoc(productRef);
            if (productSnap.exists()) {
              const currentQty = productSnap.data().quantity || 0;
              const boughtKg = (item.weight || 0) / 1000;
              let newQty = currentQty - boughtKg;
              if (newQty < 0) newQty = 0;
              await updateDoc(productRef, { quantity: newQty });
            }
          }
          // Clear cart and redirect
          setCartItems([]);
          localStorage.removeItem('taazaCart');
          navigate(`/order-confirmation?orderId=${orderRef.id}`);
        },
        prefill: {
          name: user?.name,
          email: user?.email || '',
          contact: user?.phone
        },
        theme: {
          color: '#27ae60'
        },
        modal: {
          ondismiss: function () {
            alert('Payment cancelled. Order is still pending.');
          }
        }
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      alert('Order saving or payment failed! ' + (err.message || err));
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="responsive-container responsive-p-8 text-center main-content">
        <div className="responsive-card responsive-p-8">
          <h1 className="responsive-text-2xl font-bold mb-6">Your Cart</h1>
          <p className="responsive-text-lg text-gray-500">Your cart is empty.</p>
          <Link to="/" className="responsive-btn bg-green-600 text-white inline-block mt-4 hover:bg-green-700 transition">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="responsive-container responsive-p-4 sm:responsive-p-8 main-content">
      <div className="responsive-card responsive-p-4 sm:responsive-p-8 max-w-4xl mx-auto">
        <h1 className="responsive-text-2xl sm:responsive-text-3xl font-bold mb-6 text-center">Your Cart</h1>
        
        <div className="space-y-4 mb-6">
          {cartItems.map(item => (
            <div key={item.id + '-' + item.weight} className="responsive-card responsive-p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <img 
                src={item.imageUrl} 
                alt={item.name} 
                className="w-full sm:w-20 h-20 object-cover rounded shadow-sm flex-shrink-0" 
              />
              <div className="flex-1 min-w-0">
                <h3 className="responsive-text-lg font-bold text-gray-900 mb-2">{item.name}</h3>
                <p className="responsive-text-sm text-gray-500 mb-2">{item.weight}g</p>
                <p className="responsive-text-base mb-3">
                  ₹{item.price} x {item.quantity} = <span className="font-semibold text-green-600">₹{item.price * item.quantity}</span>
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <button 
                    className="responsive-btn bg-gray-200 hover:bg-gray-300 transition touch-target" 
                    onClick={() => updateQuantity(item.id, item.weight, item.quantity - 1)} 
                    disabled={item.quantity <= 1}
                  >
                    -
                  </button>
                  <span className="responsive-text-base font-medium mx-2 min-w-[2rem] text-center">{item.quantity}</span>
                  <button 
                    className="responsive-btn bg-gray-200 hover:bg-gray-300 transition touch-target" 
                    onClick={() => updateQuantity(item.id, item.weight, item.quantity + 1)}
                  >
                    +
                  </button>
                  <button 
                    className="responsive-btn bg-red-600 text-white hover:bg-red-700 transition ml-2 sm:ml-4 touch-target" 
                    onClick={() => removeItem(item.id, item.weight)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="responsive-card responsive-p-4 bg-gray-50 rounded-lg mb-6">
          <div className="flex justify-between items-center">
            <span className="responsive-text-xl font-bold">Total:</span>
            <span className="responsive-text-xl font-bold text-green-600">₹{total}</span>
          </div>
        </div>
        
        <button 
          className="w-full responsive-btn bg-green-600 text-white hover:bg-green-700 transition font-semibold touch-target" 
          onClick={handleCheckout}
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
}

export default Cart; 