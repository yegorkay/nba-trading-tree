import dotenv from 'dotenv';
/** Date format used in the app */
const dateFormat = 'YYYY-MM-DD';
/** Base Basketball Reference URL */
const baseURL = 'https://www.basketball-reference.com';
/** Base search URL */
const searchURL = (player: string) =>
  `${baseURL}/search/search.fcgi?hint=&search=${player}`;
/** Transaction HTML selector */
const transactionSelector = '#div_transactions span';

dotenv.config();

const config = {
  db: process.env.DB || '',
  port: process.env.PORT || ''
};

export { dateFormat, baseURL, searchURL, transactionSelector, config };
