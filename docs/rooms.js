"use strict";
// Host-authoritative WebRTC rooms. Peers send inputs; only the host simulates outcomes.
window.LAB_ROOMS = (() => {
  const prior = {
    activeMembers,
    startGame,
    update,
    backHome,
    toggleRed,
    renderMembers,
    renderControls,
  };
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789",
    prefix = "dnslab-play-v1-";
  let role = null,
    peer = null,
    code = "",
    hostConnection = null,
    identity = null,
    selectedIdentity = null,
    phase = "idle",
    remote = null,
    lobby = null,
    ready = false,
    lastSnapshot = 0,
    lastHostSnapshot = 0,
    connectionTimer = null,
    clientFrame = 0,
    reconnectTimer = null,
    closed = false,
    roomEpoch = 0;
  const clients = new Map(),
    inputs = new Map();
  let inputDirection = { x: 0, y: 0 },
    inputTick = null;
  let token;
  try {
    token = sessionStorage.getItem("dnslab-room-token") || crypto.randomUUID();
    sessionStorage.setItem("dnslab-room-token", token);
  } catch {
    token = crypto.randomUUID();
  }
  function node(tag, id, cls, text) {
    const e = el(tag, cls, text);
    if (id) e.id = id;
    return e;
  }
  const modal = node("div", "roomModal", "modal");
  modal.hidden = true;
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-labelledby", "roomHeading");
  const card = node("div", null, "modal-card"),
    top = node("div", null, "modal-top");
  top.append(
    node("h2", "roomHeading", null, "각자 들어와서, 다 같이 놀자."),
    node("button", "closeRoomPanel", "close", "×"),
  );
  card.append(
    top,
    node(
      "p",
      null,
      "room-intro",
      "큰 화면에서 방을 만들고, 각자 휴대폰에서 같은 방 코드로 들어오세요. 이름과 얼굴을 고르면 휴대폰이 내 컨트롤러가 됩니다.",
    ),
  );
  const choices = node("div", "roomChoices", "room-choices"),
    create = node("button", "createRoom", "room-choice"),
    join = node("button", "showJoinRoom", "room-choice");
  create.append(
    el("strong", "", "큰 화면에서 방 만들기"),
    el(
      "small",
      "",
      "진행자가 게임·맵을 고르고, 입장한 사람들의 플레이를 한 화면에서 보여줍니다.",
    ),
  );
  join.append(
    el("strong", "", "휴대폰으로 방 입장"),
    el(
      "small",
      "",
      "방 코드 입력 → 내 얼굴 선택 → 준비 완료. 계정이나 앱 설치 없이 참여합니다.",
    ),
  );
  choices.append(create, join);
  card.append(choices);
  const status = node("p", "roomStatus", "room-status");
  status.setAttribute("role", "status");
  card.append(status);
  const hostPanel = node("section", "roomHostPanel");
  hostPanel.hidden = true;
  hostPanel.append(
    el("small", "eyebrow", "YOUR ROOM CODE"),
    node("div", "roomCode", "room-code"),
  );
  const linkRow = node("div", null, "room-link"),
    invite = node("input", "roomInvite");
  invite.readOnly = true;
  invite.setAttribute("aria-label", "방 초대 링크");
  linkRow.append(
    invite,
    node("button", "copyRoomLink", "secondary", "초대 링크 복사"),
    node("button", "shareRoomLink", "secondary", "공유"),
  );
  hostPanel.append(
    linkRow,
    node("p", "hostRoomCount", "room-intro"),
    node("div", "roomLobbyMembers", "room-members"),
    el(
      "p",
      "room-notice",
      "입장한 사람들이 준비 완료를 누르면 참여 명단에 들어갑니다. 이 큰 화면은 게임이 끝날 때까지 켜 두세요. 게임 중에도 링크로 입장할 수 있으며, 새 참가자는 다음 판부터 참여합니다.",
    ),
  );
  const hostButtons = node("div", null, "room-host-controls");
  hostButtons.append(
    node("button", "roomChooseGame", "primary", "게임·맵 고르기 ↗"),
    node("button", "endRoom", "secondary", "방 닫기"),
  );
  hostPanel.append(hostButtons);
  card.append(hostPanel);
  const joinPanel = node("section", "roomJoinPanel");
  joinPanel.hidden = true;
  const joinRow = node("div", null, "room-join"),
    codeInput = node("input", "roomCodeInput");
  codeInput.placeholder = "8자리 방 코드";
  codeInput.maxLength = 8;
  codeInput.autocomplete = "off";
  codeInput.setAttribute("aria-label", "방 코드");
  joinRow.append(codeInput);
  joinPanel.append(
    joinRow,
    el("p", "room-intro", "본인의 이름과 얼굴을 골라주세요."),
    node("div", "roomIdentityPicker", "room-members"),
    node("button", "joinRoom", "primary", "이 얼굴로 입장 ↗"),
  );
  card.append(joinPanel);
  modal.append(card);
  document.body.append(modal);
  const bar = node("section", "roomHostBar", "room-host-bar");
  bar.hidden = true;
  const barText = node("div");
  barText.append(node("b", "roomBarTitle"), node("small", "roomBarHint"));
  bar.append(
    barText,
    node("button", "showRoomLobby", "secondary", "초대 · 입장 현황"),
  );
  $("gamesTab").prepend(bar);
  const controller = node("section", "roomController", "controller");
  controller.hidden = true;
  controller.setAttribute("aria-label", "내 게임 컨트롤러");
  const head = node("header", null, "controller-head"),
    who = node("div", "controllerIdentity"),
    headText = node("div");
  headText.append(
    node("strong", "controllerName"),
    node("small", "controllerRoom"),
  );
  head.append(
    who,
    headText,
    node("button", "leaveRoom", "secondary", "나가기"),
  );
  controller.append(
    head,
    node("h2", "controllerGame", null, "방에 입장하는 중…"),
    node("p", "controllerStatus", "controller-status"),
  );
  const live = node("div", "controllerLive", "controller-live"),
    liveCanvas = node("canvas", "controllerCanvas");
  liveCanvas.width = 1200;
  liveCanvas.height = 720;
  live.append(liveCanvas, node("span", "controllerPhase"));
  controller.append(live, node("div", "controllerSelf", "controller-self"));
  const steering = node("div", "controllerSteer", "controller-steer");
  [
    ["left", "←"],
    ["up", "↑"],
    ["down", "↓"],
    ["right", "→"],
  ].forEach(([direction, label]) => {
    const b = node("button", null, null, label);
    b.dataset.direction = direction;
    b.setAttribute(
      "aria-label",
      { left: "왼쪽", right: "오른쪽", up: "위", down: "아래" }[direction],
    );
    steering.append(b);
  });
  controller.append(
    steering,
    node("div", "controllerPlates", "controller-plates"),
    node("button", "controllerAction", "controller-action", "연결하는 중…"),
    node("p", "controllerNote", "controller-note"),
    node("div", "controllerPicks", "controller-picks"),
    node(
      "button",
      "controllerReady",
      "primary controller-ready",
      "준비 완료 ↗",
    ),
    node("button", "rejoinRoom", "secondary", "다시 연결"),
  );
  document.body.append(controller);
  $("rejoinRoom").hidden = true;
  function report(message, error = false) {
    status.textContent = message;
    status.classList.toggle("error", error);
    if (role === "client") $("controllerStatus").textContent = message;
  }
  function roomCode() {
    let value = "";
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    for (const b of bytes) value += alphabet[b % 32];
    return value;
  }
  function validCode(value) {
    return /^[A-HJ-NP-Z2-9]{8}$/.test(value);
  }
  function invitation() {
    const url = new URL(location.href);
    url.search = "";
    url.hash = "";
    url.searchParams.set("room", code);
    return url.href;
  }
  function send(conn, message) {
    if (!conn?.open) return false;
    try {
      if ((conn.dataChannel?.bufferedAmount || 0) > 65536) return false;
      conn.send(message);
      return true;
    } catch {
      return false;
    }
  }
  function sendHost(message) {
    return send(hostConnection, { v: 1, ...message });
  }
  function selectedClients() {
    return [...clients.values()].filter(
      (c) =>
        c.conn.open && c.ready && !settings.excluded.includes(c.member.name),
    );
  }
  function renderLobby() {
    if (role !== "host") return;
    $("roomCode").textContent = code;
    $("roomInvite").value = invitation();
    $("roomLobbyMembers").replaceChildren();
    document
      .querySelectorAll(".game-links>span:first-child")
      .forEach((s) => (s.textContent = "각자 휴대폰 조작 · 함께 플레이"));
    const connected = [...clients.values()].filter((c) => c.conn.open);
    for (const c of connected) {
      const entry = el("div", "room-member");
      entry.append(
        portrait(c.member),
        el("span", "room-member-name", c.member.name),
        el(
          "small",
          "",
          settings.excluded.includes(c.member.name)
            ? "이번 판 제외"
            : c.ready
              ? "준비 완료"
              : "준비 중",
        ),
      );
      $("roomLobbyMembers").append(entry);
    }
    $("hostRoomCount").textContent =
      connected.length +
      "명 입장 · " +
      selectedClients().length +
      "명 준비 완료 · 최대 " +
      MEMBERS.length +
      "명";
    $("roomBarTitle").textContent = "함께 플레이 · " + code;
    $("roomBarHint").textContent =
      selectedClients().length +
      "명 준비 완료 / " +
      connected.length +
      "명 입장 · 3명부터 시작";
    prior.renderMembers();
    publish();
  }
  function lobbyMessage() {
    return {
      type: "lobby",
      v: 1,
      code,
      game: run?.g.id || settings.selected,
      playing: !!run && !run.ended,
      members: [...clients.values()]
        .filter((c) => c.conn.open)
        .map((c) => ({
          id: c.member.id,
          name: c.member.name,
          ready: c.ready,
          excluded: settings.excluded.includes(c.member.name),
        })),
    };
  }
  function publish() {
    if (role === "host") {
      const data = lobbyMessage();
      for (const c of clients.values()) send(c.conn, data);
    }
  }
  function pack(r) {
    const refs = new Set(r.actors);
    function encode(value) {
      if (refs.has(value)) return { $actor: value.id };
      if (value instanceof Set) return { $set: [...value].map(encode) };
      if (Array.isArray(value)) return value.map(encode);
      if (value && typeof value === "object") {
        const out = {};
        for (const [key, v] of Object.entries(value))
          if (key !== "photo") out[key] = encode(v);
        return out;
      }
      return typeof value === "number"
        ? Math.round(value * 1000) / 1000
        : value;
    }
    const state = {};
    for (const [key, value] of Object.entries(r)) {
      if (key === "actors" || key === "g" || key === "roomInputs") continue;
      state[key] = encode(key === "particles" ? value.slice(-35) : value);
    }
    return {
      type: "snapshot",
      v: 1,
      epoch: r.roomEpoch,
      game: r.g.id,
      actors: r.actors.map((a) => ({ ...a, photo: undefined })),
      state,
      duties: settings.duties.slice(),
    };
  }
  function unpack(message) {
    const game = GAMES.find((g) => g.id === message.game);
    if (
      !game ||
      !Array.isArray(message.actors) ||
      message.actors.length > MEMBERS.length
    )
      return null;
    const actors = message.actors.map((a) => {
      const member = MEMBERS.find((m) => m.id === a.id);
      return member ? { ...a, ...member } : null;
    });
    if (actors.some((a) => !a)) return null;
    const refs = new Map(actors.map((a) => [a.id, a]));
    function decode(v) {
      if (v && typeof v === "object") {
        if (v.$actor) return refs.get(v.$actor);
        if (v.$set) return new Set(v.$set.map(decode));
        if (Array.isArray(v)) return v.map(decode);
        const out = {};
        for (const [k, x] of Object.entries(v))
          if (k !== "__proto__" && k !== "constructor") out[k] = decode(x);
        return out;
      }
      return v;
    }
    const state = decode(message.state);
    return {
      ...state,
      actors,
      g: { ...game, color: state.map?.color || game.color },
    };
  }
  function snapshot() {
    if (role !== "host" || !run) return;
    const packet = pack(run);
    for (const c of clients.values()) send(c.conn, packet);
  }
  function newPeer(id) {
    if (typeof Peer !== "function")
      throw Error("연결 프로그램을 불러오지 못했어요. 새로고침해주세요.");
    return new Peer(id, { debug: 0 });
  }
  function peerError(error) {
    const messages = {
      "peer-unavailable":
        "방을 찾지 못했어요. 진행자 화면이 켜져 있는지, 방 코드가 맞는지 확인해주세요.",
      network:
        "연결 서버에 접속하지 못했어요. 인터넷 연결을 확인하고 다시 시도해주세요.",
      "unavailable-id": "방 코드가 겹쳤어요. 다시 방을 만들어주세요.",
      "browser-incompatible":
        "이 브라우저에서는 연결을 지원하지 않아요. Chrome 또는 Safari로 열어주세요.",
    };
    report(
      messages[error.type] ||
        "연결이 끊겼어요. 같은 방 코드로 다시 연결해주세요.",
      true,
    );
    if (role === "client") $("rejoinRoom").hidden = false;
  }
  function createRoom() {
    if (location.protocol === "file:")
      return report(
        "휴대폰 함께 플레이는 온라인 사이트 https://kts6450.github.io/lab-toto/ 에서 방을 만들어주세요.",
      );
    if (role === "client") return;
    shutdown(false);
    closed = false;
    role = "host";
    code = roomCode();
    phase = "connecting";
    $("roomHostPanel").hidden = false;
    $("roomJoinPanel").hidden = true;
    choices.hidden = true;
    report("방을 만드는 중…");
    try {
      peer = newPeer(prefix + code);
      peer.on("open", () => {
        phase = "lobby";
        bar.hidden = false;
        report("방이 열렸어요. 링크나 방 코드를 공유해주세요.");
        renderLobby();
      });
      peer.on("connection", accept);
      peer.on("error", peerError);
      peer.on("disconnected", () => {
        report("초대 연결이 끊겼어요. 재연결 중…");
        if (!closed)
          try {
            peer.reconnect();
          } catch {}
      });
      peer.on("close", () => {
        if (!closed)
          report("방 연결이 닫혔어요. 방을 다시 만들어주세요.", true);
      });
    } catch (e) {
      report(e.message, true);
    }
  }
  function accept(conn) {
    if (role !== "host") {
      conn.close();
      return;
    }
    let member = null;
    const timer = setTimeout(() => conn.close(), 10000);
    conn.on("data", (data) => {
      if (!data || typeof data !== "object" || data.v !== 1) return;
      if (data.type === "hello") {
        if (member) return;
        const requested = MEMBERS.find((m) => m.id === data.member);
        if (
          !requested ||
          typeof data.token !== "string" ||
          data.token.length > 64
        ) {
          conn.close();
          return;
        }
        const old = clients.get(requested.id);
        if (old?.conn.open && old.token !== data.token) {
          send(conn, {
            type: "rejected",
            v: 1,
            message:
              "이미 이 이름으로 참여 중인 사람이 있어요. 나가기를 누른 뒤 본인의 얼굴을 골라주세요.",
          });
          setTimeout(() => conn.close(), 250);
          return;
        }
        clearTimeout(timer);
        if (old) {
          clients.delete(requested.id);
          old.conn.close();
        }
        member = requested;
        clients.set(member.id, {
          member,
          conn,
          token: data.token,
          ready: old?.ready || false,
          lastAction: 0,
          lastInput: 0,
        });
        send(conn, { type: "welcome", v: 1, code, member: member.id });
        renderLobby();
        if (run) snapshot();
        return;
      }
      if (!member || clients.get(member.id)?.conn !== conn) return;
      const c = clients.get(member.id);
      if (data.type === "ready") {
        c.ready = data.value === true;
        renderLobby();
        return;
      }
      if (data.type === "input") {
        if (performance.now() - c.lastInput < 35) return;
        c.lastInput = performance.now();
        const x = Number(data.x),
          y = Number(data.y);
        if (!Number.isFinite(x) || !Number.isFinite(y)) return;
        const oldInput = inputs.get(member.id);
        inputs.set(member.id, {
          x: Math.max(-1, Math.min(1, x)),
          y: Math.max(-1, Math.min(1, y)),
          aimX: x || oldInput?.aimX || 0,
          aimY: y || oldInput?.aimY || 0,
          at: performance.now(),
        });
        return;
      }
      if (data.type === "action") {
        perform(c, data);
      }
    });
    conn.on("close", () => {
      clearTimeout(timer);
      if (member && clients.get(member.id)?.conn === conn) {
        clients.delete(member.id);
        inputs.delete(member.id);
        renderLobby();
      }
    });
    conn.on("error", () => conn.close());
  }
  function showJoin() {
    if (role === "host") return report("방을 닫은 뒤 다른 방에 입장해주세요.");
    choices.hidden = true;
    hostPanel.hidden = true;
    joinPanel.hidden = false;
    renderIdentity();
    codeInput.focus();
  }
  function renderIdentity() {
    const root = $("roomIdentityPicker");
    root.replaceChildren();
    for (const m of MEMBERS) {
      const b = el(
        "button",
        "room-member" + (selectedIdentity === m.id ? " selected" : ""),
      );
      b.dataset.member = m.id;
      b.append(portrait(m), el("span", "room-member-name", m.name));
      b.setAttribute("aria-pressed", String(selectedIdentity === m.id));
      b.onclick = () => {
        selectedIdentity = m.id;
        renderIdentity();
      };
      root.append(b);
    }
  }
  function joinRoom() {
    if (location.protocol === "file:")
      return report(
        "방 입장은 온라인 사이트 https://kts6450.github.io/lab-toto/ 에서 해주세요.",
      );
    const next = codeInput.value.trim().toUpperCase().replace(/[\s-]/g, "");
    if (!validCode(next)) return report("8자리 방 코드를 확인해주세요.", true);
    identity = MEMBERS.find((m) => m.id === selectedIdentity);
    if (!identity) return report("본인의 이름과 얼굴을 골라주세요.", true);
    if (role === "host") return;
    disconnectClient();
    closed = false;
    role = "client";
    phase = "connecting";
    code = next;
    controller.hidden = false;
    modal.hidden = true;
    document.body.classList.add("remote-playing");
    $("hub").inert = true;
    $("launch").inert = true;
    $("controllerIdentity").replaceChildren(portrait(identity));
    $("controllerName").textContent = identity.name;
    $("controllerRoom").textContent = "ROOM " + code;
    report("방에 연결하는 중…");
    $("controllerReady").hidden = true;
    $("controllerAction").disabled = true;
    $("controllerLive").hidden = true;
    $("controllerSteer").hidden = true;
    $("controllerPlates").hidden = true;
    $("rejoinRoom").hidden = true;
    try {
      peer = newPeer();
      peer.on("open", () => {
        hostConnection = peer.connect(prefix + code, {
          serialization: "json",
          reliable: true,
        });
        hostConnection.on("open", () => {
          sendHost({ type: "hello", member: identity.id, token });
        });
        hostConnection.on("data", receive);
        hostConnection.on("close", () => {
          if (!closed && phase !== "rejected") clientDisconnected();
        });
        hostConnection.on("error", peerError);
      });
      peer.on("error", peerError);
      peer.on("disconnected", () => {
        if (!closed)
          try {
            peer.reconnect();
          } catch {}
      });
      connectionTimer = setTimeout(() => {
        if (phase === "connecting") {
          report(
            "방 연결에 시간이 걸리고 있어요. 진행자 화면과 같은 Wi-Fi에서 다시 시도해주세요.",
            true,
          );
          $("rejoinRoom").hidden = false;
        }
      }, 15000);
    } catch (e) {
      report(e.message, true);
    }
  }
  function receive(data) {
    if (!data || typeof data !== "object" || data.v !== 1) return;
    if (data.type === "rejected") {
      phase = "rejected";
      report(data.message, true);
      $("rejoinRoom").hidden = false;
      return;
    }
    if (data.type === "welcome") {
      clearTimeout(connectionTimer);
      phase = "lobby";
      $("controllerReady").hidden = false;
      report("입장했어요! 준비 완료를 눌러주세요.");
      return;
    }
    if (data.type === "closed") {
      closed = true;
      clientDisconnected("진행자가 방을 닫았어요.");
      return;
    }
    if (data.type === "lobby") {
      lobby = data;
      const self = data.members.find((m) => m.id === identity.id);
      ready = self?.ready || false;
      $("controllerReady").textContent = ready ? "준비 취소" : "준비 완료 ↗";
      if (!data.playing) {
        remote = null;
        phase = "lobby";
        $("controllerLive").hidden = true;
        $("controllerReady").hidden = false;
        $("controllerAction").disabled = true;
        $("controllerAction").textContent =
          "진행자가 게임을 시작하면 조작할 수 있어요";
        $("controllerGame").textContent =
          "우리 방 · " + data.members.length + "명 입장";
        $("controllerStatus").textContent = self?.excluded
          ? "진행자가 이번 판에서 제외했어요."
          : ready
            ? "준비 완료! 진행자가 게임을 고르면 시작됩니다."
            : "준비 완료를 눌러주세요.";
        $("controllerSelf").replaceChildren();
        $("controllerPlates").hidden = true;
        $("controllerSteer").hidden = true;
      }
      return;
    }
    if (data.type === "snapshot") {
      const next = unpack(data);
      if (!next) return;
      remote = next;
      roomEpoch = data.epoch;
      lastSnapshot = performance.now();
      if (Array.isArray(data.duties) && data.duties.length === 3)
        settings.duties = data.duties;
      phase = next.ended ? "result" : "playing";
      $("controllerReady").hidden = true;
      $("controllerLive").hidden = false;
      renderController();
      if (!clientFrame) clientFrame = requestAnimationFrame(renderRemote);
      return;
    }
  }
  let remoteDrawAt = 0;
  function renderRemote(now) {
    clientFrame = 0;
    if (role !== "client" || !remote || controller.hidden) return;
    if (now - remoteDrawAt < 40) {
      clientFrame = requestAnimationFrame(renderRemote);
      return;
    }
    remoteDrawAt = now;
    const c = liveCanvas.getContext("2d");
    c.setTransform(1, 0, 0, 1, 0, 0);
    draw(remote, c);
    clientFrame = requestAnimationFrame(renderRemote);
  }
  function turnActor(r) {
    return r.g.id === "rhythm" ? r.target : currentActor(r);
  }
  function isTurn(r, a) {
    return turnActor(r)?.id === a.id;
  }
  function eligible(r, a) {
    if (
      !a ||
      a.picked ||
      r.ended ||
      r.paused ||
      r.countdown > 0 ||
      r.picks.length >= 3
    )
      return false;
    if (["balloon", "press", "sushi", "ladder", "rhythm"].includes(r.g.id))
      return (
        isTurn(r, a) && (r.g.id === "rhythm" ? !r.hit : r.phase === "idle")
      );
    if (r.g.id === "wheel") return r.phase === "spinning";
    if (r.g.id === "bomb") return r.holder?.id === a.id && !r.throwing;
    return true;
  }
  const controls = {
    pinball: [
      "내 공 튕기기!",
      "화살표로 내 공을 밀고, 버튼으로 위로 튕깁니다.",
    ],
    horse: ["내 말 부스터!", "내 말에만 부스터를 씁니다. 재충전은 4초입니다."],
    redlight: [
      "달리기 / 멈추기",
      "↑를 누르는 동안 달립니다. 빨간불이 켜지면 손을 떼세요! 결승 45초 후에는 누적 주행거리 하위 참가자가 선정됩니다.",
    ],
    balloon: [
      "내 차례 · 펌프질!",
      "내 차례에만 펌프질합니다. 터뜨리면 내 위험도가 올라갑니다.",
    ],
    press: [
      "내 차례 · 레버 당기기!",
      "내 차례에만 레버를 당깁니다. 압력에 주의하세요.",
    ],
    sushi: [
      "랜덤 접시 고르기",
      "내 차례에는 아래 접시를 직접 고를 수 있습니다.",
    ],
    ladder: [
      "내 튜브 출발!",
      "내 차례에 출발합니다. 진행자도 출발시킬 수 있습니다.",
    ],
    wheel: [
      "원판 급브레이크!",
      "모두 브레이크에 참여합니다. 원판 시작은 진행자가 합니다.",
    ],
    bullets: [
      "내 방어막!",
      "화살표로 내 얼굴을 움직입니다. 방어막은 내 캐릭터에만 2초 적용됩니다.",
    ],
    rhythm: ["내 박자 · 지금!", "내 차례의 박자를 보고 버튼을 누르세요."],
    lava: [
      "내 발판 점프!",
      "화살표로 방향을 고르고 버튼으로 안전한 발판을 찾아 점프합니다.",
    ],
    vortex: [
      "내 중력 반전!",
      "내 캐릭터만 블랙홀에서 밀어냅니다. 화살표로 궤도에 개입하세요.",
    ],
    bomb: ["폭탄 패스!", "내가 폭탄을 들고 있을 때만 패스할 수 있습니다."],
    curling: [
      "내 퍽 부스트!",
      "화살표로 부스트 방향을 고른 뒤 버튼을 누르세요.",
    ],
    coaster: [
      "내 서킷브레이커!",
      "내 가상 가격에만 3초 동안 급락 방어를 적용합니다.",
    ],
  };
  function renderController() {
    const r = remote;
    if (!r) return;
    const a = r.actors.find((a) => a.id === identity.id),
      can = eligible(r, a),
      now = Math.floor(r.age || 0),
      remaining = a ? Math.max(0, (a.roomCooldown || 0) - r.time) : 0;
    $("controllerGame").textContent = r.g.icon + " " + r.g.name;
    $("controllerPhase").textContent =
      (r.battlePhase === "final" ? "FINAL" : "QUALIFIER") +
      " · " +
      String(Math.floor(now / 60)).padStart(2, "0") +
      ":" +
      String(now % 60).padStart(2, "0") +
      " · " +
      r.map.name;
    $("controllerNote").textContent = controls[r.g.id][1];
    const target = turnActor(r);
    $("controllerStatus").textContent = r.ended
      ? "이번 판 결과가 나왔어요! 다음 게임은 진행자가 고릅니다."
      : r.paused
        ? "진행자가 잠깐 멈췄어요."
        : r.countdown > 0
          ? "곧 시작! 준비하세요."
          : !a
            ? "이번 판은 관전 중 · 다음 판부터 참여할 수 있어요."
            : a.picked
              ? "이번 판 담당 확정! 남은 사람들의 결과를 지켜보세요."
              : ["balloon", "press", "sushi", "ladder", "rhythm"].includes(
                    r.g.id,
                  )
                ? isTurn(r, a)
                  ? "지금 내 차례!"
                  : (target?.name || "다음 참가자") + " 차례를 기다리는 중…"
                : r.g.id === "bomb"
                  ? r.holder?.id === a.id
                    ? "내가 폭탄을 들고 있어요! 빨리 패스!"
                    : (r.holder?.name || "누군가") + "에게 폭탄이 있어요."
                  : r.announcement;
    $("controllerAction").disabled = !can || remaining > 0;
    $("controllerAction").textContent =
      !a || a.picked
        ? "지켜보는 중…"
        : remaining > 0
          ? "재충전 " + Math.ceil(remaining) + "초"
          : controls[r.g.id][0];
    $("controllerSelf").replaceChildren();
    if (a) {
      $("controllerSelf").append(
        el("span", "", "위험도 " + a.risk),
        el(
          "span",
          "",
          r.battlePhase === "final" ? "목숨 " + a.life : "예선 · 재투입 가능",
        ),
      );
      if (r.g.id === "coaster")
        $("controllerSelf").append(
          el("span", "", "내 가격 " + a.price.toFixed(1)),
        );
    }
    $("controllerSteer").hidden =
      !a ||
      a.picked ||
      !["pinball", "redlight", "bullets", "lava", "vortex", "curling"].includes(
        r.g.id,
      );
    $("controllerPlates").hidden = r.g.id !== "sushi" || !a;
    const plates = $("controllerPlates");
    if (r.g.id === "sushi") {
      const signature =
        r.plates.map((p) => (p.open ? 1 : 0)).join("") + ":" + can;
      if (plates.dataset.signature !== signature) {
        plates.dataset.signature = signature;
        plates.replaceChildren();
        r.plates.forEach((p) => {
          const b = el("button", "", p.open ? "✓" : "🍣 " + (p.i + 1));
          b.disabled = !can || p.open;
          b.dataset.plate = p.i;
          b.onclick = () =>
            sendHost({
              type: "action",
              epoch: roomEpoch,
              game: r.g.id,
              plate: p.i,
            });
          plates.append(b);
        });
      }
    }
    const pickSignature =
      r.g.id +
      ":" +
      settings.duties.join("|") +
      ":" +
      r.picks.map((p) => p.id).join(",");
    if ($("controllerPicks").dataset.signature === pickSignature) return;
    $("controllerPicks").dataset.signature = pickSignature;
    $("controllerPicks").replaceChildren();
    settings.duties.forEach((d, i) => {
      const p = r.picks[i],
        box = el("div", "controller-pick");
      box.append(el("small", "", d));
      if (p) box.append(portrait(p));
      box.append(el("strong", "", p?.name || "아직은 비밀"));
      $("controllerPicks").append(box);
    });
  }
  function clientDisconnected(message) {
    phase = "disconnected";
    clearInterval(inputTick);
    inputTick = null;
    inputDirection = { x: 0, y: 0 };
    $("controllerAction").disabled = true;
    $("controllerReady").hidden = true;
    $("rejoinRoom").hidden = false;
    report(
      message || "진행자와 연결이 끊겼어요. 같은 방으로 다시 연결해주세요.",
      true,
    );
  }
  function disconnectClient() {
    closed = true;
    clearTimeout(connectionTimer);
    clearTimeout(reconnectTimer);
    clearInterval(inputTick);
    inputTick = null;
    cancelAnimationFrame(clientFrame);
    clientFrame = 0;
    hostConnection?.close();
    hostConnection = null;
    peer?.destroy();
    peer = null;
    remote = null;
    lobby = null;
    inputDirection = { x: 0, y: 0 };
  }
  function shutdown(show = true) {
    closed = true;
    if (role === "host") {
      for (const c of clients.values()) {
        send(c.conn, { type: "closed", v: 1 });
        c.conn.close();
      }
      clients.clear();
      inputs.clear();
      peer?.destroy();
      peer = null;
      if (run) prior.backHome();
    } else disconnectClient();
    role = null;
    code = "";
    phase = "idle";
    document
      .querySelectorAll(".game-links>span:first-child")
      .forEach((s) => (s.textContent = "한 명 조작 · 모두 관전"));
    bar.hidden = true;
    controller.hidden = true;
    document.body.classList.remove("remote-playing");
    $("hub").inert = false;
    $("launch").inert = false;
    choices.hidden = false;
    hostPanel.hidden = true;
    joinPanel.hidden = true;
    prior.renderMembers();
    if (show) {
      report("방을 닫았어요.");
      modal.hidden = false;
    }
  }
  function perform(client, data) {
    const r = run,
      a = r?.actors.find((a) => a.id === client.member.id);
    if (
      role !== "host" ||
      !r ||
      data.epoch !== r.roomEpoch ||
      data.game !== r.g.id ||
      !eligible(r, a)
    )
      return;
    if (
      performance.now() - client.lastAction < 120 ||
      r.time < (a.roomCooldown || 0)
    )
      return;
    client.lastAction = performance.now();
    const held = inputs.get(a.id);
    const direction = {
      x: held?.aimX || held?.x || 0,
      y: held?.aimY || held?.y || 0,
    };
    const id = r.g.id;
    if (["balloon", "press", "ladder", "rhythm"].includes(id)) action();
    else if (id === "sushi") {
      if (
        Number.isInteger(data.plate) &&
        data.plate >= 0 &&
        data.plate < r.plates.length
      )
        chooseSushi(data.plate);
      else action();
    } else if (id === "pinball") {
      a.vy -= 160;
      a.vx += (direction.x || rng() - 0.5) * 200;
      a.roomCooldown = r.time + 1.2;
    } else if (id === "horse") {
      a.boost = 1.2;
      a.stun = 0;
      a.roomCooldown = r.time + 4;
    } else if (id === "redlight") {
      const moving = inputs.get(a.id)?.y < 0;
      inputs.set(a.id, {
        x: 0,
        y: moving ? 0 : -1,
        at: performance.now(),
        latched: true,
      });
    } else if (id === "wheel") {
      if (r.phase === "spinning") {
        r.omega *= 0.7;
        a.roomCooldown = r.time + 1.8;
      }
    } else if (id === "bullets") {
      a.roomShieldUntil = r.time + 2.2;
      a.roomCooldown = r.time + 8;
    } else if (id === "lava") {
      const safe = r.tiles.filter((t) => t.solid && !t.warn && t.i !== a.tile);
      if (safe.length) {
        const dx = direction.x,
          dy = direction.y;
        safe.sort((t, u) => {
          function distance(p) {
            const x = p.x - a.x,
              y = p.y - a.y,
              d = Math.hypot(x, y);
            return d - (dx * x + dy * y) * 0.7;
          }
          return distance(t) - distance(u);
        });
        const tile = safe[0];
        a.tile = tile.i;
        a.x = tile.x;
        a.y = tile.y;
        a.roomCooldown = r.time + 1.3;
      }
    } else if (id === "vortex") {
      const h = holes(r)
          .slice()
          .sort(
            (p, q) =>
              Math.hypot(a.x - p.x, a.y - p.y) -
              Math.hypot(a.x - q.x, a.y - q.y),
          )[0],
        dx = a.x - h.x,
        dy = a.y - h.y,
        d = Math.max(1, Math.hypot(dx, dy));
      a.vx += (dx / d) * 270;
      a.vy += (dy / d) * 210;
      a.roomCooldown = r.time + 6;
    } else if (id === "bomb") action();
    else if (id === "curling") {
      a.vx += (direction.x || rng() - 0.5) * 400;
      a.vy += (direction.y || rng() - 0.5) * 320;
      a.roomCooldown = r.time + 3;
    } else if (id === "coaster") {
      a.roomHedgeUntil = r.time + 3.5;
      a.roomCooldown = r.time + 12;
    }
    snapshot();
  }
  activeMembers = function () {
    return role === "host"
      ? selectedClients().map((c) => c.member)
      : prior.activeMembers();
  };
  renderMembers = function () {
    prior.renderMembers();
    if (role === "host") publish();
  };
  startGame = function () {
    if (role === "client") return;
    if (role === "host" && selectedClients().length < 3)
      return toast("입장 후 준비 완료한 사람이 3명 이상 필요해요.");
    prior.startGame();
    if (role === "host" && run) {
      run.roomEpoch = ++roomEpoch;
      run.roomInputs = true;
      inputs.clear();
      run.actors.forEach((a) => {
        a.roomCooldown = 0;
        a.roomShieldUntil = 0;
        a.roomHedgeUntil = 0;
        a.roomMoving = false;
        a.roomDistance = 0;
      });
      publish();
      snapshot();
    }
  };
  toggleRed = function (r) {
    prior.toggleRed(r);
    if (r.roomInputs && r.light === "red")
      r.actors.forEach((a) => {
        a.reaction = 0;
      });
  };
  update = function (r, dt) {
    if (!r.roomInputs) return prior.update(r, dt);
    const id = r.g.id,
      auto = r.auto;
    r.auto = ["redlight", "wheel"].includes(id);
    const beforePositions =
      id === "redlight" ? new Map(r.actors.map((a) => [a.id, a.x])) : null;
    let defended = false;
    for (const a of r.actors.filter((a) => !a.picked)) {
      const i = inputs.get(a.id),
        fresh = i && (i.latched || performance.now() - i.at < 450),
        x = fresh ? i.x : 0,
        y = fresh ? i.y : 0;
      if (id === "pinball") a.vx += x * 220 * dt;
      else if (id === "bullets") {
        a.vx = x * 200;
        a.vy = y * 200;
      } else if (id === "vortex") {
        a.vx += x * 100 * dt;
        a.vy += y * 100 * dt;
      } else if (id === "redlight") {
        a.roomMoving = y < 0;
        a.speed = a.roomMoving ? 62 : 0;
        if (r.light === "red")
          a.reaction = a.roomMoving
            ? 1
            : Math.min(a.reaction || 0, r.time - r.redAt);
      }
      if (id === "bullets" && a.roomShieldUntil > r.time) defended = true;
    }
    if (defended) r.roomPersonalShields = true;
    prior.update(r, dt);
    r.auto = auto;
    if (beforePositions)
      r.actors.forEach(
        (a) =>
          (a.roomDistance =
            (a.roomDistance || 0) +
            Math.max(0, a.x - beforePositions.get(a.id))),
      );
    if (id === "redlight" && r.light === "red" && r.time - r.redAt > 0.41) {
      for (const a of r.actors.filter(
        (a) => !a.picked && !a.finished && a.roomMoving,
      )) {
        if (a.roomRedCaught !== r.redAt) {
          a.roomRedCaught = r.redAt;
          record(a);
        }
      }
    }
    if (
      id === "redlight" &&
      r.battlePhase === "final" &&
      r.age - r.finalAt >= 45 &&
      r.picks.length < 3 &&
      !r.roomRankingResolved
    ) {
      r.roomRankingResolved = true;
      announce("결승 종료! 누적 주행거리 하위 참가자 선정.");
      shuffle(alive(r))
        .sort((a, b) => (a.roomDistance || 0) - (b.roomDistance || 0))
        .slice(0, 3 - r.picks.length)
        .forEach((a) => {
          a.life = 1;
          a.lastDamage = -10;
          record(a);
        });
    }
  };
  renderControls = function () {
    prior.renderControls();
    $("autoBtn").disabled = !!run?.roomInputs;
    if (run?.roomInputs) $("autoBtn").textContent = "각자 휴대폰 조작";
  };
  backHome = function () {
    prior.backHome();
    if (role === "host") {
      publish();
      renderLobby();
    }
  };
  $("startBtn").onclick = () => startGame();
  $("backHome").onclick = () => backHome();
  $("roomBtn").onclick = () => openModal("roomModal");
  $("showRoomLobby").onclick = () => openModal("roomModal");
  $("closeRoomPanel").onclick = () => closeModal("roomModal");
  $("createRoom").onclick = createRoom;
  $("showJoinRoom").onclick = showJoin;
  $("joinRoom").onclick = joinRoom;
  $("endRoom").onclick = () => shutdown();
  $("roomChooseGame").onclick = () => {
    closeModal("roomModal");
    $("mapPicker").scrollIntoView({ behavior: "smooth" });
  };
  $("leaveRoom").onclick = () => {
    shutdown(false);
    modal.hidden = true;
  };
  $("rejoinRoom").onclick = () => {
    codeInput.value = code;
    selectedIdentity = identity?.id;
    joinRoom();
  };
  $("controllerReady").onclick = () =>
    sendHost({ type: "ready", value: !ready });
  $("controllerAction").onclick = () => {
    if (remote)
      sendHost({ type: "action", epoch: roomEpoch, game: remote.g.id });
  };
  $("copyRoomLink").onclick = async () => {
    try {
      await navigator.clipboard.writeText(invitation());
      toast("초대 링크를 복사했어요.");
    } catch {
      invite.select();
      document.execCommand("copy");
      toast("초대 링크를 선택했어요. 복사해서 보내주세요.");
    }
  };
  $("shareRoomLink").onclick = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "DNSLab PLAY · 같이 참여하기",
          text: "방 코드 " + code,
          url: invitation(),
        });
      } catch {}
    } else $("copyRoomLink").click();
  };
  const directions = new Map();
  function steer() {
    let x = 0,
      y = 0;
    for (const direction of directions.values()) {
      if (direction === "left") x--;
      if (direction === "right") x++;
      if (direction === "up") y--;
      if (direction === "down") y++;
    }
    inputDirection = {
      x: Math.max(-1, Math.min(1, x)),
      y: Math.max(-1, Math.min(1, y)),
    };
    sendHost({ type: "input", ...inputDirection });
    if (directions.size && !inputTick)
      inputTick = setInterval(
        () => sendHost({ type: "input", ...inputDirection }),
        90,
      );
    if (!directions.size) {
      clearInterval(inputTick);
      inputTick = null;
    }
  }
  steering.querySelectorAll("button").forEach((b) => {
    b.onpointerdown = (e) => {
      e.preventDefault();
      b.setPointerCapture(e.pointerId);
      directions.set(e.pointerId, b.dataset.direction);
      b.classList.add("held");
      steer();
    };
    function release(e) {
      directions.delete(e.pointerId);
      b.classList.remove("held");
      steer();
    }
    b.onpointerup = release;
    b.onpointercancel = release;
    b.onlostpointercapture = release;
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      directions.clear();
      steer();
    }
  });
  setInterval(() => {
    if (role === "host") {
      const now = performance.now();
      if (now - lastHostSnapshot >= (run?.g.id === "rhythm" ? 35 : 140)) {
        snapshot();
        lastHostSnapshot = now;
      }
      const current = run && turnActor(run),
        c = current && clients.get(current.id);
      if (
        run &&
        !run.paused &&
        !run.ended &&
        run.countdown <= 0 &&
        !c &&
        ["balloon", "press", "sushi", "ladder", "rhythm"].includes(run.g.id)
      )
        action();
    } else if (
      role === "client" &&
      phase === "playing" &&
      performance.now() - lastSnapshot > 12000
    ) {
      clientDisconnected(
        "경기 소식을 받지 못하고 있어요. 진행자가 일시정지했거나 연결이 끊겼을 수 있어요.",
      );
    }
  }, 35);
  const query = new URLSearchParams(location.search).get("room");
  if (query) {
    codeInput.value = query.trim().toUpperCase();
    showJoin();
    openModal("roomModal");
  }
  return {
    createRoom,
    joinRoom,
    shutdown,
    pack,
    unpack,
    perform,
    clients,
    inputs,
    snapshot,
    get role() {
      return role;
    },
    get code() {
      return code;
    },
    get remote() {
      return remote;
    },
    get peer() {
      return peer;
    },
    get phase() {
      return phase;
    },
  };
})();
