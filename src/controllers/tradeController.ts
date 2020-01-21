import _ from 'lodash';
import { baseURL } from '../settings';
import { formatter } from '../utils';
import { Response, Request } from 'express';
import $ from 'cheerio';
import puppeteer from 'puppeteer';
import { IPlayerParams, IPageParams } from '../models';

class TradeController {
  private getDateIndices(dates: string[], dateMatch: string): number[] {
    let indexes: number[] = [];
    dates.forEach((date, i) => {
      if (date === dateMatch) indexes.push(i + 1);
    });
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

  private async traverse(playerId: string, date: string) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const playerURL = formatter.getPlayerURL(playerId);
    await page.goto(playerURL);

    const html = await page.content();
    const parentPlayer = formatter.getPlayerURLSuffix(playerId);

    const dateArray = this.getTradeDates(html);
    const dateIndices = this.getDateIndices(dateArray, date);
    const playerURLs = this.getPlayerURLs(dateIndices, html);

    const playerParams: IPlayerParams = {
      parentPlayer,
      playerURLs,
      date
    };

    const pageParams: IPageParams = {
      page,
      browser
    };

    const loopedData = await this.loopPlayers(playerParams, pageParams);

    return loopedData;
  }

  public async loopPlayers(
    playerParams: IPlayerParams,
    pageParams: IPageParams
  ) {
    const { page, browser } = pageParams;
    const { playerURLs, parentPlayer, date } = playerParams;

    let data: { [player: string]: string[] } = {};

    for (const playerURL of playerURLs) {
      await page.goto(`${baseURL}/players/${playerURL}`);

      const playerHTML = await page.content();
      const playerName = formatter.getPlayerName(playerHTML);
      console.log({ playerName });
      const dateArray = this.getTradeDates(playerHTML);
      const dateIndices = this.getDateIndices(dateArray, date);
      const playerURLs = this.getPlayerURLs(dateIndices, playerHTML);
      const playerHead =
        playerURLs.findIndex((url) => url === parentPlayer) + 1;

      // console.log(tradeService.getAllPlayers(playerHTML, dateIndices));

      data[playerName] = playerURLs.slice(playerHead);
    }

    await browser.close();
    return data;
  }

  public async getAllTransactions(req: Request, res: Response) {
    const { date, id } = req.query;
    const travData = await this.traverse(id, date);
    res.send({ data: travData });
  }
}

export const tradeController = new TradeController();
