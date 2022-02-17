import { html } from "../client.js";
import Home from "./Home.js";
import Room from "./Room.js";

export default function App({ route }) {
  let content;
  if (route[0] === "room") {
    const roomId = route[1].toUpperCase();
    content = html`<${Room} roomId=${roomId} />`;
  } else if (route[0] === "rules") {
    content = html`<${RulesPage} />`;
  } else {
    content = html`<${Home} />`;
  }

  return content;
}

export function AppHeader() {
  return html`
    <header>
      <h1>
        <a href="/">🎲 WebTop</a>
      </h1>
    </header>
  `;
}
