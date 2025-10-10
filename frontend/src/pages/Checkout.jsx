import React from 'react';
export default function Checkout(){
  const handlePay = async ()=> {
    // create order in backend and open Razorpay (backend must provide /api/payment/order)
    try{
      const res = await fetch('/api/payment/order', {method:'POST'});
      const data = await res.json();
      if(!data.orderId){ alert('Missing orderId from backend'); return; }
      const options = {
        key: data.key, // from backend
        order_id: data.orderId,
        amount: data.amount
      };
      // Razorpay checkout would be opened here (requires razorpay sdk)
      alert('Frontend prepared order: '+JSON.stringify(options));
    }catch(e){ alert('Payment init failed'); }
  };
  return (<div className="container"><h2>Checkout</h2><button className="btn" onClick={handlePay}>Pay (simulate)</button></div>);
}
