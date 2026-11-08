import type { FocusEvent } from 'react';

/** Odak halkasının dışa taşan payı: 2px çizgi + en fazla 4px açıklık */
const RING = 6;

/**
 * Yatay kaydırılan satırlarda odak alan öğeyi, halkasıyla birlikte tamamen görünür yapar.
 *
 * Neden: Chrome, odaklanan öğenin bir kısmı görünüyorsa satırı hiç kaydırmıyor. Klavyeyle satırda
 * ilerleyen kullanıcı ekran kenarında yarısı kesik bir afişe odaklanıyor, halkası da kesik
 * kalıyordu. Satırın kendisine (`onFocus`) bağlanır: React'te odak olayı üst öğeye kadar çıkar.
 *
 * Kaydırma yakalamalı (`snap-x`) satırlarda öğe satırın başına hizalanır: "en yakın" hizalama
 * yakalama noktası olmayan bir yerde durur ve tarayıcı satırı eski yerine geri oturturdu.
 *
 * Yalnızca klavye odağında (`:focus-visible`): fareyle odak tuşa basılınca gelir; satır o anda
 * kayarsa tuş bırakıldığında imleç başka bir afişin üstünde kalır ve tıklama gerçekleşmezdi.
 */
export function revealFocused(event: FocusEvent<HTMLElement>) {
  const row = event.currentTarget;
  const target = event.target;
  if (target === row || !target.matches(':focus-visible')) return;

  const item = target.getBoundingClientRect();
  const box = row.getBoundingClientRect();
  if (item.left - RING >= box.left && item.right + RING <= box.right) return;

  const snaps = getComputedStyle(row).scrollSnapType !== 'none';
  target.scrollIntoView({ block: 'nearest', inline: snaps ? 'start' : 'nearest' });
}
