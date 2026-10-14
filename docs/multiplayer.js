"use strict";
// Dedicated skill games. Player motion comes only from authenticated room inputs.
window.MULTIPLAYER = (() => {
  const old = { createRun, update, draw, action, renderControls };
  const palette = [
    "#ff947b",
    "#7dd7eb",
    "#c4a6f1",
    "#b8de7a",
    "#f3bbdf",
    "#ffd177",
    "#76d6ae",
    "#a0b9ff",
    "#ef92b7",
    "#d2d99d",
    "#dcad82",
    "#9ce6dc",
    "#bf9fd0",
    "#7eafd2",
    "#dcbdec",
    "#e4a470",
  ];
  function walls(m) {
    if (m.shape === "maze")
      return [
        { x: 285, y: 170, w: 38, h: 315 },
        { x: 510, y: 325, w: 38, h: 335 },
        { x: 740, y: 170, w: 38, h: 315 },
        { x: 955, y: 325, w: 38, h: 335 },
      ];
    if (m.shape === "yard")
      return [
        { x: 345, y: 285, w: 100, h: 38 },
        { x: 755, y: 285, w: 100, h: 38 },
        { x: 345, y: 520, w: 100, h: 38 },
        { x: 755, y: 520, w: 100, h: 38 },
      ];
    return m.shape === "disc" && m.id === "orbit"
      ? [{ x: 525, y: 335, w: 150, h: 130 }]
      : [];
  }
  function ground(m, x, y, t = 0) {
    if (x < 70 || x > 1130 || y < 175 || y > 650) return false;
    if (m.shape === "disc") {
      const radius = m.id === "crater" ? Math.max(195, 232 - t * 0.55) : 232;
      return Math.hypot((x - 600) / 1.75, y - 412) < radius;
    }
    if (m.shape === "bridges")
      return (
        Math.abs(x - 600) < 48 ||
        Math.abs(y - 412) < 42 ||
        [
          { x: 240, y: 270 },
          { x: 960, y: 270 },
          { x: 240, y: 560 },
          { x: 960, y: 560 },
        ].some((p) => Math.abs(x - p.x) < 132 && Math.abs(y - p.y) < 77) ||
        ([240, 960].some((px) => Math.abs(x - px) < 40) &&
          Math.abs(y - 412) < 145)
      );
    return true;
  }
  function clear(m, x, y, t = 0, radius = 20) {
    return (
      ground(m, x, y, t) &&
      !walls(m).some(
        (w) =>
          x > w.x - radius &&
          x < w.x + w.w + radius &&
          y > w.y - radius &&
          y < w.y + w.h + radius,
      )
    );
  }
  function point(m, t = 0) {
    for (let tries = 0; tries < 100; tries++) {
      const p = { x: 90 + rng() * 1020, y: 195 + rng() * 430 };
      if (clear(m, p.x, p.y, t, 30)) return p;
    }
    return { x: 600, y: 412 };
  }
  function respawn(r, a) {
    const p = point(r.map, r.time);
    a.x = p.x;
    a.y = p.y;
    a.vx = 0;
    a.vy = 0;
    a.impulseX = 0;
    a.impulseY = 0;
    a.respawn = 0;
    a.invincible = r.time + 1.5;
  }
  function damage(r, a, fall = false) {
    if (a.respawn > r.time || a.invincible > r.time || a.shieldUntil > r.time)
      return;
    a.deaths++;
    a.score -= fall ? 12 : 8;
    a.coins = Math.max(0, a.coins - 3);
    if (a.hitBy) {
      const attacker = r.actors.find((b) => b.id === a.hitBy);
      if (attacker) attacker.score += 8;
    }
    a.respawn = r.time + 1.1;
    a.hitBy = null;
    burst(a.x, a.y, a.color, 25);
  }
  function checkpoints(m) {
    if (m.shape === "bridges")
      return [
        { x: 240, y: 270 },
        { x: 240, y: 550 },
        { x: 600, y: 412 },
        { x: 960, y: 550 },
        { x: 960, y: 270 },
        { x: 600, y: 200 },
      ];
    if (m.shape === "disc")
      return Array.from({ length: 8 }, (_, i) => ({
        x: 600 + Math.cos((i / 8) * TAU) * 350,
        y: 412 + Math.sin((i / 8) * TAU) * 194,
      }));
    return [
      { x: 165, y: 555 },
      { x: 380, y: 560 },
      { x: 400, y: 235 },
      { x: 630, y: 225 },
      { x: 630, y: 565 },
      { x: 860, y: 560 },
      { x: 875, y: 230 },
      { x: 1060, y: 225 },
    ];
  }
  createRun = function (g, members) {
    const r = old.createRun(g, members);
    if (!isMultiplayer(g)) return r;
    r.battlePhase = "battle";
    r.finalAt = null;
    r.duration = settings.length;
    r.auto = false;
    r.worldWalls = walls(r.map);
    r.tokens = [];
    r.hazards = [];
    r.paint = Array(27 * 12).fill(null);
    r.nodes = checkpoints(r.map);
    r.spawnAt = 0;
    r.resultsPending = false;
    r.actors.forEach((a, i) => {
      Object.assign(a, {
        color: palette[i % palette.length],
        score: 0,
        deaths: 0,
        coins: 0,
        node: 0,
        finishTime: null,
        dashUntil: 0,
        shieldUntil: 0,
        roomCooldown: 0,
        impulseX: 0,
        impulseY: 0,
        respawn: 0,
        invincible: 0,
        aimX: 1,
        aimY: 0,
      });
      respawn(r, a);
      a.invincible = 0;
      if (g.id === "rally") {
        a.x =
          r.map.shape === "maze"
            ? 150 + (i % 3) * 22
            : r.map.shape === "bridges"
              ? 600 + ((i % 3) - 1) * 24
              : 925 + (i % 3) * 10;
        a.y =
          r.map.shape === "maze"
            ? 200 + Math.floor(i / 3) * 22
            : r.map.shape === "bridges"
              ? 365 + Math.floor(i / 3) * 20
              : 490 + Math.floor(i / 3) * 10;
      }
    });
    if (g.id === "coins")
      for (let i = 0; i < 35; i++)
        r.tokens.push({ ...point(r.map), value: i % 9 === 0 ? 3 : 1 });
    return r;
  };
  function paint(r, a, radius = 25) {
    for (let i = 0; i < r.paint.length; i++) {
      const x = 80 + (i % 27) * 40,
        y = 185 + Math.floor(i / 27) * 40;
      if (
        clear(r.map, x, y, r.time, 3) &&
        Math.hypot(x - a.x, y - a.y) < radius
      )
        r.paint[i] = a.id;
    }
  }
  function perform(r, a, direction) {
    if (
      !isMultiplayer(r.g) ||
      a.respawn > r.time ||
      a.finishTime !== null ||
      r.time < a.roomCooldown
    )
      return;
    const d = Math.hypot(direction.x, direction.y);
    if (d > 0.1) {
      a.aimX = direction.x / d;
      a.aimY = direction.y / d;
    }
    if (r.g.id === "laser") {
      a.shieldUntil = r.time + 1.8;
      a.roomCooldown = r.time + 7;
    } else if (r.g.id === "paint") {
      paint(r, a, 105);
      a.roomCooldown = r.time + 6;
      burst(a.x, a.y, a.color, 20);
    } else {
      a.dashUntil = r.time + 0.42;
      a.roomCooldown = r.time + (r.g.id === "rally" ? 4 : 3);
    }
  }
  function movement(r, a, dt) {
    if (a.respawn > r.time) return;
    if (a.respawn) {
      respawn(r, a);
    }
    if (a.finishTime !== null) return;
    const input = window.LAB_ROOMS?.inputs.get(a.id),
      fresh = input && performance.now() - input.at < 450;
    let x = fresh ? input.x : 0,
      y = fresh ? input.y : 0;
    const magnitude = Math.hypot(x, y);
    if (magnitude > 1) {
      x /= magnitude;
      y /= magnitude;
    }
    if (magnitude > 0.15) {
      a.aimX = x / Math.hypot(x, y);
      a.aimY = y / Math.hypot(x, y);
    }
    const dash = a.dashUntil > r.time,
      speed = r.g.id === "rally" ? 190 : 170;
    const dx =
        (dash ? a.aimX * speed * 2.6 : x * speed) * dt + (a.impulseX || 0) * dt,
      dy =
        (dash ? a.aimY * speed * 2.6 : y * speed) * dt + (a.impulseY || 0) * dt;
    a.impulseX *= Math.exp(-5 * dt);
    a.impulseY *= Math.exp(-5 * dt);
    const nx = a.x + dx,
      ny = a.y + dy;
    const falling = ["arena", "coins"].includes(r.g.id);
    function blocked(px, py) {
      return (
        r.worldWalls.some(
          (w) =>
            px > w.x - 19 &&
            px < w.x + w.w + 19 &&
            py > w.y - 19 &&
            py < w.y + w.h + 19,
        ) ||
        (!falling && !ground(r.map, px, py, r.time))
      );
    }
    if (!blocked(nx, a.y)) a.x = nx;
    if (!blocked(a.x, ny)) a.y = ny;
    if (r.map.belt)
      a.x += Math.sin(Math.floor((a.y - 175) / 158) * 2 + 1) * 45 * dt;
    if (falling && !ground(r.map, a.x, a.y, r.time)) damage(r, a, true);
  }
  function collisions(r) {
    for (let i = 0; i < r.actors.length; i++)
      for (let j = i + 1; j < r.actors.length; j++) {
        const a = r.actors[i],
          b = r.actors[j];
        if (a.respawn > r.time || b.respawn > r.time) continue;
        const dx = b.x - a.x,
          dy = b.y - a.y,
          d = Math.hypot(dx, dy);
        if (d < 39 && d > 0.01) {
          const nx = dx / d,
            ny = dy / d,
            push = (39 - d) / 2;
          if (clear(r.map, a.x - nx * push, a.y - ny * push, r.time, 17)) {
            a.x -= nx * push;
            a.y -= ny * push;
          }
          if (clear(r.map, b.x + nx * push, b.y + ny * push, r.time, 17)) {
            b.x += nx * push;
            b.y += ny * push;
          }
          for (const [from, to, dir] of [
            [a, b, 1],
            [b, a, -1],
          ])
            if (from.dashUntil > r.time) {
              to.impulseX = nx * dir * 470;
              to.impulseY = ny * dir * 470;
              to.hitBy = from.id;
              if (
                r.g.id === "coins" &&
                r.time > (from.stealAt || 0) &&
                to.coins > 0
              ) {
                to.coins--;
                from.coins++;
                from.stealAt = r.time + 0.5;
              }
            }
        }
      }
  }
  function hazards(r, dt) {
    if (r.map.hazard === "beam") {
      const angle = r.time * 0.8;
      for (const a of r.actors) {
        const dx = (a.x - 600) / 1.75,
          dy = a.y - 412;
        const radial = Math.hypot(dx, dy),
          theta = Math.atan2(dy, dx);
        if (radial > 45 && Math.abs(Math.sin(theta - angle)) * radial < 13)
          damage(r, a);
      }
    } else if (r.map.hazard === "tiles") {
      if (r.time >= r.spawnAt) {
        r.hazards.push({
          ...point(r.map),
          warnUntil: r.time + 1,
          expires: r.time + 1.45,
        });
        r.spawnAt = r.time + 0.35;
      }
      for (const h of r.hazards)
        if (r.time > h.warnUntil)
          r.actors
            .filter((a) => Math.abs(a.x - h.x) < 49 && Math.abs(a.y - h.y) < 49)
            .forEach((a) => damage(r, a));
      r.hazards = r.hazards.filter((h) => h.expires > r.time);
    } else {
      if (r.time >= r.spawnAt) {
        const side = randint(4),
          target = r.actors[randint(r.actors.length)];
        const h = {
          x: side === 0 ? 65 : side === 1 ? 1135 : 90 + rng() * 1020,
          y: side === 2 ? 170 : side === 3 ? 660 : 185 + rng() * 440,
        };
        const dx = target.x - h.x,
          dy = target.y - h.y,
          d = Math.max(1, Math.hypot(dx, dy));
        h.vx = (dx / d) * (190 + r.time * 1.4);
        h.vy = (dy / d) * (190 + r.time * 1.4);
        r.hazards.push(h);
        r.spawnAt = r.time + 0.16;
      }
      for (const h of r.hazards) {
        h.x += h.vx * dt;
        h.y += h.vy * dt;
        for (const a of r.actors)
          if (Math.hypot(h.x - a.x, h.y - a.y) < 26) {
            damage(r, a);
            h.x = -999;
            break;
          }
      }
      r.hazards = r.hazards.filter(
        (h) => h.x > -30 && h.x < 1230 && h.y > 120 && h.y < 700,
      );
    }
  }
  function resolve(r) {
    if (r.resultsPending) return;
    r.resultsPending = true;
    r.battlePhase = "final";
    const ranking = shuffle(r.actors).sort((a, b) => value(r, a) - value(r, b));
    r.leaderboard = ranking
      .slice()
      .reverse()
      .map((a) => ({ id: a.id, name: a.name, score: value(r, a) }));
    ranking.slice(0, r.targetCount).forEach((a) => {
      a.life = 1;
      a.lastDamage = -10;
      record(a);
    });
  }
  function value(r, a) {
    if (r.g.id === "coins") return a.coins;
    if (r.g.id === "paint") return r.paint.filter((id) => id === a.id).length;
    if (r.g.id === "rally") {
      const p = r.nodes[Math.min(a.node, r.nodes.length - 1)];
      return (
        a.node * 100 +
        (a.finishTime !== null
          ? Math.max(0, 100 - r.duration * 0.1 - a.finishTime * 0.1)
          : Math.max(0, 90 - Math.hypot(a.x - p.x, a.y - p.y) * 0.08))
      );
    }
    return Math.round(a.score);
  }
  update = function (r, dt) {
    if (!isMultiplayer(r.g)) return old.update(r, dt);
    if (r.ended) return;
    const factor =
      settings.speed === "fast" ? 1.6 : settings.speed === "slow" ? 0.65 : 1;
    dt /= factor;
    r.time += dt;
    r.age += dt;
    r.flash = Math.max(0, r.flash - dt);
    r.particles.forEach((p) => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
    });
    r.particles = r.particles.filter((p) => p.life > 0);
    if (r.finishAt) {
      if (r.time >= r.finishAt) finishGame();
      return;
    }
    if (r.age === dt) announce("전원 직접 조작! " + r.g.rule);
    for (const a of r.actors) {
      movement(r, a, dt);
      if (["arena", "laser"].includes(r.g.id) && a.respawn <= r.time)
        a.score += dt;
      if (r.g.id === "paint") paint(r, a);
      if (r.g.id === "rally" && a.finishTime === null) {
        const p = r.nodes[a.node];
        if (p && Math.hypot(a.x - p.x, a.y - p.y) < 42) {
          a.node++;
          burst(p.x, p.y, a.color, 14);
          if (a.node === r.nodes.length) a.finishTime = r.time;
        }
      }
    }
    if (["arena", "coins"].includes(r.g.id)) collisions(r);
    if (r.g.id === "laser") hazards(r, dt);
    if (r.g.id === "coins") {
      for (let i = r.tokens.length - 1; i >= 0; i--) {
        const p = r.tokens[i],
          a = r.actors.find(
            (a) => a.respawn <= r.time && Math.hypot(a.x - p.x, a.y - p.y) < 32,
          );
        if (a) {
          a.coins += p.value;
          r.tokens[i] = { ...point(r.map, r.time), value: p.value };
        }
      }
      if (r.map.belt) {
        const trainX = ((r.time * 115) % 1500) - 150;
        r.actors
          .filter(
            (a) =>
              Math.abs(a.y - 410) < 28 && a.x > trainX && a.x < trainX + 190,
          )
          .forEach((a) => damage(r, a));
      }
    }
    if (r.duration - r.age < 20 && !r.finaleMusic) {
      r.finaleMusic = true;
      MUSIC.final();
    }
    if (
      r.age >= r.duration ||
      (r.g.id === "rally" && r.actors.every((a) => a.finishTime !== null))
    )
      resolve(r);
    renderHud(r);
  };
  function renderHud(r) {
    if (!isMultiplayer(r.g)) return;
    $("battlePhase").textContent =
      "직접 대결 · " +
      (r.duration - r.age <= 20 ? "마지막 스퍼트" : "실시간 점수전");
    $("battlePhase").classList.toggle("final", r.duration - r.age < 20);
    $("battleClock").textContent =
      Math.max(0, Math.ceil(r.duration - r.age)) + "초";
    $("battleProgress").style.width =
      Math.min(100, (r.age / r.duration) * 100) + "%";
    $("battleMap").textContent = r.map.name;
    $("phaseSplash").hidden = true;
    $("gameRound").textContent =
      r.actors.length + "명 직접 조작 · 담당 " + r.targetCount + "개";
  }
  renderControls = function () {
    old.renderControls();
    const multi = !!run && isMultiplayer(run.g);
    $("actionBtn").hidden = multi;
    $("autoBtn").hidden = multi;
    if (multi) {
      renderHud(run);
      $("gameHint").textContent =
        "각자 휴대폰으로 이동·스킬 조작 · 점수 하위 " +
        run.targetCount +
        "명에게 담당 배정";
    }
  };
  action = function () {
    if (run && isMultiplayer(run.g)) return;
    old.action();
  };
  function board(r, c) {
    c.fillStyle =
      r.map.theme === "sky"
        ? "#192b42"
        : r.map.theme === "lava"
          ? "#371f29"
          : r.map.theme === "park"
            ? "#163629"
            : "#111d2c";
    c.fillRect(0, 0, 1200, 720);
    if (["sky", "islands"].includes(r.map.theme)) {
      for (let i = 0; i < 12; i++) {
        const x = (i * 181) % 1200,
          y = 180 + ((i * 83) % 430);
        circle(c, x, y, 48, "#d5e7f315");
        circle(c, x + 40, y + 8, 35, "#d5e7f315");
      }
    }
    if (r.map.theme === "lava")
      for (let i = 0; i < 14; i++)
        line(c, i * 93, 675, i * 93 + 85, 480, "#ff854435", 12);
    if (r.map.shape === "disc") {
      c.save();
      c.translate(600, 412);
      c.scale(1.75, 1);
      circle(
        c,
        0,
        0,
        r.map.id === "crater" ? Math.max(195, 232 - r.time * 0.55) : 232,
        "#263b4c",
        r.map.color,
      );
      circle(c, 0, 0, 75, null, r.map.color + "55");
      c.restore();
    } else if (r.map.shape === "bridges") {
      rounded(c, 552, 175, 96, 475, 8, "#59637b", r.map.color);
      rounded(c, 70, 370, 1060, 84, 8, "#59637b", r.map.color);
      for (const p of [
        { x: 240, y: 270 },
        { x: 960, y: 270 },
        { x: 240, y: 560 },
        { x: 960, y: 560 },
      ]) {
        rounded(c, p.x - 130, p.y - 75, 260, 150, 15, "#4a5263", r.map.color);
        rounded(c, p.x - 40, 270, 80, 290, 3, "#59637b", r.map.color);
      }
    } else rounded(c, 70, 175, 1060, 475, 10, "#263747", r.map.color);
    for (const w of r.worldWalls || walls(r.map)) {
      rounded(
        c,
        w.x,
        w.y,
        w.w,
        w.h,
        5,
        r.map.theme === "park" ? "#426c49" : "#59637a",
        "#bacbd055",
      );
      for (let i = 0; i < w.w; i += 15)
        line(c, w.x + i, w.y, w.x + i, w.y + w.h, "#202b3e66", 3);
    }
    if (r.map.belt)
      for (let row = 0; row < 3; row++)
        for (let x = 80; x < 1130; x += 55)
          label(c, row % 2 ? "←" : "→", x, 220 + row * 158, 19, "#7fa8c233");
  }
  draw = function (r, c, preview = false) {
    if (!isMultiplayer(r.g)) return old.draw(r, c, preview);
    board(r, c);
    if (r.g.id === "paint") {
      for (let i = 0; i < r.paint.length; i++) {
        const x = 60 + (i % 27) * 40,
          y = 165 + Math.floor(i / 27) * 40;
        if (!clear(r.map, x + 20, y + 20, r.time, 2)) continue;
        const a = r.actors.find((a) => a.id === r.paint[i]);
        rounded(c, x + 1, y + 1, 38, 38, 3, a ? a.color + "b9" : "#9fb5ce19");
      }
    }
    if (r.g.id === "coins") {
      for (const p of r.tokens) {
        circle(
          c,
          p.x,
          p.y,
          p.value === 3 ? 11 : 8,
          p.value === 3 ? "#fff0b0" : "#ecc663",
          "#8b6721",
        );
        label(c, "$", p.x, p.y, 10, "#825a16");
      }
      if (r.map.belt) {
        const x = ((r.time * 115) % 1500) - 150;
        rounded(c, x, 385, 190, 50, 8, "#dfb8a0", "#ffddba");
        for (let i = 0; i < 4; i++)
          rounded(c, x + 14 + i * 43, 395, 28, 20, 4, "#293b53");
      }
    }
    if (r.g.id === "rally")
      r.nodes.forEach((p, i) => {
        circle(c, p.x, p.y, 34, "#1b293b", r.map.color);
        label(c, String(i + 1), p.x, p.y, 24, r.map.color);
      });
    if (r.g.id === "laser") {
      if (r.map.hazard === "beam") {
        const a = r.time * 0.8;
        c.save();
        c.translate(600, 412);
        c.scale(1.75, 1);
        line(
          c,
          -Math.cos(a) * 245,
          -Math.sin(a) * 245,
          Math.cos(a) * 245,
          Math.sin(a) * 245,
          "#ff658777",
          18,
        );
        line(
          c,
          -Math.cos(a) * 245,
          -Math.sin(a) * 245,
          Math.cos(a) * 245,
          Math.sin(a) * 245,
          "#ffd8d6",
          3,
        );
        c.restore();
        circle(c, 600, 412, 40, "#ee7bac", "#fff3d2");
      }
      for (const h of r.hazards) {
        if (r.map.hazard === "tiles")
          rounded(
            c,
            h.x - 49,
            h.y - 49,
            98,
            98,
            5,
            r.time < h.warnUntil ? "#ffcd6633" : "#ff616999",
            r.time < h.warnUntil ? "#ffc679" : "#ffd1c1",
          );
        else {
          circle(c, h.x, h.y, 7, "#ff947c");
          line(
            c,
            h.x,
            h.y,
            h.x - h.vx * 0.08,
            h.y - h.vy * 0.08,
            "#ffbd9166",
            4,
          );
        }
      }
    }
    r.actors.forEach((a) => {
      if (a.respawn > r.time) {
        label(c, "재투입", a.x, a.y, 13, a.color);
        return;
      }
      if (a.shieldUntil > r.time || a.invincible > r.time)
        circle(c, a.x, a.y, 32, null, "#c5eebc");
      if (a.id === r.viewerId) {
        circle(c, a.x, a.y, 35, null, "#fff6a3");
        label(c, "나 ▼", a.x, a.y - 43, 18, "#fff6a3");
      }
      avatar(c, a, a.x, a.y, 19, !preview);
      if (a.dashUntil > r.time)
        line(
          c,
          a.x - a.aimX * 55,
          a.y - a.aimY * 55,
          a.x - a.aimX * 20,
          a.y - a.aimY * 20,
          a.color,
          5,
        );
    });
    const ranking = r.actors
      .slice()
      .sort((a, b) => value(r, b) - value(r, a))
      .slice(0, 5);
    if (!preview) {
      ranking.forEach((a, i) => {
        rounded(c, 75 + i * 212, 115, 202, 34, 6, "#101d2fee", a.color);
        label(
          c,
          i + 1 + ". " + a.name + " " + value(r, a),
          176 + i * 212,
          132,
          13,
          a.color,
        );
      });
      label(c, r.map.subtitle, 600, 690, 17, "#bad2de");
    }
  };
  return { perform, value, ground, clear, point, resolve, renderHud };
})();
