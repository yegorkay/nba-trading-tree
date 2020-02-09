import { middleware } from './middleware';
import { database } from './db';
import express, { Request, Response } from 'express';
import { tradeController, searchController } from './controllers';
import {
  dateQueryValidationRules,
  searchQueryValidationRules,
  errorHandler
} from './models';

const app = express();
const PORT: number = 5000;

database();
middleware(app);

app.get(
  '/api/get-tree',
  dateQueryValidationRules(),
  errorHandler,
  (req: Request, res: Response) => tradeController.getAllTransactions(req, res)
);

app.get(
  '/api/get-player',
  searchQueryValidationRules(),
  errorHandler,
  (req: Request, res: Response) => searchController.getPlayer(req, res)
);

app.listen(PORT, () => console.log(`Listening on port ${PORT}`));

process.on('uncaughtException', (err) => {
  console.log(`Caught exception: ${err}`);
  process.exit(1);
});
process.on('unhandledRejection', (reason, p) => {
  console.log(`Unhandled Rejection at: Promise, ${p}, reason: ${reason}`);
  process.exit(1);
});
