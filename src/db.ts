import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const dbURL = process.env.DB || '';

mongoose.connect(dbURL, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;

export const database = () => {
  db.once('open', () => console.log('Database connected:', dbURL));
  db.on('error', (err) => console.error('connection error:', err));
};
