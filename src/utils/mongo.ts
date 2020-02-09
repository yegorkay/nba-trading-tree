import mongoose from 'mongoose';
import { ISearchResult } from '../models';
class MongoController {
  async findPlayerInCollection(query: string) {
    const result = await mongoose.connection.db.collection('players');
    const playerQuery = new RegExp(query, 'i');
    return result
      .find({ 'playerID.name': { $regex: playerQuery } })
      .project({ _id: 0 })
      .toArray();
  }
  async insertPlayerInCollection(playerResult: ISearchResult) {
    const result = await mongoose.connection.db.collection('players');
    return result.insertOne(playerResult);
  }
}

export const mongo = new MongoController();
