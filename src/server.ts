import { middleware } from './middleware';
import { database } from './db';
import { config } from './settings';
import express, { Request, Response } from 'express';
import { tradeController, searchController } from './controllers';
import {
  dateQueryValidationRules,
  searchQueryValidationRules,
  errorHandler
} from './models';
import chalk from 'chalk';

const app = express();

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

app.listen(config.port, () =>
  console.log(chalk.magenta(`Listening on port ${config.port}`))
);

process.on('uncaughtException', (err) => {
  console.log(chalk.red(`Caught exception: ${err}`));
  process.exit(1);
});
process.on('unhandledRejection', (reason, p) => {
  console.log(
    chalk.red(`Unhandled Rejection at: Promise, ${p}, reason: ${reason}`)
  );
  process.exit(1);
});
