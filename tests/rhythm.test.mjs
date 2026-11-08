import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { METERS, normalizeSettings, generateBar, generatePattern, swingTick, tempoAtBar, TapScorer, eventAudioTime } from '../assets/rhythm-core.js';
import { RhythmEngine } from '../assets/rhythm-engine.js';
import { layoutBar, renderBar } from '../assets/rhythm-notation.js';
const results = [];
const near = (a,b,label='Timing') => assert.ok(Math.abs(a-b)<1e-7, `${label}: ${a} / ${b}`);
let examples = [];
for (const meter of METERS) for (const divisions of [2,3,4,6]) for (let level=0;level<=4;level++) {
  for (const space of [0,50,80]) for (let seed=1;seed<=15;seed++) {
    const bar=generateBar({meter,divisions,level,space,swing:66,seed});
    let ticks=0,attacks=0;
    bar.notes.forEach((n,i)=>{
      assert.ok(Number.isInteger(n.ticks)&&n.ticks>0);
      assert.equal(n.start,ticks);
      near(96*4/n.value*(n.dot?1.5:1)*(n.ratio||1),n.ticks,'Written duration');
      assert.equal(n.tieIn,i>0&&bar.notes[i-1].tieOut);
      if(n.tieIn)assert.equal(n.accent,false,'Tied continuations have no new accent/attack');
      if(n.tieOut) assert.ok(n.hand&&bar.notes[i+1]?.hand);
      if(!n.hand) assert.equal(n.accent,false);
      if(n.hand&&!n.tieIn) attacks++;
      ticks+=n.ticks;
    });
    assert.equal(ticks,bar.info.total,`${meter} exact bar total`);
    assert.ok(attacks>0);
    const groups=new Map();
    for(const n of bar.notes)if(n.tuplet) groups.set(n.tupletGroup,(groups.get(n.tupletGroup)||0)+n.ticks);
    for(const sum of groups.values())assert.equal(sum,bar.info.pulse,'Complete tuplet cell');
    if(space===50&&seed===3)examples.push(bar);
  }
}
assert.deepEqual(generatePattern({seed:87}),generatePattern({seed:87}));
assert.notDeepEqual(generatePattern({seed:87,level:4}),generatePattern({seed:88,level:4}));
assert.equal(normalizeSettings({meter:'bad',divisions:99,space:999,swing:999}).meter,'4/4');
near(swingTick(48,96,66),63.36);near(swingTick(96,96,66),96);
assert.deepEqual(Array.from({length:8},(_,i)=>tempoAtBar(i,{start:80,target:92,step:5,every:1,mode:'alternate'},80)),[80,85,90,92,90,85,80,85]);
assert.equal(tempoAtBar(99,{start:120,target:80,step:7,every:4,mode:'progress'},120),80);
results.push('7,200 generated bars: exact meters, reproducible seeds, dots/tuplets, rests, ties, swing and bidirectional speed training');

const score=new TapScorer();const bar=generateBar({seed:3});
score.add({id:'a',time:1,window:.08,bar});score.add({id:'b',time:1.5,window:.08,bar});
assert.equal(score.tap(1.02).hit,true);assert.equal(score.tap(1.03).hit,false);
assert.equal(score.tap(1.45).hit,true);assert.equal(score.stats().hits,2);assert.equal(score.stats().extras,1);
score.add({id:'c',time:2,window:.08,bar});score.add({id:'future',time:5,window:.08,bar});
score.expire(2.15);score.finish(3);
assert.deepEqual([score.stats().hits,score.stats().misses,score.stats().extras,score.stats().longest],[2,1,1,2]);
assert.equal(score.missedBars.size,1);assert.equal(score.targets.length,0);
near(eventAudioTime({getOutputTimestamp:()=>({contextTime:5,performanceTime:1000})},1060,1100),5.06);
near(eventAudioTime({currentTime:10,baseLatency:.02,outputLatency:.04},1990,2000),9.93);
results.push('Nearest-target matching, duplicate/extra/missed taps, missed-bar collection and output-clock timestamp conversion');

function node(){return {gain:{value:0,setValueAtTime(){},cancelScheduledValues(){},exponentialRampToValueAtTime(){}},pan:{},frequency:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){return this;},disconnect(){},start(){},stop(time){if(time===undefined)this.onended?.();}};}
function context(){return {currentTime:0,sampleRate:48000,state:'running',destination:{},createGain:node,createStereoPanner:node,createBufferSource:node,createBiquadFilter:node,createOscillator:node,createBuffer:(_,length)=>({getChannelData:()=>new Float32Array(length)}),close(){this.state='closed';}};}
const savedGlobals=Object.fromEntries(['setInterval','clearInterval','requestAnimationFrame','cancelAnimationFrame','document','window','ResizeObserver','localStorage'].map(k=>[k,globalThis[k]]));
const navDescriptor=Object.getOwnPropertyDescriptor(globalThis,'navigator');
try{
  globalThis.setInterval=()=>1;globalThis.clearInterval=()=>{};globalThis.requestAnimationFrame=()=>1;globalThis.cancelAnimationFrame=()=>{};
  for(const meter of METERS)for(const divisions of [2,3,4,6])for(const bpm of [40,80,240])for(const mode of ['generate','read','play']){
    const c=context(),hits=[],clicks=[],targets=[];const settings=normalizeSettings({meter,divisions,level:4,space:50,swing:66,seed:6});
    const pattern=generatePattern(settings),tapScore=new TapScorer();tapScore.add=(t)=>targets.push(t);
    const engine=new RhythmEngine(c,{visual(){},progress(){},finished(){throw Error('Unexpected finish');},interrupted(message){throw Error(message);}});
    engine.playNote=(time)=>hits.push(time);engine.tone=(time)=>clicks.push(time);
    const opts={settings,pattern,mode,bpm,countIn:1,seconds:0,trainer:null,gap:null,sound:'pad',clickDivision:1,scorer:tapScore,beats:()=>[],click:()=>true,guide:()=>mode!=='play',clickVolume:()=>.7,rhythmVolume:()=>.7};
    engine.start(opts);
    const secondsPerBar=pattern[0].info.beats*60/bpm,first=.16+secondsPerBar;
    for(let t=.025;t<first+secondsPerBar*10;t+=.025){c.currentTime=t;engine.tick();}
    const expected=[];
    for(let serial=0;serial<10;serial++){
      const b=mode==='read'?generateBar(settings,serial):pattern[serial%pattern.length];
      for(const n of b.notes)if(n.hand&&!n.tieIn)expected.push(first+serial*secondsPerBar+swingTick(n.start,b.info.pulse,settings.swing)/b.info.pulse*60/bpm);
    }
    const actual=mode==='play'?targets.map(t=>t.time):hits;
    assert.ok(actual.length>=expected.length);
    expected.forEach((time,i)=>near(actual[i],time,`${meter}/${divisions}/${bpm}/${mode} drift-free attack`));
    clicks.forEach((time,i)=>near(time,.16+i*60/bpm,'Independent quarter/compound/eighth click'));
    if(mode==='play')assert.equal(hits.length,0,'Play along keeps guide sound off');
    const before=actual.length;engine.stop();c.currentTime+=10;engine.tick();assert.equal(actual.length,before);assert.equal(engine.queue.length,0);
  }
  results.push('All meters/divisions at 40, 80 and 240 BPM in all modes: count-in, swing, ties without reattack, independent click and Stop cleanup');
  {
    const c=context(),clicks=[];let finished=false;const settings=normalizeSettings({seed:2}),engine=new RhythmEngine(c,{visual(){},progress(){},finished(){finished=true;engine.stop();},interrupted(m){throw Error(m);}});
    engine.playNote=()=>{};engine.tone=time=>clicks.push(time);
    engine.start({settings,pattern:generatePattern(settings),mode:'generate',bpm:80,countIn:0,seconds:10,trainer:{start:80,target:100,step:5,every:1,mode:'progress'},gap:{on:1,off:1},clickDivision:2,beats:()=>[],click:()=>true,guide:()=>true,clickVolume:()=>1,rhythmVolume:()=>1});
    for(let t=.025;t<11;t+=.025){c.currentTime=t;engine.tick();}
    assert.equal(finished,true);assert.ok(clicks.every(t=>t<10.16));assert.ok(!clicks.some(t=>t>=3.16&&t<5.98),'Silent second bar');
    const sound=new RhythmEngine(context(),{visual(){},progress(){},finished(){},interrupted(){}});
    sound.tone(1,700,.03,0);assert.equal(sound.sources.size,0);
    sound.tone(1,700,.03,.1);assert.equal(sound.sources.size,1);sound.stop();assert.equal(sound.sources.size,0);
  }
  results.push('Silent-bar gaps, click subdivisions, speed changes, timed stopping and zero-volume sound suppression');

  class E{
    constructor(tag){this.tag=tag;this.tagName=tag.toUpperCase();this.attrs={};this.dataset={};this.children=[];this.listeners={};this.value='';this.clientWidth=900;this.classes=new Set();this.classList={add:(x)=>this.classes.add(x),remove:(x)=>this.classes.delete(x),toggle:(x,on)=>on?this.classes.add(x):this.classes.delete(x)};}
    setAttribute(k,v){this.attrs[k]=String(v);}
    removeAttribute(k){delete this.attrs[k];}
    append(...v){this.children.push(...v);}
    replaceChildren(...v){this.children=v;if(this.tag==='select'&&v[0])this.value=v[0].value;}
    addEventListener(k,v){this.listeners[k]=v;}
    closest(){return ['input','select','button','textarea','a','summary'].includes(this.tag)?this:null;}
    querySelector(q){return this.querySelectorAll(q)[0]||null;}
    querySelectorAll(q){return descendants(this).filter(x=>q.startsWith('.')?x.classes.has(q.slice(1)):x.attrs['data-rr-note']===q.match(/="([^"]+)"/)?.[1]);}
    focus(){} select(){}
    reportValidity(){return this.tag!=='input'||this.attrs.type!=='number'||this.value!==''&&Number.isInteger(+this.value)&&+this.value>=+(this.attrs.min??-Infinity)&&+this.value<=+(this.attrs.max??Infinity);}
    checkValidity(){return this.reportValidity();}
    get options(){return this.children.filter(x=>x.tag==='option');}
    get min(){return this.attrs.min||'';}get max(){return this.attrs.max||'';}
  }
  const descendants=n=>[n,...n.children.filter(x=>typeof x==='object').flatMap(descendants)];
  globalThis.document={createElementNS:(_,tag)=>new E(tag)};
  for(const b of examples)for(const width of [230,375,600,960]){
    const host=new E('div');renderBar(host,b,0,width);const tree=descendants(host),layout=layoutBar(b,width);
    assert.equal(tree.filter(e=>'data-rr-note' in e.attrs).length,b.notes.length);
    for(const row of layout.rows)assert.ok(row.end+8<layout.width,'System fits viewBox');
    for(const item of layout.positions.values())assert.ok(item.x-12>=0&&item.x+13<layout.width,'Cursor and dot fit');
    const tieCount=tree.filter(e=>e.attrs.class==='rr-tie').length;
    assert.equal(tieCount,b.notes.filter(n=>n.tieOut).length);
  }
  results.push('Meter-aware score output at four widths: every note/rest, complete bars, ties and in-bounds cursors');

  const html=await readFile(new URL('../rhythm/index.html',import.meta.url),'utf8'),elements=new Map(),all=[];
  function from(tag,attrs){const e=new E(tag);for(const m of attrs.matchAll(/([\w-]+)="([^"]*)"/g)){e.attrs[m[1]]=m[2];if(m[1].startsWith('data-'))e.dataset[m[1].slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=m[2];}e.value=e.attrs.value||'';e.checked='checked'in e.attrs;e.disabled='disabled'in e.attrs;all.push(e);return e;}
  for(const m of html.matchAll(/<([a-z][a-z0-9]*)\b([^>]*\bid="([^"]+)"[^>]*)>/g))elements.set(m[3],from(m[1],m[2]));
  for(const m of html.matchAll(/<select\b([^>]*\bid="([^"]+)"[^>]*)>([\s\S]*?)<\/select>/g)){
    const e=elements.get(m[2]);let chosen;
    for(const option of m[3].matchAll(/<option([^>]*)>(.*?)<\/option>/g)){const o=from('option',option[1]);o.value=o.attrs.value??option[2];e.append(o);if(!chosen||'selected'in o.attrs)chosen=o;}
    e.value=chosen?.value||'';
  }
  const modes=[...html.matchAll(/<button\b([^>]*data-rr-mode="[^"]+"[^>]*)>/g)].map(m=>from('button',m[1]));
  const docs={},windows={},memory=new Map();
  globalThis.document={hidden:false,createElement:t=>new E(t),createElementNS:(_,t)=>new E(t),getElementById:id=>elements.get(id),querySelector:()=>null,querySelectorAll:q=>q==='[data-rr-mode]'?modes:q==='[data-rr-pattern]'?all.filter(e=>'data-rr-pattern'in e.attrs):[],addEventListener:(n,cb)=>docs[n]=cb};
  const contexts=[];globalThis.window={location:{href:'http://localhost/rhythm/',search:''},crypto:{getRandomValues:a=>(a[0]=78,a)},AudioContext:class{constructor(){Object.assign(this,context());contexts.push(this);}async resume(){this.state='running';}},addEventListener:(n,cb)=>windows[n]=cb};
  globalThis.localStorage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)};
  globalThis.ResizeObserver=class{observe(){}};
  Object.defineProperty(globalThis,'navigator',{configurable:true,value:{clipboard:{async writeText(value){memory.set('clipboard',value);}}}});
  await import('../assets/rhythm.js');
  const get=id=>elements.get('rr-'+id);
  assert.equal(get('controls').disabled,false);assert.equal(get('score').children.length,2);
  get('meter').value='7/8';get('meter').listeners.change();assert.equal(get('beat-unit').textContent,'Eighth-note BPM');
  assert.equal(get('beats').children.length,7);
  get('divisions').value='3';get('divisions').listeners.change();assert.equal(get('swing').disabled,true);
  get('save-name').value='My rhythm';get('save').listeners.click();assert.equal(get('saved').children.length,1);
  get('load').listeners.click();assert.ok(get('feedback').textContent.includes('Loaded'));
  await get('share').listeners.click();assert.ok(memory.get('clipboard').includes('meter=7%2F8'));
  modes[2].listeners.click();assert.equal(get('play-panel').hidden,false);
  await get('start').listeners.click();assert.equal(get('start').textContent,'Stop');
  document.hidden=true;docs.visibilitychange();assert.equal(get('start').textContent,'Start');document.hidden=false;
  const pending=get('start').listeners.click();await get('start').listeners.click();await pending;assert.equal(get('start').textContent,'Start');
  await get('calibrate').listeners.click();assert.equal(get('score').hidden,true);assert.equal(get('start').textContent,'Stop');
  await get('start').listeners.click();assert.equal(get('score').hidden,false);
  windows.pagehide();
  results.push('Controller fixture: initialization, meter/division changes, saved exercise/load/share, play mode, background pause, rapid Start/Stop and calibration lifecycle');
}finally{
  for(const[k,v]of Object.entries(savedGlobals)){if(v===undefined)delete globalThis[k];else globalThis[k]=v;}
  if(navDescriptor)Object.defineProperty(globalThis,'navigator',navDescriptor);else delete globalThis.navigator;
}
console.log(results.map(x=>'PASS: '+x).join('\n'));
