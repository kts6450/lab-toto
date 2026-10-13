'use strict';
function wheelSlice(r,index){const weights=r.wheelActors.map(a=>r.battlePhase==='final'?1+Math.min(6,a.risk)*.2:1),total=weights.reduce((sum,w)=>sum+w,0);return{start:weights.slice(0,index).reduce((sum,w)=>sum+w,0)/total*TAU,size:weights[index]/total*TAU};}
window.EXTRA_GAMES=[
 {id:'lava',icon:'🌋',name:'용암 발판 서바이벌',desc:'발밑이 붉어진다. 무너지기 전에 점프! 점점 줄어드는 안전 발판.',tag:'붕괴 · 점프 타이밍',path:null,action:'다 같이 긴급 점프!',rule:'무너지는 발판에서 먼저 탈락한 3명',color:'#ff946d'},
 {id:'vortex',icon:'🌀',name:'블랙홀 중력 전쟁',desc:'궤도가 무너지고 얼굴이 빨려 들어간다. 중력 반전으로 한 번 더 살아남아.',tag:'실제 중력 · 궤도',path:null,action:'중력 반전!',rule:'블랙홀 중심에 먼저 흡수된 3명',color:'#b19cff'},
 {id:'bomb',icon:'💣',name:'폭탄 택배 릴레이',desc:'퓨즈는 계속 탄다. 아직 공중에 있는데 터질 수도 있는 위험한 택배.',tag:'퓨즈 · 공중 패스',path:null,action:'옆 사람에게 패스!',rule:'폭발한 폭탄에 가장 가까운 사람 선정',color:'#ffd285'},
 {id:'curling',icon:'🥌',name:'얼굴 빙판 컬링',desc:'서로 부딪히고 튕기는 얼굴 퍽. 급가속으로 출구 앞에서 판을 뒤집어.',tag:'탄성 충돌 · 관성',path:null,action:'빙판에 돌풍!',rule:'위험 홀에 먼저 빠진 3명',color:'#9ce4f2'},
 {id:'coaster',icon:'📈',name:'주가 롤러코스터',desc:'급등, 급락, 떡상과 추락. 차트 위를 달리는 우리 얼굴, 누가 청산될까?',tag:'가상 차트 · 서킷브레이커',path:null,action:'서킷브레이커!',rule:'결승 차트에서 청산된 3명 · 완주 시 하위 3명',color:'#87e6c2'}
];
const map=(id,name,subtitle,color,params={})=>({id,name,subtitle,color,...params});
window.GAME_MAPS={
 pinball:[map('garden','네온 정원','촘촘한 핀 · 중앙 출구','#88caff',{gravity:1,pattern:0}),map('factory','자이로 공장','회전 범퍼 · 움직이는 핀','#ffd289',{gravity:1.15,pattern:1}),map('space','무중력 우주','낮은 중력 · 좌우 태양풍','#bba4ff',{gravity:.64,pattern:2})],
 horse:[map('track','야간 그랑프리','직선 스퍼트 · 추월 구간','#ffd285',{surface:0}),map('jungle','늪지 탐험','진흙 구간 · 급가속 탈출','#a7dd94',{surface:1}),map('sky','하늘 다리','돌풍 · 무작위 교량 장애물','#90d9f2',{surface:2})],
 redlight:[map('school','체육관 잠입','기본 신호 · 넓은 결승선','#e6a8bb',{cover:0}),map('ice','얼음 운동장','미끄러지는 멈춤 · 긴 반응','#9fddef',{cover:1}),map('forest','안개 숲길','나무 엄폐 구간 · 불규칙 신호','#a8df9f',{cover:2})],
 balloon:[map('pool','수영장 파티','표준 압력 · 번갈아 펌프','#8bdff0',{pressure:1}),map('steam','스팀 보일러','압력 급증 · 과열 풍선','#ffae85',{pressure:1.45}),map('moon','달 표면','탄성 풍선 · 미세 압력 변화','#c2aff0',{pressure:.7})],
 sushi:[map('bar','초밥 카운터','차분한 접시 · 와사비 한 점','#ace3ac',{plates:1,bombs:1}),map('train','회전 초밥 열차','움직이는 접시 · 섞이는 후보','#ffc4a7',{plates:1,bombs:1,moving:true}),map('buffet','와사비 뷔페','접시 두 배 · 위험 두 점','#d0b1ef',{plates:2,bombs:2})],
 press:[map('workshop','수박 실험실','표준 프레스 · 일정한 유압','#f89d9e',{pressure:1}),map('gears','거대 기어 공장','기어 증폭 · 큰 압력 변화','#ffc890',{pressure:1.6}),map('cold','극저온 챔버','조금씩 새는 유압 · 얼어붙은 수박','#a7daef',{pressure:.85,leak:true})],
 ladder:[map('slide','아쿠아 슬라이드','16단 길 · 마지막 구간 안개','#a6dbf0',{rows:16,density:.34}),map('maze','심해 미궁','24단 길 · 촘촘한 갈림길','#ada8ee',{rows:24,density:.55}),map('falls','폭포 협곡','12단 급류 · 긴 수평 이동','#96e1bc',{rows:12,density:.22})],
 wheel:[map('arena','해머 경기장','표준 원판 · 완만한 감속','#c4adf5',{friction:.45}),map('ice','빙결 원판','미끄러운 회전 · 오래 버티는 관성','#a2dce9',{friction:.25}),map('reverse','역회전 공장','방향이 바뀌는 회전 · 급제동','#f7b087',{friction:.5,reverse:true})],
 bullets:[map('rain','유성우','위에서 쏟아지는 탄막','#ffb08b',{storm:0}),map('cross','교차 사격장','비스듬한 교차 탄막','#c4a6e8',{storm:1}),map('orbit','궤도 포격','좌우에서 날아오는 유성','#9adbe6',{storm:2})],
 rhythm:[map('stage','라이브 스테이지','84 BPM · 기본 박자','#c3b0f0',{bpm:84}),map('factory','타악기 공장','110 BPM · 빠른 박자','#ffba98',{bpm:110}),map('neon','네온 클럽','140 BPM · 좁아지는 타이밍','#99dbe9',{bpm:140})],
 lava:[map('grid','화산 연구기지','격자 발판 · 번지는 경보','#ff956d',{layout:0}),map('ring','용암 원형극장','고리 발판 · 좁은 탈출로','#ffbd82',{layout:1}),map('crack','빙하 붕괴','얼음 발판 · 빠른 금 가기','#a4dfef',{layout:2})],
 vortex:[map('single','사건의 지평선','한 개의 블랙홀 · 나선 궤도','#bba8f5',{holes:1}),map('binary','쌍둥이 블랙홀','두 개의 중심 · 교차 중력','#e8a6d0',{holes:2}),map('wandering','떠도는 특이점','움직이는 중심 · 바뀌는 궤도','#99ddeb',{holes:1,moving:true})],
 bomb:[map('parcel','물류 센터','원형 패스 · 짧아지는 퓨즈','#ffd085',{track:0}),map('train','폭탄 열차','움직이는 승객 · 공중 택배','#a9dcf0',{track:1}),map('chain','연쇄 배송 사고','넓은 폭발 반경 · 주변까지 위험','#ff9c91',{track:2})],
 curling:[map('ice','북극 컬링장','두 개의 위험 홀 · 느린 마찰','#a6e3f3',{rink:0}),map('hockey','네온 에어하키','네 개의 위험 홀 · 범퍼','#c4adf0',{rink:1}),map('bumpers','빙판 범퍼카','움직이는 홀 · 중앙 장애물','#ffc598',{rink:2})],
 coaster:[map('neon','네온 급등장','급등과 조정 · 가상 주가 차트','#89e5c0',{volatility:1}),map('crypto','코인 급락장','큰 진폭 · 위험한 급락','#ffc385',{volatility:1.6}),map('delist','서킷브레이커 데이','연쇄 급락 · 짧은 반등','#efa6b9',{volatility:2.1})]
};
