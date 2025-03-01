import { formatter } from './../utils';
import $ from 'cheerio';
import { PlayerID } from '../models';
import { transactionSelector } from '../settings';
import he from 'he';

class HTMLService {
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
      `${transactionSelector}:nth-child(${index})`,
      html
    ).html();

    if (transactionHTML) {
      const isMultiTrade = transactionHTML.toLowerCase().includes('as part of');
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
   * @param html The HTML context in which we are finding the selected team in a string.
   * @param to The team side which we are selected. Either `tradedFrom` or `tradedTo`.
   * @returns The team abbreviation found in the HTML.
   * @example
   * getTeam('<a data-attr-to="PHI" /><a data-attr-from="CLE" />');
   * // "CLE"
   * getTeam('<a data-attr-to="PHI" /><a data-attr-from="CLE" />', true);
   * // "PHI"
   */
  private getTeam(html: string, to = false): string {
    const side = to ? 'to' : 'from';
    return $(`a[data-attr-${side}]`, html).attr(`data-attr-${side}`);
  }
  /**
   * Gets the players involved in a trade for one side of the trade.
   * Either the players who were `tradedFrom` a team, or `tradedTo` a team.
   * @param tradedFromHTML The side of the HTML where `traded from` occurs.
   * @param tradedToHTML The side of the HTML where `traded to` occurs.
   * @param swap An optional argument that swaps the teams involved.
   * @returns An array of PlayerIDs.
   */
  private getPlayersInSection(
    tradedFromHTML: string,
    tradedToHTML: string,
    swap = false
  ): PlayerID[] {
    const data: PlayerID[] = [];
    const htmlContext = swap ? tradedToHTML : tradedFromHTML;
    $('a[href*="players"]', htmlContext).each(
      (_i: number, ele: CheerioElement) => {
        const tradedFrom = swap
          ? this.getTeam(tradedToHTML, true)
          : this.getTeam(tradedFromHTML);

        const tradedTo = swap
          ? this.getTeam(tradedFromHTML, !swap)
          : this.getTeam(tradedToHTML, true);

        const player = new PlayerID(
          $(ele).text(),
          $(ele).attr('href'),
          tradedFrom,
          tradedTo
        );

        data.push(player);
      }
    );
    return data;
  }
  /**
   * Helper function to format trade data.
   * @param tradedFrom HTML context.
   * @param tradedTo HTML context.
   * @returns An array of PlayerIDs.
   */
  private formatTrades(tradedFrom: string, tradedTo: string): PlayerID[] {
    return [
      ...this.getPlayersInSection(tradedFrom, tradedTo),
      ...this.getPlayersInSection(tradedFrom, tradedTo, true)
    ];
  }
  /**
   * Gets all players involved in a multi-team trade for a given date.
   * @param dividedTradeHTML The array of HTML trade strings.
   * @param playerSearchHTML The html of the player we are searching for. This is used to append their information in the search result.
   * @returns An array of PlayerIDs.
   */
  private findMultiTrade(
    dividedTradeHTML: string[],
    playerSearchHTML: string
  ): PlayerID[] {
    const splitHTMLData: string[][] = [];
    const playerData: PlayerID[] = [];

    dividedTradeHTML.forEach((html) => {
      const splitHTML = this.splitHTML(html);
      splitHTMLData.push(splitHTML);
    });
    // ! inefficient On^2  going on here.
    splitHTMLData.forEach((html: string[], i: number) => {
      const [tradedFrom, tradedTo] = html;
      /** This variable is used so we don't push in the player we searched
       * for multiple times. The player we searched for is always the first
       * player in the search result */
      const isFirstTrade = i === 0;
      const searchedPlayer = this.getSearchedPlayer(playerSearchHTML, html);
      const tradeData = this.formatTrades(tradedFrom, tradedTo);

      if (isFirstTrade) playerData.push(searchedPlayer);

      playerData.push(...tradeData);
    });
    return playerData;
  }
  /**
   * Gets all players involved in a trade for a given date.
   * @param playerHTML The HTML page of the player we have searched for.
   * @param index The index is used as an argument for `splitHTML(html, index)`
   * which is used to find HTML where a trade occurs.
   * @returns An array of PlayerIDs.
   */
  public findPlayers(playerHTML: string, index: number): PlayerID[] {
    const splitHTML = this.splitHTML(playerHTML, index);
    if (splitHTML.length > 0) {
      const normalTrade = splitHTML.length === 2;
      if (normalTrade) {
        const [tradedFrom, tradedTo] = splitHTML;
        const tradeData = [
          /** Appending the searched player to the beginning of the resulting array. */
          this.getSearchedPlayer(playerHTML, splitHTML),
          ...this.formatTrades(tradedFrom, tradedTo)
        ];
        return tradeData;
      } else {
        const multiTradeData = this.findMultiTrade(splitHTML, playerHTML);
        return multiTradeData;
      }
    }
    return [];
  }
  /**
   * Gets the information for the player that we searched.
   * @param playerHTML The HTML page of the player we have searched for.
   * @param splitHTML The split HTML where one side of the array denotes `tradedFrom`, and the other `tradedTo`.
   * @returns The PlayerID.
   * @example
   * PlayerID {
        "name": "Kawhi Leonard",
        "url": "l/leonaka01.html",
        "tradedFrom": "SAS",
        "tradedTo": "TOR"
      }
   */
  getSearchedPlayer(playerHTML: string, splitHTML: string[]): PlayerID {
    const [tradedFrom, tradedTo] = splitHTML;
    return new PlayerID(
      formatter.getPlayerName(playerHTML),
      $('#inner_nav > ul > li.current > a', playerHTML).attr('href'),
      this.getTeam(tradedFrom),
      this.getTeam(tradedTo, true)
    );
  }
  /**
   * Gets all players that were ever involved in a trade.
   * @param html The HTML page of the player we have searched for.
   * @returns An array of PlayerID arrays, where each array is a trade date found.
   */
  public getAllPlayers(
    html: string,
    foundTradeIndices: number[]
  ): PlayerID[][] {
    let results: PlayerID[][] = [];

    foundTradeIndices.forEach((tradeIndex) => {
      results.push(this.findPlayers(html, tradeIndex + 1));
    });
    return results;
  }
}

export const htmlService = new HTMLService();
