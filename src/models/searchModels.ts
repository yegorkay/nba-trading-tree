import { formatter } from '../utils';
/**
  @class PlayerID
  @classdesc Generates a PlayerID structure containing all relevant player information.

  @param {name} string - Player name.
  @param {url} string - Basketball Reference URL that gets formatted.
  @param {tradedFrom} string - The team the player was traded from. (optional)
  @param {tradedTo} string - The team the player was traded to. (optional)
*/
class PlayerID {
  constructor(
    public name: string,
    public url: string,
    public tradedFrom?: string,
    public tradedTo?: string
  ) {
    this.name = name;
    this.url = formatter.formatPlayerURL(url);
    this.tradedFrom = tradedFrom;
    this.tradedTo = tradedTo;
  }
}

interface ITradeData {
  [date: string]: PlayerID[];
}

interface ISearchResult {
  playerID: PlayerID;
  trades: ITradeData;
}

export { PlayerID, ISearchResult, ITradeData };
