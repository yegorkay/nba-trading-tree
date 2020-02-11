import mongoose from 'mongoose';
import chalk from 'chalk';
import { config } from './settings';

mongoose.connect(config.db, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
const db = mongoose.connection;

export const database = () => {
  db.once('open', () =>
    console.log(chalk.cyan('Database connected:', config.db))
  );
  db.on('error', (err) => console.error(chalk.red('connection error:', err)));
};
