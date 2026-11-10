"""Private type comparison. No demo page or candidate fonts enter dist/."""
from pathlib import Path
from html import escape
import argparse
ROOT=Path(__file__).resolve().parent.parent
OPTIONS=[
 ('allura','Allura','Flowing calligraphy','allura.ttf',False),
 ('alex-brush','Alex Brush','Fuller, more structured brush script','alex-brush.ttf',False),
 ('parisienne','Parisienne','Rounded, restrained handwriting','parisienne.ttf',False),
 ('italianno','Italianno','Tall, light calligraphic strokes','italianno.ttf',False),
 ('cormorant','Cormorant Garamond Italic','Elegant editorial serif italic','cormorant.ttf',True),
 ('lora','Lora Italic','Selected / grounded serif italic','lora.ttf',True)
]
def render():
 cards=''
 for index,(key,name,description,filename,italic) in enumerate(OPTIONS,1):
  checked=' checked' if index==6 else ''
  cards+=f'''<article class="type-card type-{key}"><label class="type-choice" for="type-{key}"><input id="type-{key}" type="radio" name="type-choice" value="{key}"{checked}><span>{index:02d} · {name}</span></label><p class="type-description">{description}</p><p class="type-context">Make recovery part of</p><p class="type-specimen" data-type-sample>your week.</p><p class="type-context">Your first visit,</p><p class="type-secondary">made simple.</p></article>'''
 return f'''<!doctype html><html lang="en-AU" data-type-choice="lora"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Cursive comparisons | 3 Zone Recovery</title><link rel="stylesheet" href="/assets/styles.css"><script src="/_preview/type.js" defer></script></head><body class="type-demo"><header class="type-demo-header wrap"><a href="/" aria-label="Back to 3 Zone Recovery"><img src="/assets/logo.svg" alt="3 Zone Recovery" width="677" height="174"></a><a class="text-link" href="/">Back to the site ↗</a></header><main class="wrap type-demo-main"><p class="eyebrow">Private typography comparison</p><h1>Find the right<br><em>finishing touch.</em></h1><p class="type-intro">Compare the same words in six fonts. Select a card for the larger preview, or edit the sample words. Your selection changes this demo only.</p><p class="type-demo-note" role="status" data-type-load-status>Open the comparison image if JavaScript is unavailable.</p><p><a class="text-link" href="/_preview/type-comparison.png">View all six fonts as an image ↗</a></p><div class="type-controls" hidden><label for="type-sample">Sample words<input id="type-sample" type="text" value="your week." maxlength="50"></label></div><section class="type-live" aria-labelledby="type-live-title" hidden><h2 id="type-live-title">Larger preview: <span data-type-name>06 · Lora Italic</span></h2><p class="type-live-heading">Make recovery<br>part of <span class="type-live-accent" data-type-sample>your week.</span></p></section><fieldset class="type-grid" hidden><legend class="sr-only">Choose a font for the larger preview</legend>{cards}</fieldset><p class="type-demo-note">Option 06, Lora Italic, is now the font on the website. This private comparison does not save any further changes.</p></main></body></html>'''
def write_proof():
 from PIL import Image,ImageDraw,ImageFont
 image=Image.new('RGB',(1800,1280),'#111315');draw=ImageDraw.Draw(image)
 def normal(size):
  font=ImageFont.truetype(str(ROOT/'assets'/'fonts'/'manrope-variable.ttf'),size);font.set_variation_by_axes([500]);return font
 title=normal(30);label=normal(23);body=normal(20);small=normal(15)
 draw.text((45,25),'3 ZONE RECOVERY / CURSIVE COMPARISONS',font=title,fill='#a9dacb')
 draw.text((45,72),'Same words, six directions. Choose a number to try on the site.',font=body,fill='#c1cfd6')
 for index,(key,name,description,filename,italic) in enumerate(OPTIONS):
  x=45+(index%2)*875;y=125+(index//2)*378
  draw.rounded_rectangle((x,y,x+835,y+352),radius=5,outline='#33444b',width=2)
  draw.text((x+25,y+17),f'{index+1:02d}  {name}',font=label,fill='#f7fafb')
  draw.text((x+25,y+52),description,font=small,fill='#b9cbd5')
  draw.text((x+25,y+92),'Make recovery part of',font=body,fill='#f7fafb')
  font=ImageFont.truetype(str(ROOT/'.local'/'type-preview'/'fonts'/filename),91)
  second=ImageFont.truetype(str(ROOT/'.local'/'type-preview'/'fonts'/filename),61)
  if italic:
   try:font.set_variation_by_axes([500]);second.set_variation_by_axes([500])
   except (ValueError,OSError):pass
  draw.text((x+25,y+113),'your week.',font=font,fill='#a9dacb')
  draw.text((x+25,y+238),'Your first visit,',font=body,fill='#f7fafb')
  draw.text((x+25,y+258),'made simple.',font=second,fill='#a9dacb')
 image.save(ROOT/'.local'/'type-preview'/'type-comparison.png')
if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--png',action='store_true');args=parser.parse_args()
 folder=ROOT/'.local'/'type-preview';folder.mkdir(parents=True,exist_ok=True)
 (folder/'index.html').write_text(render(),encoding='utf-8')
 if args.png:write_proof()
 print('Private comparison: http://127.0.0.1:4180/_preview/type/')
