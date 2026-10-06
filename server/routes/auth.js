import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(72),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new AppError('JWT_SECRET is not configured', 500);
  }

  return process.env.JWT_SECRET;
};

const createToken = (userId) =>
  jwt.sign({ userId: userId.toString() }, getJwtSecret(), { expiresIn: '7d' });

const serializeUser = (user) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

router.post('/register', async (req, res, next) => {
  try {
    const input = registerSchema.parse(req.body);
    const existingUser = await User.findOne({ email: input.email });

    if (existingUser) {
      throw new AppError('A user with that email already exists', 409);
    }

    const user = await User.create(input);

    res.status(201).json({
      message: 'Registration successful',
      token: createToken(user._id),
      user: serializeUser(user),
    });
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const input = loginSchema.parse(req.body);
    const user = await User.findOne({ email: input.email }).select('+password');

    if (!user || !(await user.comparePassword(input.password))) {
      throw new AppError('Invalid email or password', 401);
    }

    res.status(200).json({
      message: 'Login successful',
      token: createToken(user._id),
      user: serializeUser(user),
    });
  } catch (error) {
    next(error);
  }
});

router.get('/me', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.status(200).json({ user: serializeUser(user) });
  } catch (error) {
    next(error);
  }
});

export default router;
