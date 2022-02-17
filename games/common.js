import { promises as fs } from 'fs'

import { produce } from 'immer'

// Load the available game titles
const games = {}
fs.readdir('./games').then(files => files.forEach(async file => {
  if (!file.endsWith('.js')) return
  const { default: game } = await import(`./${file}`)
  const name = file.replace(/\.js$/, '')
  games[name] = game
}))

export function logAction (message, action, draft, props) {
  draft.log ??= []
  draft.log.push({ message, action, index: draft.log.length, ...props })
}

export default function game (state = {}, action) {
  // Apply common "room" logic (joining, leaving)
  state = produce(state, draft => {
    const log = message => logAction(message, action, draft)

    if (
      action.type === "ADD_PLAYER" &&
      !draft.players?.[action.playerId] &&
      action.player?.name
    ) {
      draft.players ??= {}
      draft.players[action.playerId] = action.player;
      log(`🚪 ${action.player.name} entered the room.`)
    } else if (
      action.type === "REMOVE_PLAYER" &&
      state.players[action.playerId]
    ) {
      log(`❌ ${draft.players[action.playerId].name} has left the room.`)
      delete draft.players[action.playerId];
    } else if (action.type === 'NEW_GAME') {
      for(const prop in draft) {
        if (prop !== 'log' && prop !== 'players') {
          delete draft[prop]
        }
      }
      draft.game = action.game
      log(`${draft.players[action.playerId].name} started a new game of "${draft.game}."`)
    }
  })

  // Apply game-specific logic
  if (games[state.game]) {
    state = games[state.game](state, action)
  }

  return state
}
