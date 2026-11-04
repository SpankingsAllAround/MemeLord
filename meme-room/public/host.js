let hs=null;let cachedPin=sessionStorage.getItem('meme-room-host-pin');
function login(){clearError();cachedPin=$('pin').value;send('host:login',{pin:cachedPin},()=>{sessionStorage.setItem('meme-room-host-pin',cachedPin);$('login').classList.add('hidden');$('host').classList.remove('hidden');$('joinurl').textContent=location.origin+'/';});}
$('loginbtn').onclick=login;$('pin').addEventListener('keydown',e=>{if(e.key==='Enter')login();});
socket.on('connect',()=>{if(cachedPin)send('host:login',{pin:cachedPin},()=>{$('login').classList.add('hidden');$('host').classList.remove('hidden');$('joinurl').textContent=location.origin+'/';});});
socket.on('host:state',s=>{hs=s;renderHost();});
function action(type,extra={}){const error=$('hosterror');error.classList.add('hidden');socket.emit('host:action',{type,...extra},r=>{if(!r?.ok){error.textContent=r?.error||'Action failed';error.classList.remove('hidden');}});}
function control(text,type,style,extra){const b=add($('controls'),'button','btn '+(style||''),text);b.onclick=()=>action(type,extra||{});return b;}
function renderHost(){if(!hs)return;const s=hs;const count=s.players.filter(p=>p.connected).length;const names=$('playerlist');clear(names);s.players.forEach(p=>{const c=add(names,'span','chip',p.name);if(!p.connected)c.style.opacity='.4';});
 $('connected').textContent=`${count} / ${s.players.length} online`;$('roundnum').textContent=`Round ${s.round} / ${s.maxRounds}`;$('phase').textContent=s.phase.toUpperCase();listBoard($('leaderboard'),s.leaderboard);
 const heading=$('heading'),sub=$('subheading'),tag=$('eyebrow'),status=$('status'),controls=clear($('controls'));
 const content=$('captions'),results=$('results');clear(content);clear(results);content.classList.add('hidden');results.classList.add('hidden');$('scene').classList.remove('hidden');
 let done=0,total=count;let note='';
 if(s.phase==='lobby'){
  tag.textContent='Welcome!';heading.textContent='Scan to join the game';sub.textContent='Type your name on your phone and get ready to caption!';renderScene($('scene'),null);status.textContent=`${s.players.length} players joined`;done=s.players.length;total=25;
  const label=add(controls,'label','small','Rounds ');label.htmlFor='maxrounds';const select=add(controls,'select');select.id='maxrounds';[5,8,10,12,15,20].forEach(v=>{const opt=add(select,'option','',`${v} rounds`);opt.value=v;if(v===10)opt.selected=true;});const btn=control('Start game','start');btn.onclick=()=>action('start',{maxRounds:Number(select.value)});
  note='At least two players needed. Players cannot join mid-game, but disconnected players can reconnect.';
 } else if(s.phase==='submit'){
  tag.textContent='Write your caption';heading.textContent='Make us laugh!';sub.textContent='Everyone writes one original family-friendly caption for the scene.';renderScene($('scene'),s.scene);
  status.textContent=`${s.submitted} of ${s.players.length} captions submitted`;done=s.submitted;total=s.players.length;control('Close submissions & review','review');note='You can wait until everyone submits, or close submissions at any time once two captions are in.';
 } else if(s.phase==='review'){
  tag.textContent='Private host review';heading.textContent='Review captions';sub.textContent='These captions appear on the TV host screen. Remove anything inappropriate before voting.';renderScene($('scene'),s.scene);
  content.classList.remove('hidden');s.captions.forEach(c=>{const row=add(content,'div','entry');const d=add(row,'div');add(d,'div','caption',c.text);add(d,'div','author',c.name);const b=add(row,'button','btn danger','Remove');b.onclick=()=>action('remove',{id:c.id});});
  status.textContent=`${s.captions.length} captions approved`;done=s.captions.length;total=s.players.length;control('Open voting','vote');control('Reopen submissions','reopen','secondary');note='If the TV is visible to players, captions are no longer anonymous during review. For full anonymity, do the review privately on a laptop before projecting.';
 } else if(s.phase==='prelim'||s.phase==='final'){
  const prelim=s.phase==='prelim';tag.textContent=prelim?'First ballot':'Final ballot';heading.textContent=prelim?'Vote for your favorite!':'The final vote!';sub.textContent=prelim?'Each player sees up to five randomly distributed captions on their phone. Top five go to the final.':'Finalists are competing for the win! Vote from your phone.';renderScene($('scene'),s.scene);
  status.textContent=`${s.votesReceived} of ${s.eligibleVoters} ballots submitted`;done=s.votesReceived;total=s.eligibleVoters;control(prelim?'Reveal five finalists':'Reveal winner',prelim?'final':'results');note='Each person has one vote per stage. No one can vote for their own caption.';
 } else if(s.phase==='results'){
  tag.textContent='Round results';heading.textContent='The votes are in!';sub.textContent=s.results.length?`Congratulations, ${s.results.filter(x=>x.votes===s.results[0].votes).map(x=>x.name).join(' & ')}!`:'Well played!';$('scene').classList.add('hidden');results.classList.remove('hidden');s.results.forEach((r,i)=>{const row=add(results,'div','entry');const left=add(row,'div');add(left,'div','caption',`${i===0?'🏆 ':''}${r.caption}`);add(left,'div','author',r.name);add(row,'div','votes',`${r.votes} votes`);});
  status.textContent=`Round ${s.round} complete`;done=1;total=1;control(s.round>=s.maxRounds?'Show final standings':'Next round','next');note='Each final vote = 100 points, plus 300 for the most votes (ties share the bonus).';
 } else if(s.phase==='finished'){
  tag.textContent='Game over';heading.textContent='Thanks for playing!';sub.textContent='The final leaderboard is on the right. The room is yours!';$('scene').classList.add('hidden');status.textContent='Finished';done=1;total=1;note='Reset starts a new game and clears all scores.';
 }
 $('status').textContent=status.textContent;$('progress').style.width=`${Math.round(done/Math.max(1,total)*100)}%`;$('controlnote').textContent=note;
 if(s.phase!=='lobby'){const end=control('End game','end','secondary');if(s.phase==='finished')end.remove();}
 const reset=control('Reset everything','reset','danger');reset.onclick=()=>{if(confirm('Clear all players, captions, and scores? Everyone will need to rejoin.'))action('reset');};
}
