import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { db } from '../../../firebase';
import { collection, getDocs, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, getDoc } from 'firebase/firestore';
import bgImg from '../../../assets/bg.jpg'; // This import is essential for the header

// --- DEFINITIVE, ILLUSTRATIVE & RECOGNIZABLE ICONS ---
const AllIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M3 11h8V3H3v8zm2-6h4v4H5V5zM13 3v8h8V3h-8zm6 6h-4V5h4v4zM3 21h8v-8H3v8zm2-6h4v4H5v-4zM13 21h8v-8h-8v8zm6-6h-4v4h4v-4z" />
  </svg>
);

// Advanced Chicken Icon with detailed features and gradients
const ChickenIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    {/* Chicken body with gradient */}
    <ellipse cx="12" cy="14" rx="8" ry="6" fill="url(#chickenBody)" stroke="#E65100" strokeWidth="0.8"/>
    
    {/* Chicken head with gradient */}
    <circle cx="12" cy="8" r="3" fill="url(#chickenHead)" stroke="#E65100" strokeWidth="0.8"/>
    
    {/* Beak with 3D effect */}
    <path d="M12 5L14.5 7.5L12 10L9.5 7.5L12 5Z" fill="url(#beakGradient)"/>
    <path d="M12 5L13.5 6.5L12 8L10.5 6.5L12 5Z" fill="#FF6F00" opacity="0.7"/>
    
    {/* Eye with depth */}
    <circle cx="13" cy="7" r="1" fill="#1A1A1A"/>
    <circle cx="13" cy="7" r="0.4" fill="#FFFFFF"/>
    <circle cx="13.2" cy="6.8" r="0.2" fill="#1A1A1A"/>
    
    {/* Comb with texture */}
    <path d="M9 6C9 6 10.5 3.5 12 3.5C13.5 3.5 15 6 15 6L14 7.5L12 6.5L10 7.5L9 6Z" fill="url(#combGradient)"/>
    <path d="M10 5.5C10 5.5 11 4 12 4C13 4 14 5.5 14 5.5" stroke="#B71C1C" strokeWidth="0.3" fill="none"/>
    
    {/* Wings with feather detail */}
    <ellipse cx="8" cy="13" rx="2.5" ry="3.5" fill="url(#wingGradient)" stroke="#E65100" strokeWidth="0.5"/>
    <ellipse cx="16" cy="13" rx="2.5" ry="3.5" fill="url(#wingGradient)" stroke="#E65100" strokeWidth="0.5"/>
    <path d="M6 12C6 12 7.5 10.5 9 12" stroke="#E65100" strokeWidth="0.8" fill="none" strokeLinecap="round"/>
    <path d="M18 12C18 12 16.5 10.5 15 12" stroke="#E65100" strokeWidth="0.8" fill="none" strokeLinecap="round"/>
    
    {/* Legs with texture */}
    <rect x="10.5" y="19" width="1" height="2.5" fill="#5D4037" stroke="#3E2723" strokeWidth="0.3"/>
    <rect x="12.5" y="19" width="1" height="2.5" fill="#5D4037" stroke="#3E2723" strokeWidth="0.3"/>
    
    {/* Feet with detail */}
    <path d="M10.5 21.5L9 23L12 23L10.5 21.5Z" fill="#3E2723"/>
    <path d="M12.5 21.5L11 23L14 23L12.5 21.5Z" fill="#3E2723"/>
    <circle cx="9.5" cy="22.5" r="0.3" fill="#1A1A1A"/>
    <circle cx="13.5" cy="22.5" r="0.3" fill="#1A1A1A"/>
    
    {/* Gradients */}
    <defs>
      <linearGradient id="chickenBody" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFD54F"/>
        <stop offset="50%" stopColor="#FFB300"/>
        <stop offset="100%" stopColor="#FF8F00"/>
      </linearGradient>
      <linearGradient id="chickenHead" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFD54F"/>
        <stop offset="100%" stopColor="#FFB300"/>
      </linearGradient>
      <linearGradient id="beakGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF8F00"/>
        <stop offset="100%" stopColor="#E65100"/>
      </linearGradient>
      <linearGradient id="combGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#D32F2F"/>
        <stop offset="100%" stopColor="#B71C1C"/>
      </linearGradient>
      <linearGradient id="wingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFB74D"/>
        <stop offset="100%" stopColor="#FF8F00"/>
      </linearGradient>
    </defs>
  </svg>
);

// Advanced Mutton/Lamb Icon with wool texture and realistic features
const MuttonIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    {/* Lamb body with wool texture */}
    <ellipse cx="12" cy="15" rx="7" ry="5" fill="url(#woolBody)" stroke="#E0E0E0" strokeWidth="0.8"/>
    
    {/* Lamb head with wool texture */}
    <circle cx="12" cy="9" r="3.5" fill="url(#woolHead)" stroke="#E0E0E0" strokeWidth="0.8"/>
    
    {/* Ears with detail */}
    <ellipse cx="10" cy="7" rx="1.2" ry="1.8" fill="url(#earGradient)" stroke="#D0D0D0" strokeWidth="0.5"/>
    <ellipse cx="14" cy="7" rx="1.2" ry="1.8" fill="url(#earGradient)" stroke="#D0D0D0" strokeWidth="0.5"/>
    <ellipse cx="10" cy="7" rx="0.6" ry="0.9" fill="#F5F5F5"/>
    <ellipse cx="14" cy="7" rx="0.6" ry="0.9" fill="#F5F5F5"/>
    
    {/* Eyes with depth */}
    <circle cx="11" cy="8.5" r="0.8" fill="#2E2E2E"/>
    <circle cx="13" cy="8.5" r="0.8" fill="#2E2E2E"/>
    <circle cx="11" cy="8.5" r="0.3" fill="#FFFFFF"/>
    <circle cx="13" cy="8.5" r="0.3" fill="#FFFFFF"/>
    <circle cx="11.2" cy="8.3" r="0.15" fill="#2E2E2E"/>
    <circle cx="13.2" cy="8.3" r="0.15" fill="#2E2E2E"/>
    
    {/* Nose with texture */}
    <ellipse cx="12" cy="10" rx="1" ry="0.6" fill="url(#noseGradient)"/>
    <ellipse cx="12" cy="10" rx="0.5" ry="0.3" fill="#9E9E9E"/>
    
    {/* Mouth */}
    <path d="M11.5 10.5C11.5 10.5 12 11.2 12.5 10.5" stroke="#9E9E9E" strokeWidth="0.4" fill="none" strokeLinecap="round"/>
    
    {/* Wool texture circles */}
    <circle cx="8" cy="14" r="1" fill="url(#woolTexture)" stroke="#E0E0E0" strokeWidth="0.3"/>
    <circle cx="16" cy="14" r="1" fill="url(#woolTexture)" stroke="#E0E0E0" strokeWidth="0.3"/>
    <circle cx="12" cy="16" r="1" fill="url(#woolTexture)" stroke="#E0E0E0" strokeWidth="0.3"/>
    <circle cx="10" cy="15" r="0.7" fill="url(#woolTexture)" stroke="#E0E0E0" strokeWidth="0.2"/>
    <circle cx="14" cy="15" r="0.7" fill="url(#woolTexture)" stroke="#E0E0E0" strokeWidth="0.2"/>
    
    {/* Legs with texture */}
    <rect x="9.5" y="19" width="1.2" height="3" fill="url(#legGradient)" stroke="#D0D0D0" strokeWidth="0.5"/>
    <rect x="13.3" y="19" width="1.2" height="3" fill="url(#legGradient)" stroke="#D0D0D0" strokeWidth="0.5"/>
    
    {/* Hooves with detail */}
    <ellipse cx="10" cy="22" rx="1" ry="0.4" fill="url(#hoofGradient)"/>
    <ellipse cx="14" cy="22" rx="1" ry="0.4" fill="url(#hoofGradient)"/>
    <ellipse cx="10" cy="22" rx="0.5" ry="0.2" fill="#757575"/>
    <ellipse cx="14" cy="22" rx="0.5" ry="0.2" fill="#757575"/>
    
    {/* Tail with wool */}
    <ellipse cx="19" cy="15" rx="1.8" ry="1.2" fill="url(#woolTexture)" stroke="#E0E0E0" strokeWidth="0.3"/>
    
    {/* Gradients */}
    <defs>
      <radialGradient id="woolBody" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#FFFFFF"/>
        <stop offset="50%" stopColor="#F5F5F5"/>
        <stop offset="100%" stopColor="#E8E8E8"/>
      </radialGradient>
      <radialGradient id="woolHead" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#FFFFFF"/>
        <stop offset="100%" stopColor="#F5F5F5"/>
      </radialGradient>
      <linearGradient id="earGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#E8E8E8"/>
        <stop offset="100%" stopColor="#D0D0D0"/>
      </linearGradient>
      <linearGradient id="noseGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#BDBDBD"/>
        <stop offset="100%" stopColor="#9E9E9E"/>
      </linearGradient>
      <radialGradient id="woolTexture" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#FAFAFA"/>
        <stop offset="100%" stopColor="#E0E0E0"/>
      </radialGradient>
      <linearGradient id="legGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#E0E0E0"/>
        <stop offset="100%" stopColor="#D0D0D0"/>
      </linearGradient>
      <linearGradient id="hoofGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#9E9E9E"/>
        <stop offset="100%" stopColor="#757575"/>
      </linearGradient>
    </defs>
  </svg>
);

// Advanced Goat Icon with realistic features and textures
const GoatIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    {/* Goat body with fur texture */}
    <ellipse cx="12" cy="15" rx="7" ry="5" fill="url(#goatBody)" stroke="#6D4C41" strokeWidth="0.8"/>
    
    {/* Goat head with fur texture */}
    <ellipse cx="12" cy="9" rx="3" ry="3.5" fill="url(#goatHead)" stroke="#6D4C41" strokeWidth="0.8"/>
    
    {/* Horns with realistic curves */}
    <path d="M10 6C10 6 9 3.5 10 2.5C11 1.5 12 2.5 12 3.5" stroke="url(#hornGradient)" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
    <path d="M14 6C14 6 15 3.5 14 2.5C13 1.5 12 2.5 12 3.5" stroke="url(#hornGradient)" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
    <path d="M10 6C10 6 9.5 4.5 10 3.5" stroke="#5D4037" strokeWidth="0.8" fill="none" strokeLinecap="round"/>
    <path d="M14 6C14 6 14.5 4.5 14 3.5" stroke="#5D4037" strokeWidth="0.8" fill="none" strokeLinecap="round"/>
    
    {/* Ears with detail */}
    <ellipse cx="10" cy="7" rx="1" ry="1.4" fill="url(#earGradient)" stroke="#5D4037" strokeWidth="0.5"/>
    <ellipse cx="14" cy="7" rx="1" ry="1.4" fill="url(#earGradient)" stroke="#5D4037" strokeWidth="0.5"/>
    <ellipse cx="10" cy="7" rx="0.5" ry="0.7" fill="#8D6E63"/>
    <ellipse cx="14" cy="7" rx="0.5" ry="0.7" fill="#8D6E63"/>
    
    {/* Eyes with depth */}
    <circle cx="11" cy="8.5" r="0.8" fill="#1A1A1A"/>
    <circle cx="13" cy="8.5" r="0.8" fill="#1A1A1A"/>
    <circle cx="11" cy="8.5" r="0.3" fill="#FFFFFF"/>
    <circle cx="13" cy="8.5" r="0.3" fill="#FFFFFF"/>
    <circle cx="11.2" cy="8.3" r="0.15" fill="#1A1A1A"/>
    <circle cx="13.2" cy="8.3" r="0.15" fill="#1A1A1A"/>
    
    {/* Nose with texture */}
    <ellipse cx="12" cy="10.5" rx="0.8" ry="0.5" fill="url(#noseGradient)"/>
    <ellipse cx="12" cy="10.5" rx="0.4" ry="0.25" fill="#5D4037"/>
    
    {/* Mouth */}
    <path d="M11.5 11C11.5 11 12 11.8 12.5 11" stroke="#5D4037" strokeWidth="0.4" fill="none" strokeLinecap="round"/>
    
    {/* Beard with texture */}
    <path d="M12 11.5C12 11.5 11 13.5 9.5 13" stroke="url(#beardGradient)" strokeWidth="1" fill="none" strokeLinecap="round"/>
    <path d="M12 11.5C12 11.5 13 13.5 14.5 13" stroke="url(#beardGradient)" strokeWidth="1" fill="none" strokeLinecap="round"/>
    <path d="M12 12C12 12 11.5 13 10.5 12.5" stroke="#5D4037" strokeWidth="0.6" fill="none" strokeLinecap="round"/>
    <path d="M12 12C12 12 12.5 13 13.5 12.5" stroke="#5D4037" strokeWidth="0.6" fill="none" strokeLinecap="round"/>
    
    {/* Fur texture on body */}
    <path d="M8 14C8 14 9 12.5 10.5 14" stroke="#6D4C41" strokeWidth="0.5" fill="none" strokeLinecap="round"/>
    <path d="M16 14C16 14 15 12.5 13.5 14" stroke="#6D4C41" strokeWidth="0.5" fill="none" strokeLinecap="round"/>
    <path d="M10 15C10 15 11 13.5 12.5 15" stroke="#6D4C41" strokeWidth="0.4" fill="none" strokeLinecap="round"/>
    <path d="M14 15C14 15 13 13.5 11.5 15" stroke="#6D4C41" strokeWidth="0.4" fill="none" strokeLinecap="round"/>
    
    {/* Legs with texture */}
    <rect x="9.5" y="19" width="1.2" height="3" fill="url(#legGradient)" stroke="#5D4037" strokeWidth="0.5"/>
    <rect x="13.3" y="19" width="1.2" height="3" fill="url(#legGradient)" stroke="#5D4037" strokeWidth="0.5"/>
    
    {/* Hooves with detail */}
    <ellipse cx="10" cy="22" rx="1" ry="0.4" fill="url(#hoofGradient)"/>
    <ellipse cx="14" cy="22" rx="1" ry="0.4" fill="url(#hoofGradient)"/>
    <ellipse cx="10" cy="22" rx="0.5" ry="0.2" fill="#4E342E"/>
    <ellipse cx="14" cy="22" rx="0.5" ry="0.2" fill="#4E342E"/>
    
    {/* Tail with fur */}
    <ellipse cx="19" cy="15" rx="1.8" ry="1.2" fill="url(#tailGradient)" stroke="#6D4C41" strokeWidth="0.3"/>
    
    {/* Gradients */}
    <defs>
      <radialGradient id="goatBody" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#A1887F"/>
        <stop offset="50%" stopColor="#8D6E63"/>
        <stop offset="100%" stopColor="#6D4C41"/>
      </radialGradient>
      <radialGradient id="goatHead" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#A1887F"/>
        <stop offset="100%" stopColor="#8D6E63"/>
      </radialGradient>
      <linearGradient id="hornGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#6D4C41"/>
        <stop offset="100%" stopColor="#4E342E"/>
      </linearGradient>
      <linearGradient id="earGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#8D6E63"/>
        <stop offset="100%" stopColor="#6D4C41"/>
      </linearGradient>
      <linearGradient id="noseGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#6D4C41"/>
        <stop offset="100%" stopColor="#5D4037"/>
      </linearGradient>
      <linearGradient id="beardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#6D4C41"/>
        <stop offset="100%" stopColor="#4E342E"/>
      </linearGradient>
      <linearGradient id="legGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#8D6E63"/>
        <stop offset="100%" stopColor="#6D4C41"/>
      </linearGradient>
      <linearGradient id="hoofGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#5D4037"/>
        <stop offset="100%" stopColor="#4E342E"/>
      </linearGradient>
      <radialGradient id="tailGradient" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#A1887F"/>
        <stop offset="100%" stopColor="#8D6E63"/>
      </radialGradient>
    </defs>
  </svg>
);

const EggIcon = (props) => (
  <span role="img" aria-label="Eggs" {...props}>🥚</span>
);
const MasalaIcon = (props) => (
  <span role="img" aria-label="Masalas" {...props}>🧂</span>
);

// ▼▼▼ PRODUCT CARD HAS BEEN SIGNIFICANTLY MODIFIED FOR RESPONSIVE SIZE ▼▼▼
function ProductCard({ item, onAddToCart }) {
  const [weight, setWeight] = useState('');
  const [showWeightInput, setShowWeightInput] = useState(false);
  const calculatedPrice = useMemo(() => {
    const numericWeight = parseInt(weight, 10);
    if (!item.price || isNaN(numericWeight) || numericWeight <= 0) return 0;
    return Math.round((item.price * (numericWeight / 1000)));
  }, [item.price, weight]);
  const handleWeightChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (parseInt(value, 10) > 20000) {
      setWeight('20000');
    } else {
      setWeight(value);
    }
  };
  const handleShowInput = () => {
    setWeight('');
    setShowWeightInput(true);
  };
  const handleConfirm = () => {
    let finalWeight = parseInt(weight, 10);
    if (isNaN(finalWeight) || finalWeight < 50) {
      finalWeight = 50;
    }
    const finalPrice = Math.round((item.price * (finalWeight / 1000)));
    onAddToCart(item, finalWeight, finalPrice);
    setShowWeightInput(false);
  };
  return (
    <article className="bg-yellow-100 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 flex flex-col overflow-hidden border border-yellow-200/50 h-full">
      <img
        src={item.imageUrl || 'https://via.placeholder.com/400x300'}
        alt={item.name}
        className="w-full h-28 sm:h-48 object-cover" // Responsive image height
      />
      <div className="p-2 sm:p-4 flex flex-col flex-grow"> {/* Responsive padding */}
        <h3 className="text-sm sm:text-lg font-bold text-slate-800 min-h-[40px] sm:min-h-[56px]">{item.name}</h3> {/* Responsive text and min-height */}
        <p className="text-xs sm:text-sm text-slate-500 mt-1">{item.description}</p>
        <div className="flex-grow" />
        <p className="text-lg sm:text-2xl font-extrabold text-red-600 mt-2 sm:mt-4"> {/* Responsive text and margin */}
          ₹{item.price}<span className="text-xs sm:text-sm font-medium text-slate-500">/kg</span>
        </p>
        <div className="mt-2 sm:mt-4">
          {!showWeightInput ? (
            <div className="flex gap-2">
              <button onClick={handleShowInput} className="flex-1 bg-green-500 text-white font-bold py-2 px-3 text-sm sm:py-3 sm:px-4 rounded-lg hover:bg-green-600 transition-colors duration-300">
                Add to Cart
              </button>
              <Link to="/cart" className="flex-1 text-center bg-slate-200 text-slate-800 font-bold py-2 px-3 text-sm sm:py-3 sm:px-4 rounded-lg hover:bg-slate-300 transition-colors duration-300">
                Cart
              </Link>
            </div>
          ) : (
            <div className="flex gap-2 items-center">
              <input
                id={`weight-${item.id}`}
                type="text"
                pattern="[0-9]*"
                inputMode="numeric"
                min={50} max={20000} step={50}
                value={weight}
                onChange={handleWeightChange}
                placeholder="Grams"
                className="flex-1 p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 text-sm"
                style={{ minWidth: 0 }}
              />
              <span className="font-bold text-base sm:text-lg text-red-600 whitespace-nowrap">₹{calculatedPrice}</span>
              <button onClick={handleConfirm} className="bg-green-600 text-white font-bold py-2 px-3 text-sm rounded-lg hover:bg-green-700 transition-colors flex-shrink-0">
                Confirm
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function Home(props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem('taazaCart')) || []);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const filters = [
    { key: 'all', label: 'All', icon: AllIcon },
    { key: 'chicken', label: 'Chicken', icon: ChickenIcon },
    { key: 'mutton', label: 'Mutton', icon: MuttonIcon },
    { key: 'goat', label: 'Goat', icon: GoatIcon },
    { key: 'eggs', label: 'Eggs', icon: EggIcon },
    { key: 'masalas', label: 'Masalas', icon: MasalaIcon },
  ];

  useEffect(() => {
    if (!user || user.type !== 'customer') {
      navigate('/login');
    }
  }, [user, navigate]);
  
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'products'), (querySnapshot) => {
      const productsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(productsData);
      setLoading(false);
    }, (err) => {
      setError('Failed to load products.');
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);
  
  const handleAddToCart = (item, weight, price) => {
    const cartItem = { ...item, weight, price, quantity: 1 };
    const existingItem = cart.find(ci => ci.id === item.id && ci.weight === weight);
    let updatedCart;
    if (existingItem) {
      updatedCart = cart.map(ci => ci.id === item.id && ci.weight === weight ? { ...ci, quantity: ci.quantity + 1 } : ci);
    } else {
      updatedCart = [...cart, cartItem];
    }
    setCart(updatedCart);
    localStorage.setItem('taazaCart', JSON.stringify(updatedCart));
    setSuccessMessage(`${item.name} (${weight}g) added!`);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };
  
  const groupedProducts = useMemo(() => {
    const filtered = activeFilter === 'all'
      ? products
      : products.filter(p => p.category === activeFilter);
    return filtered.reduce((acc, product) => {
      const category = product.category || 'other';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(product);
      return acc;
    }, {});
  }, [activeFilter, products]);

  if (loading) return <div className="flex justify-center items-center h-screen bg-slate-50 text-xl font-semibold">Loading Fresh Products...</div>;
  if (error) return <div className="flex justify-center items-center h-screen bg-red-50 text-red-600 text-xl">{error}</div>;

  return (
    <div className="min-h-screen bg-green-100">
      <div
        className={`fixed top-5 right-5 bg-green-200 text-green-800 border border-green-400 font-bold py-3 px-6 rounded-lg shadow-lg transition-all duration-500 ease-in-out ${showSuccess ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}
      >
        ✅ {successMessage}
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
       
        <header
          className="relative bg-cover bg-center rounded-2xl p-8 md:p-12 text-white text-center shadow-xl mb-12 overflow-hidden"
          style={{ backgroundImage: `url(${bgImg})` }}
        >
          <div className="absolute inset-0 bg-black opacity-50"></div>
         
          <div className="relative z-10">
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
              Welcome to Taaza!
            </h1>
            <p className="mt-2 md:mt-4 text-lg md:text-xl max-w-2xl mx-auto" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.5)' }}>
              The freshest meat and fish, delivered to your doorstep.
            </p>
          </div>
        </header>

        <nav aria-label="Product Filters" className="flex flex-wrap justify-center gap-2 md:gap-3 mb-12">
          {filters.map(filter => {
            const IconComponent = filter.icon;
            return (
              <button
                key={filter.key}
                className={`filter-button inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold transition-all duration-300 border-2 text-sm ${
                  activeFilter === filter.key
                    ? 'active bg-red-600 text-white border-red-600 shadow-md'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-yellow-100 hover:border-yellow-400'
                }`}
                onClick={() => setActiveFilter(filter.key)}
              >
                <IconComponent className="h-5 w-5" />
                <span>{filter.label}</span>
              </button>
            );
          })}
        </nav>
       
        <div className="space-y-12">
          {Object.entries(groupedProducts).map(([category, items]) => {
            // ▼▼▼ FIX: Replaced flex slider with a responsive grid ▼▼▼
            const containerClasses = "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4";

            return (
              <section key={category} aria-labelledby={`${category}-heading`}>
                <h2 id={`${category}-heading`} className="text-3xl font-bold text-slate-800 border-b-4 border-red-500 pb-2 mb-8 capitalize">
                  {category}
                </h2>
                <div className={containerClasses}>
                  {items.map(item => (
                    // Removed the wrapper div, the grid now controls layout
                    <ProductCard key={item.id} item={item} onAddToCart={handleAddToCart} />
                  ))}
                </div>
              </section>
            );
          })}
          {Object.keys(groupedProducts).length === 0 && !loading && (
            <div className="text-center py-16">
              <p className="text-2xl font-semibold text-slate-500">No products found in this category.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Home;