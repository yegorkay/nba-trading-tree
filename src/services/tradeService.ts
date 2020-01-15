import $ from 'cheerio';
import { PlayerID } from '../models';
import { transactionSelector } from '../settings';
import he from 'he';

class TradeService {
  private splitString(html: string, index: number): string[] | undefined {
    const transaction = $(
      `${transactionSelector}:nth-child(${index + 1})`,
      html
    );
    const transactionHTML = transaction.html();
    if (transactionHTML) {
      const isMultiTrade = transactionHTML
        ?.toLowerCase()
        .includes('as part of');
      /** Decode any HTML entities so we don't have false positives splitting a string on a semi-colon `(;)` */
      const decodedHTML = isMultiTrade
        ? he.decode(transactionHTML)
        : transactionHTML;
      const splitKey = isMultiTrade ? '; ' : 'to the ';
      return decodedHTML?.split(splitKey);
    }
    return undefined;
  }

  private getTeam(context: string, to = false): string {
    const side = to ? 'to' : 'from';
    return $(`a[data-attr-${side}]`, context).attr(`data-attr-${side}`);
  }

  getPlayersInSection(
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

  public getPlayerData(html: string, index: number) {
    const dividedHTML = this.splitString(html, index);
    if (dividedHTML) {
      const normalTrade = dividedHTML.length === 2;
      if (normalTrade) {
        const [tradedFrom, tradedTo] = dividedHTML;
        const tradeData = [
          ...this.getPlayersInSection(tradedFrom, tradedTo),
          ...this.getPlayersInSection(tradedFrom, tradedTo, true)
        ];
        return tradeData;
      } else {
        dividedHTML.shift();
        console.log(`${dividedHTML[0]}`);
        // console.log(
        //   this.getTeam(dividedHTML[0]),
        //   this.getTeam(dividedHTML[0], true)
        // );
        // dividedHTML.forEach((html) => {
        //   console.log({
        //     tradedFrom: this.getTeam(html),
        //     tradedTo: this.getTeam(html, true)
        //   });
        // });
      }
    }
    return [];
  }

  getAllPlayers(html: string, foundTradeIndices: number[]): PlayerID[][] {
    let results: PlayerID[][] = [];
    for (let i = 0; i < foundTradeIndices.length; i++) {
      results.push(this.getPlayerData(html, foundTradeIndices[i]));
    }
    return results;
  }
}

export const tradeService = new TradeService();
