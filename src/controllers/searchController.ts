import { tradeService } from '../services';
import { errors } from '../messages';
import { tradeController } from './tradeController';
import { baseURL, searchURL } from '../settings';
import { Response, Request } from 'express';
import { transactionSelector } from '../settings';
import { formatter } from './../utils';
import $ from 'cheerio';
import puppeteer, { Page } from 'puppeteer';
import { PlayerID, ISearchResult, ITradeData } from '../models';

class SearchController {
  private async getTradeIndices(page: Page, url: string): Promise<number[]> {
    await page.goto(url);
    const playerHTML = await page.content();
    let tradeIndices: number[] = [];
    $(transactionSelector, playerHTML).each(
      (i: number, ele: CheerioElement) => {
        if (
          $(ele)
            .text()
            .toLowerCase()
            .includes('traded by')
        ) {
          tradeIndices.push(i);
        }
      }
    );
    return tradeIndices;
  }

  private fuzzyPlayerURL(
    html: string,
    res: Response,
    player: string
  ): Response | string {
    const searchResults = $('.search-item', html).length;

    if (searchResults > 1) {
      const firstResultURL = $(
        '#players .search-item:first-child .search-item-url',
        html
      ).text();
      return `${baseURL}${firstResultURL}`;
    } else {
      return res.status(422).send(errors.playerNotFound(player));
    }
  }

  public async getPlayer(req: Request, res: Response) {
    const { player } = req.query;

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(searchURL(player));

    const html = await page.content();

    if (page.url().includes('search')) {
      if ($('.search-item', html).length > 1) {
        const fuzzyPlayerURLResult = this.fuzzyPlayerURL(html, res, player);
        if (typeof fuzzyPlayerURLResult === 'string') {
          await page.goto(fuzzyPlayerURLResult);
          const fuzzyHTML = await page.content();
          const result = await this.getSearchResults(page, fuzzyHTML);
          res.send(result);
        }
      }
    } else {
      const result = await this.getSearchResults(page, html);
      res.send(result);
    }
  }

  async getSearchResults(page: Page, html: string): Promise<ISearchResult> {
    const foundTradeIndices = await this.getTradeIndices(page, page.url());
    const foundTradeDates = tradeController.getTradeDates(html);

    const trades = this.getTradesInDate(
      foundTradeIndices,
      foundTradeDates,
      html
    );

    const result: ISearchResult = {
      playerID: new PlayerID(formatter.getPlayerName(html), page.url()),
      trades
    };

    return result;
  }

  getTradesInDate(
    foundTradeIndices: number[],
    foundTradeDates: string[],
    html: string
  ): ITradeData {
    let result: ITradeData = {};

    const foundPlayersArray: PlayerID[][] = tradeService.getAllPlayers(
      html,
      foundTradeIndices
    );

    for (let i = 0; i < foundTradeIndices.length; i++) {
      const foundTradeIndex = foundTradeIndices[i];
      result[foundTradeDates[foundTradeIndex]] = foundPlayersArray[i];
    }
    return result;
  }
}

export const searchController = new SearchController();
