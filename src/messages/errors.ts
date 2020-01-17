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
  }),
  dateNotFound: () => ({
    errors: [
      {
        value: 'date',
        msg: 'Could not find the date provided.',
        param: 'date',
        location: 'query'
      }
    ]
  })
};
