import './styles.css';
import { mountApplication } from './mount.js';

const moduleUrl = import.meta.url;
export function mountMetronome(target = '#metronome-app') {
  const css = new URL('./metronome.css', moduleUrl);
  css.search = new URL(moduleUrl).search;
  return mountApplication(target, { cssHref: css.href });
}
