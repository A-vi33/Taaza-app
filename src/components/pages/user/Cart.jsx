import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { db, storage } from '../../../firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, getDoc, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { sendOrderNotifications } from '../../../utils/notifications';
import { generateOrderId } from '../../../utils/orderUtils';

function Cart(props) {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [products, setProducts] = useState([]);

  const RAZORPAY_KEY_ID = 'rzp_test_Ty2fPZgb35aMIa';

  useEffect(() => {
    if (!authLoading && (!user || user.type !== 'customer')) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const savedCart = localStorage.getItem('taazaCart');
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      const productsCollection = collection(db, 'products');
      const productsSnapshot = await getDocs(productsCollection);
      const productsData = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(productsData);
    };

    fetchProducts();
  }, []);

  const updateQuantity = (id, weight, quantity) => {
    if (quantity <= 0) {
      removeItem(id, weight);
      return;
    }
    
    // Check if requested quantity exceeds available stock
    const item = cartItems.find(item => item.id === id && item.weight === weight);
    if (item) {
      const weightInKg = (weight * quantity) / 1000;
      const product = products.find(p => p.id === id);
      if (product && weightInKg > (product.quantity || 0)) {
        alert(`Insufficient stock! Only ${product.quantity || 0} kg available.`);
        return;
      }
    }
    
    const updatedCart = cartItems.map(item => 
      item.id === id && item.weight === weight 
        ? { ...item, quantity } 
        : item
    );
    setCartItems(updatedCart);
    localStorage.setItem('taazaCart', JSON.stringify(updatedCart));
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

  const sendSMS = async (phone, message, orderId, paymentId) => {
    try {
      // Use the new notification utility
      await sendOrderNotifications(
        phone, 
        orderId, 
        paymentId, 
        total, 
        cartItems, 
        user?.name
      );
      
      console.log('Order notifications sent successfully');
    } catch (error) {
      console.error('Error sending notifications:', error);
    }
  };

  const handleCheckout = async () => {
    if (!user) {
      alert('Please login to checkout');
      return;
    }

    try {
      const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      // Generate sequential order ID
      const orderId = await generateOrderId();
      
      // Load Razorpay script
      const res = await loadRazorpayScript();
      if (!res) {
        alert('Razorpay SDK failed to load.');
        return;
      }

      // Store order in Firestore first
      const orderRef = await addDoc(collection(db, 'orders'), {
        orderId: orderId,
        cart: cartItems,
        user: { name: user?.name, phone: user?.mobile, email: user?.email || '' },
        paymentId: '',
        status: 'pending',
        createdAt: serverTimestamp(),
        fulfilled: false,
        source: 'online'
      });
      
      const options = {
        key: RAZORPAY_KEY_ID,
        amount: total * 100, // in paise
        currency: 'INR',
        name: 'Taaza Chicken',
        description: 'Order Payment',
        // Remove order_id - let Razorpay generate it
        handler: async function (response) {
          console.log('Razorpay response:', response);
          
          const paymentId = response.razorpay_payment_id;
          
          // Create update object with only defined values
          const orderUpdate = {
            paymentId,
            status: 'paid'
          };
          
          // Only add Razorpay fields if they exist
          if (response.razorpay_order_id) {
            orderUpdate.razorpayOrderId = response.razorpay_order_id;
          }
          if (response.razorpay_payment_id) {
            orderUpdate.razorpayPaymentId = response.razorpay_payment_id;
          }
          if (response.razorpay_signature) {
            orderUpdate.razorpaySignature = response.razorpay_signature;
          }
          
          console.log('Order update object:', orderUpdate);
          
          try {
            // Save transaction
            await addDoc(collection(db, 'transactions'), {
              orderId: orderRef.id,
              orderNumber: orderId,
              transactionId: paymentId,
              amount: total,
              status: 'success',
              date: new Date(),
              customer: { name: user?.name, phone: user?.mobile, email: user?.email || '' },
              mode: 'Razorpay',
              user: user?.name || user?.email || 'Customer',
              cart: cartItems
            });
            
            // Update order with paymentId and status
            await updateDoc(doc(db, 'orders', orderRef.id), orderUpdate);
            
            // Generate e-bill HTML
            const billHtml = `
              <div style='font-family:sans-serif;padding:24px;'>
                <h2 style='color:#27ae60;'>Tazza Chicken - E-Bill</h2>
                <p><strong>Name:</strong> ${user?.name}</p>
                <p><strong>Phone:</strong> ${user?.mobile}</p>
                <p><strong>Email:</strong> ${user?.email || ''}</p>
                <p><strong>Order ID:</strong> ${orderId}</p>
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
            
            // Generate PDF using blob URL (primary method - no CORS issues)
            let billUrl = null;
            try {
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
              
              // Create blob URL for immediate download (no CORS issues)
              billUrl = URL.createObjectURL(pdfBlob);
              
              // Store blob URL in order (primary method)
              await updateDoc(doc(db, 'orders', orderRef.id), { 
                billUrl: billUrl,
                billType: 'blob',
                billGenerated: true,
                billBlobData: {
                  url: billUrl,
                  cleanup: true // Mark for cleanup
                }
              });
              
              console.log('E-Bill generated successfully using blob URL');
              
              // Store cleanup function in localStorage for later cleanup
              const cleanupKey = `bill_cleanup_${orderRef.id}`;
              localStorage.setItem(cleanupKey, 'true');
              
              // Optionally try Firebase Storage in background (non-blocking)
              setTimeout(async () => {
                try {
                  const billRef = ref(storage, `bills/${orderRef.id}.pdf`);
                  await uploadBytes(billRef, pdfBlob, { contentType: 'application/pdf' });
                  const firebaseUrl = await getDownloadURL(billRef);
                  // Update order with Firebase URL if successful
                  await updateDoc(doc(db, 'orders', orderRef.id), { 
                    firebaseBillUrl: firebaseUrl,
                    billType: 'firebase'
                  });
                  console.log('E-Bill uploaded to Firebase successfully (background)');
                } catch (firebaseError) {
                  console.log('Firebase upload failed (background), using blob URL:', firebaseError.message);
                }
              }, 1000); // Run in background after 1 second
              
            } catch (pdfError) {
              console.error('Error generating PDF:', pdfError);
              // Continue without PDF - order is still valid
            }
            
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
            
            // Send SMS receipt to customer
            if (user?.mobile) {
              const smsMessage = `Thank you for your order! Order ID: ${orderId}, Amount: ₹${total}, Items: ${cartItems.map(item => `${item.name} (${item.weight}g)`).join(', ')}. Payment ID: ${paymentId}`;
              await sendSMS(user.mobile, smsMessage, orderId, paymentId);
            }
            
            // Clear cart and redirect
            setCartItems([]);
            localStorage.removeItem('taazaCart');
            navigate(`/order-confirmation?orderId=${orderId}`);
            
          } catch (error) {
            console.error('Error processing payment:', error);
            alert('Error processing payment: ' + error.message);
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email || '',
          contact: user?.mobile
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-slate-600 to-slate-700 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <span className="text-3xl">🛒</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-800 mb-4">Your Cart is Empty</h1>
            <p className="text-slate-600 text-lg mb-8">Looks like you haven't added any items yet.</p>
            <Link 
              to="/" 
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-slate-600 to-slate-700 text-white font-semibold rounded-xl hover:from-slate-700 hover:to-slate-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              🍗 Start Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-slate-600 to-slate-700 rounded-xl flex items-center justify-center text-white text-xl shadow-lg">
                🛒
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-800">Shopping Cart</h1>
                <p className="text-slate-600">{cartItems.length} item{cartItems.length !== 1 ? 's' : ''} in your cart</p>
              </div>
            </div>
            <div className="hidden sm:block">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-lg font-semibold shadow-lg">
                Total: ₹{total}
              </div>
            </div>
          </div>
        </div>
        
        {/* Cart Items */}
        <div className="space-y-4 mb-8">
          {cartItems.map(item => (
            <div key={item.id + '-' + item.weight} className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-300">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                {/* Product Image */}
                <div className="relative">
                  <img 
                    src={item.imageUrl} 
                    alt={item.name} 
                    className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-xl shadow-lg" 
                  />
                  <div className="absolute -top-2 -right-2 bg-gradient-to-r from-slate-600 to-slate-700 text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg">
                    {item.category}
                  </div>
                </div>
                
                {/* Product Details */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-slate-800 mb-2">{item.name}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-sm text-slate-600 font-medium">Weight</p>
                      <p className="text-lg font-bold text-slate-800">{item.weight}g</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-sm text-slate-600 font-medium">Price</p>
                      <p className="text-lg font-bold text-slate-800">₹{item.price}</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-sm text-slate-600 font-medium">Available</p>
                      <p className="text-lg font-bold text-green-600">
                        {products.find(p => p.id === item.id)?.quantity || 0} kg
                      </p>
                    </div>
                  </div>
                  
                  {/* Quantity Controls */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <button 
                        className="w-10 h-10 bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-lg hover:from-slate-700 hover:to-slate-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed" 
                        onClick={() => updateQuantity(item.id, item.weight, item.quantity - 1)} 
                        disabled={item.quantity <= 1}
                      >
                        <span className="text-lg font-bold">−</span>
                      </button>
                      <span className="text-xl font-bold text-slate-800 min-w-[3rem] text-center">{item.quantity}</span>
                      <button 
                        className="w-10 h-10 bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-lg hover:from-slate-700 hover:to-slate-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105" 
                        onClick={() => updateQuantity(item.id, item.weight, item.quantity + 1)}
                      >
                        <span className="text-lg font-bold">+</span>
                      </button>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm text-slate-600">Subtotal</p>
                        <p className="text-2xl font-bold text-green-600">₹{item.price * item.quantity}</p>
                      </div>
                      <button 
                        className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105" 
                        onClick={() => removeItem(item.id, item.weight)}
                      >
                        🗑️ Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Order Summary */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-6 mb-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-slate-600 to-slate-700 rounded-xl flex items-center justify-center text-white text-lg shadow-lg">
              📋
            </div>
            Order Summary
          </h2>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-slate-200">
              <span className="text-slate-600 font-medium">Items ({cartItems.length})</span>
              <span className="text-slate-800 font-semibold">{cartItems.length}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-slate-200">
              <span className="text-slate-600 font-medium">Subtotal</span>
              <span className="text-slate-800 font-semibold">₹{total}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-slate-200">
              <span className="text-slate-600 font-medium">Delivery</span>
              <span className="text-green-600 font-semibold">Free</span>
            </div>
            <div className="flex justify-between items-center pt-3">
              <span className="text-2xl font-bold text-slate-800">Total</span>
              <span className="text-3xl font-bold text-green-600">₹{total}</span>
            </div>
          </div>
        </div>
        
        {/* Checkout Button */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-6">
          <button 
            className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xl font-bold rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105" 
            onClick={handleCheckout}
          >
            🚀 Proceed to Checkout - ₹{total}
          </button>
          <p className="text-center text-slate-600 mt-4 text-sm">
            Secure payment powered by Razorpay
          </p>
        </div>
      </div>
    </div>
  );
}

export default Cart; 