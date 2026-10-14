"use strict";
window.MULTI_GAMES = [
  {
    id: "arena",
    multiplayer: true,
    icon: "⚔️",
    name: "범퍼 아레나",
    desc: "전원이 직접 움직인다. 대시로 서로 밀어내고, 떨어지기 직전 방향을 틀어라.",
    tag: "이동 · 몸싸움 · 대시",
    action: "대시!",
    rule: "생존 점수 하위부터 담당 배정",
    color: "#ffb27c",
    path: null,
  },
  {
    id: "laser",
    multiplayer: true,
    icon: "🚨",
    name: "레이저 닷지",
    desc: "쏟아지는 탄과 회전 레이저를 직접 피한다. 방어막은 나에게만 적용.",
    tag: "이동 · 회피 · 개인 방어막",
    action: "내 방어막!",
    rule: "피격·생존 점수 하위부터 담당 배정",
    color: "#ed97b5",
    path: null,
  },
  {
    id: "coins",
    multiplayer: true,
    icon: "🪙",
    name: "코인 쟁탈전",
    desc: "코인을 먼저 주워라. 대시로 상대를 치면 코인을 빼앗을 수 있다.",
    tag: "수집 · 이동 · 코인 스틸",
    action: "스틸 대시!",
    rule: "보유 코인 하위부터 담당 배정",
    color: "#efda7b",
    path: null,
  },
  {
    id: "paint",
    multiplayer: true,
    icon: "🎨",
    name: "영토 페인트전",
    desc: "지나가는 바닥이 내 색으로 변한다. 남의 땅을 빼앗고 페인트 폭탄을 써라.",
    tag: "이동 · 점령 · 페인트 폭탄",
    action: "페인트 폭탄!",
    rule: "점령한 칸 수 하위부터 담당 배정",
    color: "#9ddcc3",
    path: null,
  },
  {
    id: "rally",
    multiplayer: true,
    icon: "🏁",
    name: "체크포인트 랠리",
    desc: "미로와 좁은 다리를 직접 운전한다. 순서대로 찍고 결승까지 달려라.",
    tag: "직접 운전 · 코스 공략",
    action: "니트로!",
    rule: "체크포인트·완주 기록 하위부터 담당 배정",
    color: "#9fbfee",
    path: null,
  },
];
window.EXTRA_GAMES.push(...window.MULTI_GAMES);
window.isMultiplayer = (g) =>
  typeof g === "string"
    ? window.MULTI_GAMES.some((x) => x.id === g)
    : !!g?.multiplayer;
Object.assign(window.GAME_MAPS, {
  arena: [
    map(
      "crater",
      "붕괴 분화구",
      "줄어드는 원형 발판 · 가장자리 추락",
      "#ffb27c",
      { shape: "disc", theme: "lava" },
    ),
    map(
      "cargo",
      "컨테이너 야드",
      "네 모서리 추락 구역 · 철제 장애물",
      "#88cde1",
      { shape: "yard", theme: "cargo" },
    ),
    map("sky", "십자 하늘다리", "섬 네 개 · 좁은 십자 교량", "#c6b6f1", {
      shape: "bridges",
      theme: "sky",
    }),
  ],
  laser: [
    map(
      "corridor",
      "십자 포격 복도",
      "십자형 벽 · 사방에서 날아오는 탄",
      "#efad83",
      { shape: "maze", theme: "cargo", hazard: "shots" },
    ),
    map("reactor", "회전 원자로", "원형 방 · 두 줄의 회전 레이저", "#dfa3c7", {
      shape: "disc",
      theme: "reactor",
      hazard: "beam",
    }),
    map(
      "tiles",
      "번개 타일 공장",
      "격자 바닥 · 경고 후 터지는 발판",
      "#99d6e2",
      { shape: "yard", theme: "neon", hazard: "tiles" },
    ),
  ],
  coins: [
    map("warehouse", "금고 창고", "수직 통로 · 코인 쟁탈 · 스틸", "#eed47e", {
      shape: "maze",
      theme: "cargo",
    }),
    map(
      "islands",
      "보물섬 다리",
      "섬과 좁은 다리 · 추락하면 코인 손실",
      "#a5dbba",
      { shape: "bridges", theme: "islands" },
    ),
    map("subway", "코인 지하철", "세 개의 벨트 · 지나가는 열차", "#a1c7ed", {
      shape: "yard",
      theme: "subway",
      belt: true,
    }),
  ],
  paint: [
    map("park", "페인트 공원", "넓은 바닥 · 네 개의 벽 · 점령전", "#97d5b0", {
      shape: "yard",
      theme: "park",
    }),
    map("reactor", "링 점령전", "원형 격자 · 모서리 접근 불가", "#beaceb", {
      shape: "disc",
      theme: "reactor",
    }),
    map("bridges", "연결 통로 전쟁", "섬 네 개 · 길목 가로채기", "#edb693", {
      shape: "bridges",
      theme: "sky",
    }),
  ],
  rally: [
    map("maze", "스위치백 미로", "굽은 통로 · 순서대로 체크포인트", "#accfe4", {
      shape: "maze",
      theme: "cargo",
    }),
    map("sky", "다리 위의 질주", "섬 네 개를 잇는 좁은 코스", "#c1afea", {
      shape: "bridges",
      theme: "sky",
    }),
    map("orbit", "행성 궤도 서킷", "원형 외곽 코스 · 중앙 장애물", "#e5ce8b", {
      shape: "disc",
      theme: "space",
    }),
  ],
});
