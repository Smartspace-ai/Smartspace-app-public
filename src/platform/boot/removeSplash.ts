let removed = false;

export function removeSplash() {
  if (removed) return;
  removed = true;
  const el = document.getElementById('ss-boot-splash');
  if (!el) return;
  el.style.transition = 'opacity 300ms ease-out';
  el.style.opacity = '0';
  el.style.pointerEvents = 'none';
  el.addEventListener('transitionend', () => el.remove(), { once: true });
  setTimeout(() => el.remove(), 400); // safety fallback
}
