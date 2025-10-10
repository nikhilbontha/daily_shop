import React, {useEffect, useState} from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

export default function Product(){
  const {id} = useParams();
  const [p, setP] = useState(null);
  const nav = useNavigate();
  useEffect(()=>{ axios.get('/api/products/'+id).then(r=>setP(r.data)).catch(()=>{}); },[id]);
  if(!p) return <div className="container">Loading...</div>;
  return (
    <div className="container">
      <button onClick={()=>nav(-1)} style={{marginBottom:10}}>Back</button>
      <div style={{display:'flex',gap:20}}>
        <img src={p.image||''} alt="" style={{width:320,height:320,objectFit:'cover'}}/>
        <div>
          <h2>{p.name}</h2>
          <p>₹{p.price}</p>
          <p>{p.description}</p>
          <a className="btn" href="/cart">Add to cart</a>
        </div>
      </div>
    </div>
  );
}
