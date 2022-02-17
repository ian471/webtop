import { html, playerId } from "../client.js";

// Audio to .play() during the game.
// const alertAudio = new Audio("../media/alert.wav");
// const gameEndAudio = new Audio("../media/gameEnd.wav");
// const handEndAudio = new Audio("../media/handEnd.wav");
// const turnNotificationAudio = new Audio("../media/notify.wav");

export default function ButtonGame ({ gameState, sendMessage }) {
  return html`
    <h4>Players</h4>
    <ul>
      ${Object.keys(gameState.players).map(id => html`
        <li key=${id}>
          ${gameState.players[id].name}
          ${id === playerId && ' (you)'}
        </li>
      `)}
    </ul>
    <div style="text-align: center; margin: 1rem;">
      <button
        style="background:red;"
        onclick=${() => sendMessage({ type: 'PUSH_BUTTON' })}
      ><big>PUSH ME (${gameState.buttonCount || 0})</big></button>
    </div>
  `
}
