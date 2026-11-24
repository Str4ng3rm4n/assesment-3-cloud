require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
require('./db');

const authRoutes = require('./routes/auth');
const capsuleRoutes = require('./routes/capsules');

const app = express();
app.set('trust proxy', 1);
app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/capsules', capsuleRoutes);
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

const dist = path.join(__dirname, '../client/dist');
app.use(express.static(dist));
app.get('/{*splat}', (req, res) => res.sendFile(path.join(dist, 'index.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening on ${PORT}`));