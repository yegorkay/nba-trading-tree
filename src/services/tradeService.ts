import $ from 'cheerio';
import { htmlService } from './htmlService';
import { formatter } from '../utils';
import { transactionSelector } from '../settings';
import { PlayerID, ITradeData } from '../models';

class TradeService {
  /**
   * Converts all found trades into an array of indices.
   * @param dates The array of date strings.
   * @param dateMatch The matching date.
   * @returns Array of found trade indices.
   */
  public getDateIndices(dates: string[], dateMatch: string): number[] {
    let indexes: number[] = [];
    dates.forEach((date, i) => {
      if (date === dateMatch) indexes.push(i + 1);
    });
    return indexes;
  }
  /**
   * Gets all the player URLs.
   * @param html The HTML context.
   * @returns Array of found trade dates.
   */
  public getTradeDates(html: string): string[] {
    const transactionDateSelector: string = `#div_transactions span p.transaction strong:first-of-type`;
    let dateArray: string[] = [];
    $(transactionDateSelector, html).each((_i: number, ele: CheerioElement) => {
      return dateArray.push(formatter.formatDate($(ele).text()));
    });

    return dateArray;
  }
  /**
   * Gets all the player URLs.
   * @param dateIndices The array of data indices where trades were found.
   * @returns Array of player URLs.
   */
  public getPlayerURLs(dateIndices: number[], html: string): string[] {
    const playerURLSelector = formatter.generatePlayerURLSelector(dateIndices);

    let playerURLs: string[] = [];

    $(playerURLSelector, html).each((_i: number, ele: CheerioElement) => {
      const url = $(ele).attr('href');
      playerURLs.push(url.split('players/')[1]);
    });

    return playerURLs;
  }
  /**
   * Gets all the occurences of transactions where a trade occured.
   * @param html The HTML of the page we are searching trades for.
   * @returns A promise that resolves into an array of indices where trades occured.
   */
  public getTradeIndices(html: string): number[] {
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
  public getTradesInDate(
    foundTradeIndices: number[],
    foundTradeDates: string[],
    html: string
  ): ITradeData {
    let result: ITradeData = {};

    const foundPlayersArray: PlayerID[][] = this.getPlayersInTrade(
      html,
      foundTradeIndices
    );

    foundTradeIndices.forEach((tradeIndex, i) => {
      result[foundTradeDates[tradeIndex]] = foundPlayersArray[i];
    });
    return result;
  }
  /**
   * Gets all players that were ever involved in a trade.
   * @param html The HTML page of the player we have searched for.
   * @returns An array of PlayerID arrays, where each array is a trade date found.
   */
  public getPlayersInTrade(
    html: string,
    foundTradeIndices: number[]
  ): PlayerID[][] {
    let results: PlayerID[][] = [];

    foundTradeIndices.forEach((tradeIndex) => {
      results.push(htmlService.findPlayers(html, tradeIndex + 1));
    });
    return results;
  }
}

export const tradeService = new TradeService();
