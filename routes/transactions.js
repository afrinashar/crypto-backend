const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const router = express.Router();

// Middleware to protect routes
const authenticate = (req, res, next) => {
  const token = req.header('Authorization').replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'Access denied' });
  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    res.status(400).json({ message: 'Invalid token' });
  }
};

// Create transaction
router.post('/', authenticate, async (req, res) => {
  const { type, amount } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (type === 'withdraw' && user.wallet < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }
    const newBalance = type === 'deposit' ? user.wallet + amount : user.wallet - amount;
    user.wallet = newBalance;
    await user.save();

    const transaction = new Transaction({ user: user._id, type, amount });
    await transaction.save();
    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ message: 'Transaction failed' });
  }
});

module.exports = router;
