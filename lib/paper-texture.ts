function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

export function generatePaperGradients(): string {
  const rand = seededRandom(42);
  const gradients: string[] = [];
  for (let i = 0; i < 40; i++) {
    const degrees = Math.floor(rand() * 150) + 30;
    const start = Math.floor(rand() * 100);
    const end = Math.floor(rand() * 20) + start + 1;
    gradients.push(
      `linear-gradient(${degrees}deg, #000 ${start}%, #fff ${Math.min(end, 100)}%)`
    );
  }
  return gradients.join(', ');
}
