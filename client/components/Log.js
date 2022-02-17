import { html, useEffect, useRef } from "../client.js";

function scrollToBottom(el) {
  el.scrollTo({
    top: el.scrollHeight - el.clientHeight
  });
}

export default function Log({ entries }) {
  const ref = useRef();

  // Auto-scroll
  useEffect(() => scrollToBottom(ref.current), [])
  useEffect(() => {
    const el = ref.current
    if (el.scrollHeight - el.scrollTop - 32 < el.clientHeight) {
      scrollToBottom(el);
    }
  }, [entries]);

  return html`<div class="log-container">
    <div ref=${ref} class="log">
      <ul>
        ${entries.map((entry) => html`<li key=${entry.index}>${entry.message}</li>`)}
      </ul>
      <button
        type="button"
        class="scroll-to-end-button"
        onclick=${() => scrollToBottom(ref.current)}
      >⬇️</button>
    </div>
  </div>`;
}
