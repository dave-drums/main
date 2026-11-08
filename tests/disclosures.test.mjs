// Exercise disclosure lifecycle and accessibility with controlled WAAPI completion.
// This checks behaviour, not browser rendering or animation frame timing.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(new URL('../package.json',import.meta.url));
const {JSDOM}=require('jsdom');
const script=await readFile(new URL('../assets/script.js',import.meta.url),'utf8');
const navigation=await readFile(new URL('../assets/navigation.js',import.meta.url),'utf8');
const tick=()=>new Promise(setImmediate);

async function fixture(file,{mobile=true,reduced=false,animated=true,enhance=true}={}){
  const dom=new JSDOM(await readFile(new URL('../'+file,import.meta.url),'utf8'),{
    url:'https://www.davedrums.com.au/'+file,runScripts:'outside-only',pretendToBeVisual:true
  });
  await tick(); // Complete initial pageshow before testing user interaction.
  const w=dom.window,d=w.document,queries=new Map(),animations=[],running=new Map();
  const sizing=d.createElement('style');
  sizing.textContent='.nav-submenu { box-sizing:border-box;padding:8px;border:1px solid #fff; }';
  d.head.append(sizing);
  w.matchMedia=query=>{
    if(!queries.has(query)){
      const listeners=new Set();
      queries.set(query,{
        matches:query.includes('reduced-motion')?reduced:query.includes('max-width')?mobile:true,
        addEventListener(type,callback){if(type==='change')listeners.add(callback);},
        removeEventListener(type,callback){listeners.delete(callback);},
        set(matches){this.matches=matches;listeners.forEach(callback=>callback({matches}));}
      });
    }
    return queries.get(query);
  };
  w.Element.prototype.scrollIntoView=function(){};
  w.Element.prototype.getBoundingClientRect=function(){
    let height=64;
    if(this.matches('.faq-item,.rr-options'))height=this.open?240:64;
    if(this.matches('.nav-submenu'))height=this.closest('details').open?180:0;
    if(this.matches('.about-more'))height=this.hidden?0:360;
    const current=running.get(this);
    if(current&&current.frames[0].height){
      height=(parseFloat(current.frames[0].height)+parseFloat(current.frames[1].height))/2;
    }
    return {height,width:600,top:0,bottom:height,left:0,right:600};
  };
  w.Element.prototype.getClientRects=function(){
    return this.closest('details:not([open]),[hidden]')?[]:[this.getBoundingClientRect()];
  };
  if(animated)w.Element.prototype.animate=function(frames,options){
    let resolve,reject;
    const animation={
      target:this,frames,options,playState:'running',
      finished:new Promise((yes,no)=>{resolve=yes;reject=no;}),
      finish(){
        if(this.playState!=='running')return;
        this.playState='finished';
        if(running.get(this.target)===this)running.delete(this.target);
        resolve();
      },
      cancel(){
        if(this.playState!=='running')return;
        this.playState='idle';
        if(running.get(this.target)===this)running.delete(this.target);
        reject(new Error('cancelled'));
      }
    };
    animations.push(animation);running.set(this,animation);return animation;
  };
  if(enhance){w.eval(script);w.eval(navigation);}
  const finish=async()=>{[...running.values()].forEach(animation=>animation.finish());await tick();};
  return {w,d,animations,running,finish,close:()=>w.close(),
    motion:()=>w.matchMedia('(prefers-reduced-motion: reduce)'),
    viewport:()=>w.matchMedia('(max-width: 900px)')};
}

{
  const f=await fixture('lessons/index.html');
  try{
    const faq=f.d.querySelector('.faq-item'),summary=faq.querySelector('summary'),answer=faq.querySelector('p');
    summary.click();
    assert.equal(summary.getAttribute('aria-expanded'),'true');
    assert.equal(faq.open,true);assert.equal(answer.inert,false);
    assert.deepEqual(Array.from(f.animations.at(-1).frames,frame=>frame.height),['64px','240px']);
    await f.finish();assert.equal(faq.classList.contains('is-disclosure-animating'),false);
    summary.click();
    assert.equal(summary.getAttribute('aria-expanded'),'false');
    assert.equal(faq.open,true,'Contents remain rendered until closing finishes');
    assert.equal(answer.inert,true);
    await f.finish();assert.equal(faq.open,false);
    assert.equal(answer.inert,false,'Closed native details keep answers available to browser find');

    summary.click();const first=f.animations.at(-1);
    summary.click();const second=f.animations.at(-1);
    assert.equal(second.frames[0].height,'152px','Reverse from current animated height');
    summary.click();const third=f.animations.at(-1);
    assert.equal(first.playState,'idle');assert.equal(second.playState,'idle');
    first.finish();second.finish();await tick();
    assert.equal(summary.getAttribute('aria-expanded'),'true');
    third.finish();await tick();assert.equal(faq.open,true);

    const next=f.d.querySelectorAll('.faq-item')[1];next.querySelector('summary').click();
    assert.equal(faq.open,true,'FAQs can remain open independently');
    f.motion().set(true);await tick();
    assert.equal(next.open,true);assert.equal(f.running.size,0);
    const count=f.animations.length;
    next.querySelector('summary').click();assert.equal(next.open,false);
    next.querySelector('summary').click();assert.equal(next.open,true);
    assert.equal(f.animations.length,count,'Reduced motion skips animation');
    f.motion().set(false);
    next.querySelector('summary').click();
    f.w.dispatchEvent(new f.w.Event('resize'));await tick();
    assert.equal(next.open,false);assert.equal(f.running.size,0);
    faq.open=false;await tick();
    assert.equal(summary.getAttribute('aria-expanded'),'false');
  }finally{f.close();}
}

for(const options of [{animated:false},{enhance:false}]){
  const f=await fixture('lessons/index.html',options);
  try{
    const faq=f.d.querySelector('.faq-item');faq.querySelector('summary').click();
    assert.equal(faq.open,true);faq.querySelector('summary').click();assert.equal(faq.open,false);
  }finally{f.close();}
}

{
  const f=await fixture('index.html');
  try{
    const open=f.d.querySelector('.story-link'),story=f.d.querySelector('.about-more');
    open.click();assert.equal(story.hidden,false);assert.equal(story.inert,false);
    const interrupted=f.animations.at(-1);
    f.d.querySelector('.story-collapse').click();
    assert.equal(f.d.activeElement,open);assert.equal(story.inert,true);
    open.click();interrupted.finish();await f.finish();
    assert.equal(story.hidden,false);assert.equal(open.getAttribute('aria-expanded'),'true');
    f.d.querySelector('.story-collapse').click();await f.finish();assert.equal(story.hidden,true);
    open.click();f.w.dispatchEvent(new f.w.Event('resize'));await tick();
    assert.equal(story.hidden,false);assert.equal(f.running.size,0);
  }finally{f.close();}
}

{
  const f=await fixture('index.html');
  try{
    const toggle=f.d.querySelector('.nav-toggle'),nav=f.d.querySelector('#site-navigation'),main=f.d.querySelector('main');
    toggle.click();assert.equal(main.inert,true);await f.finish();
    const group=nav.querySelector('.nav-group'),summary=group.querySelector('summary');
    summary.focus();
    summary.dispatchEvent(new f.w.KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true,cancelable:true}));
    assert.equal(f.animations.at(-1).frames[0].paddingTop,'0px');
    assert.equal(f.animations.at(-1).frames[1].paddingTop,'8px');
    assert.equal(f.d.activeElement,group.querySelector('a'));await f.finish();
    f.d.dispatchEvent(new f.w.KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));
    assert.equal(summary.getAttribute('aria-expanded'),'false');assert.equal(f.d.activeElement,summary);
    assert.equal(f.animations.at(-1).frames[1].paddingBottom,'0px');
    assert.equal(f.animations.at(-1).frames[1].borderBottomWidth,'0px');
    await f.finish();assert.equal(group.open,false);
    toggle.click();assert.equal(toggle.getAttribute('aria-expanded'),'false');
    assert.equal(nav.classList.contains('is-open'),true,'Closing panel remains rendered');
    await f.finish();assert.equal(nav.classList.contains('is-open'),false);assert.equal(main.inert,false);
    toggle.click();toggle.click();toggle.click();await f.finish();
    assert.equal(toggle.getAttribute('aria-expanded'),'true');assert.equal(main.inert,true);
    const destination=nav.querySelector('a');destination.addEventListener('click',event=>event.preventDefault());
    destination.click();assert.equal(main.inert,false);assert.equal(nav.classList.contains('is-open'),false);
    toggle.click();f.viewport().set(false);await tick();
    assert.equal(main.inert,false);assert.equal(nav.classList.contains('is-open'),false);
  }finally{f.close();}
}

{
  const f=await fixture('index.html',{mobile:false});
  try{
    const group=f.d.querySelector('.nav-group'),enter=new f.w.Event('pointerenter');
    Object.defineProperty(enter,'pointerType',{value:'mouse'});
    group.dispatchEvent(enter);await f.finish();assert.equal(group.open,true);
    group.dispatchEvent(new f.w.Event('pointerleave'));await f.finish();assert.equal(group.open,false);
  }finally{f.close();}
}

console.log('PASS: Disclosure opening/closing, rapid reversal, native fallback, reduced motion, resize, focus, mobile navigation and desktop hover.');
