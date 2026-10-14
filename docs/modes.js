"use strict";
(() => {
  const prior = { renderLaunch, startGame, renderControls };
  window.appMode = "solo";
  let menu = "solo";
  function allowed() {
    return GAMES.filter((g) => !!g.multiplayer === (appMode === "party"));
  }
  renderGames = function () {
    const root = $("gameGrid");
    root.replaceChildren();
    allowed().forEach((g, i) => {
      const card = el("article", "game-card");
      card.dataset.game = g.id;
      const b = el("button", "game-choose"),
        c = el("canvas");
      c.width = 600;
      c.height = 360;
      c.setAttribute("aria-hidden", "true");
      const content = el("div", "game-text"),
        h = el("h3");
      h.append(
        el("span", "", g.name),
        el("small", "", String(i + 1).padStart(2, "0")),
      );
      content.append(
        h,
        el("p", "", g.desc.replace(/3명/g, "선택한 담당 수만큼")),
        el("span", "game-tag", g.tag + " · 맵 3개"),
      );
      b.append(c, content);
      b.onclick = () => selectGame(g.id);
      b.setAttribute("aria-label", g.name + " 선택");
      const links = el("div", "game-links");
      links.append(
        el(
          "span",
          "",
          g.multiplayer
            ? "전원 직접 조작 · 실시간 대결"
            : "한 명 진행 · 관전 추첨",
        ),
      );
      if (g.path) {
        const link = el("a", "", "원본 ↗");
        link.href = "https://game.binaryworld.kr/" + g.path;
        link.target = "_blank";
        link.rel = "noopener";
        links.append(link);
      } else links.append(el("span", "original-label", "LAB ORIGINAL"));
      card.append(b, links, el("span", "selected-badge", "✓"));
      root.append(card);
    });
    selectGame(settings.selected);
    drawPreviews();
  };
  function preview(g, m, c) {
    const previous = settings.mapChoices[g.id];
    settings.mapChoices[g.id] = m.id;
    const r = createRun(g, MEMBERS.slice(0, 9));
    settings.mapChoices[g.id] = previous;
    r.time = 5;
    if (g.id === "horse")
      r.actors.forEach((a, i) => (a.progress = 0.07 + i * 0.09));
    if (g.id === "redlight") r.actors.forEach((a, i) => (a.x = 200 + i * 70));
    if (g.id === "paint")
      r.paint = r.paint.map((id, i) =>
        i % 4 === 0 ? r.actors[i % r.actors.length].id : null,
      );
    if (g.id === "laser" && r.map.hazard === "shots")
      r.hazards = Array.from({ length: 12 }, (_, i) => ({
        x: 150 + i * 80,
        y: 230 + (i % 3) * 120,
        vx: 80,
        vy: 120,
      }));
    const context = c.getContext("2d");
    context.setTransform(c.width / 1200, 0, 0, c.height / 720, 0, 0);
    draw(r, context, true);
  }
  renderMapOptions = function () {
    const g = GAMES.find((g) => g.id === settings.selected),
      maps = GAME_MAPS[g.id],
      selected = chosenMap(g);
    $("mapHeading").textContent = g.name + " · 지형과 규칙 선택";
    $("mapOptions").replaceChildren();
    maps.forEach((m) => {
      const b = el(
          "button",
          "map-option" + (m.id === selected.id ? " active" : ""),
        ),
        c = el("canvas");
      c.width = 480;
      c.height = 288;
      c.setAttribute("aria-hidden", "true");
      b.style.setProperty("--map-color", m.color);
      b.dataset.map = m.id;
      b.setAttribute("aria-pressed", String(m.id === selected.id));
      b.append(
        c,
        el("strong", "", m.name),
        el("small", "", m.subtitle),
        el(
          "span",
          "map-difference",
          m.shape
            ? "지형: " +
                {
                  disc: "원형",
                  maze: "미로",
                  bridges: "섬과 교량",
                  yard: "사각 필드",
                }[m.shape]
            : "미리보기를 눌러 이 경기장으로 변경",
        ),
      );
      b.onclick = () => {
        settings.mapChoices[g.id] = m.id;
        save();
        renderLaunch();
        drawPreviews();
      };
      $("mapOptions").append(b);
      preview(g, m, c);
    });
  };
  renderLaunch = function () {
    const g = GAMES.find((g) => g.id === settings.selected);
    if (!g) return;
    prior.renderLaunch();
    const members = activeMembers().length,
      need = Math.max(appMode === "party" ? 2 : 1, settings.duties.length),
      host = LAB_ROOMS.role === "host";
    $("launchTitle").textContent = g.name;
    $("launchHint").textContent =
      (g.multiplayer
        ? "직접 대결 " + settings.length + "초"
        : "관전 추첨 · 예선 " + settings.length + "초+") +
      " · " +
      chosenMap(g).name +
      " · 담당 " +
      settings.duties.length +
      "개";
    $("startBtn").textContent =
      g.multiplayer && !host ? "대결 방 만들기 ↗" : "게임 시작 ↗";
    $("startBtn").disabled = g.multiplayer && !host ? false : members < need;
    $("gamesTab").querySelector(".section-head h2").textContent = g.multiplayer
      ? "직접 붙는 전용 대결 5종"
      : "한 명이 진행하는 관전 추첨 15종";
    $("partyRoomTools").hidden = appMode !== "party";
    if (appMode === "party" && !host)
      $("participantCount").textContent = "입장 대기";
    renderMapOptions();
  };
  window.setAppMode = function (next) {
    if (!["solo", "party", "food"].includes(next)) return;
    if (next === "food") {
      menu = "food";
      $("foodTab").hidden = false;
      $("gamesTab").hidden = true;
      $("launch").hidden = true;
    } else {
      if (next === "solo" && LAB_ROOMS.role === "host") {
        LAB_ROOMS.shutdown(false);
        toast("방을 닫고 관전 추첨으로 전환했어요.");
      }
      window.appMode = next;
      menu = next;
      $("foodTab").hidden = true;
      $("gamesTab").hidden = false;
      $("launch").hidden = false;
      document.body.classList.toggle("party-mode", next === "party");
      $("roundConfigHeading").textContent =
        next === "party" ? "대결 제한시간" : "한 판 구성 · 예선 후 결승";
      $("roundConfigNote").textContent =
        next === "party"
          ? "제한시간 동안 직접 플레이하고 점수 순위로 담당을 정합니다."
          : "표시된 예선 시간 후 실제 결승이 이어집니다. 예선 위험도가 결승 난이도에 반영됩니다.";
      document
        .querySelectorAll("[data-length]")
        .forEach(
          (b) =>
            (b.textContent =
              b.dataset.length + "초" + (next === "party" ? "" : "+")),
        );
      $("rosterDescription").textContent =
        next === "party"
          ? "선택 가능한 재학 명단입니다. 방에 들어와 준비 완료한 사람만 실제 대결에 참여합니다."
          : "노션 재학 멤버 고정 명단. 이름을 누르면 오늘만 참여 / 제외돼요.";
      document.querySelector(".hero-tags span").textContent =
        next === "party" ? "● EVERYONE PLAYS" : "● ONE HOST";
      if (!allowed().some((g) => g.id === settings.selected))
        settings.selected = next === "party" ? "arena" : "pinball";
      settings.mode = next;
      save();
      renderGames();
      renderMembers();
      $("modeHeroTitle").innerHTML =
        next === "party"
          ? "각자 움직이고.<br><em>직접 붙어서 정한다.</em>"
          : "한 명이 돌리고.<br><em>모두가 구경하며 뽑는다.</em>";
      $("modeHeroCopy").textContent =
        next === "party"
          ? "조이스틱으로 이동하고, 대시로 밀어내고, 코인을 빼앗는다. 준비된 참가자만 전용 경기장에서 직접 대결합니다."
          : "핀볼·경마·룰렛을 큰 화면에 띄워 함께 관전하세요. 오늘 필요한 담당 항목을 추가하고 재미있게 추첨합니다.";
    }
    document.querySelectorAll("[data-mode]").forEach((b) => {
      b.classList.toggle("active", b.dataset.mode === appMode);
      b.setAttribute("aria-pressed", String(b.dataset.mode === appMode));
    });
    document
      .querySelectorAll("[data-tab]")
      .forEach((b) =>
        b.classList.toggle(
          "active",
          b.dataset.tab === (menu === "solo" ? "games" : menu),
        ),
      );
  };
  document
    .querySelectorAll("[data-tab]")
    .forEach(
      (b) =>
        (b.onclick = () =>
          setAppMode(b.dataset.tab === "games" ? "solo" : b.dataset.tab)),
    );
  document
    .querySelectorAll("[data-mode]")
    .forEach((b) => (b.onclick = () => setAppMode(b.dataset.mode)));
  $("randomGame").onclick = () => {
    const pool = allowed().filter((g) => g.id !== settings.selected),
      g = pool[randint(pool.length)];
    selectGame(g.id);
    toast(g.name);
  };
  renderControls = function () {
    prior.renderControls();
    if (run && !isMultiplayer(run.g))
      $("gameHint").textContent = run.g.rule.replace(
        /3명/g,
        run.targetCount + "명",
      );
  };
  startGame = function () {
    prior.startGame();
    if (run) {
      document.body.classList.toggle("direct-match", isMultiplayer(run.g));
      renderControls();
    }
  };
  $("startBtn").onclick = () => startGame();
  // Portrait loading redraws the catalog; update arena thumbnails after the image cache is ready.
  const oldPreviews = drawPreviews;
  drawPreviews = function () {
    oldPreviews();
    const g = GAMES.find((g) => g.id === settings.selected);
    if (g)
      document.querySelectorAll(".map-option canvas").forEach((c) => {
        const m = GAME_MAPS[g.id].find(
          (m) => m.id === c.parentElement.dataset.map,
        );
        if (m) preview(g, m, c);
      });
  };
  setAppMode(
    new URLSearchParams(location.search).get("mode") === "party" ||
      new URLSearchParams(location.search).has("room")
      ? "party"
      : new URLSearchParams(location.search).get("mode") === "solo"
        ? "solo"
        : settings.mode === "party"
          ? "party"
          : "solo",
  );
})();
