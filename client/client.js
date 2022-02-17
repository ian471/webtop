import {
  html,
  render,
  useEffect,
  useRef,
  useState,
} from "https://unpkg.com/htm/preact/standalone.module.js";
import { nanoid } from "https://unpkg.com/nanoid@3.1.30/nanoid.js";

import App from "./components/App.js";

export { html, nanoid, useEffect, useRef, useState };

function getCookie(name) {
  let res;
  document.cookie.split(";").forEach((part) => {
    const [, key, value] = /\s*(.+?)=(.*?)\s*$/.exec(part) ?? [];
    if (key === name) {
      try {
        res = JSON.parse(decodeURIComponent(value));
      } catch (error) {
        console.warn(`Malformed cookie "${name}"="${value}"`, error);
      }
    }
  });
  return res;
}

function setCookie(name, value) {
  if (value === undefined || value === null) {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
  } else {
    document.cookie = `${name}=${encodeURIComponent(JSON.stringify(value))}`;
  }
}

export function useStickyState(key, initialValue) {
  const [value, setValue] = useState(() => {
    const stickyValue = getCookie(key);
    return stickyValue ? stickyValue : initialValue;
  });
  useEffect(() => {
    setCookie(key, value);
  }, [key, value]);
  return [value, setValue];
}

export let playerId;
(() => {
  const url = new URL(location.href);
  const route = url.pathname.split("/").filter((x) => !!x);

  playerId = getCookie("playerId") || nanoid();
  setCookie("playerId", playerId);

  render(html`<${App} route=${route} />`, document.body);
})();
