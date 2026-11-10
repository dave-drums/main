# Standalone static 3 Zone site. Edit this source, never dist/ directly.
from pathlib import Path
from html import escape
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import argparse, json, shutil, re, posixpath, zipfile

ROOT = Path(__file__).resolve().parent.parent
SITE = 'https://3zonerecovery.com'
MEMBERSHIP = {'weeklyPrice': '39.99', 'currency': 'AUD'}
FORM_CONFIG = json.loads((ROOT/'build'/'config'/'forms.json').read_text(encoding='utf-8-sig'))
FORM_KEY = str(FORM_CONFIG.get('web3formsAccessKey', '')).strip()
NAV = [('/#zones','The zones'),('/#our-space','Our space'),('/#first-visit','First visit'),('/#membership','Membership'),('/#visit','Find us'),('/contact/','Contact')]
BOOKINGS = [('sauna','01','Infrared sauna','Seated warmth in the M-Pulse infrared sauna.','20114575ff92'),('water','02','Water therapy','Explore alternating hot and cold magnesium water immersion.','20114576ff92'),('compression','03','NormaTec compression','Recline with NormaTec compression for your legs, hips or arms.','20114577ff92'),('heat-water','01 + 02','Sauna + water therapy','Infrared sauna and hot and cold magnesium water therapy in one booking.','20114573ff92'),('all-zones','01–03','All three zones','Infrared sauna, hot and cold water therapy, and NormaTec compression.','20114574ff92')]
PAGES = {
 '': ('3 Zone Recovery | Recovery studio & unlimited membership, Reservoir VIC', f"Infrared sauna, water therapy and NormaTec compression inside BFT Reservoir. Unlimited sessions: ${MEMBERSHIP['weeklyPrice']}/week, billed weekly."),
 'booking': ('Book a session | 3 Zone Recovery, Reservoir','Book infrared sauna, water therapy, NormaTec compression or a combination at 3 Zone Recovery. Everyone welcome, no BFT membership needed.'),
 'contact': ('Contact & visit | 3 Zone Recovery, Reservoir','Contact 3 Zone Recovery at 48–50 Edwardes Street, Reservoir VIC 3073. Rear entry from Ralph Street car park. Call 0411 292 672.'),
 '404': ('Page not found | 3 Zone Recovery','Find your way back to 3 Zone Recovery in Reservoir, Melbourne.')
}

def arrow(): return '<span class="arrow" aria-hidden="true">↗</span>'
def down_arrow(): return '<span class="arrow disclosure-arrow" aria-hidden="true">↓</span>'

def href(slug='',anchor=''): return ('/'+slug+'/' if slug else '/')+('#'+anchor if anchor else '')
def button(label,url,kind=''): return f'<a class="button {kind}" href="{escape(url,quote=True)}">{label}{arrow()}</a>'
def textlink(label,url): return f'<a class="text-link" href="{escape(url,quote=True)}">{label}{arrow()}</a>'
def eyebrow(text): return f'<p class="eyebrow">{text}</p>'
def image(name,alt,cls='',eager=False):
 dimensions={'sauna':(600,800),'water':(466,700),'compression':(680,1024),'studio':(768,1024),'room':(768,1024),'visit':(820,1024),'studio-hero':(1600, 2133),'water-session':(1152, 1536),'compression-session':(600, 800)}
 w,h=dimensions[name]
 sizes='(max-width: 650px) 100vw, 68vw' if name=='studio-hero' else '(max-width: 650px) 100vw, 50vw'
 return f'<img class="{cls}" src="/assets/{name}.webp" srcset="/assets/{name}-small.webp {min(w,480)}w, /assets/{name}.webp {w}w" sizes="{sizes}" width="{w}" height="{h}" alt="{escape(alt,quote=True)}" {"fetchpriority=high" if eager else "loading=lazy"} decoding="async">'
def hours(): return '<dl class="opening-hours"><dt>Monday–Friday</dt><dd>5:00 am–8:00 pm</dd><dt>Saturday–Sunday</dt><dd>7:00 am–12:00 pm</dd></dl>'
def address(): return '<address class="address">48–50 Edwardes Street<br>Reservoir VIC 3073</address>'
def directions(): return 'https://www.google.com/maps/search/?api=1&query=3+Zone+Recovery+48-50+Edwardes+Street+Reservoir+VIC+3073'
def header(active):
 links=''.join(f'<a href="{url}"'+(' aria-current="page"' if active=='contact' and url=='/contact/' else '')+f'>{label}</a>' for url,label in NAV)
 booking_cta=button('Book a session','/booking/','light header-cta')
 if active=='booking': booking_cta=booking_cta.replace('href="/booking/"','href="/booking/" aria-current="page"')
 return f'''<a class="skip" href="#main">Skip to content</a><header class="site-header"><div class="wrap header-inner"><a class="brand" href="/" aria-label="3 Zone Recovery home"><img src="/assets/logo.svg" alt="3 Zone Recovery" width="677" height="174"></a><nav class="main-nav" id="main-navigation" aria-label="Main navigation" data-navigation>{links}</nav><div class="header-actions">{booking_cta}<button class="menu-button" type="button" aria-expanded="false" aria-controls="main-navigation" aria-label="Open navigation" data-menu-button><span class="menu-icon" aria-hidden="true"><span></span><span></span></span><span class="sr-only">Menu</span></button></div></div></header><button class="menu-backdrop" type="button" tabindex="-1" aria-label="Close navigation" data-menu-backdrop hidden></button>'''

def footer():
 links=''.join(f'<a href="{url}">{label}</a>' for url,label in NAV)+'<a href="/booking/">Book a session</a>'
 return f'''<footer class="site-footer"><div class="wrap"><div class="footer-main"><div class="footer-brand"><a href="/" aria-label="3 Zone Recovery home"><img src="/assets/logo.svg" alt="3 Zone Recovery" width="677" height="174" loading="lazy"></a><p>Recovery inside BFT Reservoir.<br>Melbourne’s Northern Suburbs.</p></div><div class="footer-links"><span class="footer-heading">Explore</span><nav class="footer-nav" aria-label="Footer navigation">{links}</nav></div><div class="footer-contact"><span class="footer-heading">Find us</span><address>48–50 Edwardes Street, Reservoir VIC 3073<br>Rear entry via Ralph Street car park</address><p><a href="tel:+61411292672">0411 292 672</a><br><a href="mailto:info@3zonerecovery.com">info@3zonerecovery.com</a></p><p>Weekdays 5:00 am–8:00 pm<br>Weekends 7:00 am–12:00 pm</p></div></div><div class="footer-bottom"><span>© 2026 3 Zone Recovery</span><div class="footer-legal"><a href="{SITE}/privacy-policy/">Privacy policy</a><a href="{SITE}/terms-conditions/">Terms & conditions</a><a href="https://www.instagram.com/3zonerecovery/">Instagram ↗</a><a href="#top">Back to top ↑</a></div></div></div></footer>'''


def health_note():
 return '<div class="wrap health-note">For advice on the suitability of heat, cold or compression, speak with a qualified health professional before booking. For practical questions about the studio, <a href="/contact/">get in touch</a>.</div>'

def intro(label,title,copy,extra=''):
 return f'<section class="page-intro"><div class="wrap">{eyebrow(label)}<h1>{title}</h1><p class="lead">{copy}</p>{extra}</div></section>'
def zone_cards():
 cards=[
  ('heat','01','sauna','A visitor relaxing in the M-Pulse infrared sauna','Infrared sauna','Step into our timber-lined M-Pulse infrared sauna, with an inbuilt monitor for entertainment.','Warmth','Unwind in the warmth.', 'Make your post-workout wind-down a moment to look forward to. Settle into the warmth, slow the pace and enjoy time to yourself.','https://pubmed.ncbi.nlm.nih.gov/37398966/'),
  ('water','02','water','Two visitors using the magnesium water baths at 3 Zone Recovery','Water therapy','Alternate between hot and cold magnesium water in our iCoolSport baths.','Immersion','Warm up. Cool down. Reset.', 'Enjoy the contrast of soothing warmth and an invigorating cold plunge. A refreshing change of pace after training or a busy day. The cold bath can reach 5°C; ask about current temperatures.','https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0062356'),
  ('compression','03','compression','Two visitors reclining with NormaTec compression boots at 3 Zone Recovery','NormaTec compression','Recline as NormaTec air-filled sleeves apply a repeating sequence of pressure. Choose legs, hips or arms, with entertainment available.','Compression','Put your feet up. Switch off.', 'Take time off your feet and settle into rhythmic compression. Watch something, listen to music or simply enjoy a quiet pause in your day.','https://pubmed.ncbi.nlm.nih.gov/39416507/')
 ]
 return '<div class="zone-grid">'+''.join(f'''<article class="zone-card {style}" id="{name}" data-reveal><div class="zone-card-top"><span class="zone-number">Zone {number}</span><span>{label}</span></div><a class="zone-card-main" href="/booking/#book-{name}" aria-label="Book {title}"><div class="zone-photo">{image({'sauna':'sauna','water':'water-session','compression':'compression-session'}[name],alt)}<span class="zone-card-arrow" aria-hidden="true">↗</span></div><h3>{title}</h3></a><p>{copy}</p><div class="zone-benefit"><p class="zone-benefit-line">{benefit}</p><details class="zone-evidence"><summary>Benefits &amp; details<span class="sr-only"> — {title}</span>{down_arrow()}</summary><p>{evidence} <a href="{source}">Read the research<span class="sr-only"> on {title}</span> ↗</a></p></details></div><a class="zone-descriptor" href="/booking/#book-{name}">Book {title}<span aria-hidden="true">↗</span></a></article>''' for style,number,name,alt,title,copy,label,benefit,evidence,source in cards)+'</div>'

def faqs():
 questions=[
  ('Who can benefit from 3 Zone Recovery?','3 Zone is for athletes, regular exercisers and anyone making time for their wellbeing. Whether you’re training for an event, winding down after a workout or taking a break from a busy week, our three zones give you ways to relax and recharge. No BFT membership needed.'),
  ('Do I have to book all three zones?','No. Choose a single zone, sauna + water therapy, or all three zones. Each option has its own <a href="/booking/">booking panel</a>.'),
  ('Where can I find session lengths and prices?','Open your preferred <a href="/booking/">session’s booking panel</a> to view the available details in Mindbody before confirming. <a href="/contact/?enquiry=booking#enquiry">Ask the studio</a> if you need help.'),
  ('Can I book through an app?','Yes. You can use the 3 Zone Recovery app, Mindbody app or Mindbody online, as well as <a href="/booking/">booking here</a>.'),
  ('Need help with an existing booking?','Call <a href="tel:+61411292672">0411 292 672</a> or <a href="mailto:info@3zonerecovery.com">email the studio</a> with your booking question.')
 ]
 return f'''<section class="section" id="questions"><div class="wrap faq-layout"><div class="faq-intro">{eyebrow('Good to know')}<h2>A few useful<br><em>details.</em></h2></div><div class="faq-list">'''+''.join(f'<details><summary>{q}{down_arrow()}</summary><p>{a}</p></details>' for q,a in questions)+'</div></div></section>'

def first_visit():
 return f'''<section class="section first-visit" id="first-visit"><div class="wrap"><div class="section-heading"><div>{eyebrow('Before you arrive')}<h2>Your first visit,<br><em>made simple.</em></h2></div>{textlink('Ask a first-visit question','/contact/?enquiry=first-visit#enquiry')}</div><ol class="steps visit-steps"><li><div><h3>Book your session</h3><p>Choose a single zone or a combination, then review the available times and session details in Mindbody.</p></div></li><li><div><h3>Bring the essentials</h3><p>Bring water and wear comfortable clothing suited to your chosen zone.</p></div></li><li><div><h3>Find the rear entry</h3><p>We’re inside BFT Reservoir at 48–50 Edwardes Street. Enter via the Ralph Street car park.</p><a class="arrival-link" href="{directions()}">Get directions ↗</a></div></li></ol></div></section>'''

def audience():
 return f'''<section class="section audience-section" id="our-space"><div class="wrap studio-story"><figure class="studio-story-photo" data-reveal>{image('visit','Two visitors relaxing together in the M-Pulse infrared sauna')}<figcaption>A moment inside the M-Pulse infrared sauna.</figcaption></figure><div class="audience-intro" id="who-its-for" data-reveal><span id="introduction" aria-hidden="true"></span>{eyebrow('Space for recovery')}<h2>Recovery for<br><em>real life.</em></h2><p class="studio-statement">Life moves fast.<br>Recovery deserves a place in it.</p><p>A welcoming space to slow down, recharge and make recovery a regular part of life. Step out of the rush and into a different pace.</p>{textlink('Find your session','/booking/')}</div></div></section>'''

def membership(compact=False):
 enquiry='/contact/?enquiry=membership#enquiry'
 return f'''<section class="section membership-section" id="membership"><div class="wrap membership-layout"><div class="membership-story">{eyebrow('3 Zone membership')}<h2>Recovery.<br><em>On repeat.</em></h2><p>Make time for yourself more often,<br>with unlimited sessions.</p></div><div class="membership-offer"><p class="membership-inclusion">Unlimited sessions</p><p class="membership-price"><span>${MEMBERSHIP['weeklyPrice']}</span><span class="membership-period">/week</span></p><p class="membership-billing">AUD · Billed weekly</p><div class="actions">{button('Enquire about membership',enquiry,'light')}</div><p class="membership-terms">Ask the studio about joining, inclusions and full membership terms.</p><a class="membership-single" href="/booking/">Just visiting? Book a session <span aria-hidden="true">↗</span></a></div></div></section>'''

def enquiry_form_markup():
 enabled=bool(FORM_KEY)
 disabled='' if enabled else ' disabled'
 captcha_enabled=enabled and FORM_CONFIG.get('hcaptcha',True)
 captcha='<div class="form-verification" role="group" aria-label="Spam verification" aria-describedby="captcha-error"><div class="h-captcha" data-captcha="true" data-theme="light" data-size="compact"></div><p id="captcha-error" class="field-error" hidden></p></div>' if captcha_enabled else ''
 script='<script src="https://web3forms.com/client/script.js" async defer></script>' if captcha_enabled else ''
 privacy_intro='Your message is sent to the studio via Web3Forms.' if enabled else 'When online enquiries are enabled, messages are delivered via Web3Forms.'
 return f'''<form action="https://api.web3forms.com/submit" method="POST" class="enquiry-form" data-enquiry-form data-enabled="{str(enabled).lower()}" data-captcha="{str(captcha_enabled).lower()}"><input type="hidden" name="access_key" value="{escape(FORM_KEY,quote=True)}"><input type="hidden" name="subject" value="3 Zone Recovery website enquiry"><input type="hidden" name="from_name" value="3 Zone Recovery website"><input type="hidden" name="redirect" value="https://web3forms.com/success"><div hidden><label for="contact-botcheck">Leave this field empty</label><input type="checkbox" name="botcheck" id="contact-botcheck" tabindex="-1"></div><fieldset{disabled}><legend class="sr-only">Your enquiry</legend><div class="form-row"><div class="form-field"><label for="contact-name">Name</label><input id="contact-name" name="name" type="text" autocomplete="name" required minlength="2" maxlength="100" aria-describedby="contact-name-error"><p class="field-error" id="contact-name-error" hidden></p></div><div class="form-field"><label for="contact-email">Email</label><input id="contact-email" name="email" type="email" autocomplete="email" required maxlength="254" aria-describedby="contact-email-error"><p class="field-error" id="contact-email-error" hidden></p></div></div><div class="form-row"><div class="form-field"><label for="contact-phone">Phone <span>(optional)</span></label><input id="contact-phone" name="phone" type="tel" autocomplete="tel" inputmode="tel" maxlength="30" aria-describedby="contact-phone-error"><p class="field-error" id="contact-phone-error" hidden></p></div><div class="form-field"><label for="contact-enquiry">Enquiry</label><select id="contact-enquiry" name="enquiry" aria-describedby="contact-enquiry-error"><option value="general">General enquiry</option><option value="membership">Membership — ${MEMBERSHIP['weeklyPrice']}/week</option><option value="first-visit">My first visit</option><option value="booking">Booking question</option></select><p class="field-error" id="contact-enquiry-error" hidden></p></div></div><div class="form-field"><label for="contact-message">Message</label><textarea id="contact-message" name="message" rows="5" required minlength="10" maxlength="3000" aria-describedby="contact-message-error"></textarea><p class="field-error" id="contact-message-error" hidden></p></div>{captcha}<button class="button" type="submit" data-enquiry-submit>Send message{arrow()}</button></fieldset><p class="form-privacy">{privacy_intro} <a href="{SITE}/privacy-policy/">Privacy policy</a>.</p><p class="form-status" role="status" aria-live="polite" aria-atomic="true" data-form-status></p></form>{script}'''

def contact_form():
 form=enquiry_form_markup()
 if FORM_KEY:
  return f'''<section class="contact-enquiry" id="enquiry" aria-labelledby="enquiry-title">{eyebrow('Send an enquiry')}<h2 id="enquiry-title">A question<br>for <em>the studio?</em></h2>{form}</section>'''
 return f'''<section class="contact-enquiry contact-enquiry-offline" id="enquiry" aria-labelledby="enquiry-title">{eyebrow('A question for us?')}<h2 id="enquiry-title">A little help<br><em>getting started.</em></h2><p>Ask about membership, choosing a session or planning your first visit. Email the studio and we’ll help you with the details.</p><p class="enquiry-context" data-enquiry-context hidden></p><details class="offline-form"><summary>Online enquiry form{down_arrow()}</summary><p>Online enquiries are currently unavailable. Please call or email the studio.</p>{form}</details></section>'''

def home():
 return f'''<section class="hero" aria-labelledby="hero-title"><figure class="hero-media">{image('studio-hero','The hot and cold water therapy space inside 3 Zone Recovery','hero-image',True)}<figcaption class="hero-caption"><span>Inside BFT Reservoir</span><span>Reservoir, Victoria</span></figcaption></figure><div class="wrap hero-content"><div class="hero-copy">{eyebrow('3 Zone Recovery / Reservoir, VIC')}<h1 id="hero-title">Make recovery<br>part of <em>your week.</em></h1><p>A state-of-the-art recovery studio inside BFT Reservoir. Infrared sauna, water therapy and NormaTec compression.</p><p class="hero-welcome">For regular exercisers, busy people and first-timers. No BFT membership needed.</p><div class="actions">{button('Book a session','/booking/','light')}{textlink('Explore the zones','#zones')}</div><a class="hero-membership" href="#membership"><span>Unlimited sessions</span><span><strong>${MEMBERSHIP['weeklyPrice']}</strong>/week · billed weekly</span><span aria-hidden="true">↗</span></a></div><a class="hero-scroll" href="#zones"><span>Discover the three zones</span><span aria-hidden="true">↓</span></a></div></section><section class="section zones-section" id="zones"><div class="wrap"><div class="section-heading"><div>{eyebrow('Explore the studio')}<h2>Three zones.<br><em>Your way.</em></h2></div></div>{zone_cards()}</div></section>{audience()}{first_visit()}{membership()}{booking_preview()}{faqs()}{visit_section()}{health_note()}'''





def booking_preview():
 return f'''<section class="section booking-preview" id="booking"><div class="wrap booking-preview-layout"><div>{eyebrow('Book your recovery')}<h2>One zone.<br>Or <em>all three.</em></h2><p>Choose the experience that fits your day. Available times and session details are on our booking page.</p>{button('See times & book','/booking/')}</div><ul class="booking-paths"><li><a href="/booking/"><span>Single zone<small>Sauna, water therapy or compression</small></span>{arrow()}</a></li><li><a href="/booking/#book-heat-water"><span>Sauna + water<small>Zones 1 &amp; 2 together</small></span>{arrow()}</a></li><li><a href="/booking/#book-all-zones"><span>All three zones<small>The complete three-zone experience</small></span>{arrow()}</a></li></ul></div></section>'''

def booking():
 return intro('Book a session','Your zones.<br><em>Your time.</em>','A single zone or a combination. Everyone welcome — no BFT membership needed.')+booking_options()+health_note()

def visit_section():
 return f'''<section class="visit-preview" id="visit" aria-labelledby="visit-title"><div class="visit-scene"><div class="visit-photo">{image('room','Exterior of BFT Reservoir with 3 Zone Recovery signage','visit-image')}</div><div class="wrap visit-layout"><div class="visit-copy">{eyebrow('Visit 3 Zone')}<h2 id="visit-title">Right here in<br>Melbourne’s <em>Northern Suburbs.</em></h2>{address()}<p class="note">Inside BFT Reservoir. Rear entry via the Ralph Street car park.</p></div></div></div><div class="wrap visit-practical"><div>{eyebrow('Opening hours')}{hours()}</div><div class="actions">{button('Book a session','/booking/','light')}{textlink('Get directions',directions())}</div></div></section>'''

def booking_options():
 content=f'''<section class="section booking-section" id="booking"><div class="wrap"><div class="section-heading" id="starting-point"><div>{eyebrow('Five ways to book')}<h2>Choose your session.</h2></div><p>Open an option to view times and session details in Mindbody.</p></div><div class="booking-list">'''
 labels={'sauna':'Zone 1','water':'Zone 2','compression':'Zone 3','heat-water':'Zone 1 + 2','all-zones':'Zones 1, 2 & 3'}
 for slug,num,title,desc,widget in BOOKINGS:
  direct='https://widgets.mindbodyonline.com/iframe/appointments/'+widget
  content+=f'''<article class="booking-option" id="book-{slug}"><div class="booking-option-top"><span class="booking-number" aria-hidden="true">{num}</span><div><p class="booking-zone-label">{labels[slug]}</p><h3>{title}</h3></div><button class="button booking-toggle" type="button" data-load-booking="{widget}" aria-controls="widget-{slug}" aria-expanded="false"><span class="booking-label">View times & book</span>{down_arrow()}<span class="sr-only"> — {title}</span></button></div><div class="booking-panel" id="widget-{slug}" hidden role="region" aria-label="{escape(title)} Mindbody bookings"><div class="booking-widget"><p role="status">Bookings are provided by Mindbody. If the panel does not appear, open Mindbody directly or call the studio.</p><p class="widget-fallback"><a href="{direct}">Open this Mindbody panel ↗</a> · <a href="tel:+61411292672">Call 0411 292 672</a></p><healcode-widget data-type="appointments" data-widget-partner="object" data-widget-id="{widget}" data-widget-version="0"></healcode-widget></div></div><noscript><p class="booking-native-link"><a href="{direct}">Book {title} through Mindbody ↗</a></p></noscript></article>'''
 return content+f'''</div><p class="booking-help-line">Need help booking? <a href="tel:+61411292672">Call 0411 292 672</a> or <a href="/contact/?enquiry=booking#enquiry">send an enquiry</a>.</p></div></section>'''

def contact():
 return intro('Contact / Visit','Let’s <em>talk.</em>','A quick question or ready to make recovery part of your week? We’re here to help.')+f'''<section class="section"><div class="wrap enquiry-layout"><div class="contact-details">{eyebrow('Contact the studio')}<h2>Call. Email.<br><em>Find us.</em></h2><a class="contact-method" href="tel:+61411292672"><div><small>Phone</small><span>0411 292 672</span></div>{arrow()}</a><a class="contact-method" href="mailto:info@3zonerecovery.com"><div><small>Email</small><span>info@3zonerecovery.com</span></div>{arrow()}</a><a class="contact-method" href="https://www.instagram.com/3zonerecovery/"><div><small>Instagram</small><span>@3zonerecovery</span></div>{arrow()}</a><div class="contact-visit"><h3>Inside BFT Reservoir</h3>{address()}<p class="note">Rear entry via the Ralph Street car park.</p>{hours()}{textlink('Get directions',directions())}</div><figure class="contact-location-photo">{image('room','BFT Reservoir exterior with 3 Zone Recovery signage')}</figure></div>{contact_form()}</div></section>'''

def not_found():
 return f'<section class="section not-found wrap">{eyebrow("A small detour")}<h1>Let’s find<br><em>your way back.</em></h1><p class="muted">We couldn’t find this page. Your next moment of recovery is still within reach.</p><div class="actions">{button("Back to home","/")}{textlink("Explore the zones","/services/")}</div></section>'


def normalise_links(markup):
 def convert(match):
  url=match.group(1)
  if url.startswith('/#book-'):url='/booking/#'+url.split('#',1)[1]
  elif url.startswith('/booking/#') and url.split('#',1)[1] in {row[0] for row in BOOKINGS}:url='/booking/#book-'+url.split('#',1)[1]
  elif url.startswith('/services/#'):url='/#'+url.split('#',1)[1]
  elif url=='/services/':url='/#zones'
  elif url.startswith('/about/'):url='/#our-space'
  return 'href="'+url+'"'
 return re.sub(r'href="([^"]+)"',convert,markup)

def portable_links(markup, slug, base_path='/'):
 """Make normal pages portable under any folder; keep a 404 safe at unknown depths."""
 page_dir='' if slug in ('','404') else slug
 def local_url(url):
  if not url.startswith('/') or url.startswith('//'):return url
  if slug=='404':return base_path.rstrip('/')+url
  parts=urlsplit(url)
  relative=posixpath.relpath(parts.path.lstrip('/') or '.', page_dir or '.')
  if parts.path.endswith('/'):relative+='/'
  return relative+('?' + parts.query if parts.query else '')+('#' + parts.fragment if parts.fragment else '')
 markup=re.sub(r'\b(href|src)="([^"]+)"',lambda m:m.group(1)+'="'+local_url(m.group(2))+'"',markup)
 markup=re.sub(r'srcset="([^"]+)"',lambda m:'srcset="'+', '.join(local_url(part.strip().split()[0])+' '+part.strip().split()[1] for part in m.group(1).split(','))+'"',markup)
 return markup

def legacy_document(route):
 destination={'services':'zones','about':'our-space'}[route]
 return f'''<!doctype html><html lang="en-AU"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,follow"><title>Continue to 3 Zone Recovery</title><link rel="icon" type="image/png" sizes="150x150" href="/assets/favicon.png"><link rel="apple-touch-icon" href="/assets/apple-touch-icon.png"><meta http-equiv="refresh" content="1;url=../#{destination}"><link rel="stylesheet" href="/assets/styles.css"><script src="/assets/legacy-redirect.js" data-route="{route}" defer></script></head><body><main class="wrap section"><h1>Find it on<br><em>our homepage.</em></h1><p class="actions"><a class="button" href="/#{destination}">Continue to 3 Zone Recovery ↗</a></p></main></body></html>'''

def document(slug,body,release,site_url=SITE):
 title,desc=PAGES[slug]; url=site_url+href(slug) if slug!='404' else site_url+'/404.html'
 schema={'@context':'https://schema.org','@type':'LocalBusiness','name':'3 Zone Recovery','url':SITE+'/','telephone':'+61411292672','email':'info@3zonerecovery.com','address':{'@type':'PostalAddress','streetAddress':'48–50 Edwardes Street','addressLocality':'Reservoir','addressRegion':'VIC','postalCode':'3073','addressCountry':'AU'},'openingHoursSpecification':[{'@type':'OpeningHoursSpecification','dayOfWeek':['Monday','Tuesday','Wednesday','Thursday','Friday'],'opens':'05:00','closes':'20:00'},{'@type':'OpeningHoursSpecification','dayOfWeek':['Saturday','Sunday'],'opens':'07:00','closes':'12:00'}],'sameAs':['https://www.instagram.com/3zonerecovery/']}
 return f'''<!doctype html>
<html lang="en-AU" id="top"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{escape(title)}</title><meta name="description" content="{escape(desc,quote=True)}"><meta name="theme-color" content="#111315"><meta name="robots" content="{'index,follow' if release and slug!='404' else 'noindex,follow'}"><link rel="canonical" href="{url}"><meta property="og:type" content="website"><meta property="og:locale" content="en_AU"><meta property="og:site_name" content="3 Zone Recovery"><meta property="og:title" content="{escape(title,quote=True)}"><meta property="og:description" content="{escape(desc,quote=True)}"><meta property="og:url" content="{url}"><meta property="og:image" content="{site_url}/assets/social.jpg"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="The water therapy space at 3 Zone Recovery, Reservoir"><meta name="twitter:card" content="summary_large_image"><link rel="icon" type="image/png" sizes="150x150" href="/assets/favicon.png"><link rel="apple-touch-icon" href="/assets/apple-touch-icon.png"><link rel="preload" href="/assets/fonts/manrope-variable.ttf" as="font" type="font/ttf" crossorigin><link rel="preload" href="/assets/fonts/lora-italic-latin.woff2" as="font" type="font/woff2" crossorigin><link rel="stylesheet" href="/assets/styles.css"><script>document.documentElement.classList.add('js')</script><script src="/assets/site.js" defer></script><script type="application/ld+json">{json.dumps(schema,ensure_ascii=False)}</script></head>
<body>{header(slug)}<main id="main">{body}</main>{footer()}</body></html>'''

class Inspect(HTMLParser):
 def __init__(self):
  super().__init__(convert_charrefs=True)
  self.refs=[];self.ids=set();self.duplicate=[];self.h1=0;self.main=0;self.aria_refs=[]
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if 'id' in a:
   if a['id'] in self.ids:self.duplicate.append(a['id'])
   self.ids.add(a['id'])
  if tag=='h1':self.h1+=1
  if tag=='main':self.main+=1
  for attr in ('href','src'):
   if a.get(attr):self.refs.append(a[attr])
  if a.get('srcset'):self.refs.extend(part.strip().split()[0] for part in a['srcset'].split(','))
  for attr in ('aria-controls','aria-labelledby','aria-describedby'):
   self.aria_refs.extend(a.get(attr,'').split())
  if tag=='img' and not all(key in a for key in ('alt','width','height')):raise ValueError('Image missing alt or dimensions')

def check_output(output, pages, base_path):
 for page,parser in pages.items():
  assert parser.h1==1 and parser.main==1 and not parser.duplicate,f'Invalid structure: {page}'
  for target_id in parser.aria_refs:assert target_id in parser.ids,f'Missing ARIA target {target_id} in {page}'
  for ref in parser.refs:
   parts=urlsplit(ref)
   if parts.scheme or parts.netloc:continue
   if parts.path.startswith('/'):
    assert parts.path.startswith(base_path),f'Link leaves site folder: {ref}'
    target=output/unquote(parts.path[len(base_path):])
   else:target=page.parent/unquote(parts.path) if parts.path else page
   target=target.resolve()
   assert target.is_relative_to(output.resolve()),f'Link escapes output: {ref}'
   if target.is_dir():target=target/'index.html'
   assert target.is_file(),f'Broken reference {ref} in {page}'
   if parts.fragment and target in pages:assert parts.fragment in pages[target].ids,f'Missing anchor {ref}'
 # Shared CSS fonts must also resolve inside the same deployable folder.
 css=(output/'assets/styles.css').read_text(encoding='utf-8')
 for ref in re.findall(r'url\([\'"]?([^\'"\s)]+)',css):
  if urlsplit(ref).scheme or ref.startswith(('#','data:')):continue
  assert (output/'assets'/ref).is_file(),f'Missing stylesheet asset: {ref}'
 assert not any(p.suffix in ('.py','.md') or '-source' in p.name for p in output.rglob('*') if p.is_file()),'Authoring material in deployable output'

def build_site(output, release=False, site_url=SITE, base_path='/'):
 # Only reset these two explicitly generated directories, never a caller-supplied path.
 allowed={(ROOT/'dist').resolve(),(ROOT/'demo'/'3zone').resolve()}
 assert output.resolve() in allowed and not output.is_symlink(),'Unsafe build destination'
 if output.exists():shutil.rmtree(output)
 output.mkdir(parents=True)
 assets=output/'assets';assets.mkdir()
 for path in (ROOT/'assets').iterdir():
  if path.is_file() and (path.suffix in ('.webp','.css','.js','.svg') or path.name in ('social.jpg','favicon.png','apple-touch-icon.png')):shutil.copy2(path,assets/path.name)
 (assets/'fonts').mkdir()
 for name in ('manrope-variable.ttf','lora-italic-latin.woff2','MANROPE-OFL.txt','LORA-OFL.txt'):shutil.copy2(ROOT/'assets'/'fonts'/name,assets/'fonts'/name)
 pages={}
 for slug,renderer in {'':home,'booking':booking,'contact':contact,'404':not_found}.items():
  dest=output/'404.html' if slug=='404' else output/slug/'index.html'
  dest.parent.mkdir(parents=True,exist_ok=True)
  markup=portable_links(normalise_links(document(slug,renderer(),release,site_url)),slug,base_path)
  dest.write_text(markup,encoding='utf-8');parser=Inspect();parser.feed(markup);pages[dest.resolve()]=parser
 for slug in ('services','about'):
  dest=output/slug/'index.html';dest.parent.mkdir()
  markup=portable_links(legacy_document(slug),slug,base_path)
  dest.write_text(markup,encoding='utf-8');parser=Inspect();parser.feed(markup);pages[dest.resolve()]=parser
 check_output(output,pages,base_path)
 (output/'robots.txt').write_text('User-agent: *\nAllow: /\n'+('Sitemap: '+site_url+'/sitemap.xml\n' if release else ''),encoding='utf-8')
 urls=''.join('<url><loc>'+site_url+href(slug)+'</loc></url>' for slug in ('','booking','contact'))
 (output/'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+urls+'</urlset>',encoding='utf-8')
 (output/'.nojekyll').write_text('',encoding='utf-8')
 print('Built and checked Home, Booking, Contact, custom 404 and two legacy forwards: '+str(output))

def build(release=False, demo=False):
 if release and demo:raise ValueError('A demo must remain noindex; use release only for the studio domain.')
 build_site(ROOT/'dist',release)
 if demo:
  export=ROOT/'demo'/'3zone'
  build_site(export,False,'https://www.davedrums.com.au/3zone','/3zone/')
  archive=ROOT/'demo'/'3zone-demo.zip'
  with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_DEFLATED) as bundle:
   for path in sorted(export.rglob('*')):
    if path.is_file():bundle.write(path,Path('3zone')/path.relative_to(export))
  print('Copy demo/3zone into the drums website root. ZIP: '+str(archive))
 print('Release metadata enabled.' if release else 'Preview/demo: search indexing disabled.')

if __name__=='__main__':
 parser=argparse.ArgumentParser()
 parser.add_argument('--release',action='store_true',help='Enable indexing for an owner-approved studio-domain release')
 parser.add_argument('--demo',action='store_true',help='Also build a ready-to-copy demo/3zone folder and ZIP for the drums website')
 args=parser.parse_args()
 if args.demo and args.release:parser.error('--demo and --release cannot be combined')
 build(args.release,args.demo)
