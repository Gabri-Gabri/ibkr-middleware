const express = require('express');
const app = express();
app.use(express.json());

console.log('🚀 IBKR Cloud Middleware - PAPER TRADING SIMULATION');

app.post('/api/order', (req, res) => {
  console.log('🎯 ORDINE PAPER TRADING:', req.body.ticker, req.body.quantity, 'azioni a', req.body.price);
  
  // Simula sempre successo (Paper Trading)
  res.json({
    success: true,
    message: 'Ordine Paper Trading simulato con successo',
    order_id: `PAPER_${Date.now()}`,
    account: req.body.acctId || 'DU1234567',
    symbol: req.body.ticker,
    quantity: req.body.quantity,
    price: req.body.price,
    status: 'Filled',
    timestamp: new Date().toISOString(),
    environment: 'Railway Cloud - Paper Trading Simulation'
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'online', 
    service: 'IBKR Paper Trading Simulation',
    ibkr_gateway: 'simulated',
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'IBKR Paper Trading Cloud Middleware',
    note: 'SIMULAZIONE - Nessuna connessione IBKR reale'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Paper Trading Simulation running on port ${PORT}`);
});
