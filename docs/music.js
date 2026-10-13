'use strict';
// Original arranged soundtrack. User gestures unlock playback; controls never autoplay the hub.
window.EPIC_MUSIC=(()=>{
 const tracks={overture:new Audio(window.EPIC_AUDIO?.overture||'audio/overture.wav'),finale:new Audio(window.EPIC_AUDIO?.finale||'audio/finale.wav')};
 Object.values(tracks).forEach(a=>{a.preload='auto';a.loop=true;a.volume=0;});
 let mode='overture',started=false,paused=false,fadeTimer=null,finishTimer=null,enabled=settings.music!==false,volume=Number.isFinite(settings.musicVolume)?Math.max(0,Math.min(1,settings.musicVolume)):.45;
 function controls(){$('bgmBtn').textContent=enabled?'♫ BGM ON':'♫ BGM OFF';$('musicOn').checked=enabled;$('musicVolume').value=Math.round(volume*100);$('musicVolumeLabel').textContent=Math.round(volume*100)+'%';}
 function clearFade(){clearInterval(fadeTimer);fadeTimer=null;}
 function fade(to,duration=.9){clearFade();const begins={overture:tracks.overture.volume,finale:tracks.finale.volume},when=performance.now();fadeTimer=setInterval(()=>{const p=Math.min(1,(performance.now()-when)/(duration*1000));for(const key of Object.keys(tracks)){const target=enabled&&key===to?volume:0;tracks[key].volume=Math.max(0,Math.min(1,begins[key]+(target-begins[key])*p));}if(p>=1){clearFade();for(const key of Object.keys(tracks))if(key!==to)tracks[key].pause();}},35);}
 function start(){stop();started=true;paused=false;mode='overture';if(enabled){tracks.overture.currentTime=0;tracks.overture.play().then(()=>fade(mode,.6)).catch(()=>toast('BGM 재생이 제한됐어요. 게임 화면의 BGM 버튼을 눌러주세요.'));}controls();}
 function final(){if(!started||mode==='finale')return;mode='finale';if(enabled&&!paused){tracks.finale.currentTime=0;tracks.finale.play().then(()=>fade('finale',1.2)).catch(()=>{mode='overture';tracks.overture.volume=volume;});}}
 function pause(){if(!started)return;paused=true;clearFade();Object.values(tracks).forEach(a=>a.pause());}
 function resume(){if(!started)return;paused=false;if(enabled){tracks[mode].volume=volume;tracks[mode].play().catch(()=>{});}}
 function stop(){clearFade();clearTimeout(finishTimer);Object.values(tracks).forEach(a=>{a.pause();a.volume=0;});started=false;paused=false;}
 function finish(){if(!started)return;clearTimeout(finishTimer);finishTimer=setTimeout(()=>{fade(null,1.3);finishTimer=setTimeout(stop,1450);},1100);}
 function toggle(value){enabled=typeof value==='boolean'?value:!enabled;settings.music=enabled;save();if(started){if(enabled&&!paused){tracks[mode].play().then(()=>fade(mode,.5)).catch(()=>{});}else{clearFade();Object.values(tracks).forEach(a=>{a.pause();a.volume=0;});}}controls();}
 function setVolume(value){volume=Math.max(0,Math.min(1,value));settings.musicVolume=volume;save();if(started&&!paused&&enabled){clearFade();tracks[mode].volume=volume;Object.entries(tracks).forEach(([key,a])=>{if(key!==mode){a.volume=0;a.pause();}});}controls();}
 $('bgmBtn').onclick=()=>toggle();$('musicOn').onchange=e=>toggle(e.target.checked);$('musicVolume').oninput=e=>setVolume(Number(e.target.value)/100);controls();
 return{start,final,pause,resume,stop,finish,toggle,setVolume,tracks,get mode(){return mode;},get started(){return started;},get enabled(){return enabled;}};
})();
