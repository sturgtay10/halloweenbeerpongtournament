
// === TITLE SCREEN LOGIC ===
document.addEventListener('DOMContentLoaded', () => {
  const titleScreen = document.getElementById('title-screen');
  const mainUI = document.getElementById('main-ui');
  const startBtnTitle = document.getElementById('start-btn');
  const titleDoubleElim = document.getElementById('title-double-elim');
  const mainDoubleElim = document.getElementById('double-elim');

  if (startBtnTitle) {
    startBtnTitle.addEventListener('click', () => {
      if (mainDoubleElim && titleDoubleElim)
        mainDoubleElim.checked = titleDoubleElim.checked;

      titleScreen.classList.add('fade-out');
      setTimeout(() => {
        titleScreen.classList.add('hidden');
        mainUI.classList.remove('hidden');
      }, 1000);
    });
  }
});



(function(){
  const SAVE_KEY = 'halloween_beerpong_project_v3';
  const DEFAULTS = ['Witchcraft','Spooky Sips','Booze Hounds','Creepin\' Shots','Pumpkin Kings','Graveyard Gang','Mummy Toss','Phantom Paddles','Ghosted Goblets','Haunted Hangover','Vampyre Vessels','Banshee Bash','Zombie Zingers','Black Cat Ringers','Cobweb Crushers','Moonlit Cups'];
  const bracketEl = document.getElementById('bracket');
  const batsImg = document.getElementById('bats');
  const startBtn = document.getElementById('start-tourney');
  const doubleElim = document.getElementById('double-elim');
  const resetBtn = document.getElementById('reset-winners');
  const clearBtn = document.getElementById('clear-all');
  const popup = document.getElementById('champion-popup');
  const connectorsSvg = document.getElementById('connectors');
  const champNameEl = document.getElementById('champion-name');
  const closePopupBtn = document.getElementById('close-popup');
  const sfx = [document.getElementById('sfx-ghost'), document.getElementById('sfx-light'), document.getElementById('sfx-witch')];
  function playRandomSfx(){ try{ const a = sfx[Math.floor(Math.random()*sfx.length)]; if(a){ a.currentTime=0; a.play().catch(()=>{});} }catch(e){} }

  let teamCount = 8, bracketSize = 8, initialPositions = [], rounds = [];
  let isDoubleElim = false, phase = 'winners';
  let winnerChampion = null, loserChampion = null;
  let loserInitialPositions = [], loserRounds = [], loserTeamCount = 0, loserBracketSize = 0;

  function nextPow2(n){let p=1;while(p<n)p<<=1;return p;}
  function clampTeams(n){return Math.max(2,Math.min(16,Math.round(n)));}

  function buildRoundsFromInitial(){
    rounds=[];
    const matches0=[];
    for(let i=0;i<bracketSize;i+=2){
      const t1 = initialPositions[i] || 'BYE';
      const t2 = initialPositions[i+1] || 'BYE';
      if (t1 === 'BYE' && t2 === 'BYE') continue;
      const winner = (t1 === 'BYE') ? t2 : (t2 === 'BYE') ? t1 : null;
      matches0.push({teams:[t1, t2], winner});
    }
    rounds.push(matches0);
    let prev=matches0;
    while(prev.length>1){
      const next=[];
      for(let i=0;i<prev.length;i+=2) next.push({teams:[null,null], winner:null});
      rounds.push(next);
      prev=next;
    }
  }

  function propagateWinners(){
    for(let r=0;r<rounds.length-1;r++){
      for(let m=0;m<rounds[r].length;m++){
        const win=rounds[r][m].winner;
        if(win) rounds[r+1][Math.floor(m/2)].teams[m%2]=win;
      }
    }
  }

  function render(){
    bracketEl.innerHTML='';
    setPhaseTitle();
    for(let r=0;r<rounds.length;r++){
      const roundDiv=document.createElement('div');
      roundDiv.className='round';
      let title=(r===rounds.length-1)?'Final':`Round ${r+1}`;
      roundDiv.innerHTML=`<div class="title">${title}</div>`;
      rounds[r].forEach((match,mIdx)=>{
        const matchDiv=document.createElement('div');
        matchDiv.className='match';
        matchDiv.dataset.round=r;
        matchDiv.dataset.match=mIdx;
        for(let s=0;s<2;s++){
          const slot=document.createElement('div');
          slot.className='slot';
          slot.dataset.round=r; slot.dataset.match=mIdx; slot.dataset.side=s;
          const teamName=(match.teams[s]&&match.teams[s]!=='BYE')?match.teams[s]:(match.teams[s]==='BYE'?'BYE':'—');
          slot.innerHTML=`<div class="team"><div class="badge">👻</div><div class="name">${teamName}</div></div>`;
          if(match.winner===teamName) slot.classList.add('winner');
          slot.onclick=onSlotClick;
          matchDiv.appendChild(slot);
        }
        roundDiv.appendChild(matchDiv);
      });
      bracketEl.appendChild(roundDiv);
    }
    const champ=(rounds.at(-1)[0].winner);
    if(champ){
      if(isDoubleElim){
        if(phase==='winners'){
          winnerChampion = champ;
          setTimeout(()=>{ triggerLightningTransition(); startLoserBracket(); }, 250);
        } else if(phase==='losers'){
          loserChampion = champ;
          setTimeout(()=>{ triggerLightningTransition(); startFinalMatch(); }, 350);
        } else if(phase==='final'){
          showChampionPopup(champ);
        }
      } else {
        showChampionPopup(champ);
      }
    }
    saveState();
    // draw spooky connectors after DOM is ready
    // draw connectors and rescale after layout settles
    setTimeout(() => {
      autoScaleBracket();
      setTimeout(drawConnectors, 80);
    }, 50);
  }

  function onSlotClick(e){
    const slot=e.currentTarget;
    const r=parseInt(slot.dataset.round), m=parseInt(slot.dataset.match), s=parseInt(slot.dataset.side);
    const team=rounds[r][m].teams[s];
    if(team==='—'||team==='BYE') return;
    const match=rounds[r][m];
    match.winner=(match.winner===team)?null:team;
    propagateWinners();
    render();
    playRandomSfx();
    triggerBats();
  }

  function triggerBats(){
    batsImg.classList.remove('bat-fly');
    void batsImg.offsetWidth; // reset animation
    batsImg.classList.add('bat-fly');
  }

  function showChampionPopup(name){
    champNameEl.textContent=name;
    popup.classList.remove('hidden');
    playRandomSfx();
  }
  closePopupBtn.addEventListener('click',()=>popup.classList.add('hidden'));

  function openNewTournament(){
  isDoubleElim = !!(doubleElim && doubleElim.checked);
  phase = 'winners';
  winnerChampion = null;
  loserChampion = null;
  bracketEl.classList.remove('mode-losers');
  setPhaseTitle();

  const n = parseInt(prompt('How many teams? (2-16)','8'),10);
  if (!n) return;

  teamCount = clampTeams(n);
  bracketSize = nextPow2(teamCount);

  const names = [];
  for (let i=0; i<teamCount; i++) {
    const v = prompt('Team ' + (i+1) + ' name (leave blank for spooky default):', DEFAULTS[i] || ('Team ' + (i+1)));
    names.push(v && v.trim() ? v : DEFAULTS[i] || ('Team ' + (i+1)));
  }

  // --- smarter BYE distribution ---
  const totalByes = bracketSize - teamCount;
  const positions = Array.from({length: bracketSize}, (_, i) => i);
  const byeIndices = [];

  // randomize which slots are BYEs
  for (let i = 0; i < totalByes; i++) {
    const idx = Math.floor(Math.random() * positions.length);
    byeIndices.push(positions.splice(idx, 1)[0]);
  }

  initialPositions = new Array(bracketSize).fill(null);
  names.sort(() => Math.random() - 0.5);

  // fill non-BYE slots
  let nameIdx = 0;
  for (let i = 0; i < bracketSize; i++) {
    initialPositions[i] = byeIndices.includes(i) ? 'BYE' : names[nameIdx++];
  }

  buildRoundsFromInitial();
  render();
}

  function saveState(){
    try{ const payload={initialPositions, winners: rounds.map(r=>r.map(m=>m.winner)), teamCount, isDoubleElim, phase, winnerChampion, loserChampion}; localStorage.setItem(SAVE_KEY, JSON.stringify(payload)); }catch(e){}
  }

  function loadState(){
    try{
      const raw=localStorage.getItem(SAVE_KEY);
      if(!raw) return false;
      const p=JSON.parse(raw);
      if(!p.initialPositions) return false;
      initialPositions=p.initialPositions; teamCount=p.teamCount; bracketSize=initialPositions.length;
      buildRoundsFromInitial();
      if(p.winners) for(let r=0;r<p.winners.length;r++) for(let m=0;m<p.winners[r].length;m++) rounds[r][m].winner=p.winners[r][m];
      isDoubleElim = !!p.isDoubleElim; phase = p.phase || 'winners'; winnerChampion = p.winnerChampion || null; loserChampion = p.loserChampion || null;
      setPhaseTitle(); if(phase==='losers') bracketEl.classList.add('mode-losers'); else bracketEl.classList.remove('mode-losers');
      propagateWinners(); return true;
    }catch(e){return false;}
  }

  startBtn.addEventListener('click',openNewTournament);
  resetBtn.addEventListener('click',()=>{ if(confirm('Reset winners but keep teams?')){ rounds.forEach(r=>r.forEach(m=>m.winner=null)); buildRoundsFromInitial(); render(); }});
  clearBtn.addEventListener('click',()=>{ if(confirm('Clear all?')){ localStorage.removeItem(SAVE_KEY); teamCount=8;bracketSize=8;initialPositions=DEFAULTS.slice(0,8);buildRoundsFromInitial();render(); }});



  function setPhaseTitle(){
    const el = document.getElementById('phase-title');
    if(!el) return;
    if(phase==='winners') el.textContent = isDoubleElim ? 'Winner Bracket' : 'Tournament';
    else if(phase==='losers') el.textContent = 'Loser Bracket';
    else if(phase==='final') el.textContent = 'Grand Final';
  }

  function triggerLightningTransition(){
    try{
      const lightning = document.querySelector('.lightning');
      const sfxLight = document.getElementById('sfx-light');
      if(lightning){ lightning.classList.add('flash'); setTimeout(()=>lightning.classList.remove('flash'), 1200); }
      if(sfxLight){ sfxLight.currentTime=0; sfxLight.play().catch(()=>{}); }
      triggerBats();
    }catch(e){}
  }

  function collectWinnersBracketLosers(){
    const losers = [];
    for(let r=0;r<rounds.length;r++){
      for(let m=0;m<rounds[r].length;m++){
        const match = rounds[r][m];
        const t0 = match.teams[0], t1 = match.teams[1];
        const w = match.winner;
        if(t0 && t0!=='BYE' && t0!=='—' && w && w!==t0) losers.push(t0);
        if(t1 && t1!=='BYE' && t1!=='—' && w && w!==t1) losers.push(t1);
      }
    }
    return [...new Set(losers)];
  }

  function startLoserBracket(){
    const losers = collectWinnersBracketLosers();
    loserTeamCount = clampTeams(losers.length);
    loserBracketSize = nextPow2(loserTeamCount);
    const shuffled = losers.slice().sort(()=>Math.random()-0.5);
    loserInitialPositions = new Array(loserBracketSize).fill('BYE');
    for(let i=0;i<loserTeamCount;i++) loserInitialPositions[i] = shuffled[i];
    // switch into loser mode
    initialPositions = loserInitialPositions.slice();
    bracketSize = loserBracketSize;
    rounds = [];
    buildRoundsFromInitial();
    phase='losers';
    bracketEl.classList.add('mode-losers');
    setPhaseTitle();
    render();
  }

  function startFinalMatch(){
    phase='final';
    rounds=[[{teams:[winnerChampion, loserChampion], winner:null}]];
    bracketEl.classList.remove('mode-losers');
    bracketEl.classList.add('mode-final');
    setPhaseTitle();
    render();
  }

  function drawConnectors(){
    if(!connectorsSvg){ return; }
    // Clear
    while(connectorsSvg.firstChild) connectorsSvg.removeChild(connectorsSvg.firstChild);
    const wrap = document.querySelector('.bracket-wrap');
    const wrapRect = wrap.getBoundingClientRect();
    connectorsSvg.setAttribute('width', wrap.scrollWidth);
    connectorsSvg.setAttribute('height', wrap.scrollHeight);
    connectorsSvg.setAttribute('viewBox', `0 0 ${wrap.scrollWidth} ${wrap.scrollHeight}`);

    // For each round except last, connect match to next round match
    const roundEls = Array.from(bracketEl.querySelectorAll('.round'));
    for(let r=0; r<roundEls.length-1; r++){
      const matches = Array.from(roundEls[r].querySelectorAll('.match'));
      const nextMatches = Array.from(roundEls[r+1].querySelectorAll('.match'));
      for(let m=0; m<matches.length; m++){
        const src = matches[m].getBoundingClientRect();
        const targetIdx = Math.floor(m/2);
        const dst = nextMatches[targetIdx].getBoundingClientRect();

        const x1 = src.right - wrapRect.left;
        const y1 = src.top + src.height/2 - wrapRect.top;
        const x2 = dst.left - wrapRect.left;
        const y2 = dst.top + dst.height/2 - wrapRect.top;

        // Curvy spooky path using cubic Bezier
        const dx = Math.max(40, (x2 - x1) * 0.5);
        const c1x = x1 + dx * 0.6;
        const c1y = y1 - 20;
        const c2x = x2 - dx * 0.6;
        const c2y = y2 + 20;

        const path = document.createElementNS('http://www.w3.org/2000/svg','path');
        path.setAttribute('d', `M ${x1} ${y1} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${x2} ${y2}`);
        connectorsSvg.appendChild(path);
      }
    }
  }

  function startup(){ const ok=loadState(); if(!ok){ teamCount=8;bracketSize=8;initialPositions=DEFAULTS.slice(0,8);buildRoundsFromInitial(); } render(); }
  startup();
window.addEventListener('resize', () => {
  autoScaleBracket();
  setTimeout(drawConnectors, 100);
});
})();


// --- Ensure bats only animate on winner selection (already called by triggerLightningTransition for champion) ---
// No changes needed if triggerBats is already used on click. Keep for safety.

// Ensure champion popup plays lightning once and shows until user closes.
(function(){
  const popup = document.getElementById('champion-popup');
  const closeBtn = document.getElementById('close-popup');
  const sfxLight = document.getElementById('sfx-light');
  const lightning = document.querySelector('.lightning');

  if (closeBtn && popup){
    closeBtn.addEventListener('click', ()=>{
      popup.classList.add('hidden');
    });
  }

  // Patch showChampionPopup if present to enforce one-time lightning + sound
  const _oldShow = window.showChampionPopup;
  window.showChampionPopup = function(name){
    try{
      const champNameEl = document.getElementById('champion-name');
      if (champNameEl) champNameEl.textContent = name || '';
      if (popup) popup.classList.remove('hidden');
      if (lightning){ lightning.classList.add('flash'); setTimeout(()=>lightning.classList.remove('flash'), 1200); }
      if (sfxLight){ sfxLight.currentTime = 0; sfxLight.play().catch(()=>{}); }
    }catch(e){}
    if (typeof _oldShow === 'function'){ try{ _oldShow(name); }catch(e){} }
  };
})();


function autoScaleBracket() {
  const bracketWrap = document.querySelector('.bracket-wrap');
  const bracket = document.getElementById('bracket');
  if (!bracketWrap || !bracket) return;

  const wrapWidth = bracketWrap.clientWidth;
  const wrapHeight = bracketWrap.clientHeight;
  const brWidth = bracket.scrollWidth;
  const brHeight = bracket.scrollHeight;

  const scale = Math.min(1, wrapWidth / (brWidth + 40), wrapHeight / (brHeight + 60));

  bracket.style.transform = `scale(${scale})`;
  bracket.style.transformOrigin = 'center center';
}


// === BACK TO TITLE SCREEN BUTTON ===
document.addEventListener('DOMContentLoaded', () => {
  const backBtn = document.getElementById('back-title');
  const titleScreen = document.getElementById('title-screen');
  const mainUI = document.getElementById('main-ui');
  const titleDoubleElim = document.getElementById('title-double-elim');
  const mainDoubleElim = document.getElementById('double-elim');

  if (backBtn) {
    backBtn.addEventListener('click', () => {
      if (titleDoubleElim && mainDoubleElim)
        titleDoubleElim.checked = mainDoubleElim.checked;

      mainUI.classList.add('fade-out');
      setTimeout(() => {
        mainUI.classList.add('hidden');
        mainUI.classList.remove('fade-out');
        titleScreen.classList.remove('hidden');
        titleScreen.style.opacity = 0;
        setTimeout(() => {
          titleScreen.style.opacity = 1;
        }, 50);
      }, 800);
    });
  }
});
