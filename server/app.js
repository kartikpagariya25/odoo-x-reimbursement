const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Temporary placeholder for route imports
app.get('/api/health', (req, res) => res.status(200).json({ status: 'API is running' }));

// Routes
app.use('/api/expenses', require('./routes/expense.routes'));

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
