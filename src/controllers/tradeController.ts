import _ from 'lodash';
import puppeteer from 'puppeteer';
import { tradeService } from '../services';
import { baseURL } from '../settings';
import { formatter } from '../utils';
import { Response, Request } from 'express';
import { IPlayerParams, IPageParams } from '../models';

class TradeController {
  private async traverse(playerId: string, date: string) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const playerURL = formatter.getPlayerURL(playerId);
    await page.goto(playerURL);

    const html = await page.content();
    const parentPlayer = formatter.getPlayerURLSuffix(playerId);

    const dateArray = tradeService.getTradeDates(html);
    const dateIndices = tradeService.getDateIndices(dateArray, date);
    const playerURLs = tradeService.getPlayerURLs(dateIndices, html);

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
      const dateArray = tradeService.getTradeDates(playerHTML);
      const dateIndices = tradeService.getDateIndices(dateArray, date);
      const playerURLs = tradeService.getPlayerURLs(dateIndices, playerHTML);
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
