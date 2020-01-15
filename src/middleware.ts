import { Express } from 'express';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import compression from 'compression';

/**
 * Express middleware extrapolated into its own file.
 * @param app - The Express app we are initiating.
 * @return The executed middleware including body-parser, compression and morgan.
 */
export const middleware = (app: Express) => {
  app.use(compression());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(
    morgan(':method :url :status :res[content-length] - :response-time ms')
  );
};
