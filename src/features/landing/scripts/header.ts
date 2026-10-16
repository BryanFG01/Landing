// Lógica del menú móvil y del indicador de sección activa (Header.astro).
const toggle = document.querySelector<HTMLButtonElement>('.menu-toggle');
const menu = document.getElementById('menu');
const main = document.getElementById('contenido');
const footer = document.querySelector('footer');

const setOpen = (open: boolean) => {
  if (!toggle || !menu) return;
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  menu.toggleAttribute('data-open', open);
  menu.inert = !open;
  if (main) main.inert = open;
  if (footer) footer.inert = open;
  if (open) {
    window.smoothScroll?.stop();
    menu.querySelector<HTMLAnchorElement>('a')?.focus({ preventScroll: true });
  } else {
    window.smoothScroll?.start();
  }
};

toggle?.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && toggle?.getAttribute('aria-expanded') === 'true') {
    setOpen(false);
    toggle.focus();
  }
});

menu?.querySelectorAll<HTMLAnchorElement>('[data-menu-link]').forEach((link) => {
  link.addEventListener('click', (event) => {
    const target = document.querySelector<HTMLElement>(link.hash);
    if (!target) return;
    event.preventDefault();
    setOpen(false);
    if (window.smoothScroll) window.smoothScroll.scrollTo(target);
    else target.scrollIntoView();
  });
});

window.matchMedia('(min-width: 1024px)').addEventListener('change', (event) => {
  if (event.matches) setOpen(false);
});

// Indica en la navegación la sección que se está viendo.
const links = [...document.querySelectorAll<HTMLAnchorElement>('[data-nav-link]')];
const indicator = document.querySelector<HTMLElement>('.nav-indicator');

const moveIndicator = () => {
  if (!indicator) return;
  const active = links.find((link) => link.getAttribute('aria-current') === 'true');
  if (!active) {
    indicator.removeAttribute('data-visible');
    return;
  }
  // Si estaba oculta, aparece en su sitio en vez de deslizarse desde el anterior.
  indicator.toggleAttribute('data-instant', !indicator.hasAttribute('data-visible'));
  indicator.style.setProperty('--x', `${active.offsetLeft}px`);
  indicator.style.setProperty('--w', `${active.offsetWidth}px`);
  void indicator.offsetWidth;
  indicator.removeAttribute('data-instant');
  indicator.setAttribute('data-visible', '');
};

const spy = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const href = (entry.target as HTMLElement).dataset.spy;
      links.forEach((link) => link.setAttribute('aria-current', String(link.getAttribute('href') === href)));
      moveIndicator();
    }
  },
  { rootMargin: '-50% 0px -50% 0px' },
);
document.querySelectorAll('[data-spy]').forEach((el) => spy.observe(el));

const list = links[0]?.closest('ul');
if (list) new ResizeObserver(moveIndicator).observe(list);
