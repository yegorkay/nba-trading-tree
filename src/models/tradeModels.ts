import { Page, Browser } from 'puppeteer';

interface IPlayerParams {
  parentPlayer: string;
  playerURLs: string[];
  date: string;
}

interface IPageParams {
  page: Page;
  browser: Browser;
}

export { IPageParams, IPlayerParams };
