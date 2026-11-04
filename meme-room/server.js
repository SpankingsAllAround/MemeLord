'use strict';
require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const QRCode = require('qrcode');
const crypto = require('crypto');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { maxHttpBufferSize: 1024 * 40 });
const port = Number(process.env.PORT || 3000);
const pin = process.env.HOST_PIN || '2468';
if (!process.env.HOST_PIN) console.warn('WARNING: HOST_PIN not set. Local default is 2468. Set HOST_PIN before exposing this app on the internet.');
app.set('trust proxy', 1);
app.use(express.static(path.join(__dirname, 'public')));
app.get('/host', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'host.html')));
app.get('/api/qr.svg', async (req, res) => {
  try {
    const host = req.get('host');
    const proto = req.protocol;
    const url = `${proto}://${host}/`;
    res.type('image/svg+xml').set('Cache-Control', 'no-store').send(await QRCode.toString(url, { type: 'svg', margin: 1, width: 360, errorCorrectionLevel: 'M' }));
  } catch (_) { res.status(500).end(); }
});

const scenes = [
  { icon: '🐱', title: 'The cat is judging', scene: 'A cat stares at you from the kitchen counter.', mood: 'side-eye' },
  { icon: '🦖', title: 'Tiny arms, big plans', scene: 'A dinosaur attempts to reach the top shelf.', mood: 'oops' },
  { icon: '🐶', title: 'Very important meeting', scene: 'A dog sits at a desk surrounded by paperwork.', mood: 'business' },
  { icon: '🦝', title: 'Midnight snack mission', scene: 'A raccoon is caught rummaging in the pantry.', mood: 'sneaky' },
  { icon: '🐸', title: 'No thoughts, just vibes', scene: 'A frog is sitting calmly in the middle of chaos.', mood: 'calm' },
  { icon: '🦉', title: 'One more episode', scene: 'An owl stares wide-eyed at the clock at 2 a.m.', mood: 'night' },
  { icon: '🐧', title: 'Walk it off', scene: 'A penguin confidently slips on the ice.', mood: 'oops' },
  { icon: '🦊', title: 'Act natural', scene: 'A fox tries to blend in with the houseplants.', mood: 'sneaky' },
  { icon: '🐻', title: 'First day on the job', scene: 'A bear looks baffled by a computer keyboard.', mood: 'business' },
  { icon: '🐢', title: 'Be there in five', scene: 'A turtle is halfway across a very long sidewalk.', mood: 'calm' },
  { icon: '🦄', title: 'A normal Tuesday', scene: 'A unicorn is stuck in a traffic jam.', mood: 'side-eye' },
  { icon: '🐙', title: 'Multitasking champion', scene: 'An octopus is trying to juggle eight tasks at once.', mood: 'business' },
  { icon: '🐿️', title: 'Forgot what I came for', scene: 'A squirrel freezes in the middle of the grocery store.', mood: 'oops' },
  { icon: '🐔', title: 'The big presentation', scene: 'A chicken stands proudly in front of a whiteboard.', mood: 'business' },
  { icon: '🦥', title: 'Quick question', scene: 'A sloth raises its hand halfway through a meeting.', mood: 'calm' },
  { icon: '🐼', title: 'Just five more minutes', scene: 'A panda refuses to get out of a blanket fort.', mood: 'night' }
];
let state;
const players = new Map();
const hostSockets = new Set();
function resetGame() { state = { phase:'lobby', round:0, maxRounds:12, scene:null, usedScenes:[], submissions:new Map(), stage:'', ballots:new Map(), votes:new Map(), finalists:[], results:[], winners:[] }; players.clear(); }
resetGame();
function shuffled(items) { const a=[...items]; for(let i=a.length-1;i>0;i--){const j=crypto.randomInt(i+1);[a[i],a[j]]=[a[j],a[i]];}return a; }
const clean = (s, limit) => typeof s === 'string' ? s.trim().replace(/\s+/g,' ').slice(0,limit) : '';
const playerList = () => [...players.values()].map(({ id,name,score,connected })=>({id,name,score,connected}));
const ranking = () => playerList().sort((a,b)=>b.score-a.score || a.name.localeCompare(b.name));
const captionList = () => [...state.submissions.entries()].filter(([id])=>players.has(id)).map(([id,text])=>({id,text,name:players.get(id).name}));
const phasePublic = () => ({phase:state.phase,round:state.round,maxRounds:state.maxRounds,scene:state.scene,players:playerList(),submitted:state.submissions.size,results:state.results,leaderboard:ranking().slice(0,10),finalistCount:state.finalists.length});
function publish() {
 io.emit('game:state', phasePublic());
 for (const p of players.values()) if (p.socketId) sendPlayer(p);
 for (const sid of hostSockets) sendHost(io.sockets.sockets.get(sid));
}
function sendPlayer(p) {
 const s=io.sockets.sockets.get(p.socketId); if(!s) return;
 const ballot = state.ballots.get(p.id) || [];
 s.emit('player:state',{id:p.id,name:p.name,score:p.score,submitted:state.submissions.has(p.id),voted:state.votes.has(p.id),options:ballot.map(id=>({id,text:state.submissions.get(id)}))});
}
function sendHost(s) { if(s) s.emit('host:state',{...phasePublic(),captions:state.phase==='review'?captionList():[],votesReceived:state.votes.size,eligibleVoters:[...state.ballots.keys()].length}); }
function fail(ack,msg) { if(typeof ack==='function') ack({ok:false,error:msg}); }
function ok(ack,data={}) { if(typeof ack==='function') ack({ok:true,...data}); }
function auth(s) { return s.data.host === true; }
function hostOnly(s,ack) { if(!auth(s)){fail(ack,'Host access required.');return false;}return true; }
function pickScene() {
 let available=scenes.map((_,i)=>i).filter(i=>!state.usedScenes.includes(i));
 if(!available.length){state.usedScenes=[];available=scenes.map((_,i)=>i);}
 const index=available[crypto.randomInt(available.length)]; state.usedScenes.push(index); return scenes[index];
}
function nextRound() {
 state.round++; state.phase='submit'; state.scene=pickScene(); state.submissions=new Map();state.ballots=new Map();state.votes=new Map();state.finalists=[];state.results=[];state.stage='';
}
function ballotSelections(candidates, voterId, count, slot) {
 const eligible=candidates.filter(id=>id!==voterId);
 if(eligible.length<=count) return shuffled(eligible);
 const start=(slot*count)%eligible.length;
 return Array.from({length:count},(_,i)=>eligible[(start+i)%eligible.length]);
}
function startPrelim() {
 const ids=shuffled([...state.submissions.keys()]);
 state.ballots=new Map();state.votes=new Map();
 const voterIds=shuffled([...players.keys()].filter(id=>players.get(id).connected));
 voterIds.forEach((id,i)=>state.ballots.set(id,ballotSelections(ids,id,5,i)));
 state.phase='prelim'; state.stage='prelim';
}
function scorePrelim() {
 const exposure = new Map([...state.submissions.keys()].map(id=>[id,0]));
 const votes = new Map([...state.submissions.keys()].map(id=>[id,0]));
 for(const options of state.ballots.values()) for(const id of options) exposure.set(id,(exposure.get(id)||0)+1);
 for(const id of state.votes.values()) votes.set(id,(votes.get(id)||0)+1);
 // Bayesian smoothing reduces luck from appearing in just a few ballots.
 return [...state.submissions.keys()].sort((a,b)=>{
  const ra=((votes.get(a)||0)+1)/((exposure.get(a)||0)+4);
  const rb=((votes.get(b)||0)+1)/((exposure.get(b)||0)+4);
  return rb-ra || (votes.get(b)||0)-(votes.get(a)||0);
 });
}
function startFinal() {
 state.finalists=state.submissions.size<=5?[...state.submissions.keys()]:scorePrelim().slice(0,5);
 state.votes=new Map();state.ballots=new Map();
 for(const p of players.values()) if(p.connected) state.ballots.set(p.id,shuffled(state.finalists.filter(id=>id!==p.id)));
 state.phase='final';state.stage='final';
}
function finishRound() {
 const count=new Map(state.finalists.map(id=>[id,0]));
 for(const id of state.votes.values()) count.set(id,(count.get(id)||0)+1);
 const results=state.finalists.map(id=>({id,caption:state.submissions.get(id),name:players.get(id)?.name||'Player',votes:count.get(id)||0})).sort((a,b)=>b.votes-a.votes);
 if(results.length) {
  const top=results[0].votes;
  const winners=results.filter(r=>r.votes===top);
  for(const r of results) {
   const p=players.get(r.id);if(p)p.score+=r.votes*100 + (r.votes===top?300:50);
  }
  state.winners=winners.map(w=>w.id);
 }
 state.results=results;state.phase='results';state.votes=new Map();state.ballots=new Map();
}

io.on('connection',socket=>{
 socket.emit('game:state',phasePublic());
 socket.on('host:login',({pin:provided}={},ack)=>{
  if(typeof provided!=='string'||provided!==pin)return fail(ack,'Incorrect host PIN.');
  socket.data.host=true;hostSockets.add(socket.id);ok(ack);sendHost(socket);
 });
 socket.on('host:action',({type,id,maxRounds}={},ack)=>{
  if(!hostOnly(socket,ack))return;
  if(type==='start' && state.phase==='lobby'){
   const n=Number(maxRounds); if(Number.isInteger(n)&&n>=1&&n<=30)state.maxRounds=n;
   if(players.size<2)return fail(ack,'At least 2 players must join.'); nextRound();
  } else if(type==='review' && state.phase==='submit'){
   if(state.submissions.size<2)return fail(ack,'At least 2 captions are needed.');state.phase='review';
  } else if(type==='remove' && state.phase==='review'){
   if(!state.submissions.has(id))return fail(ack,'Caption not found.');state.submissions.delete(id);
  } else if(type==='reopen' && state.phase==='review'){
   state.phase='submit';
  } else if(type==='vote' && state.phase==='review'){
   if(state.submissions.size<2)return fail(ack,'At least 2 approved captions are needed.');
   if(state.submissions.size<=5)startFinal();else startPrelim();
  } else if(type==='final' && state.phase==='prelim'){
   if(state.votes.size===0)return fail(ack,'At least one preliminary vote is needed.');startFinal();
  } else if(type==='results' && state.phase==='final'){
   if(state.votes.size===0)return fail(ack,'At least one final vote is needed.');finishRound();
  } else if(type==='next' && state.phase==='results'){
   if(state.round>=state.maxRounds)state.phase='finished';else nextRound();
  } else if(type==='end' && state.phase!=='lobby'){
   state.phase='finished';
  } else if(type==='reset'){
   resetGame();
  } else return fail(ack,'That action is unavailable in the current phase.');
  ok(ack);publish();
 });
 socket.on('player:join',({name,token}={},ack)=>{
  const label=clean(name,22);
  if(label.length<2)return fail(ack,'Enter a name with at least two characters.');
  let p = typeof token==='string'?[...players.values()].find(x=>x.token===token):null;
  if(!p){
   if(state.phase!=='lobby')return fail(ack,'Game already started. Ask the host to reset for a new game.');
   if(players.size>=40)return fail(ack,'Room is full (40 players).');
   if([...players.values()].some(x=>x.name.toLowerCase()===label.toLowerCase()))return fail(ack,'That name is taken.');
   p={id:crypto.randomUUID(),token:crypto.randomBytes(24).toString('hex'),name:label,score:0,connected:false,socketId:null};players.set(p.id,p);
  }
  p.connected=true;p.socketId=socket.id;socket.data.playerId=p.id;
  ok(ack,{token:p.token,id:p.id,name:p.name});publish();
 });
 socket.on('player:submit',({caption}={},ack)=>{
  const id=socket.data.playerId;
  if(!id||!players.has(id))return fail(ack,'Join the room first.');
  if(state.phase!=='submit')return fail(ack,'Caption submissions are closed.');
  const value=clean(caption,140);
  if(value.length<2)return fail(ack,'Write at least two characters.');
  if(state.submissions.has(id))return fail(ack,'You have already submitted.');
  state.submissions.set(id,value);ok(ack);publish();
 });
 socket.on('player:vote',({id:selected}={},ack)=>{
  const id=socket.data.playerId;
  if(!id||!players.has(id))return fail(ack,'Join the room first.');
  if(!['prelim','final'].includes(state.phase))return fail(ack,'Voting is not open.');
  if(state.votes.has(id))return fail(ack,'You already voted.');
  if(!state.ballots.get(id)?.includes(selected))return fail(ack,'Invalid vote.');
  if(id===selected)return fail(ack,'You cannot vote for yourself.');
  state.votes.set(id,selected);ok(ack);publish();
 });
 socket.on('disconnect',()=>{
  hostSockets.delete(socket.id);
  const id=socket.data.playerId;const p=players.get(id);
  if(p&&p.socketId===socket.id){p.connected=false;p.socketId=null;publish();}
 });
});
server.listen(port,()=>console.log(`Meme Room running on http://localhost:${port} (host: /host)`));
