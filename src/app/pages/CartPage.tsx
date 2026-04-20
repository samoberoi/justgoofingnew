import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Cart no longer used — bookings replace it. Redirect to home.
const CartPage = () => {
  const navigate = useNavigate();
  useEffect(() => { navigate('/home', { replace: true }); }, [navigate]);
  return null;
};

export default CartPage;
