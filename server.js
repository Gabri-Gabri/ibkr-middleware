const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Configurazione IBKR Gateway
const IBKR_GATEWAY = 'http://127.0.0.1:7497';

// 🔐 Middleware di sicurezza
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

// 🎯 ENDPOINT PRINCIPALE - INVIO ORDINI
app.post('/api/order', authenticate, async (req, res) => {
  try {
    console.log('📨 Ricevuto ordine da n8n:', {
      ticker: req.body.ticker,
      action: req.body.side,
      quantity: req.body.quantity,
      price: req.body.price
    });
    
    // Prepara il payload per IBKR
    const ibkrPayload = {
      orders: [{
        acctId: req.body.acctId || process.env.IBKR_ACCOUNT_ID,
        conid: req.body.conid,
        secType: req.body.secType || 'STK',
        orderType: req.body.orderType || 'LMT',
        side: req.body.side,
        quantity: req.body.quantity,
        price: req.body.price,
        tif: 'GTC', // Good Till Cancelled
        outsideRTH: false
      }]
    };

    console.log('🔄 Invio a IBKR Gateway:', JSON.stringify(ibkrPayload, null, 2));

    const response = await fetch(`${IBKR_GATEWAY}/v1/api/order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ibkrPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`IBKR Gateway error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Risposta IBKR:', data);
    
    res.json({
      success: true,
      ibkr_response: data,
      timestamp: new Date().toISOString(),
      order_details: {
        ticker: req.body.ticker,
        order_id: data[0]?.order_id || 'unknown',
        status: 'submitted'
      }
    });

  } catch (error) {
    console.error('❌ Errore:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      note: "Assicurati che IBKR Gateway sia in esecuzione su 127.0.0.1:7497"
    });
  }
});

// 🔍 ENDPOINT DI HEALTH CHECK
app.get('/api/health', async (req, res) => {
  try {
    const response = await fetch(`${IBKR_GATEWAY}/v1/api/iserver/auth/status`);
    
    if (response.ok) {
      const status = await response.json();
      res.json({
        status: 'online',
        ibkr_gateway: 'connected',
        authenticated: status.authenticated,
        connected: status.connected,
        timestamp: new Date().toISOString()
      });
    } else {
      res.json({
        status: 'online', 
        ibkr_gateway: 'disconnected',
        error: 'IBKR Gateway not responding',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    res.json({
      status: 'online',
      ibkr_gateway: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 📊 ENDPOINT INFO SERVER
app.get('/', (req, res) => {
  res.json({
    service: 'IBKR Middleware Server',
    version: '1.0.0',
    status: 'online',
    timestamp: new Date().toISOString(),
    endpoints: {
      health_check: 'GET /api/health',
      submit_order: 'POST /api/order',
      authentication: 'Header: x-api-key'
    },
    instructions: {
      order_payload: {
        acctId: 'IBKR account ID',
        conid: 'Contract ID',
        secType: 'STK',
        orderType: 'LMT',
        side: 'BUY/SELL', 
        quantity: 'number',
        price: 'number'
      }
    }
  });
});

// ❌ Gestione errori 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    available_endpoints: ['GET /', 'GET /api/health', 'POST /api/order']
  });
});

// 🏁 AVVIO SERVER
app.listen(PORT, () => {
  console.log(`🚀 IBKR Middleware Server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📊 API Info: http://localhost:${PORT}/`);
  console.log(`🔐 API Key: ${process.env.API_KEY || 'ibkr-middleware-secret-123'}`);
  console.log(`💡 Remember: IBKR Gateway must be running on 127.0.0.1:7497`);
});