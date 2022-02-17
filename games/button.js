import { produce } from 'immer'

import { logAction } from './common.js'

export const title = 'The Button Game'

export default function buttonGame (state, action) {
  return produce(state, draft => {
    if (action.type === 'NEW_GAME') {
      draft.buttonCount = 0
    } else if (action.type === 'PUSH_BUTTON') {
      ++draft.buttonCount
      logAction(`${draft.players[action.playerId].name} pushed the button.`, action, draft)
    }
  })
}
