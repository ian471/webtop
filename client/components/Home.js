import { html } from "../client.js";
import { AppHeader } from "./App.js";

export default function Home() {
  return html`
    <${AppHeader} />
    <main>
      <h1>Welcome!</h1>
      <p>Create a new room and invite your friends to play.</p>
      <p>
        <button
          onclick=${async () => {
            const { roomId } = await fetch("/api/rooms", {
              method: "POST",
            }).then((r) => r.json());
            location.pathname = `/room/${roomId}`;
          }}
        >🚪 New room</button>
      </p>
    </main>
  `;
}
