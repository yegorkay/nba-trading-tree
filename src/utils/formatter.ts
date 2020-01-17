import $ from 'cheerio';
import moment from 'moment';
import { transactionSelector } from '../settings';

class FormatController {
  /**
   * Formats the bball-ref date to an easier to use format.
   * @param date Date string i.e. "June 21, 2006"
   * @returns formatted date.
   * @example
   * formatDate("June 21, 2006");
   * // "2006-06-21"
   */
  public formatDate(date: string): string {
    return moment(new Date(date)).format('YYYY-MM-DD');
  }
  /**
   * Generates an HTML selector for all players involved in a trade.
   * @param dateIndices - The indexes where trade dates occur in the page.
   * @return HTML selector for all players involved in a trade.
   * @example
   * '#div_transactions span:nth-child(n+1) p a[href*="players"]'
   */
  public generatePlayerURLSelector(dateIndices: number[]): string {
    console.log(dateIndices, 'dateIndices');
    if (dateIndices.length > 1) {
      return `${transactionSelector}:nth-child(n+${
        dateIndices[0]
      }):nth-child(-n+${
        dateIndices[dateIndices.length - 1]
      }) p a[href*="players"]`;
    }
    return `${transactionSelector}:nth-child(n+${dateIndices[0]}) p a[href*="players"]`;
  }
  /**
   * Formats a player URL to return only the prefix including the players last name.
   * @param playerURL - The URL of the player.
   * @return Shortened and formatted URL.
   * @example
   * formatPlayerURL("https://www.basketball-reference.com/players/n/nashst01.html");
   * // "n/nashst01.html"
   */
  public formatPlayerURL(playerURL: string) {
    return playerURL.split('players/')[1];
  }
  /**
   * Returns the string value for elements that have `data-attr-to` or `data-attr-from` data attribute.
   * @param playerURL - The URL of the player.
   * @return Shortened and formatted URL.
   * @example
   * formatPlayerURL("https://www.basketball-reference.com/players/n/nashst01.html");
   * // "n/nashst01.html"
   */
  public teamAttrSelector(html: string, index: number, to = false): string {
    const side = to ? 'to' : 'from';
    return $(
      `${transactionSelector}:nth-child(${index +
        1}) p.transaction a[data-attr-${side}]`,
      html
    ).attr(`data-attr-${side}`);
  }
  /**
   * Returns the player name by selecting the `h1` tag at the top of the page.
   * @param htmlContext - The HTML being searched.
   * @return Player name.
   * @example
   * getPlayerName(steveNashHTML);
   * // Steve Nash
   */
  public getPlayerName(htmlContext: string): string {
    return $('h1', htmlContext).text();
  }
}

export const formatter = new FormatController();
