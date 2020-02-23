import { tradeService } from '../services';
import { errors } from '../messages';
import { tradeController } from './tradeController';
import { baseURL, searchURL } from '../settings';
import { Response, Request } from 'express';
import { transactionSelector } from '../settings';
import { formatter, mongo } from './../utils';
import $ from 'cheerio';
import puppeteer, { Page } from 'puppeteer';
import { PlayerID, ISearchResult, ITradeData } from '../models';

class SearchController {
  /**
   * A check to see if there are no player results on the page.
   * @param html The resulting HTML of the player we have searched.
   * @param res The Express Response.
   * @param player The player query.
   * @returns A status if there is nothing found.
   */
  checkNoResults(html: string, res: Response, player: string): void {
    const selector = 'h1 + div > p > strong';
    const resultText = $(selector, html)
      .text()
      .toLowerCase();
    const nothingFound = resultText.includes('examples of successful searches');
    if (nothingFound) res.status(422).send(errors.playerNotFound(player));
  }
  /**
   * Returns the first URL from bball-ref search engine if a fuzzy search is initiated.
   * @param html The HTML of the fuzzy page result.
   * @param res The Express Response.
   * @returns Either a Response (player not found) or URL of the resulting player.
   */
  private fuzzyPlayerURL(
    html: string,
    res: Response,
    player: string
  ): Response | string {
    const searchResults = $('.search-item', html).length;

    if (searchResults > 1) {
      const firstResultURL = $('.search-item-name a:nth-child(1)', html).attr(
        'href'
      );
      return `${baseURL}${firstResultURL}`;
    } else {
      return res.status(422).send(errors.playerNotFound(player));
    }
  }
  /**
   * Our primary method to get any trade results from our search.
   * @param page The page class provided by puppeteer.
   * @param html The HTML of the player page we are searching.
   * @returns A promise of the search results.
   */
  async getSearchResults(page: Page, html: string): Promise<ISearchResult> {
    const foundTradeIndices = this.getTradeIndices(html);
    const foundTradeDates = tradeController.getTradeDates(html);
    const playerID = new PlayerID(formatter.getPlayerName(html), page.url());

    const trades = this.getTradesInDate(
      foundTradeIndices,
      foundTradeDates,
      html
    );

    const result: ISearchResult = {
      playerID,
      trades
    };
    return result;
  }
  /**
   * Gets all the occurences of transactions where a trade occured.
   * @param html The HTML of the page we are searching trades for.
   * @returns A promise that resolves into an array of indices where trades occured.
   */
  private getTradeIndices(html: string): number[] {
    let tradeIndices: number[] = [];
    $(transactionSelector, html).each((i: number, ele: CheerioElement) => {
      const isTradeElement = $(ele)
        .text()
        .toLowerCase()
        .includes('traded by');
      if (isTradeElement) tradeIndices.push(i);
    });
    return tradeIndices;
  }
  /**
   * Used to get any trades that occur within a trade string.
   * @param foundTradeIndices The trade indices that we have found on the page.
   * @param foundTradeDates The dates where the trade occured (this is used to name the object by date).
   * @param html The HTML of the player page we are searching.
   * @returns All trades that have occured within all trade dates.
   */
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

    foundTradeIndices.forEach((tradeIndex, i) => {
      result[foundTradeDates[tradeIndex]] = foundPlayersArray[i];
    });
    return result;
  }
  /**
   * Helper that gets results, stores them in the DB, and sends them through the endpoint.
   * @param page The page class provided by puppeteer.
   * @param html The HTML of the player page we are searching.
   * @returns A promise executing either a mongo insertion or response send.
   */
  async getResult(page: Page, html: string, res: Response): Promise<void> {
    const result = await this.getSearchResults(page, html);
    await mongo.insertPlayerInCollection(result);
    res.send(result);
  }
  /**
   * The main controller method used in our route to get the player we searched for.
   * @param player The player search query.
   * @param res The Express Response.
   * @returns A promise executing either a mongo insertion or response send.
   */
  async findPlayer(player: string, res: Response) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(searchURL(player));

    const html = await page.content();

    this.checkNoResults(html, res, player);

    if (page.url().includes('search')) {
      if ($('.search-item', html).length > 1) {
        const fuzzyPlayerURLResult = this.fuzzyPlayerURL(html, res, player);
        if (typeof fuzzyPlayerURLResult === 'string') {
          await page.goto(fuzzyPlayerURLResult);
          const fuzzyHTML = await page.content();
          await this.getResult(page, fuzzyHTML, res);
        }
      }
    } else {
      await this.getResult(page, html, res);
    }
  }
  /**
   * The main controller method used in our route to get the player we searched for.
   * @param req The Express Request.
   * @param res The Express Response.
   * @returns A promise of the resulting player.
   */
  public async getPlayer(req: Request, res: Response) {
    const { player } = req.query;
    const dbResults = await mongo.findPlayerInCollection(player);
    const noDBResults = !dbResults.length;
    if (noDBResults) {
      await this.findPlayer(player, res);
    } else {
      res.send(dbResults[0]);
    }
  }
}

export const searchController = new SearchController();
