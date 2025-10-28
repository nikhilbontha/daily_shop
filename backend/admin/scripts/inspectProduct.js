const connectDB = require('../../config/db');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

async function main(){
  const id = process.argv[2];
  if(!id){ console.error('Usage: node inspectProduct.js <productId>'); process.exit(2); }
  await connectDB();
  const Product = require('../../models/Product');
  const p = await Product.findById(id).lean();
  if(!p){ console.error('Product not found', id); process.exit(1); }
  console.log('Product:', p._id.toString(), p.name);
  console.log('Images array (stored in DB):');
  (p.images||[]).forEach((img, i) => console.log(i, img));

  const uploads = path.join(__dirname, '..', 'uploads');
  console.log('\nChecking files in uploads dir and trash:');
  for(const img of (p.images||[])){
    try{
      const bn = path.basename(img);
      const f1 = path.join(uploads, bn);
      const f2 = path.join(uploads, 'trash', bn);
      console.log(bn, 'exists in uploads?', fs.existsSync(f1), 'exists in trash?', fs.existsSync(f2));
    }catch(e){ console.log('err checking', img, e && e.message); }
  }
  process.exit(0);
}

main().catch(err=>{ console.error(err); process.exit(1); });
