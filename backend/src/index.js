require('express-async-errors');
const express = require('express');
const cors    = require('cors');
require('dotenv').config();

const authRoutes        = require('./routes/auth');
const progressRoutes    = require('./routes/progress');
const quizRoutes        = require('./routes/quiz');
const submissionsRoutes = require('./routes/submissions');
const adminRoutes       = require('./routes/admin');

const app  = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());

app.use('/auth',        authRoutes);
app.use('/progress',    progressRoutes);
app.use('/quiz',        quizRoutes);
app.use('/submissions', submissionsRoutes);
app.use('/admin',       adminRoutes);

// Global error handler
app.use((err, req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => console.log(`BFF running on :${PORT}`));
