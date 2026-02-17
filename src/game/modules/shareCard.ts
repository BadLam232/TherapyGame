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
  gradient.addColorStop(0, '#88a5d4');
  gradient.addColorStop(0.52, '#7ba3cb');
  gradient.addColorStop(1, '#7fb7bf');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.globalAlpha = 0.42;
  ctx.fillStyle = '#d6e8ff';
  ctx.beginPath();
  ctx.arc(canvas.width * 0.72, canvas.height * 0.22, 260, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(canvas.width * 0.22, canvas.height * 0.18, 180, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  const panelX = 86;
  const panelY = 180;
  const panelW = canvas.width - 172;
  const panelH = canvas.height - 300;

  ctx.fillStyle = 'rgba(52, 77, 113, 0.62)';
  drawRoundedRect(ctx, panelX, panelY, panelW, panelH, 36);
  ctx.fill();

  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(245, 251, 255, 0.85)';
  drawRoundedRect(ctx, panelX, panelY, panelW, panelH, 36);
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = 'rgba(37, 57, 84, 0.9)';
  ctx.lineWidth = 4;
  ctx.font = 'bold 68px "Trebuchet MS", "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.strokeText('Внутренний путь', canvas.width / 2, 124);
  ctx.fillText('Внутренний путь', canvas.width / 2, 124);

  const unicorn = await loadUnicornImage();
  const unicornBox = { x: canvas.width / 2 - 170, y: 248, w: 340, h: 340 };
  if (unicorn) {
    ctx.drawImage(unicorn, unicornBox.x, unicornBox.y, unicornBox.w, unicornBox.h);
  } else {
    ctx.fillStyle = '#f6fbff';
    drawRoundedRect(ctx, unicornBox.x + 40, unicornBox.y + 30, 260, 250, 90);
    ctx.fill();
  }

  ctx.fillStyle = '#f8fcff';
  ctx.strokeStyle = 'rgba(39, 58, 85, 0.9)';
  ctx.lineWidth = 2.5;
  ctx.font = 'bold 50px "Trebuchet MS", "Segoe UI", sans-serif';
  ctx.strokeText(`Счёт: ${input.score}`, canvas.width / 2, 680);
  ctx.fillText(`Счёт: ${input.score}`, canvas.width / 2, 680);

  ctx.font = 'bold 42px "Trebuchet MS", "Segoe UI", sans-serif';
  ctx.strokeText(`Снято черт тени: ${input.devilRemoved}/5`, canvas.width / 2, 760);
  ctx.fillText(`Снято черт тени: ${input.devilRemoved}/5`, canvas.width / 2, 760);

  ctx.strokeText(`Проявлено человеческих черт: ${input.humanGained}/5`, canvas.width / 2, 832);
  ctx.fillText(`Проявлено человеческих черт: ${input.humanGained}/5`, canvas.width / 2, 832);

  ctx.fillStyle = 'rgba(205, 224, 255, 0.28)';
  drawRoundedRect(ctx, panelX + 52, 900, panelW - 104, 282, 30);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'italic 40px "Trebuchet MS", "Segoe UI", sans-serif';
  drawWrappedText(ctx, `«${quote}»`, canvas.width / 2, 980, panelW - 180, 54);

  ctx.font = '600 30px "Trebuchet MS", "Segoe UI", sans-serif';
  ctx.fillStyle = '#f9e9d3';
  ctx.fillText('Игра метафорическая, не является диагностикой или лечением.', canvas.width / 2, 1286);

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
