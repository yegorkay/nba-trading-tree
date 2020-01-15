import _ from 'lodash';
import { baseURL } from '../settings';
import { formatter } from '../utils';
import { Response, Request } from 'express';
import $ from 'cheerio';
import puppeteer, { Page, Browser } from 'puppeteer';

const playerDemo = '/players/n/nashst01.html';
const playerTest = `${baseURL}${playerDemo}`;

class TradeController {
  private getDateIndices(dates: string[], dateMatch: string): number[] {
    let indexes: number[] = [];
    for (let i = 0; i < dates.length; i++) {
      if (dates[i] === dateMatch) indexes.push(i + 1);
    }
    return indexes;
  }

  public getTradeDates(html: string): string[] {
    const transactionDateSelector: string = `#div_transactions span p.transaction strong:first-of-type`;
    let dateArray: string[] = [];

    $(transactionDateSelector, html).each((_i: number, ele: CheerioElement) => {
      return dateArray.push(formatter.formatDate($(ele).text()));
    });

    return dateArray;
  }

  public getPlayerURLs(dateIndices: number[], html: string): string[] {
    const playerURLSelector = formatter.generatePlayerURLSelector(dateIndices);

    let playerURLs: string[] = [];

    $(playerURLSelector, html).each((_i: number, ele: CheerioElement) => {
      const url = $(ele).attr('href');
      playerURLs.push(url.split('players/')[1]);
    });

    return playerURLs;
  }

  private async traverse(date: string) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(playerTest);

    const html = await page.content();

    const dateArray = this.getTradeDates(html);
    const dateIndices = this.getDateIndices(dateArray, date);
    const playerURLs = this.getPlayerURLs(dateIndices, html);
    const loopedData = await this.loopPlayers(playerURLs, date, page, browser);

    return loopedData;
  }

  public async loopPlayers(
    playerURLs: string[],
    date: string,
    page: Page,
    browser: Browser
  ) {
    let data: { [player: string]: string[] } = {};
    for (const playerURL of playerURLs) {
      await page.goto(`${baseURL}${playerURL}`);

      const playerHTML = await page.content();
      const playerName = $('h1', playerHTML).text();

      const dateArray = this.getTradeDates(playerHTML);
      const dateIndices = this.getDateIndices(dateArray, date);
      const playerURLs = this.getPlayerURLs(dateIndices, playerHTML);
      const playerHead = playerURLs.findIndex((url) => url === playerDemo) + 1;

      data[playerName] = playerURLs.slice(playerHead);
    }

    await browser.close();
    return data;
  }

  public async getAllTransactions(req: Request, res: Response) {
    const travData = await this.traverse(req.query.date);
    res.send({ data: travData });
  }
}

export const tradeController = new TradeController();
