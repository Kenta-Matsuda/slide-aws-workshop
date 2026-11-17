// 撮影済みの画面キャプチャを切り抜き、番号つきの枠と吹き出しを付ける。
// ログインが必要な画面は tools/shoot.cjs で撮れないため、手で撮った画像（assets/shots/raw）にこれで注釈を付ける。
// 使い方：HTML で window.SHOT = {...} を定義してから、このファイルを読み込む。
//   src     : 画像のパス
//   crop    : [x, y, w, h]  元画像の切り抜き範囲（px）
//   scale   : 切り抜いた画像の表示倍率（既定 1）
//   bubbleW : 右の吹き出しの列の幅（既定 360）。0 にすると吹き出しを出さず枠だけ
//   boxes   : [{ x, y, w, h, text }]  元画像の座標で枠を指定。text が吹き出しの文
//   gap     : 吹き出しどうしの最小の間隔（既定 14）
window.addEventListener('load', async () => { await document.fonts.ready;
  const S = window.SHOT;
  const scale = S.scale || 1;
  const [cx, cy, cw, ch] = S.crop;
  const bw = S.bubbleW === undefined ? 360 : S.bubbleW;
  const imgW = Math.round(cw * scale), imgH = Math.round(ch * scale);
  const gutter = bw ? 40 : 0;
  const W = imgW + gutter + bw, H = imgH;

  const fig = document.getElementById('fig');
  fig.style.width = W + 'px';
  fig.style.height = H + 'px';

  const shot = document.createElement('div');
  shot.className = 'an-shot';
  Object.assign(shot.style, {
    width: imgW + 'px', height: imgH + 'px',
    backgroundImage: `url(${S.src})`,
    backgroundSize: `${Math.round((S.imgW || 1152) * scale)}px auto`,
    backgroundPosition: `${-cx * scale}px ${-cy * scale}px`,
  });
  fig.appendChild(shot);

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'an-wires');
  svg.setAttribute('width', W); svg.setAttribute('height', H);
  fig.appendChild(svg);

  // 個人情報（メールアドレスなど）を伏せる。masks: [{ x, y, w, h }] 元画像の座標
  (S.masks || []).forEach((m) => {
    const el = document.createElement('div');
    el.className = 'an-mask';
    Object.assign(el.style, { left: (m.x - cx) * scale + 'px', top: (m.y - cy) * scale + 'px', width: m.w * scale + 'px', height: m.h * scale + 'px' });
    fig.appendChild(el);
  });

  const boxes = (S.boxes || []).map((b, i) => {
    const x = (b.x - cx) * scale, y = (b.y - cy) * scale, w = b.w * scale, h = b.h * scale;
    const el = document.createElement('div');
    el.className = 'an-box';
    Object.assign(el.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' });
    fig.appendChild(el);
    const n = document.createElement('div');
    n.className = 'an-num';
    n.textContent = String(i + 1);
    Object.assign(n.style, { left: (x - 16) + 'px', top: (y - 16) + 'px' });
    fig.appendChild(n);
    return { x, y, w, h, text: b.text, i };
  });

  if (!bw) { document.body.dataset.ready = '1'; return; }

  // 吹き出しを右の列に置く。枠の縦の中心に合わせ、重ならないように下へずらす
  const placed = [];
  const gap = S.gap || 14;
  const left = imgW + gutter;
  let lastBottom = -Infinity;
  boxes.forEach((b) => {
    const el = document.createElement('div');
    el.className = 'an-bub';
    el.innerHTML = `<b>${b.i + 1}</b><span>${b.text}</span>`;
    el.style.left = left + 'px';
    el.style.width = bw + 'px';
    fig.appendChild(el);
    const h = el.offsetHeight;
    let top = b.y + b.h / 2 - h / 2;
    top = Math.max(top, lastBottom + gap, 0);
    lastBottom = top + h;
    placed.push({ b, top, h, el });
  });
  // 下にはみ出したら、下から順に上へ押し戻す
  let limit = H;
  for (let k = placed.length - 1; k >= 0; k--) {
    const q = placed[k];
    if (q.top + q.h > limit) q.top = Math.max(0, limit - q.h);
    limit = q.top - gap;
  }
  placed.forEach((q) => { q.el.style.top = q.top + 'px'; });

  placed.forEach(({ b, top, h }) => {
    const y1 = b.y + b.h / 2, x1 = b.x + b.w;
    const y2 = top + h / 2, x2 = left;
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    const mx = imgW + gutter / 2;
    p.setAttribute('points', `${x1},${y1} ${mx},${y1} ${mx},${y2} ${x2},${y2}`);
    p.setAttribute('fill', 'none');
    p.setAttribute('stroke', '#ff4d00');
    p.setAttribute('stroke-width', '3');
    svg.appendChild(p);
  });

  document.body.dataset.ready = '1';
});
