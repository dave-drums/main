import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';

const html=await readFile(new URL('../apps/groovelab/index.html',import.meta.url),'utf8');
const dom=new JSDOM(html,{url:'http://localhost/',runScripts:'outside-only'});
try {
  for(const file of ['groove_utils','groove_writer']) {
    dom.window.eval(await readFile(new URL(`../apps/groovelab/js/${file}.js`,import.meta.url),'utf8'));
  }
  const writer=new dom.window.GrooveWriter(),doc=dom.window.document;
  for(const name of ['toms-container','tom-label']) {
    const node=doc.createElement('div');node.className=name;node.style.visibility='hidden';doc.body.append(node);
  }
  const button=doc.getElementById('showHideTomsButton');
  for(const [force,on,expected] of [[true,true,true],[true,false,false],[false,false,true],[false,false,false]]) {
    writer.showHideToms(force,on,true);
    assert.equal(button.getAttribute('aria-pressed'),String(expected));
    assert.equal(button.classList.contains('ClickToHide'),expected);
    assert.equal(doc.querySelector('.toms-container').style.visibility,expected?'visible':'hidden');
    assert.equal(doc.querySelector('.tom-label').style.visibility,expected?'visible':'hidden');
  }
  assert.ok(button.querySelector('svg.toms-icon'));
  const buttons=[...doc.querySelectorAll('#bottomButtonRow > button')];
  assert.equal(buttons.length,6);
  assert.ok(buttons.every(node=>node.children.length===1&&node.firstElementChild.classList.contains('bottomButtonContents')));
  assert.ok(doc.querySelector('#stickingsButton .stickings-icon'));
  console.log('PASS: Actual Toms visibility/pressed state, forced/toggled modes and stable icon/label wrappers on editing actions.');
} finally { dom.window.close(); }
