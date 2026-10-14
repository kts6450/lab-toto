"use strict";
// Each arena has its own scenery and several games project their actual state onto a different course.
(() => {
  const original = { draw, background: BASE.background };
  function gear(c, x, y, rad, t, color) {
    c.save();
    c.translate(x, y);
    c.rotate(t);
    for (let i = 0; i < 12; i++) {
      c.rotate(TAU / 12);
      rounded(c, rad - 7, -6, 16, 12, 2, color);
    }
    circle(c, 0, 0, rad, color);
    circle(c, 0, 0, rad * 0.6, "#14202c", "#91a5b744");
    c.restore();
  }
  function scenery(c, r) {
    const id = r.map.id,
      g = r.g.id,
      t = r.time || 0;
    const space = [
        "space",
        "moon",
        "orbit",
        "single",
        "binary",
        "wandering",
      ].includes(id),
      ice = ["ice", "cold", "crack"].includes(id),
      trees = ["garden", "jungle", "forest"].includes(id),
      water = ["pool", "slide", "falls"].includes(id),
      metal = [
        "factory",
        "gears",
        "workshop",
        "steam",
        "reverse",
        "parcel",
      ].includes(id);
    c.fillStyle = space
      ? "#13142d"
      : ice
        ? "#25424f"
        : trees
          ? "#142c26"
          : water
            ? "#143644"
            : metal
              ? "#252a32"
              : "#152034";
    c.fillRect(0, 0, 1200, 720);
    if (space) {
      for (let i = 0; i < 120; i++)
        circle(
          c,
          (i * 157.1) % 1200,
          (i * 97.3) % 720,
          i % 9 === 0 ? 2 : 1,
          "#c9d0f27c",
        );
      circle(c, 1040, 260, 100, "#645681");
      circle(c, 1017, 237, 82, "#292940");
      c.save();
      c.translate(1040, 260);
      c.rotate(-0.3);
      c.strokeStyle = "#a59bc877";
      c.lineWidth = 14;
      c.beginPath();
      c.ellipse(0, 0, 155, 34, 0, 0, TAU);
      c.stroke();
      c.restore();
      if (id === "moon") {
        c.beginPath();
        c.moveTo(0, 560);
        for (let x = 0; x <= 1200; x += 50)
          c.lineTo(x, 560 + Math.sin(x * 0.009) * 30);
        c.lineTo(1200, 720);
        c.lineTo(0, 720);
        c.fillStyle = "#666578";
        c.fill();
        for (let i = 0; i < 13; i++)
          circle(c, i * 101, 660 + (i % 3) * 13, 22, "#47465e");
      }
    } else if (ice) {
      c.beginPath();
      c.moveTo(0, 380);
      for (let i = 0; i < 9; i++) {
        c.lineTo(i * 160 + 70, 150 + (i % 3) * 42);
        c.lineTo(i * 160 + 150, 380);
      }
      c.lineTo(1200, 720);
      c.lineTo(0, 720);
      c.fillStyle = "#a5cfd332";
      c.fill();
      for (let i = 0; i < 18; i++) {
        const x = (i * 173) % 1200;
        line(c, x, 720, x + 180, 410, "#bce9e233", 3);
      }
      if (id === "cold")
        rounded(c, 300, 145, 600, 510, 28, "#6ba1b12a", "#a2dbe7");
    } else if (trees) {
      rounded(c, 30, 160, 1140, 510, 25, "#263e32");
      for (let i = 0; i < 22; i++) {
        const x = i % 2 ? 35 + ((i * 89) % 1100) : (i % 11) * 115,
          y = i % 2 ? 170 : 640;
        rounded(c, x - 7, y - 13, 14, 56, 4, "#705947");
        circle(c, x, y, 33 + (i % 3) * 5, "#437050");
        circle(c, x - 14, y - 8, 21, "#68935b");
      }
    } else if (water) {
      for (let row = 0; row < 14; row++) {
        c.beginPath();
        for (let x = 0; x <= 1200; x += 15) {
          const y = 145 + row * 40 + Math.sin(x * 0.016 + t * 0.7 + row) * 8;
          if (x === 0) c.moveTo(x, y);
          else c.lineTo(x, y);
        }
        c.strokeStyle = row % 2 ? "#79ccd033" : "#377fa566";
        c.lineWidth = 3;
        c.stroke();
      }
      if (id === "pool") {
        rounded(c, 60, 155, 1080, 510, 24, "#5098af22", "#bcdadacc");
        for (let x = 65; x < 1150; x += 70)
          rounded(c, x, 610, 34, 10, 3, "#e2b37a");
      }
      if (id === "falls") {
        for (const x of [110, 1050]) {
          rounded(c, x - 70, 100, 140, 620, 25, "#464d49");
          for (let k = 0; k < 7; k++)
            line(c, x - 40 + k * 12, 120, x - 40 + k * 12, 700, "#8ddeeb55", 5);
        }
      }
    } else if (metal) {
      for (let x = 0; x < 1200; x += 120)
        for (let y = 145; y < 720; y += 110) {
          rounded(c, x + 4, y + 4, 112, 102, 7, "#333a4355", "#69778522");
          circle(c, x + 15, y + 15, 3, "#89959d");
        }
      for (let i = 0; i < 6; i++)
        gear(
          c,
          85 + i * 211,
          625 + (i % 2) * -430,
          45 + (i % 2) * 18,
          t * (i % 2 ? -0.2 : 0.2),
          "#6d745466",
        );
      if (id === "steam")
        for (let i = 0; i < 6; i++) {
          const y = 240 + ((i * 131 - t * 15) % 400);
          circle(c, 900 + (i % 2) * 45, y, 40, "#cfdfdc19");
        }
      if (id === "workshop")
        rounded(c, 300, 155, 600, 490, 8, "#324b4255", "#acbf8888");
    } else {
      for (let x = 0; x < 1200; x += 70)
        line(c, x, 150, x, 720, "#5779a822", 1);
      for (let y = 150; y < 720; y += 70)
        line(c, 0, y, 1200, y, "#5779a822", 1);
    }
    if (g === "bomb" && id === "train") {
      c.save();
      c.translate(600, 390);
      c.strokeStyle = "#7ca3b966";
      c.lineWidth = 9;
      c.beginPath();
      c.ellipse(0, 0, 415, 230, 0, 0, TAU);
      c.stroke();
      c.lineWidth = 3;
      c.beginPath();
      c.ellipse(0, 0, 455, 260, 0, 0, TAU);
      c.stroke();
      c.restore();
    }
    if (g === "bomb" && id === "chain" && r.bomb)
      circle(c, r.bomb.x, r.bomb.y, 180, "#f4868120", "#fb96914a");
    if (g === "rhythm") {
      if (id === "stage") {
        for (let i = 0; i < 8; i++) {
          c.beginPath();
          c.moveTo(100 + i * 145, 140);
          c.lineTo(40 + i * 145, 600);
          c.lineTo(200 + i * 145, 600);
          c.fillStyle = i % 2 ? "#daaadf15" : "#85a9db15";
          c.fill();
        }
      } else if (id === "factory") {
        for (let i = 0; i < 8; i++)
          gear(c, 120 + i * 145, 450, 48, t, "#88755544");
      } else {
        for (let i = 0; i < 18; i++)
          rounded(
            c,
            45 + i * 64,
            500 - Math.sin(t * 3 + i) * 80,
            36,
            170 + Math.sin(t * 3 + i) * 80,
            2,
            i % 2 ? "#84e0e422" : "#dd96dc22",
          );
      }
    }
  }
  BASE.background = function (c, g) {
    if (drawingRun?.map) scenery(c, drawingRun);
    else original.background(c, g);
  };
  background = function (c, g) {
    BASE.background(c, g);
  };
  function pathPoint(r, p, lane = 0) {
    if (r.g.id === "horse") {
      if (r.map.id === "track") {
        const a = -Math.PI / 2 + p * TAU;
        return {
          x: 600 + Math.cos(a) * (440 + lane),
          y: 415 + Math.sin(a) * (190 + lane * 0.25),
        };
      }
      if (r.map.id === "jungle")
        return {
          x: 100 + p * 1010,
          y: 405 + Math.sin(p * TAU * 1.25) * 175 + lane,
        };
      const section = Math.min(3, Math.floor(p * 4)),
        q = (p * 4) % 1;
      return {
        x: section % 2 ? 1080 - q * 960 : 120 + q * 960,
        y: 210 + section * 120 + lane,
      };
    }
    return {
      x: 90 + p * 1000,
      y:
        r.map.id === "forest"
          ? 420 + Math.sin(p * TAU) * 135 + lane
          : r.map.id === "ice"
            ? 235 + p * 250 + lane
            : 425 + lane,
    };
  }
  function course(r, c) {
    for (let i = 0; i < 160; i++) {
      const p = pathPoint(r, i / 160),
        q = pathPoint(r, (i + 1) / 160);
      line(
        c,
        p.x,
        p.y,
        q.x,
        q.y,
        r.map.id === "jungle" && i / 160 > 0.28 && i / 160 < 0.55
          ? "#94734b"
          : "#496273",
        r.g.id === "horse" ? 62 : 110,
      );
    }
    for (let i = 0; i < 40; i++) {
      const p = pathPoint(r, i / 40),
        q = pathPoint(r, (i + 0.45) / 40);
      line(c, p.x, p.y, q.x, q.y, "#d0c99566", 2);
    }
    const end = pathPoint(r, 0.995);
    circle(c, end.x, end.y, 27, "#ead6a2");
    label(c, "🏁", end.x, end.y, 32, "#fff");
  }
  function race(r, c, preview) {
    course(r, c);
    r.actors.forEach((a, i) => {
      const lane = (i - (r.actors.length - 1) / 2) * 5,
        p = pathPoint(r, Math.min(0.997, a.progress), lane);
      if (a.boost > 0) line(c, p.x - 30, p.y, p.x - 7, p.y, a.color, 4);
      avatar(c, a, p.x, p.y, preview ? 16 : 19, !preview);
      if (a.stun > 0) label(c, "⚡", p.x, p.y - 30, 17, "#ffe598");
    });
    label(
      c,
      r.map.id === "track"
        ? "OVAL GRAND PRIX"
        : r.map.id === "jungle"
          ? "진흙 구간에서 속도가 떨어집니다"
          : "다리를 따라 지그재그로 달립니다",
      600,
      680,
      19,
      r.map.color,
    );
  }
  function redlight(r, c, preview) {
    course(r, c);
    r.actors
      .filter((a) => !a.picked)
      .forEach((a, i) => {
        const p = pathPoint(
          r,
          Math.max(0, (a.x - 70) / 1030),
          (i - (r.actors.length - 1) / 2) * 6,
        );
        avatar(c, a, p.x, p.y, 18, !preview);
      });
    label(
      c,
      r.light === "green" ? "🟢 달려!" : "🔴 멈춰!",
      600,
      155,
      36,
      r.map.color,
    );
    if (r.map.id === "forest") {
      for (const p of [0.35, 0.72]) {
        const pt = pathPoint(r, p);
        circle(c, pt.x, pt.y, 52, "#64976166");
        label(c, "엄폐", pt.x, pt.y - 60, 18, "#9ae68e");
      }
    }
    if (r.map.id === "ice")
      for (let i = 0; i < 7; i++)
        label(c, "≋", 200 + i * 130, 590, 47, "#a2e9ec44");
  }
  function sushi(r, c, preview) {
    const count = r.plates.length;
    if (r.map.id === "train") {
      c.save();
      c.translate(600, 390);
      c.strokeStyle = "#bb9e7766";
      c.lineWidth = 85;
      c.beginPath();
      c.ellipse(0, 0, 400, 190, 0, 0, TAU);
      c.stroke();
      c.restore();
    } else {
      rounded(
        c,
        120,
        185,
        960,
        365,
        14,
        r.map.id === "buffet" ? "#51435c" : "#594f41",
        "#bdac8a",
      );
      for (let x = 140; x < 1080; x += 100)
        line(c, x, 195, x, 540, "#cfba8a22", 2);
    }
    r.plates.forEach((p, i) => {
      let x, y;
      if (r.map.id === "train") {
        const a = (i / count) * TAU + r.time * 0.3;
        x = 600 + Math.cos(a) * 405;
        y = 385 + Math.sin(a) * 195;
      } else {
        const cols = Math.ceil(Math.sqrt(count * 2)),
          rows = Math.ceil(count / cols);
        x = 185 + ((i % cols) * 830) / Math.max(1, cols - 1);
        y = 240 + (Math.floor(i / cols) * 270) / Math.max(1, rows - 1);
      }
      const size = count > 24 ? 28 : 35;
      p.box = { x: x - size, y: y - size, w: size * 2, h: size * 2 };
      circle(c, x, y, size, p.open ? "#243d31" : "#e1d9bd", "#8d9baf");
      label(c, p.open ? "✓" : "🍣", x, y, size, p.open ? "#92e38a" : "#fff");
      if (!preview) label(c, String(i + 1), x, y + size + 12, 12, "#e3cdb0");
    });
    const a = currentActor(r);
    if (a) {
      avatar(c, a, 600, 615, 30, !preview);
      label(c, a.name + " 차례", 600, 690, 18, r.map.color);
    }
  }
  function balloon(r, c, preview) {
    const a = currentActor(r);
    if (r.map.id === "steam") {
      rounded(c, 450, 185, 300, 355, 35, "#747f8266", "#c5d7da");
      rounded(
        c,
        470,
        500 - r.amount * 1.2,
        260,
        r.amount * 1.2,
        12,
        "#ffa57366",
      );
      for (let i = 0; i < 4; i++) {
        line(c, 395, 250 + i * 75, 455, 250 + i * 75, "#a6b5ac", 14);
        gear(c, 825, 390, 72, r.amount * 0.01, "#9b956577");
      }
      label(c, "스팀 압력 탱크", 600, 160, 25, "#ffd29b");
    } else {
      const radius = 40 + r.amount * 0.73;
      circle(
        c,
        600,
        335,
        radius,
        r.map.id === "moon" ? "#bf9add99" : "#7adcf1aa",
        r.map.color,
      );
      circle(
        c,
        600 - radius * 0.3,
        335 - radius * 0.4,
        radius * 0.15,
        "#f4f0e955",
      );
      line(c, 600, 335 + radius, 600, 530, r.map.color, 4);
      if (r.map.id === "pool") {
        for (let i = 0; i < 8; i++)
          label(c, "~", 270 + i * 95, 560, 40, "#89dfed");
      } else label(c, "LOW GRAVITY", 600, 170, 23, "#bdadea");
    }
    rounded(c, 850, 215, 40, 340, 7, "#18273a", r.map.color);
    rounded(c, 857, 540 - r.amount * 1.65, 26, r.amount * 1.65, 5, r.map.color);
    if (a) avatar(c, a, 600, 595, 36, !preview);
    label(
      c,
      "압력 " + Math.round(r.amount) + " · " + (r.map.pressure || 1) + "× 펌프",
      600,
      690,
      20,
      r.map.color,
    );
  }
  function press(r, c, preview) {
    if (r.map.id === "workshop") return original.draw(r, c, preview);
    scenery(c, r);
    const a = currentActor(r),
      amount = r.amount;
    if (r.map.id === "gears") {
      gear(
        c,
        390 + amount * 0.35,
        365,
        105,
        r.time * 0.6 + amount * 0.02,
        "#9c9464",
      );
      gear(
        c,
        810 - amount * 0.35,
        365,
        105,
        -r.time * 0.6 - amount * 0.02,
        "#9c9464",
      );
      rounded(c, 370, 500, 460, 34, 8, "#606b72", "#c1cbc4");
      c.save();
      c.translate(600, 380);
      c.scale(1, Math.max(0.48, 1 - amount / 370));
      circle(c, 0, 0, 68, "#71a26b", "#b4d39b");
      for (let i = -2; i <= 2; i++)
        line(c, i * 17, -60, i * 17, 60, "#3d7046", 5);
      c.restore();
      label(c, "기어가 양쪽에서 조여 옵니다", 600, 165, 24, r.map.color);
    } else {
      rounded(c, 340, 185, 520, 325, 28, "#80b7c322", "#bedceb");
      for (let i = 0; i < 9; i++)
        line(c, 350 + i * 60, 205, 385 + i * 55, 485, "#b9e8f130", 2);
      rounded(
        c,
        370,
        460 - Math.min(230, amount * 1.1),
        460,
        Math.min(230, amount * 1.1),
        8,
        "#88d4e955",
      );
      circle(c, 600, 355, 75, "#87b8a0", "#c1e6db");
      for (let i = 0; i < 6; i++)
        label(c, "❄", 410 + i * 80, 235 + (i % 2) * 60, 32, "#cee4ed");
      label(
        c,
        "냉각 챔버 · 손을 떼면 압력이 샙니다",
        600,
        165,
        23,
        r.map.color,
      );
    }
    rounded(c, 280, 545, 640, 22, 6, "#182637", r.map.color);
    rounded(c, 285, 550, Math.min(630, amount * 3), 12, 4, r.map.color);
    if (a) avatar(c, a, 600, 615, 32, !preview);
    label(
      c,
      "압력 " + (amount / 20).toFixed(1) + " MPa · " + r.map.pressure + "×",
      600,
      690,
      19,
      r.map.color,
    );
  }
  function ladder(r, c, preview) {
    const n = r.actors.length,
      rows = r.links.length,
      horizontal = r.map.id === "maze";
    function p(col, row) {
      if (horizontal)
        return {
          x: 120 + (row / rows) * 950,
          y: 185 + (col / Math.max(1, n - 1)) * 410,
        };
      return {
        x: r.cols[col] + (r.map.id === "falls" ? Math.sin(row * 0.8) * 33 : 0),
        y: 165 + (row / rows) * 465,
      };
    }
    for (let row = 0; row < rows; row++)
      for (let col = 0; col < n; col++) {
        let to = col;
        if (r.links[row].includes(col)) to = col + 1;
        else if (r.links[row].includes(col - 1)) to = col - 1;
        const a = p(col, row),
          b = p(to, row + 1);
        line(
          c,
          a.x,
          a.y,
          b.x,
          b.y,
          to === col ? "#82bbcb77" : r.map.color,
          horizontal ? 3 : 4,
        );
        if (horizontal) circle(c, a.x, a.y, 3, "#c4d3f588");
      }
    r.actors.forEach((a, i) => {
      const start = p(i, 0),
        end = p(i, rows);
      avatar(
        c,
        a,
        horizontal ? 75 : start.x,
        horizontal ? start.y : 128,
        Math.max(10, Math.min(16, 180 / n)),
        false,
        a.safe ? 0.35 : 1,
      );
      rounded(
        c,
        end.x - 15,
        end.y - 13,
        30,
        26,
        5,
        r.bad.has(i) ? "#ba5b65" : "#598476",
      );
      label(c, r.bad.has(i) ? "!" : "✓", end.x, end.y, 15, "#f1ecdf");
    });
    if (r.water) {
      const w = r.water,
        a = p(w.from, w.row),
        b = p(w.to, w.row + 1);
      const x = a.x + (b.x - a.x) * w.progress,
        y = a.y + (b.y - a.y) * w.progress;
      circle(c, x, y, 27, "#94dbe255");
      avatar(c, w.actor, x, y, 21, false);
      if (!preview)
        label(c, w.actor.name + "의 튜브", 600, 680, 20, w.actor.color);
    }
    const mist = c.createLinearGradient(
      horizontal ? 920 : 0,
      horizontal ? 0 : 540,
      horizontal ? 1100 : 0,
      horizontal ? 0 : 645,
    );
    mist.addColorStop(0, "#12243500");
    mist.addColorStop(1, "#0b1b31d9");
    c.fillStyle = mist;
    c.fillRect(
      horizontal ? 920 : 25,
      horizontal ? 150 : 540,
      horizontal ? 190 : 1150,
      horizontal ? 475 : 105,
    );
    label(
      c,
      horizontal
        ? "심해 회로를 따라 왼쪽에서 오른쪽으로"
        : r.map.id === "falls"
          ? "협곡의 지그재그 급류를 따라 내려갑니다"
          : "물길을 따라 아래로 내려갑니다",
      600,
      705,
      15,
      r.map.color,
    );
  }
  function chart(r, c, preview) {
    const left = 90,
      top = 195,
      w = 1020,
      h = 425,
      y = (v) => top + h - ((v - 20) / 155) * h;
    if (r.map.id === "crypto") {
      c.fillStyle = "#1e2148";
      c.fillRect(left, top, w, h);
      c.beginPath();
      r.candles.forEach((p, i) => {
        const x = left + (i * w) / (r.candles.length - 1);
        if (i === 0) c.moveTo(x, y(p.close));
        else c.lineTo(x, y(p.close));
      });
      c.lineTo(left + w, top + h);
      c.lineTo(left, top + h);
      c.fillStyle = "#5b74ba55";
      c.fill();
    } else if (r.map.id === "delist") {
      rounded(c, left, top, w, h, 12, "#302332", "#af697f");
      rounded(c, left, y(38), w, top + h - y(38), 2, "#ff52633f");
      for (let i = 0; i < 12; i++)
        line(
          c,
          left + i * 90,
          top + h,
          left + i * 90 + 60,
          top + h - 40,
          "#ff8d5e44",
          5,
        );
    } else {
      rounded(c, left, top, w, h, 12, "#183731", "#77cda566");
      for (let i = 0; i < 12; i++)
        rounded(
          c,
          left + i * 90,
          top + h - 80 - (i % 5) * 25,
          50,
          80 + (i % 5) * 25,
          2,
          "#41736533",
        );
    }
    for (let i = 0; i < 5; i++) {
      const yy = top + (i * h) / 4;
      line(c, left, yy, left + w, yy, "#cadbca22");
      label(c, String(175 - i * 39), left - 30, yy, 14, "#9eb9c3");
    }
    const dx = w / r.candles.length;
    r.candles.forEach((p, i) => {
      const x = left + dx * (i + 0.5);
      if (r.map.id !== "crypto") {
        line(
          c,
          x,
          y(p.high),
          x,
          y(p.low),
          p.close > p.open ? "#a5e1af" : "#ef9ea4",
          2,
        );
        rounded(
          c,
          x - dx * 0.25,
          Math.min(y(p.open), y(p.close)),
          dx * 0.5,
          Math.max(3, Math.abs(y(p.close) - y(p.open))),
          2,
          p.close > p.open ? "#76c69e" : "#db8a9e",
        );
      }
    });
    c.beginPath();
    r.candles.forEach((p, i) => {
      const x = left + dx * (i + 0.5);
      if (i === 0) c.moveTo(x, y(p.close));
      else c.lineTo(x, y(p.close));
    });
    c.strokeStyle = r.map.id === "crypto" ? "#94d5ff" : "#dce8aa";
    c.lineWidth = 5;
    c.stroke();
    alive(r).forEach((a, i) => {
      const x = left + 40 + (i * (w - 80)) / Math.max(1, alive(r).length - 1),
        yy = Math.max(top + 25, Math.min(top + h - 25, y(a.price)));
      rounded(c, x - 19, yy + 16, 38, 12, 4, a.color);
      circle(c, x - 12, yy + 32, 4, "#ccd6c1");
      circle(c, x + 12, yy + 32, 4, "#ccd6c1");
      avatar(c, a, x, yy, 20, !preview);
      a.x = x;
      a.y = yy;
    });
    label(
      c,
      r.map.id === "neon"
        ? "네온 증시 · 완만한 급등"
        : r.map.id === "crypto"
          ? "코인 산맥 · 큰 진폭"
          : "청산 절벽 · 연쇄 급락",
      600,
      157,
      25,
      r.map.color,
    );
    label(
      c,
      "변동성 " + r.map.volatility + "× · 가상 가격",
      600,
      690,
      18,
      r.map.color,
    );
  }
  draw = function (r, c, preview = false) {
    if (!r.map) return original.draw(r, c, preview);
    const custom = [
      "horse",
      "redlight",
      "sushi",
      "balloon",
      "coaster",
      "press",
      "ladder",
    ].includes(r.g.id);
    if (!custom) {
      original.draw(r, c, preview);
      return;
    }
    drawingRun = r;
    scenery(c, r);
    if (r.g.id === "horse") race(r, c, preview);
    else if (r.g.id === "redlight") redlight(r, c, preview);
    else if (r.g.id === "sushi") sushi(r, c, preview);
    else if (r.g.id === "balloon") balloon(r, c, preview);
    else if (r.g.id === "press") press(r, c, preview);
    else if (r.g.id === "ladder") ladder(r, c, preview);
    else chart(r, c, preview);
    if (!preview) drawEffects(r, c);
    drawingRun = null;
  };
})();
