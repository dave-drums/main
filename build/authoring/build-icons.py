"""Compile the site's locally hosted icon sprite from official Lucide SVGs."""
from pathlib import Path
import argparse
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[2]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('source', type=Path, help='Folder containing Lucide 0.468.0 SVGs and LICENSE')
args = parser.parse_args()
NS = 'http://www.w3.org/2000/svg'
ET.register_namespace('', NS)
icons = {
    'arrow-up-right': 'arrow-up-right', 'arrow-right': 'arrow-right', 'arrow-left': 'arrow-left',
    'arrow-up': 'arrow-up', 'arrow-down': 'arrow-down', 'chevron-down': 'chevron-down',
    'chevron-up': 'chevron-up', 'menu': 'menu', 'close': 'x', 'plus': 'plus', 'minus': 'minus',
    'drum': 'drum', 'waveform': 'audio-lines', 'mic': 'mic', 'headphones': 'headphones', 'sparkles': 'sparkles',
    'speaker': 'volume-2', 'speaker-off': 'volume-x', 'pin': 'map-pin', 'users': 'users-round',
    'person': 'user-round', 'book': 'book-open', 'clock': 'clock-3', 'layers': 'layers',
    'sliders': 'sliders-horizontal', 'disc': 'disc-3', 'mail': 'mail', 'phone': 'phone',
    'message': 'message-circle', 'help': 'circle-help', 'info': 'info', 'download': 'download', 'check': 'check',
    'grid': 'grid-3x3', 'rhythm': 'music-2', 'coffee': 'coffee', 'play': 'play', 'pause': 'pause',
    'stop': 'square', 'tap': 'pointer', 'shuffle': 'shuffle', 'maximize': 'maximize', 'minimize': 'minimize',
    'trash': 'trash-2', 'print': 'printer', 'share': 'share-2', 'copy': 'copy', 'undo': 'rotate-ccw',
    'repeat': 'repeat-2', 'key': 'key-round', 'settings': 'settings-2', 'remove': 'circle-x',
}
sprite = ET.Element(f'{{{NS}}}svg', {'fill': 'none', 'stroke': 'currentColor', 'stroke-width': '2',
    'stroke-linecap': 'round', 'stroke-linejoin': 'round'})
sprite.append(ET.Comment(' Lucide 0.468.0, ISC / Feather MIT; see icons-LICENSE.txt. Custom icons by Dave Drums. '))
for name, source in icons.items():
    original = ET.parse(args.source / (source + '.svg')).getroot()
    symbol = ET.SubElement(sprite, f'{{{NS}}}symbol', {'id': name, 'viewBox': original.attrib['viewBox']})
    for child in original:
        symbol.append(child)
# Custom icons use the same 24-unit grid and matching optical weight.
custom = {
    'kick-drum': '<ellipse cx="7" cy="11" rx="4.5" ry="8.5"/><path d="M7 2.5h9c6 0 6 17 0 17H7m4-12.5h9M11.5 12H21m-10.5 5H19M6.5 15.5v5L3 22"/><circle cx="6.5" cy="14.5" r="1"/>',
    'stacker': '<path d="M4 9h16M4 15h16"/>',
    'cowbell': '<path d="m12 4 9 16H3Z"/>',
    'home': '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z"/><path d="M9 21v-8h6v8"/>',
    'sticks': '<path d="M11 21.5a1 1 0 0 0 2 0L12.55 6c-.05-.5.1-.9.3-1.35C13.3 3.7 12.9 2 12 2s-1.3 1.7-.85 2.65c.2.45.35.85.3 1.35Z" transform="translate(12 12) scale(1.2) rotate(-43) translate(-12 -12)" fill="currentColor" stroke="none"/><path d="M11 21.5a1 1 0 0 0 2 0L12.55 6c-.05-.5.1-.9.3-1.35C13.3 3.7 12.9 2 12 2s-1.3 1.7-.85 2.65c.2.45.35.85.3 1.35Z" transform="translate(12 12) scale(1.2) rotate(43) translate(-12 -12)" fill="currentColor" stroke="none"/>',
    'metronome': '<path d="M8 3h8l5 18H3L8 3Z"/><path d="M7 17h10M12 17l5-11m-2.8 4 2.7 1.2"/>',
    'toms': '<ellipse cx="7" cy="6" rx="4.5" ry="2.5"/><path d="M2.5 6v5c0 3.3 9 3.3 9 0V6"/><ellipse cx="17" cy="6" rx="4.5" ry="2.5"/><path d="M12.5 6v5c0 3.3 9 3.3 9 0V6"/><ellipse cx="12" cy="16" rx="4.5" ry="2.5"/><path d="M7.5 16v4c0 3.3 9 3.3 9 0v-4"/>',
    'note-quarter': '<ellipse cx="9" cy="18" rx="4" ry="2.8" transform="rotate(-22 9 18)" fill="currentColor" stroke="none"/><path d="M12.5 17V4"/>',
    'note-eighth': '<ellipse cx="7" cy="18" rx="4" ry="2.8" transform="rotate(-22 7 18)" fill="currentColor" stroke="none"/><path d="M10.5 17V4c0 3 6 3.5 6 7 0 .9-.2 1.5-.7 2.2"/>',
    'note-sixteenth': '<ellipse cx="7" cy="18" rx="4" ry="2.8" transform="rotate(-22 7 18)" fill="currentColor" stroke="none"/><path d="M10.5 17V4c0 2.5 6 2.5 6 6"/><path d="M10.5 8c0 2.5 6 2.5 6 6 0 .7-.2 1.3-.6 1.8"/>',
    'note-thirty-second': '<ellipse cx="7" cy="19" rx="4" ry="2.8" transform="rotate(-22 7 19)" fill="currentColor" stroke="none"/><path d="M10.5 18V2c0 2.5 6 2.5 6 6M10.5 6c0 2.5 6 2.5 6 6M10.5 10c0 2.5 6 2.5 6 6 0 .7-.2 1.3-.6 1.8"/>',
}
for name, body in custom.items():
    symbol = ET.SubElement(sprite, f'{{{NS}}}symbol', {'id': name, 'viewBox': '0 0 24 24'})
    original = ET.fromstring(f'<svg xmlns="{NS}">{body}</svg>')
    for child in original:
        symbol.append(child)
ET.indent(sprite, space='  ')
(ROOT / 'assets/icons.svg').write_bytes(ET.tostring(sprite, encoding='utf-8') + b'\n')
notice = ('Dave Drums icon system\n\nStandard icons: Lucide 0.468.0\n'
          'Source: https://github.com/lucide-icons/lucide/tree/0.468.0/icons\n'
          'Custom icons: home, crossed drumsticks, metronome, toms, kick drum, stacker, cowbell and note values, by Dave Drums.\n\n')
(ROOT / 'assets/icons-LICENSE.txt').write_bytes(notice.encode() + (args.source / 'LICENSE').read_bytes())
print(f'Compiled {len(icons) + len(custom)} matching SVG icons and retained the upstream licence.')
