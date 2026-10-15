// Chat de ayuda de la landing (navegador). Conversación guiada con botones: preguntas con respuesta y un pedido paso
// a paso que termina abriendo WhatsApp con el mensaje armado. Las reglas del pedido (precios, total, mensaje) están en
// src/data/chat.ts; aquí solo se pinta y se lleva el paso actual.
import {
  MAX_QTY,
  orderMessage,
  selectedProducts,
  summarize,
  totalText,
  whatsappUrl,
  type ChatData,
  type ChatQuestion,
  type OrderDetails,
  type Quantities,
} from '../data/chat';

const QUESTIONS_SHOWN = 5;
const TYPING_MS = 450;

const BTN = 'chat-choice';
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text?: string) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function initChat(root: HTMLElement) {
  const data = JSON.parse(root.querySelector('[data-chat-data]')?.textContent ?? '{}') as ChatData;
  const launcher = root.querySelector<HTMLButtonElement>('[data-chat-open]')!;
  const panel = root.querySelector<HTMLElement>('[data-chat-panel]')!;
  const log = root.querySelector<HTMLElement>('[data-chat-log]')!;
  const actions = root.querySelector<HTMLElement>('[data-chat-actions]')!;
  const close = root.querySelector<HTMLButtonElement>('[data-chat-close]')!;

  let started = false;
  let qty: Quantities = {};
  let details: OrderDetails = { nombre: '', direccion: '', entrega: '', nota: '' };

  // ─── Mensajes ──────────────────────────────────────────────────────────────

  function scrollToEnd() {
    log.scrollTo({ top: log.scrollHeight, behavior: reduceMotion ? 'auto' : 'smooth' });
  }

  function say(from: 'bot' | 'user', content: string, { html = false } = {}) {
    const bubble = el('div', `chat-msg chat-msg-${from}`);
    if (html) bubble.innerHTML = content; // Solo HTML escapado por rich() (ver src/data/chat.ts).
    else bubble.textContent = content;
    log.append(bubble);
    scrollToEnd();
  }

  /** El bot "escribe" un momento antes de responder (sin espera con movimiento reducido). */
  function botSay(content: string, opts: { html?: boolean } = {}) {
    return new Promise<void>((resolve) => {
      if (reduceMotion) {
        say('bot', content, opts);
        resolve();
        return;
      }
      const typing = el('div', 'chat-msg chat-msg-bot chat-typing');
      typing.setAttribute('aria-hidden', 'true');
      typing.append(el('span'), el('span'), el('span'));
      log.append(typing);
      scrollToEnd();
      setTimeout(() => {
        typing.remove();
        say('bot', content, opts);
        resolve();
      }, TYPING_MS);
    });
  }

  // ─── Acciones (lo que se puede tocar en cada paso) ─────────────────────────

  function setActions(...nodes: HTMLElement[]) {
    actions.replaceChildren(...nodes);
    actions.querySelector<HTMLElement>('button, a, input')?.focus({ preventScroll: true });
  }

  function choice(label: string, onClick: () => void, extra = '') {
    const b = el('button', `${BTN} ${extra}`, label);
    b.type = 'button';
    b.addEventListener('click', onClick);
    return b;
  }

  function whatsappLink(label: string, text: string, className = 'btn btn-primary btn-sm') {
    const a = el('a', className);
    a.href = whatsappUrl(data.whatsapp, text);
    a.target = '_blank';
    a.rel = 'noopener';
    a.append(el('span', '', label));
    return a;
  }

  const group = (...nodes: HTMLElement[]) => {
    const div = el('div', 'flex flex-wrap gap-2');
    div.append(...nodes);
    return div;
  };

  // ─── Inicio y preguntas ────────────────────────────────────────────────────

  function showMenu(allQuestions = false) {
    const items: HTMLElement[] = [];
    if (data.productos.length) items.push(choice('Hacer un pedido', startOrder, 'chat-choice-primary'));
    const questions = allQuestions ? data.preguntas : data.preguntas.slice(0, QUESTIONS_SHOWN);
    for (const q of questions) items.push(choice(q.pregunta, () => answer(q)));
    if (!allQuestions && data.preguntas.length > QUESTIONS_SHOWN) {
      items.push(choice(`Ver más preguntas (${data.preguntas.length - QUESTIONS_SHOWN})`, () => showMenu(true)));
    }
    items.push(whatsappLink('Hablar con una persona', `Hola, ${data.marca}. Tengo una pregunta.`, `${BTN} chat-choice-link`));
    setActions(group(...items));
  }

  async function answer(q: ChatQuestion) {
    say('user', q.pregunta);
    actions.replaceChildren();
    await botSay(q.respuestaHtml, { html: true });
    const next = [choice('Otra pregunta', () => showMenu())];
    if (data.productos.length) next.unshift(choice('Hacer un pedido', startOrder, 'chat-choice-primary'));
    setActions(group(...next));
  }

  // ─── Pedido ────────────────────────────────────────────────────────────────

  async function startOrder() {
    say('user', 'Quiero hacer un pedido');
    qty = {};
    details = { nombre: '', direccion: '', entrega: '', nota: '' };
    actions.replaceChildren();
    await botSay('Perfecto. ¿Qué quieres pedir? Elige las cantidades.');
    showPicker();
  }

  function showPicker() {
    const list = el('div', 'chat-picker');
    const next = choice('Continuar', confirmProducts, 'chat-choice-primary');
    const refresh = () => {
      next.disabled = !selectedProducts(data.productos, qty).length;
    };
    for (const p of data.productos) {
      const row = el('div', 'chat-product');
      const info = el('div', 'min-w-0 flex-1');
      info.append(el('p', 'chat-product-name', p.nombre), el('p', 'chat-product-price', p.precio));
      const count = el('span', 'chat-qty', String(qty[p.id] ?? 0));
      count.setAttribute('aria-live', 'polite');
      const step = (delta: number) => () => {
        qty[p.id] = Math.min(MAX_QTY, Math.max(0, (qty[p.id] ?? 0) + delta));
        count.textContent = String(qty[p.id]);
        refresh();
      };
      const minus = choice('−', step(-1), 'chat-step');
      minus.setAttribute('aria-label', `Quitar uno de ${p.nombre}`);
      const plus = choice('+', step(1), 'chat-step');
      plus.setAttribute('aria-label', `Añadir uno de ${p.nombre}`);
      row.append(info, minus, count, plus);
      list.append(row);
    }
    refresh();
    setActions(list, group(next, choice('Cancelar', () => showMenu())));
  }

  async function confirmProducts() {
    say('user', summarize(data.productos, qty).lines.join('\n'));
    actions.replaceChildren();
    await botSay('¿A nombre de quién va el pedido?');
    askText('Tu nombre', (v) => {
      details.nombre = v;
      void askAddress();
    });
  }

  async function askAddress() {
    await botSay('¿A qué dirección o barrio lo llevamos?');
    askText('Dirección o barrio', (v) => {
      details.direccion = v;
      void askDelivery();
    });
  }

  async function askDelivery() {
    if (!data.entregas.length) return askNote();
    await botSay('¿Para cuándo lo quieres?');
    setActions(
      group(
        ...data.entregas.map((option) =>
          choice(option, () => {
            say('user', option);
            details.entrega = option;
            void askNote();
          }),
        ),
      ),
    );
  }

  async function askNote() {
    if (!data.pedirNota) return showSummary();
    actions.replaceChildren();
    await botSay('¿Quieres añadir una nota? Por ejemplo, un punto de referencia o cómo quieres el pollo.');
    askText('Nota (opcional)', (v) => {
      details.nota = v;
      void showSummary();
    }, { optional: true });
  }

  /** Campo de texto con enviar (y "Omitir" si es opcional). */
  function askText(placeholder: string, onDone: (value: string) => void, { optional = false } = {}) {
    const form = el('form', 'chat-form');
    const input = el('input', 'chat-input');
    input.placeholder = placeholder;
    input.setAttribute('aria-label', placeholder);
    input.maxLength = 160;
    input.required = !optional;
    input.autocomplete = 'on';
    const send = el('button', 'chat-send', 'Enviar');
    send.type = 'submit';
    form.append(input, send);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const value = input.value.trim();
      if (!value && !optional) return input.focus();
      if (value) say('user', value);
      actions.replaceChildren();
      onDone(value);
    });
    const nodes: HTMLElement[] = [form];
    if (optional) {
      nodes.push(
        group(
          choice('Omitir', () => {
            actions.replaceChildren();
            onDone('');
          }),
        ),
      );
    }
    setActions(...nodes);
  }

  async function showSummary() {
    actions.replaceChildren();
    const s = summarize(data.productos, qty);
    const lines = [
      'Este es tu pedido:',
      ...s.lines,
      totalText(s),
      '',
      `Nombre: ${details.nombre}`,
      `Dirección: ${details.direccion}`,
      ...(details.entrega ? [`Entrega: ${details.entrega}`] : []),
      ...(details.nota ? [`Nota: ${details.nota}`] : []),
    ].filter((l, i, all) => l || all[i - 1]);
    await botSay(lines.join('\n'));
    const send = whatsappLink('Enviar pedido por WhatsApp', orderMessage(data, qty, details));
    send.addEventListener('click', () => {
      void botSay('Listo. Se abrió WhatsApp con tu pedido: solo dale enviar y te confirmamos el total y la hora.');
      setActions(group(choice('Volver al inicio', () => showMenu())));
    });
    setActions(group(send, choice('Cambiar el pedido', startOrder), choice('Volver al inicio', () => showMenu())));
  }

  // ─── Abrir y cerrar ────────────────────────────────────────────────────────

  async function open() {
    panel.hidden = false;
    root.dataset.open = '';
    launcher.setAttribute('aria-expanded', 'true');
    if (!started) {
      started = true;
      await botSay(data.bienvenida);
      showMenu();
    } else {
      actions.querySelector<HTMLElement>('button, a, input')?.focus({ preventScroll: true });
    }
  }

  function hide() {
    panel.hidden = true;
    delete root.dataset.open;
    launcher.setAttribute('aria-expanded', 'false');
    launcher.focus();
  }

  launcher.addEventListener('click', () => (panel.hidden ? void open() : hide()));
  close.addEventListener('click', hide);
  root.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !panel.hidden) hide();
  });
}

document.querySelectorAll<HTMLElement>('[data-chat]').forEach(initChat);
