import dotenv from 'dotenv';

dotenv.config();

export const config = {
  db: process.env.DB || '',
  port: process.env.PORT || ''
};
