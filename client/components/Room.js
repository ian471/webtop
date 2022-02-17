import {
  html,
  useEffect,
  useRef,
  useState,
  useStickyState,
  playerId,
} from "../client.js";
import { AppHeader } from "./App.js";
import Game from "./Game.js";
import Log from "./Log.js";

// "game" corresponds to the filename in games/
const gamesMenu = [
  { game: 'button', title: 'The Button Game' },
]

export default function Room({ roomId }) {
  const url = new URL(location.href);
  const debug = url.searchParams.has("debug");

  const [connectedPlayerIds, setConnectedPlayerIds] = useState(new Set());
  const [defaultPlayerName, setDefaultPlayerName] =
    useStickyState("defaultPlayerName");
  const [gameState, setGameState] = useState();
  const [linkCopied, setLinkCopied] = useState(false);
  const [newGameDialogOpen, setNewGameDialogOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState();

  const handleError = (err) => {
    console.error(err);
    setStatusMessage(`❗ ${err}`);
  };

  const [ws, setWs] = useState(null);
  useEffect(() => {
    if (!roomId) return;
    const url = new URL(location.href);
    url.protocol = location.protocol === "https:" ? "wss:" : "ws:";
    url.pathname = `/api/rooms/${roomId}`;
    url.searchParams.set("playerId", playerId);
    const ws = new WebSocket(url);
    ws.onopen = () => setWs(ws);
    ws.onmessage = (e) => {
      try {
        const message = JSON.parse(e.data);
        switch (message.type) {
          case "CONNECTED_PLAYERS":
            setConnectedPlayerIds(new Set(message.playerIds));
            break;
          case "GAME_STATE":
            setGameState(message.gameState);
            break;
          case "ERROR":
            handleError(message.message);
            break;
          default:
            handleError(`Unknown message type: ${message.type}`);
        }
      } catch (err) {
        handleError(`Error handling message: ${e.data} ${err.message}`);
      }
    };
    ws.onerror = (e) => {
      handleError(`WebSocket error: ${e.message}`);
      setWs(null);
    };
    ws.onclose = () => setWs(null);
    return () => ws.close();
  }, [roomId]);

  // Keep websocket connection alive
  const [wsHeartbeatInterval, setWsHeartbeatInterval] = useState();
  useEffect(() => {
    if (ws && !wsHeartbeatInterval) {
      setWsHeartbeatInterval(
        setInterval(() => {
          sendMessage('{"type":"HEARTBEAT"}');
        }, 10000)
      );
    } else if (!ws && wsHeartbeatInterval) {
      clearInterval(wsHeartbeatInterval);
      setWsHeartbeatInterval(null);
    }
    return () => clearInterval(wsHeartbeatInterval);
  }, [ws, wsHeartbeatInterval]);

  const sendMessage = (message) => {
    if (typeof message !== "string") {
      message = JSON.stringify(message);
    }
    ws.send(message);
  };

  const inRoom = !!(ws && gameState?.players[playerId]);

  return html`
    <${AppHeader} />
    <main>
      <p>
        <strong>${ws ? "✅ Connected" : "🔌 Not connected"}</strong><br />
        ${statusMessage}
      </p>
      <p>
        <label class="copy-link"
          >Room link<br />
          <input
            readonly
            value=${location.href}
            onclick=${(e) =>
              e.target.setSelectionRange(0, e.target.value.length)}
          />
          ${navigator.clipboard &&
          ws &&
          html`
            <button
              type="button"
              class="copy-button"
              onclick=${() => {
                navigator.clipboard.writeText(location.href);
                setLinkCopied(true);
                setTimeout(() => setLinkCopied(false), 2000);
              }}
            >
              ${linkCopied ? "✔ Copied" : "📋 Copy"}
            </button>
          `}
        </label>
      </p>

      ${ws && (inRoom
        ? html`
          <button type="button" onclick=${() => setNewGameDialogOpen(true)}>
            🔃 Start new game
          </button>
          <button
            type="button"
            onclick=${() => {
              confirm("Are you sure you want to leave?") &&
                sendMessage({ type: "REMOVE_PLAYER" });
            }}
          >❌ Leave room</button>
          <h4>Log</h4>
          <p><${Log} entries=${gameState.log} status=${gameState.status} /></p>
          ${gameState.game &&
          html`<${Game} ...${{ connectedPlayerIds, gameState, sendMessage }} />`}
          ${newGameDialogOpen && html`
            <${NewGameDialog}
              onClose=${data => {
                setNewGameDialogOpen(false);
                if (data) {
                  sendMessage({
                    type: "NEW_GAME",
                    game: data.game,
                    players: Array.from(connectedPlayerIds)
                  });
                }
              }}
            />
          `}
        `
        : html`
          <form
            onsubmit=${(e) => {
              e.preventDefault();
              const name = e.target.elements.playerName.value;
              setDefaultPlayerName(name);
              if (name) {
                sendMessage({
                  type: "ADD_PLAYER",
                  player: { name },
                });
              }
            }}
          >
            <input
              name="playerName"
              placeholder="Your name"
              value=${defaultPlayerName}
              required
              autofocus
            />
            <button>Join room</button>
          </form>
        `
      )}
      ${debug && html`<p>
        <details>
          <summary>Debug info</summary>
          <h4>Game State</h4>
          <pre>${gameState ? JSON.stringify(gameState, null, 2) : "{}"}</pre>
          <h4>Send Message</h4>
          <form
            onsubmit=${(e) => {
              e.preventDefault();
              sendMessage(e.target.elements.message.value);
              return false;
            }}
          >
            <input name="message" placeholder="Enter a message" />
            <button>Send</button>
          </form>
        </details>
      </p>`}
    </main>
  `;
}

function NewGameDialog({ onClose }) {
  const dialogRef = useRef();
  useEffect(() => {
    dialogRef.current.showModal();
  }, []);

  return html`<dialog ref=${dialogRef} onclose=${() => onClose()}>
    <h3>New Game</h3>
    <form
      method="dialog"
      onsubmit=${(e) => {
        e.preventDefault();
        const data = new FormData(e.target)
        onClose({ game: data.get('game') });
      }}
    >
      <select name="game">
        ${gamesMenu.map(({ game, title }) => html`
          <option key=${game} value=${game}>${title}</option>
        `)}
      </select>
      <footer style=${{ textAlign: "right" }}>
        <button type="button" onclick=${() => dialogRef.current.close()}>
          Cancel
        </button>
        <button>Start game</button>
      </footer>
    </form>
  </dialog>`;
}
