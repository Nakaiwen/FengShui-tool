/* Presentation only: every displayed star comes from XuanKong.compute. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const MOUNTAINS = ['子','癸','丑','艮','寅','甲','卯','乙','辰','巽','巳','丙','午','丁','未','坤','申','庚','酉','辛','戌','乾','亥','壬'];
  const GRID = ['巽','離','坤','震','中','兌','艮','坎','乾'];
  const DIR = {巽:'東南',離:'南',坤:'西南',震:'東',中:'中宮',兌:'西',艮:'東北',坎:'北',乾:'西北'};
  const CN = ['','一','二','三','四','五','六','七','八','九'];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const ns = 'http://www.w3.org/2000/svg';
  let animations = [], generation = 0, lastResult = null, rotation = null, flightCount = 0;
  const normalize = degree => ((degree % 360) + 360) % 360;
  const mountain = degree => MOUNTAINS[Math.floor((normalize(degree) + 7.5) / 15) % 24];
  const sectors = [], labels = [];
  function svgEl(tag, attrs, parent, text) {
    const node = document.createElementNS(ns, tag);
    Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
    if (text !== undefined) node.textContent = text;
    parent.appendChild(node);
    return node;
  }
  function polar(radius, angle) {
    const a = angle * Math.PI / 180;
    return [200 + radius * Math.sin(a), 200 - radius * Math.cos(a)];
  }
  function buildCompass() {
    const svg = $('xk-compass-svg');
    svgEl('circle', {cx:200,cy:200,r:184,fill:'var(--xk-card)',stroke:'var(--xk-gold)','stroke-width':1}, svg);
    svgEl('circle', {cx:200,cy:200,r:176,fill:'none',stroke:'var(--xk-line-strong)','stroke-width':.6}, svg);
    const rotor = svgEl('g', {id:'xk-compass-rotor'}, svg);
    MOUNTAINS.forEach((m,i) => {
      const a = i * 15;
      const p1 = polar(164,a-7.5), p2 = polar(164,a+7.5), p3 = polar(110,a+7.5), p4 = polar(110,a-7.5);
      const path = svgEl('path', {d:`M ${p1} A 164 164 0 0 1 ${p2} L ${p3} A 110 110 0 0 0 ${p4} Z`,fill:i%2 ? 'var(--xk-wash)':'var(--xk-paper)',stroke:'var(--xk-card)','stroke-width':1}, rotor);
      sectors.push(path);
      const [x,y] = polar(139,a);
      const label = svgEl('text', {x,y,'text-anchor':'middle','dominant-baseline':'central',fill:'var(--xk-ink)','font-size':16,'font-family':'STKaiti, KaiTi, serif'}, rotor,m);
      labels.push({label,x,y});
    });
    for (let a=0;a<360;a+=3) {
      const p1=polar(a%15 === 0 ? 169 : 172,a), p2=polar(176,a);
      svgEl('line',{x1:p1[0],y1:p1[1],x2:p2[0],y2:p2[1],stroke:a%15===0?'var(--xk-gold)':'var(--xk-line-strong)','stroke-width':a%15===0?1.2:.7},rotor);
    }
    [['北',0],['東',90],['南',180],['西',270]].forEach(([t,a])=>{
      const [x,y]=polar(194,a);
      const label=svgEl('text',{x,y,'text-anchor':'middle','dominant-baseline':'central',fill:'var(--xk-moss)','font-size':11},rotor,t);
      labels.push({label,x,y});
    });
    svgEl('circle',{cx:200,cy:200,r:104,fill:'var(--xk-wash)',stroke:'var(--xk-gold)','stroke-width':.7},svg);
    svgEl('circle',{cx:200,cy:200,r:83,fill:'var(--xk-card)',stroke:'var(--xk-line)','stroke-width':.6},svg);
    // Shared controls retain their original DOM ids for the purple-white mode.
    const directions = document.createElement('div');
    directions.className = 'xk-sitting-facing xk-only';
    directions.innerHTML = '<div><small>坐山</small><strong id="xk-sitting">子<span>北</span></strong></div><span>山 ─ 向</span><div><small>向首</small><strong id="xk-facing">午<span>南</span></strong></div>';
    $('info-display').before(directions);
  }
  function updateHeading(heading) {
    heading = normalize(heading);
    const sitting=mountain(heading+180), facing=mountain(heading);
    // Unwrap 359° → 0° so the compass never makes a full reverse turn.
    if (rotation === null) rotation=heading;
    else rotation += ((heading-normalize(rotation)+540)%360)-180;
    $('xk-compass-rotor').style.transform=`rotate(${-rotation}deg)`;
    labels.forEach(({label,x,y})=>label.setAttribute('transform',`rotate(${rotation} ${x} ${y})`));
    sectors.forEach((sector,i)=>sector.setAttribute('fill',MOUNTAINS[i]===facing?'var(--xk-facing)':MOUNTAINS[i]===sitting?'var(--xk-sit)':i%2?'var(--xk-wash)':'var(--xk-paper)'));
    const sg=window.XuanKong.MTN[sitting].gua, fg=window.XuanKong.MTN[facing].gua;
    $('xk-live-degree').innerHTML=`${heading.toFixed(1)}<small>°</small>`;
    $('xk-live-direction').textContent=`${DIR[fg]} · ${facing}向`;
    $('xk-sitting').innerHTML=`${sitting}<span>${DIR[sg]}</span>`;
    $('xk-facing').innerHTML=`${facing}<span>${DIR[fg]}</span>`;
  }
  function stopAnimation() {
    generation++;
    animations.forEach(animation=>animation.cancel());
    animations=[];
    $('xk-plate').classList.remove('is-flying');
    if (lastResult) $('xk-chart-status').textContent='坐向同步';
  }
  function animate() {
    stopAnimation();
    const plate=$('xk-plate');
    if (!lastResult || reduced.matches || document.hidden || !plate.getClientRects().length || !document.body.classList.contains('mode-xk')) return;
    const nodes=[...plate.querySelectorAll('.xk-cell:not(.is-center) .xk-stars')];
    const center=plate.querySelector('.is-center').getBoundingClientRect();
    const token=generation;
    flightCount++;
    plate.dataset.flightCount=String(flightCount);
    plate.classList.add('is-flying');
    $('xk-chart-status').textContent='中宮起飛 · 八宮歸位';
    // Animate the real numbers, not duplicate particle labels. Cancelling always
    // restores the latest computed board, including rapid direction changes.
    nodes.forEach((node,i)=>{
      const cell=node.parentElement.getBoundingClientRect();
      const dx=center.left+center.width/2-cell.left-cell.width/2;
      const dy=center.top+center.height/2-cell.top-cell.height/2;
      animations.push(node.animate([
        {transform:`translate(${dx}px, ${dy}px) scale(.18)`,opacity:0},
        {transform:`translate(${dx*.85}px, ${dy*.85}px) scale(.32)`,opacity:.55,offset:.2},
        {transform:'translate(0, 0) scale(1)',opacity:1}
      ],{duration:680,delay:i*28,easing:'cubic-bezier(.2,.7,.2,1)',fill:'backwards'}));
    });
    const centerNode=plate.querySelector('.is-center .xk-stars');
    animations.push(centerNode.animate([{transform:'scale(1)',opacity:1},{transform:'scale(1.13)',opacity:.7,offset:.35},{transform:'scale(1)',opacity:1}],{duration:520,easing:'ease-out'}));
    Promise.all(animations.map(a=>a.finished.catch(()=>{}))).then(()=>{
      if(token !== generation) return;
      animations=[];
      plate.classList.remove('is-flying');
      $('xk-chart-status').textContent='坐向同步';
    });
  }
  function render(result, shouldAnimate=true) {
    stopAnimation();
    lastResult=result && result.ok ? result : null;
    const plate=$('xk-plate');
    plate.replaceChildren();
    if (!lastResult) {
      plate.textContent=result && result.reason || '請設定坐向';
      $('xk-chart-status').textContent='待設定';
      return;
    }
    const r=lastResult, gates=new Set(r.advanced.castleGate.filter(g=>g.valid).map(g=>g.palace));
    const robbery=r.advanced.robbery.success ? r.advanced.robbery.palaces : [];
    const fragment=document.createDocumentFragment();
    GRID.forEach(gua=>{
      const cell=document.createElement('div');
      const sitting=gua===r.sitting.gua, facing=gua===r.facing.gua;
      cell.className=['xk-cell',gua==='中'?'is-center':'',sitting?'is-sitting':'',facing?'is-facing':'',gates.has(gua)?'is-gate':'',robbery.includes(gua)?'is-robbery':''].filter(Boolean).join(' ');
      cell.dataset.gua=gua;
      cell.setAttribute('aria-label',`${DIR[gua]}${gua==='中'?'':gua+'宮'}：山星${r.plates.shan[gua]}，向星${r.plates.xiang[gua]}，運星${r.plates.yun[gua]}${sitting?'，坐山':facing?'，向首':''}`);
      const stars=document.createElement('div');
      stars.className='xk-stars';
      stars.setAttribute('aria-hidden','true');
      ['shan','xiang','yun'].forEach(kind=>{
        const n=r.plates[kind][gua], span=document.createElement('span');
        span.className=`xk-star ${kind}${n===r.period?' is-wang':''}`;
        span.dataset.number=String(n);
        span.textContent=kind==='yun'?CN[n]:n;
        stars.appendChild(span);
      });
      cell.appendChild(stars);
      const label=document.createElement('div');
      label.className='xk-cell-label';
      label.innerHTML=gua==='中'?'中宮':`${sitting?'<b>坐</b>':facing?'<b>向</b>':gates.has(gua)?'<b>城門</b>':''}${gua} · ${DIR[gua]}`;
      cell.appendChild(label);
      fragment.appendChild(cell);
    });
    plate.appendChild(fragment);
    const cycle=['上元','中元','下元'][Math.floor((r.period-1)/3)];
    $('xk-period-name').textContent=CN[r.period]+'運';
    const year=1864+(r.period-1)*20;
    $('xk-period-years').textContent=`${year}–${year+19} · ${cycle} · 建宅元運`;
    $('xk-chart-heading').textContent=`${r.sitting.mtn}山${r.facing.mtn}向 · ${CN[r.period]}運宅盤`;
    $('xk-flight-summary').innerHTML=`<div><span>山星飛法</span><strong>${r.center.shan} 入中 · ${r.center.shanFwd?'順飛':'逆飛'}</strong></div><div><span>向星飛法</span><strong>${r.center.xiang} 入中 · ${r.center.xiangFwd?'順飛':'逆飛'}</strong></div>`;
    $('xk-chart-status').textContent='坐向同步';
    if(shouldAnimate) animate();
  }
  buildCompass();
  $('xk-replay').addEventListener('click',animate);
  reduced.addEventListener('change',()=>{if(reduced.matches)stopAnimation();});
  window.addEventListener('resize',stopAnimation);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopAnimation();});
  window.XKDashboard={render,updateHeading,animate,stopAnimation};
})();
