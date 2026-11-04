let game=null, me=null;
const savedToken=localStorage.getItem('meme-room-token');
const savedName=localStorage.getItem('meme-room-name');
if(savedName)$('name').value=savedName;
function join(){clearError();const name=$('name').value.trim();send('player:join',{name,token:localStorage.getItem('meme-room-token')},r=>{localStorage.setItem('meme-room-token',r.token);localStorage.setItem('meme-room-name',r.name);$('join').classList.add('hidden');$('game').classList.remove('hidden');});}
$('joinbtn').onclick=join;$('name').addEventListener('keydown',e=>{if(e.key==='Enter')join();});
$('caption').oninput=()=>$('characters').textContent=$('caption').value.length;
$('submit').onclick=()=>{clearError();send('player:submit',{caption:$('caption').value},()=>{$('caption').value='';$('characters').textContent='0';});};
socket.on('connect',()=>{$('connection').textContent='Connected';if(savedToken&&savedName)send('player:join',{name:savedName,token:savedToken},r=>{$('join').classList.add('hidden');$('game').classList.remove('hidden');});});
socket.on('disconnect',()=>{$('connection').textContent='Reconnecting…';});
socket.on('game:state',g=>{game=g;render();});
socket.on('player:state',p=>{me=p;render();});
function render(){if(!game||!me)return;
 $('round').textContent=`${game.round} / ${game.maxRounds}`;$('score').textContent=me.score;
 renderScene($('scene'),game.scene);listBoard($('board'),game.leaderboard);
 const phase=game.phase;
 $('compose').classList.add('hidden');$('ballot').classList.add('hidden');$('resultlist').classList.add('hidden');
 const title=$('instruction'),desc=$('description'),stage=$('stage');
 if(phase==='lobby'){stage.textContent='Lobby';title.textContent='You’re in, '+me.name+'!';desc.textContent='Watch the TV for the game to begin.';}
 else if(phase==='submit'){stage.textContent='Write';title.textContent=me.submitted?'Caption submitted!':'Make them laugh';desc.textContent=me.submitted?'Watch the TV while the other players finish.':'Write one original, kind, family-friendly caption for the scene above.';if(!me.submitted)$('compose').classList.remove('hidden');}
 else if(phase==='review'){stage.textContent='Host review';title.textContent='Captions are being reviewed';desc.textContent='The host is choosing which captions are ready for voting.';}
 else if(phase==='prelim'||phase==='final'){
  stage.textContent=phase==='prelim'?'First vote':'Final vote';title.textContent=me.voted?'Vote received!':'Pick the funniest caption';desc.textContent=me.voted?'Watch the TV for the next stage.':'Tap your favorite. Your own entry is never on your ballot.';
  const area=clear($('ballot'));if(!me.voted&&me.options?.length){me.options.forEach(option=>{const btn=add(area,'button','option',option.text);btn.type='button';btn.onclick=()=>{clearError();send('player:vote',{id:option.id});};});area.classList.remove('hidden');}
  else if(!me.voted)desc.textContent='No eligible captions on your ballot this round. Watch the TV.';
 } else if(phase==='results'){
  stage.textContent='Results';title.textContent='Round complete!';desc.textContent='Here are the finalists. The next round begins on the host screen.';
  const area=clear($('resultlist'));game.results.forEach((r,i)=>{const row=add(area,'div','entry');const body=add(row,'div');add(body,'div','caption',`${i===0?'🏆 ':''}${r.caption}`);add(body,'div','author',r.name);add(row,'div','votes',`${r.votes} votes`);});area.classList.remove('hidden');
 } else if(phase==='finished'){
  stage.textContent='The end';title.textContent='Game over!';desc.textContent='Check the leaderboard for the final scores. Thanks for playing!';
 }
}
