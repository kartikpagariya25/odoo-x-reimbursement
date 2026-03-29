const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Temporary placeholder for route imports
app.get('/api/health', (req, res) => res.status(200).json({ status: 'API is running' }));

// Routes
app.use('/api/expenses', require('./routes/expense.routes'));

const clientDistPath = path.resolve(__dirname, '../client/dist');
const clientIndexPath = path.join(clientDistPath, 'index.html');

if (fs.existsSync(clientIndexPath)) {
  app.use(express.static(clientDistPath));

  // SPA fallback for non-API routes (e.g. /admin, /manager).
  app.get(/^\/(?!api).*/, (req, res) => {
    res.sendFile(clientIndexPath);
  });
}

// TODO: Mount remaining routes as they are built
// app.use('/api/auth', require('./routes/auth.routes'));
// app.use('/api/users', require('./routes/user.routes'));
// app.use('/api/rules', require('./routes/rule.routes'));
// app.use('/api/approval', require('./routes/approval.routes'));
// app.use('/api/currency', require('./routes/currency.routes'));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Server Error' });
});

module.exports = app;
