export const SHARE_QUOTES = [
  'Путь к целостности не прямой, но каждый шаг возвращает к себе.',
  'Там, где было напряжение, может появиться бережный ритм.',
  'Исцеление похоже на дорогу: важен не рывок, а устойчивый шаг.',
  'Баланс рождается, когда мы слышим себя и не спешим сражаться с собой.',
  'Свет внутри растет, когда мы выбираем контакт вместо внутренней войны.',
];

export interface ShareCardInput {
  score: number;
  devilRemoved: number;
  humanGained: number;
  quote?: string;
}

export interface ShareCardResult {
  blob: Blob | null;
  quote: string;
  shareText: string;
}

function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): number {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';

  words.forEach((word) => {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  });

  if (line) {
    lines.push(line);
  }

  lines.forEach((l, i) => {
    ctx.fillText(l, x, y + i * lineHeight);
  });

  return y + Math.max(0, lines.length - 1) * lineHeight;
}

async function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = url;
  });
}

async function loadUnicornImage(): Promise<HTMLImageElement | null> {
  const candidates = ['/assets/share/unicorn.png', '/assets/share/unicorn.svg'];

  for (const src of candidates) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const image = await loadImage(src);
      return image;
    } catch {
      // Try next source.
    }
  }

  return null;
}

function toBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png', 0.95);
  });
}

export async function createShareCard(input: ShareCardInput): Promise<ShareCardResult> {
  const quote = input.quote ?? SHARE_QUOTES[Math.floor(Math.random() * SHARE_QUOTES.length)];
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1440;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return {
      blob: null,
      quote,
      shareText: [
        'Внутренний путь — мой результат',
        `Счёт: ${input.score}`,
        `Снято черт тени: ${input.devilRemoved}/5`,
        `Проявлено человеческих черт: ${input.humanGained}/5`,
        `«${quote}»`,
      ].join('\n'),
    };
  }

  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#2b1856');
  gradient.addColorStop(0.46, '#25145c');
  gradient.addColorStop(1, '#1f1146');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.globalAlpha = 0.24;
  ctx.fillStyle = '#6d7aff';
  ctx.beginPath();
  ctx.arc(canvas.width * 0.2, canvas.height * 0.16, 240, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ff6bcf';
  ctx.beginPath();
  ctx.arc(canvas.width * 0.82, canvas.height * 0.22, 260, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.strokeStyle = 'rgba(255, 138, 217, 0.11)';
  ctx.lineWidth = 1;
  const step = 56;
  for (let gx = 0; gx <= canvas.width; gx += step) {
    ctx.beginPath();
    ctx.moveTo(gx, 0);
    ctx.lineTo(gx, canvas.height);
    ctx.stroke();
  }
  for (let gy = 0; gy <= canvas.height; gy += step) {
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.lineTo(canvas.width, gy);
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(21, 9, 38, 0.56)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const panelX = 86;
  const panelY = 170;
  const panelW = canvas.width - 172;
  const panelH = canvas.height - 250;

  ctx.fillStyle = 'rgba(86, 109, 156, 0.62)';
  drawRoundedRect(ctx, panelX, panelY, panelW, panelH, 36);
  ctx.fill();

  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(245, 251, 255, 0.88)';
  drawRoundedRect(ctx, panelX, panelY, panelW, panelH, 36);
  ctx.stroke();

  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(171, 198, 255, 0.6)';
  drawRoundedRect(ctx, panelX + 3, panelY + 3, panelW - 6, panelH - 6, 34);
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = 'rgba(34, 15, 59, 0.9)';
  ctx.lineWidth = 4;
  ctx.font = 'bold 68px "Trebuchet MS", "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.strokeText('Внутренний путь', canvas.width / 2, 124);
  ctx.fillText('Внутренний путь', canvas.width / 2, 124);

  const unicorn = await loadUnicornImage();
  const unicornBox = { x: canvas.width / 2 - 170, y: 236, w: 340, h: 340 };
  if (unicorn) {
    ctx.drawImage(unicorn, unicornBox.x, unicornBox.y, unicornBox.w, unicornBox.h);
  } else {
    ctx.fillStyle = '#f6fbff';
    drawRoundedRect(ctx, unicornBox.x + 40, unicornBox.y + 30, 260, 250, 90);
    ctx.fill();
  }

  ctx.fillStyle = '#f8fcff';
  ctx.strokeStyle = 'rgba(34, 15, 59, 0.9)';
  ctx.lineWidth = 2.5;
  ctx.font = 'bold 50px "Trebuchet MS", "Segoe UI", sans-serif';
  ctx.strokeText(`Счёт: ${input.score}`, canvas.width / 2, 662);
  ctx.fillText(`Счёт: ${input.score}`, canvas.width / 2, 662);

  ctx.font = 'bold 42px "Trebuchet MS", "Segoe UI", sans-serif';
  ctx.strokeText(`Снято черт тени: ${input.devilRemoved}/5`, canvas.width / 2, 736);
  ctx.fillText(`Снято черт тени: ${input.devilRemoved}/5`, canvas.width / 2, 736);

  ctx.strokeText(`Проявлено человеческих черт: ${input.humanGained}/5`, canvas.width / 2, 804);
  ctx.fillText(`Проявлено человеческих черт: ${input.humanGained}/5`, canvas.width / 2, 804);

  ctx.fillStyle = 'rgba(180, 201, 238, 0.24)';
  drawRoundedRect(ctx, panelX + 52, 860, panelW - 104, 262, 30);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'italic 48px "Trebuchet MS", "Segoe UI", sans-serif';
  drawWrappedText(ctx, `«${quote}»`, canvas.width / 2, 920, panelW - 160, 56);

  ctx.font = '600 40px "Trebuchet MS", "Segoe UI", sans-serif';
  ctx.fillStyle = '#f9e9d3';
  drawWrappedText(ctx, 'Игра метафорическая, не является диагностикой или лечением.', canvas.width / 2, panelY + panelH - 92, panelW - 120, 44);

  const blob = await toBlob(canvas);
  const shareText = [
    'Внутренний путь — мой результат',
    `Счёт: ${input.score}`,
    `Снято черт тени: ${input.devilRemoved}/5`,
    `Проявлено человеческих черт: ${input.humanGained}/5`,
    `«${quote}»`,
    '#TelegramMiniApp #ВнутреннийПуть',
  ].join('\n');

  return { blob, quote, shareText };
}
