// Generador de códigos QR sin dependencias (modo byte, corrección de errores M, versiones 1 a 9).
// Basado en el algoritmo de referencia del estándar ISO/IEC 18004 (como el de Nayuki, licencia MIT).
// Comprobado con un lector real hasta 170 caracteres; se limita a 150, de sobra para los carteles (~64).

const ECC_POR_BLOQUE = [10, 16, 26, 18, 24, 16, 18, 22, 22, 26]; // nivel M, versiones 1..10
const BLOQUES = [1, 1, 1, 2, 2, 4, 4, 4, 5, 5];
const BITS_FORMATO_M = 0;

function modulosDatos(ver: number) {
  let r = (16 * ver + 128) * ver + 64;
  if (ver >= 2) {
    const n = Math.floor(ver / 7) + 2;
    r -= (25 * n - 10) * n - 55;
    if (ver >= 7) r -= 36;
  }
  return r;
}

const capacidad = (ver: number) => Math.floor(modulosDatos(ver) / 8) - ECC_POR_BLOQUE[ver - 1] * BLOQUES[ver - 1];

function multiplicar(x: number, y: number) {
  let z = 0;
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d);
    z ^= ((y >>> i) & 1) * x;
  }
  return z & 0xff;
}

function divisor(grado: number) {
  const r = new Array<number>(grado).fill(0);
  r[grado - 1] = 1;
  let raiz = 1;
  for (let i = 0; i < grado; i++) {
    for (let j = 0; j < r.length; j++) {
      r[j] = multiplicar(r[j], raiz);
      if (j + 1 < r.length) r[j] ^= r[j + 1];
    }
    raiz = multiplicar(raiz, 0x02);
  }
  return r;
}

function resto(datos: number[], div: number[]) {
  const r = div.map(() => 0);
  for (const b of datos) {
    const f = b ^ (r.shift() as number);
    r.push(0);
    div.forEach((c, i) => (r[i] ^= multiplicar(c, f)));
  }
  return r;
}

function posicionesAlineacion(ver: number, tam: number) {
  if (ver === 1) return [];
  const n = Math.floor(ver / 7) + 2;
  const paso = Math.ceil((ver * 4 + 4) / (n * 2 - 2)) * 2;
  const r = [6];
  for (let p = tam - 7; r.length < n; p -= paso) r.splice(1, 0, p);
  return r;
}

/** Devuelve la matriz del QR: true = módulo oscuro. */
export function matrizQR(texto: string): boolean[][] {
  const bytes = Array.from(new TextEncoder().encode(texto));
  if (bytes.length > 150) throw new Error("Texto demasiado largo para el QR");
  let ver = 1;
  while (4 + 8 + bytes.length * 8 > capacidad(ver) * 8) ver++;
  const tam = ver * 4 + 17;
  const cap = capacidad(ver);

  // Datos: modo byte (0100), longitud en 8 bits, los bytes, terminador y relleno
  const bits: number[] = [];
  const poner = (v: number, n: number) => {
    for (let i = n - 1; i >= 0; i--) bits.push((v >>> i) & 1);
  };
  poner(4, 4);
  poner(bytes.length, 8);
  bytes.forEach((b) => poner(b, 8));
  poner(0, Math.min(4, cap * 8 - bits.length));
  poner(0, (8 - (bits.length % 8)) % 8);
  for (let p = 0xec; bits.length < cap * 8; p ^= 0xec ^ 0x11) poner(p, 8);
  const datos: number[] = [];
  for (let i = 0; i < bits.length; i += 8) datos.push(bits.slice(i, i + 8).reduce((a, b) => (a << 1) | b, 0));

  // Bloques con corrección de errores, intercalados
  const nBloques = BLOQUES[ver - 1];
  const eccLen = ECC_POR_BLOQUE[ver - 1];
  const totales = Math.floor(modulosDatos(ver) / 8);
  const cortos = nBloques - (totales % nBloques);
  const largoCorto = Math.floor(totales / nBloques);
  const div = divisor(eccLen);
  const bloques: number[][] = [];
  for (let i = 0, k = 0; i < nBloques; i++) {
    const d = datos.slice(k, k + largoCorto - eccLen + (i < cortos ? 0 : 1));
    k += d.length;
    const b = d.concat(resto(d, div));
    if (i < cortos) b.splice(largoCorto - eccLen, 0, 0);
    bloques.push(b);
  }
  const final: number[] = [];
  for (let i = 0; i < bloques[0].length; i++)
    bloques.forEach((b, j) => {
      if (i !== largoCorto - eccLen || j >= cortos) final.push(b[i]);
    });

  // Patrones fijos
  const m = Array.from({ length: tam }, () => new Array<boolean>(tam).fill(false));
  const fijo = Array.from({ length: tam }, () => new Array<boolean>(tam).fill(false));
  const fijar = (x: number, y: number, oscuro: boolean) => {
    m[y][x] = oscuro;
    fijo[y][x] = true;
  };
  for (let i = 0; i < tam; i++) {
    fijar(6, i, i % 2 === 0);
    fijar(i, 6, i % 2 === 0);
  }
  for (const [cx, cy] of [[3, 3], [tam - 4, 3], [3, tam - 4]])
    for (let dy = -4; dy <= 4; dy++)
      for (let dx = -4; dx <= 4; dx++) {
        const x = cx + dx, y = cy + dy;
        const d = Math.max(Math.abs(dx), Math.abs(dy));
        if (x >= 0 && x < tam && y >= 0 && y < tam) fijar(x, y, d !== 2 && d !== 4);
      }
  const al = posicionesAlineacion(ver, tam);
  al.forEach((x, i) =>
    al.forEach((y, j) => {
      if ((i === 0 && j === 0) || (i === 0 && j === al.length - 1) || (i === al.length - 1 && j === 0)) return;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) fijar(x + dx, y + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    })
  );
  const formato = (mascara: number) => {
    const d = (BITS_FORMATO_M << 3) | mascara;
    let r = d;
    for (let i = 0; i < 10; i++) r = (r << 1) ^ ((r >>> 9) * 0x537);
    const b = ((d << 10) | r) ^ 0x5412;
    const bit = (i: number) => ((b >>> i) & 1) === 1;
    for (let i = 0; i <= 5; i++) fijar(8, i, bit(i));
    fijar(8, 7, bit(6));
    fijar(8, 8, bit(7));
    fijar(7, 8, bit(8));
    for (let i = 9; i < 15; i++) fijar(14 - i, 8, bit(i));
    for (let i = 0; i < 8; i++) fijar(tam - 1 - i, 8, bit(i));
    for (let i = 8; i < 15; i++) fijar(8, tam - 15 + i, bit(i));
    fijar(8, tam - 8, true);
  };
  formato(0);
  if (ver >= 7) {
    let r = ver;
    for (let i = 0; i < 12; i++) r = (r << 1) ^ ((r >>> 11) * 0x1f25);
    const b = (ver << 12) | r;
    for (let i = 0; i < 18; i++) {
      const bit = ((b >>> i) & 1) === 1;
      const a = tam - 11 + (i % 3), c = Math.floor(i / 3);
      fijar(a, c, bit);
      fijar(c, a, bit);
    }
  }

  // Colocar los datos en zigzag
  let i = 0;
  for (let der = tam - 1; der >= 1; der -= 2) {
    if (der === 6) der = 5;
    for (let v = 0; v < tam; v++)
      for (let j = 0; j < 2; j++) {
        const x = der - j;
        const y = ((der + 1) & 2) === 0 ? tam - 1 - v : v;
        if (!fijo[y][x] && i < final.length * 8) {
          m[y][x] = ((final[i >>> 3] >>> (7 - (i & 7))) & 1) === 1;
          i++;
        }
      }
  }

  // Elegir la máscara con menos penalización
  const condiciones = [
    (x: number, y: number) => (x + y) % 2 === 0,
    (_x: number, y: number) => y % 2 === 0,
    (x: number) => x % 3 === 0,
    (x: number, y: number) => (x + y) % 3 === 0,
    (x: number, y: number) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
    (x: number, y: number) => ((x * y) % 2) + ((x * y) % 3) === 0,
    (x: number, y: number) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
    (x: number, y: number) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
  ];
  const aplicar = (k: number) => {
    for (let y = 0; y < tam; y++) for (let x = 0; x < tam; x++) if (!fijo[y][x] && condiciones[k](x, y)) m[y][x] = !m[y][x];
  };
  const penalizacion = () => {
    let p = 0, oscuros = 0;
    for (let y = 0; y < tam; y++) {
      for (let dir = 0; dir < 2; dir++) {
        let run = 1;
        for (let x = 1; x < tam; x++) {
          const a = dir ? m[x][y] : m[y][x], b = dir ? m[x - 1][y] : m[y][x - 1];
          if (a === b) {
            run++;
            if (run === 5) p += 3;
            else if (run > 5) p++;
          } else run = 1;
        }
      }
      for (let x = 0; x < tam; x++) {
        if (m[y][x]) oscuros++;
        if (y < tam - 1 && x < tam - 1 && m[y][x] === m[y][x + 1] && m[y][x] === m[y + 1][x] && m[y][x] === m[y + 1][x + 1]) p += 3;
      }
    }
    return p + Math.floor(Math.abs(oscuros * 20 - tam * tam * 10) / (tam * tam)) * 10;
  };
  let mejor = 0, minimo = Infinity;
  for (let k = 0; k < 8; k++) {
    aplicar(k);
    formato(k);
    const p = penalizacion();
    if (p < minimo) [minimo, mejor] = [p, k];
    aplicar(k);
  }
  aplicar(mejor);
  formato(mejor);
  return m;
}

/** El QR como un único trazado SVG (sin margen: el margen blanco lo pone quien lo dibuja). */
export function svgQR(texto: string, color = "#1B1A18") {
  const m = matrizQR(texto);
  let d = "";
  m.forEach((fila, y) => fila.forEach((o, x) => o && (d += `M${x} ${y}h1v1h-1z`)));
  return { tam: m.length, d, color };
}
