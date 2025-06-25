import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db, storage } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

function Cart(props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);

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

  const handleCheckout = async () => {
    console.log('Checkout started');
    console.log('User:', user);
    console.log('Cart items:', cartItems);
    // Mock payment: simulate payment success
    try {
      // Store order in Firestore
      console.log('Saving order to Firestore...');
      const orderRef = await addDoc(collection(db, 'orders'), {
        cart: cartItems,
        user: { name: user?.name, phone: user?.phone, email: user?.email },
        paymentId: 'MOCK_PAYMENT_' + Date.now(),
        status: 'paid',
        createdAt: serverTimestamp(),
      });
      console.log('Order saved:', orderRef.id);

      // Generate e-bill HTML
      const billHtml = `
        <div style='font-family:sans-serif;padding:24px;'>
          <h2 style='color:#27ae60;'>Tazza Chicken - E-Bill</h2>
          <p><strong>Name:</strong> ${user?.name}</p>
          <p><strong>Phone:</strong> ${user?.phone}</p>
          <p><strong>Email:</strong> ${user?.email}</p>
          <p><strong>Order ID:</strong> ${orderRef.id}</p>
          <table border='1' cellpadding='8' cellspacing='0' style='margin-top:16px;width:100%;'>
            <thead><tr><th>Item</th><th>Weight</th><th>Qty</th><th>Price</th></tr></thead>
            <tbody>
              ${cartItems.map(item => `<tr><td>${item.name}</td><td>${item.weight}g</td><td>${item.quantity}</td><td>₹${item.price * item.quantity}</td></tr>`).join('')}
            </tbody>
          </table>
          <p style='margin-top:16px;'><strong>Total:</strong> ₹${cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)}</p>
          <p style='margin-top:8px;'>Thank you for ordering from Tazza Chicken!</p>
        </div>
      `;
      console.log('E-bill HTML generated');

      // Convert HTML to PDF (html2pdf.js)
      console.log('Generating PDF...');
      const pdfBlob = await new Promise((resolve, reject) => {
        const iframe = document.createElement('iframe');
        document.body.appendChild(iframe);
        const doc = iframe.contentWindow.document;
        doc.open();
        doc.write(billHtml);
        doc.close();
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
      console.log('PDF generated');

      // Upload PDF to Firebase Storage
      console.log('Uploading PDF to Firebase Storage...');
      const billRef = ref(storage, `bills/${orderRef.id}.pdf`);
      await uploadBytes(billRef, pdfBlob, { contentType: 'application/pdf' });
      const billUrl = await getDownloadURL(billRef);
      console.log('PDF uploaded. Bill URL:', billUrl);

      // Update order with e-bill URL
      console.log('Updating order with bill URL...');
      await orderRef.update({ billUrl });
      console.log('Order updated with bill URL');

      // Clear cart
      setCartItems([]);
      localStorage.removeItem('taazaCart');
      console.log('Cart cleared, navigating to order confirmation');
      navigate(`/order-confirmation?orderId=${orderRef.id}`);
    } catch (err) {
      console.error('Checkout failed:', err);
      alert('Order saving or bill generation failed! ' + (err.message || err));
    }
  };

  if (cartItems.length === 0) {
    return <div className="p-8 text-center">Your cart is empty.</div>;
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Your Cart</h1>
      <div className="space-y-4 mb-6">
      {cartItems.map(item => (
          <div key={item.id + '-' + item.weight} className="flex items-center bg-white rounded shadow p-4">
            <img src={item.imageUrl} alt={item.name} className="w-20 h-20 object-cover rounded mr-4" />
            <div className="flex-1">
              <h3 className="font-bold">{item.name}</h3>
              <p className="text-sm text-gray-500">{item.weight}g</p>
              <p>₹{item.price} x {item.quantity} = <span className="font-semibold">₹{item.price * item.quantity}</span></p>
              <div className="flex items-center mt-2">
                <button className="px-2 py-1 bg-gray-200 rounded" onClick={() => updateQuantity(item.id, item.weight, item.quantity - 1)} disabled={item.quantity <= 1}>-</button>
                <span className="mx-2">{item.quantity}</span>
                <button className="px-2 py-1 bg-gray-200 rounded" onClick={() => updateQuantity(item.id, item.weight, item.quantity + 1)}>+</button>
                <button className="ml-4 text-red-600" onClick={() => removeItem(item.id, item.weight)}>Remove</button>
          </div>
          </div>
        </div>
      ))}
        </div>
      <div className="flex justify-between items-center mb-6">
        <span className="text-xl font-bold">Total:</span>
        <span className="text-xl font-bold">₹{total}</span>
      </div>
      <button className="w-full bg-green-600 text-white py-3 rounded text-lg font-semibold" onClick={handleCheckout}>
        Checkout
      </button>
    </div>
  );
}

export default Cart; 