export const errors = {
  playerNotFound: (player: string) => ({
    errors: [
      {
        value: player,
        msg: 'Could not find the player provided.',
        param: 'player',
        location: 'query'
      }
    ]
  })
};
