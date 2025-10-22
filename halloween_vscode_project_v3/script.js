
(function(){
  const SAVE_KEY = 'halloween_beerpong_project_v3';
  const DEFAULTS = ['Witchcraft','Spooky Sips','Booze Hounds','Creepin\' Shots','Pumpkin Kings','Graveyard Gang','Mummy Toss','Phantom Paddles','Ghosted Goblets','Haunted Hangover','Vampyre Vessels','Banshee Bash','Zombie Zingers','Black Cat Ringers','Cobweb Crushers','Moonlit Cups'];
  const bracketEl = document.getElementById('bracket');
  const batsImg = document.getElementById('bats');
  const startBtn = document.getElementById('start-tourney');
  const resetBtn = document.getElementById('reset-winners');
  const clearBtn = document.getElementById('clear-all');
  const popup = document.getElementById('champion-popup');
  const champNameEl = document.getElementById('champion-name');
  const closePopupBtn = document.getElementById('close-popup');
  const sfx = [document.getElementById('sfx-ghost'), document.getElementById('sfx-light'), document.getElementById('sfx-witch')];
  function playRandomSfx(){ try{ const a = sfx[Math.floor(Math.random()*sfx.length)]; if(a){ a.currentTime=0; a.play().catch(()=>{});} }catch(e){} }

  let teamCount = 8, bracketSize = 8, initialPositions = [], rounds = [];

  function nextPow2(n){let p=1;while(p<n)p<<=1;return p;}
  function clampTeams(n){return Math.max(2,Math.min(16,Math.round(n)));}

  function buildRoundsFromInitial(){
    rounds=[];
    const matches0=[];
    for(let i=0;i<bracketSize;i+=2)
      matches0.push({teams:[initialPositions[i]||'BYE', initialPositions[i+1]||'BYE'], winner:null});
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
    if(champ){ showChampionPopup(champ); }
    saveState();
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
    const n=parseInt(prompt('How many teams? (2-16)','8'),10);
    if(!n) return;
    teamCount=clampTeams(n); bracketSize=nextPow2(teamCount);
    const names=[];
    for(let i=0;i<teamCount;i++){
      const v=prompt('Team '+(i+1)+' name (leave blank for spooky default):', DEFAULTS[i]||('Team '+(i+1)));
      names.push(v&&v.trim()?v:DEFAULTS[i]||('Team '+(i+1)));
    }
    initialPositions=new Array(bracketSize).fill('BYE');
    for(let i=0;i<teamCount;i++){ initialPositions[i]=names[i]; } // fill all slots sequentially
    buildRoundsFromInitial();
    render();
  }

  function saveState(){
    try{ const payload={initialPositions, winners: rounds.map(r=>r.map(m=>m.winner)), teamCount}; localStorage.setItem(SAVE_KEY, JSON.stringify(payload)); }catch(e){}
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
      propagateWinners(); return true;
    }catch(e){return false;}
  }

  startBtn.addEventListener('click',openNewTournament);
  resetBtn.addEventListener('click',()=>{ if(confirm('Reset winners but keep teams?')){ rounds.forEach(r=>r.forEach(m=>m.winner=null)); buildRoundsFromInitial(); render(); }});
  clearBtn.addEventListener('click',()=>{ if(confirm('Clear all?')){ localStorage.removeItem(SAVE_KEY); teamCount=8;bracketSize=8;initialPositions=DEFAULTS.slice(0,8);buildRoundsFromInitial();render(); }});

  function startup(){ const ok=loadState(); if(!ok){ teamCount=8;bracketSize=8;initialPositions=DEFAULTS.slice(0,8);buildRoundsFromInitial(); } render(); }
  startup();
})();
