// Keyboard and assistive-technology access to the existing editor, without changing its data format.
(() => {
  'use strict';
  const grid = document.getElementById('measureContainer');
  const writer = window.myGrooveWriter;
  if (!grid || !writer) return;
  const instruments = [ ['sticking','Sticking','.sticking'], ['hh','Hi-hat','.hi-hat'],
    ['tom1','High tom','[id^="tom1-"].tom'], ['snare','Snare','.snare'], ['tom4','Low tom','[id^="tom4-"].tom'], ['kick','Kick','.kick'] ];
  let rows = [], activeId, pending;
  const audioStatus = document.createElement('p');
  audioStatus.className = 'groove-keyboard-help';
  audioStatus.setAttribute('role', 'status');
  document.getElementById('midiPlayer').after(audioStatus);
  audioStatus.textContent = 'Loading drum sounds…';
  const audioTimeout = setTimeout(() => {
    if (!audioStatus.hidden) {
      const retry = document.createElement('a');
      retry.href = location.href;
      retry.textContent = 'Reload the editor';
      audioStatus.replaceChildren('Drum sounds could not load. Check your connection. ', retry);
    }
  }, 15000);
  const visible = element => getComputedStyle(element).visibility !== 'hidden' && getComputedStyle(element.parentElement).display !== 'none';
  function refresh() {
    pending = undefined;
    rows = instruments.map(([type, name, selector]) => [...grid.querySelectorAll(selector)].filter(visible).map(cell => {
      const index = Number(cell.id.match(/\d+$/)[0]);
      const note = writer.accessibleNoteState(type, index);
      cell.dataset.grooveNote = type;
      cell.dataset.noteIndex = String(index);
      cell.setAttribute('role', 'button');
      cell.setAttribute('aria-pressed', String(note.on));
      cell.setAttribute('aria-label', `${name}, bar ${note.bar}, beat ${note.beat}, step ${note.step} of ${note.steps}: ${note.state}`);
      cell.setAttribute('aria-describedby', 'groove-keyboard-help');
      cell.querySelectorAll('.note_part').forEach(part => part.setAttribute('aria-hidden', 'true'));
      return cell;
    })).filter(row => row.length);
    const cells = rows.flat();
    if (!cells.some(cell => cell.id === activeId)) activeId = cells[0]?.id;
    cells.forEach(cell => { cell.tabIndex = cell.id === activeId ? 0 : -1; });
    document.querySelectorAll('#LeftHandNav [onclick],#TopNav [onclick],.line-labels [onclick],.noteContextMenu li[onclick]').forEach(control => {
      control.setAttribute('role', 'button'); control.tabIndex = 0;
      if (control.matches('.subdivision,#metronomeOff,#metronome4ths,#metronome8ths,#metronome16ths,#advancedEditAnchor')) {
        control.setAttribute('aria-pressed', String(control.classList.contains('buttonSelected')));
      }
    });
    document.querySelectorAll('.midiPlayImage').forEach(control => {
      const playing = control.classList.contains('Playing');
      const ready = control.matches('.Stopped,.Paused,.Playing');
      control.setAttribute('aria-disabled', String(!ready));
      if (ready && !audioStatus.hidden) { audioStatus.hidden = true; clearTimeout(audioTimeout); }
      control.setAttribute('role', 'button'); control.tabIndex = 0;
      control.setAttribute('aria-label', playing ? 'Stop groove playback' : 'Start groove playback');
      control.setAttribute('aria-pressed', String(playing));
    });
    document.querySelectorAll('.midiExpandImage,.midiMetronomeMenu,.midiRepeatImage').forEach(control => {
      control.setAttribute('role', 'button'); control.tabIndex = 0;
      control.setAttribute('aria-label', control.title || 'Playback options');
    });
  }
  const schedule = () => { if (!pending) pending = requestAnimationFrame(refresh); };
  new MutationObserver(records => {
    if (records.some(record => record.type === 'childList' || record.target.matches('.note_part,.toms-container,.stickings-container,.tom-label,.midiPlayImage,.subdivision,.metronomeButton,#advancedEditAnchor'))) schedule();
  }).observe(document.getElementById('GrooveWriter'), { subtree:true,childList:true,attributes:true,attributeFilter:['style','class'] });
  grid.setAttribute('role', 'group');
  grid.setAttribute('aria-label', 'Drum pattern. Use arrow keys to move between notes.');
  grid.addEventListener('focusin', event => {
    const cell = event.target.closest('[data-groove-note]');
    if (cell) { activeId = cell.id; rows.flat().forEach(node => { node.tabIndex = node === cell ? 0 : -1; }); }
  });
  document.addEventListener('keydown', event => {
    const cell = event.target.closest('[data-groove-note]');
    if (cell) {
      const rowIndex = rows.findIndex(row => row.includes(cell)), row = rows[rowIndex];
      if (!row) return;
      const column = row.indexOf(cell);
      let next;
      if (event.key === 'ArrowLeft') next = row[Math.max(0,column-1)];
      if (event.key === 'ArrowRight') next = row[Math.min(row.length-1,column+1)];
      if (event.key === 'ArrowUp') next = rows[Math.max(0,rowIndex-1)][column];
      if (event.key === 'ArrowDown') next = rows[Math.min(rows.length-1,rowIndex+1)][column];
      if (event.key === 'Home') next = event.ctrlKey ? rows[0][0] : row[0];
      if (event.key === 'End') next = event.ctrlKey ? rows.at(-1).at(-1) : row.at(-1);
      if (next) { event.preventDefault(); event.stopPropagation(); next.focus(); next.scrollIntoView({block:'nearest',inline:'nearest'}); }
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault(); event.stopPropagation();
        event.fromKeyboard = true;
        writer.noteLeftClick(event, cell.dataset.grooveNote, Number(cell.dataset.noteIndex));
        refresh();
      }
      return;
    }
    const control = event.target.closest('[role="button"]');
    if (control && !control.matches('button') && (event.key === ' ' || event.key === 'Enter')) {
      // Grooves has its own keyboard handler; leave that control to its owner.
      if (control.id === 'groovesAnchor') return;
      if (control.getAttribute('aria-disabled') === 'true') { event.preventDefault(); return; }
      event.preventDefault(); event.stopPropagation(); control.click(); schedule();
    }
  }, true);
  const stop = () => writer.myGrooveUtils.stopMIDI_playback();
  window.addEventListener('pagehide', stop);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  window.addEventListener('load', () => { refresh(); parent.postMessage({type:'dave-drums:groove-ready'},location.origin); });
  refresh();
})();
