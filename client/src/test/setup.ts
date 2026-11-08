import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// jsdom'da olmayan tarayıcı işlevleri. Testler bunların sonucuna değil, uygulamanın davranışına
// bakar: yerleşim ölçülmez, tuval okunmaz.
Element.prototype.scrollIntoView = function scrollIntoView() {};

// Tarayıcıda `inert` bir alandaki öğe odak alamaz; jsdom bunu uygulamıyor. Olmasaydı fragman
// testi, odağın `inert` kalkmadan önce verilmesi hatasını yakalayamazdı (denendi).
const nativeFocus = HTMLElement.prototype.focus;
HTMLElement.prototype.focus = function focus(options?: FocusOptions) {
  if (this.closest('[inert]')) return;
  nativeFocus.call(this, options);
};
HTMLCanvasElement.prototype.getContext = () => null;
window.matchMedia ??= (query: string) =>
  ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }) satisfies MediaQueryList;

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
