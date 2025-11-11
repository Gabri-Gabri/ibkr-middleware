const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// ⚠️ FIXED: Usa variabile d'ambiente per IBKR Gateway
const IBKR_GATEWAY = process.env.IBKR_GATEWAY_URL || 'http://127.0.0.1:7497';
console.log('🔗 IBKR Gateway URL:', IBKR_GATEWAY);

// Middleware di sicurezza
const authenticate = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const validKey = process.env.API_KEY || 'ibkr-middleware-secret-123';
  
  if (apiKey === validKey) {
    next();
  } else {
    res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Invalid API Key'
    });
  }
};

// Endpoint principale - Invio ordini
app.post('/api/orders', authenticate, async (req, res) => {
  try {
    console.log('📨 Ricevuto ordine:', req.body);
    
    const ibkrPayload = {
      orders: req.body.orders.map(order => ({
        acctId: order.acctId || process.env.IBKR_ACCOUNT_ID || 'DU1234567',
        conid: order.conid,
        secType: order.secType || 'STK',
        orderType: order.orderType || 'LMT',
        side: order.side,
        quantity: order.quantity,
        price: order.price,
        tif: 'DAY',
        outsideRTH: false
      }))
    };

    console.log('🔄 Invio a IBKR:', IBKR_GATEWAY);
    const response = await fetch(`${IBKR_GATEWAY}/v1/api/iserver/account/DU1234567/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ibkrPayload)
    });

    if (!response.ok) throw new Error(`IBKR error: ${response.status}`);
    
    const data = await response.json();
    console.log('✅ Risposta IBKR:', data);
    
    res.json({ success: true, ibkr_response: data });

  } catch (error) {
    console.error('❌ Errore:', error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      note: "Verifica che IBKR Gateway sia attivo e ngrok running"
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'online', 
    service: 'IBKR Middleware',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});