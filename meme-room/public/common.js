const socket=io();
const $=id=>document.getElementById(id);
const el=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node;};
const clear=node=>{while(node.firstChild)node.removeChild(node.firstChild);return node;};
const add=(p,tag,cls,text)=>{const n=el(tag,cls,text);p.appendChild(n);return n;};
function renderScene(container,scene){clear(container);container.className='scene '+(scene?.mood||'');add(container,'div','emoji',scene?.icon||'🎭');add(container,'h2','',scene?.title||'Get ready to laugh!');add(container,'p','',scene?.scene||'Players join from their phones.');}
function listBoard(container,people){clear(container);if(!people.length){add(container,'p','muted','Scores appear after the first round.');return;}people.forEach((p,i)=>{const row=add(container,'div','boardrow');add(row,'span','',`${i+1}. ${p.name}`);add(row,'b','',`${p.score} pts`);});}
function send(event,data,callback){socket.emit(event,data,(response)=>{if(!response?.ok)showError(response?.error||'Something went wrong.');else callback?.(response);});}
function showError(message){const box=$('error');if(!box)return;box.textContent=message;box.classList.remove('hidden');}
function clearError(){const box=$('error');if(box){box.classList.add('hidden');box.textContent='';}}
