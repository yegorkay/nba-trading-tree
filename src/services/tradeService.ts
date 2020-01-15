import $ from 'cheerio';
import { PlayerID } from '../models';
import { transactionSelector } from '../settings';
import he from 'he';

class TradeService {
  /**
  * Gets the team abbreviation found in a `data-attr` tag for the given HTML.
  * @param html The HTML context.
  * @param index Used as part of a CSS selector to find HTML where a trade occurs.
  * @returns An array of HTML strings.
  */
  private splitHTML(html: string, index?: number): string[] {

    /** If the index is not passed, we are reading already parsed HTML,
     * and more likely an HTML string that was a part of a multi-team trade */
    if (!index) return html.split('to the ');

    const transactionHTML = $(
      `${transactionSelector}:nth-child(${index + 1})`,
      html
    ).html();

    if (transactionHTML) {
      const isMultiTrade = transactionHTML
        ?.toLowerCase()
        .includes('as part of');
      /** Decode any HTML entities so we don't have false
       * positives splitting a string on a semi-colon `(;)` */
      const decodedHTML = isMultiTrade
        ? he.decode(transactionHTML)
        : transactionHTML;
      const splitKey = isMultiTrade ? '; ' : 'to the ';
      return decodedHTML.split(splitKey);
    } else {
      return [];
    }
  }
  /**
   * Gets the team abbreviation found in a `data-attr` tag for the given HTML.
   * @param context The HTML context in which we are finding the selected team in a string.
   * @param to The team side which we are selected. Either `tradedFrom` or `tradedTo`.
   * @returns The team abbreviation found in the HTML.
   * @example
   * getTeam('<a data-attr-to="PHI" /><a data-attr-from="CLE" />');
   * // "CLE"
   * getTeam('<a data-attr-to="PHI" /><a data-attr-from="CLE" />', true);
   * // "PHI"
   */
  private getTeam(context: string, to = false): string {
    const side = to ? 'to' : 'from';
    return $(`a[data-attr-${side}]`, context).attr(`data-attr-${side}`);
  }
  /**
   * Gets the players involved in a trade for one side of the trade.
   * Either the players who were `tradedFrom` a team, or `tradedTo` a team.
   * @param tradedFromCtx The side of the HTML where `traded from` occurs.
   * @param tradedToCtx The side of the HTML where `traded to` occurs.
   * @param swap An optional argument that swaps the teams involved.
   * @returns An array of PlayerIDs.
   */
  private getPlayersInSection(
    tradedFromCtx: string,
    tradedToCtx: string,
    swap = false
  ): PlayerID[] {
    const data: PlayerID[] = [];
    const htmlCtx = swap ? tradedToCtx : tradedFromCtx;
    $('a[href*="players"]', htmlCtx).each((_i: number, ele: CheerioElement) => {
      const tradedFrom = swap
        ? this.getTeam(tradedToCtx, true)
        : this.getTeam(tradedFromCtx);

      const tradedTo = swap
        ? this.getTeam(tradedFromCtx, !swap)
        : this.getTeam(tradedToCtx, true);

      data.push(
        new PlayerID($(ele).text(), $(ele).attr('href'), tradedFrom, tradedTo)
      );
    });
    return data;
  }
  /**
   * Gets all players involved in a multi-team trade for a given date.
   * @param dividedHTML The array of HTML trade strings.
   * @returns An array of PlayerIDs.
   */
  private getMultiTradeData(dividedHTML: string[]): PlayerID[] {
    const splitHTMLData: string[][] = [];
    const playerData: PlayerID[] = [];

    dividedHTML.forEach((html) => {
      const splitHTML = this.splitHTML(html);
      splitHTMLData.push(splitHTML);
    });
    splitHTMLData.forEach((html: string[]) => {
      const [tradedFrom, tradedTo] = html;
      const tradeData = [
        ...this.getPlayersInSection(tradedFrom, tradedTo),
        ...this.getPlayersInSection(tradedFrom, tradedTo, true)
      ];
      playerData.push(...tradeData);
    })
    return playerData;
  }
  /**
   * Gets all players involved in a trade for a given date.
   * @param html The HTML page of the player we have searched for.
   * @param index The index is used as an argument for `splitHTML(html, index)`
   * which is used to find HTML where a trade occurs.
   * @returns An array of PlayerIDs.
   */
  private getPlayerData(html: string, index: number): PlayerID[] {
    const splitHTML = this.splitHTML(html, index);
    if (splitHTML.length > 0) {
      const normalTrade = splitHTML.length === 2;
      if (normalTrade) {
        const [tradedFrom, tradedTo] = splitHTML;
        const tradeData = [
          ...this.getPlayersInSection(tradedFrom, tradedTo),
          ...this.getPlayersInSection(tradedFrom, tradedTo, true)
        ];
        return tradeData;
      } else {
        /** Removing first element as we don't need
         * the trade data for the player we are searching for */
        splitHTML.shift();
        const multiTradeData = this.getMultiTradeData(splitHTML);
        return multiTradeData;
      }
    }
    return [];
  }
  /**
   * Gets all players that were ever involved in a trade.
   * @param html The HTML page of the player we have searched for.
   * @returns An array of PlayerID arrays, where each array is a trade date found.
   */
  public getAllPlayers(html: string, foundTradeIndices: number[]): PlayerID[][] {
    let results: PlayerID[][] = [];
    for (let i = 0; i < foundTradeIndices.length; i++) {
      results.push(this.getPlayerData(html, foundTradeIndices[i]));
    }
    return results;
  }
}

export const tradeService = new TradeService();
