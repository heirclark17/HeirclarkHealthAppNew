// PatternBackground - SVG pattern generator for frosted glass-compatible backgrounds
// Creates visually rich textures that blur beautifully with liquid glass overlays

import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Colors } from '../../constants/Theme';
import Svg, {
  Defs,
  Pattern,
  Rect,
  Circle,
  Path,
  G,
  LinearGradient,
  Stop,
  Polygon,
  Line,
  Ellipse,
  RadialGradient,
} from 'react-native-svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export type PatternType =
  | 'noise-grain'
  | 'geometric-hexagons'
  | 'organic-blobs'
  | 'topographic'
  | 'waves'
  | 'dots-grid'
  | 'circuit-board'
  | 'mesh-gradient'
  | 'bokeh'
  | 'crystals'
  | 'marble'
  | 'water-ripples'
  | 'fabric-weave'
  | 'starfield'
  | 'aurora-bands'
  | 'midnight-gold-leopard'
  | 'classic-safari-leopard'
  | 'snow-leopard-frost'
  | 'rose-gold-leopard'
  | 'obsidian-leopard'
  | 'cheetah-luxe'
  // Holiday patterns
  | 'christmas-festive'
  | 'halloween-spooky'
  | 'thanksgiving-harvest'
  | 'fourth-of-july'
  | 'valentines-hearts'
  | 'easter-spring'
  | 'cinco-de-mayo';

interface PatternBackgroundProps {
  pattern: PatternType;
  isDark: boolean;
  width?: number;
  height?: number;
}

// Generate random but deterministic values for consistent patterns
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// Noise Grain Pattern - Film-like texture
function NoiseGrainPattern({ isDark }: { isDark: boolean }) {
  const dots = useMemo(() => {
    const result = [];
    const density = 1200;
    for (let i = 0; i < density; i++) {
      const x = seededRandom(i * 1.1) * SCREEN_WIDTH;
      const y = seededRandom(i * 2.2) * SCREEN_HEIGHT;
      const opacity = seededRandom(i * 3.3) * 0.15 + 0.02;
      const size = seededRandom(i * 4.4) * 1.5 + 0.5;
      result.push(
        <Circle
          key={i}
          cx={x}
          cy={y}
          r={size}
          fill={isDark ? Colors.text : Colors.background}
          opacity={opacity}
        />
      );
    }
    return result;
  }, [isDark]);

  const bgColor = isDark ? '#0D0D0D' : '#F5F5F7';

  return (
    <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT} style={StyleSheet.absoluteFill}>
      <Rect width="100%" height="100%" fill={bgColor} />
      <Defs>
        <LinearGradient id="grainOverlay" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={isDark ? Colors.card : '#f0f0f0'} stopOpacity={0.4} />
          <Stop offset="50%" stopColor={isDark ? '#0d0d0d' : '#fafafa'} stopOpacity={0.2} />
          <Stop offset="100%" stopColor={isDark ? Colors.card : '#f0f0f0'} stopOpacity={0.4} />
        </LinearGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#grainOverlay)" />
      {dots}
    </Svg>
  );
}

// Geometric Hexagons Pattern
function GeometricHexagonsPattern({ isDark }: { isDark: boolean }) {
  const hexSize = 40;
  const hexWidth = hexSize * 2;
  const hexHeight = hexSize * Math.sqrt(3);

  const hexPath = (cx: number, cy: number, size: number) => {
    const points = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      points.push(`${cx + size * Math.cos(angle)},${cy + size * Math.sin(angle)}`);
    }
    return `M${points.join('L')}Z`;
  };

  const hexagons = useMemo(() => {
    const result = [];
    const cols = Math.ceil(SCREEN_WIDTH / (hexWidth * 0.75)) + 2;
    const rows = Math.ceil(SCREEN_HEIGHT / hexHeight) + 2;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * hexWidth * 0.75;
        const y = row * hexHeight + (col % 2 === 0 ? 0 : hexHeight / 2);
        const opacity = seededRandom(row * cols + col) * 0.08 + 0.02;
        result.push(
          <Path
            key={`hex-${row}-${col}`}
            d={hexPath(x, y, hexSize - 2)}
            fill="none"
            stroke={isDark ? Colors.text : Colors.background}
            strokeWidth={0.5}
            opacity={opacity}
          />
        );
      }
    }
    return result;
  }, [isDark]);

  const bgColors = isDark
    ? ['#0a0a0f', '#0f0a14', '#0a1010']
    : ['#f5f5fa', '#f8f5fa', '#f5f8f8'];

  return (
    <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT} style={StyleSheet.absoluteFill}>
      <Defs>
        <LinearGradient id="hexBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={bgColors[0]} />
          <Stop offset="50%" stopColor={bgColors[1]} />
          <Stop offset="100%" stopColor={bgColors[2]} />
        </LinearGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#hexBg)" />
      {hexagons}
    </Svg>
  );
}

// Organic Blobs Pattern
function OrganicBlobsPattern({ isDark }: { isDark: boolean }) {
  const blobs = useMemo(() => {
    const result = [];
    const count = 8;

    for (let i = 0; i < count; i++) {
      const cx = seededRandom(i * 10) * SCREEN_WIDTH;
      const cy = seededRandom(i * 20) * SCREEN_HEIGHT;
      const rx = seededRandom(i * 30) * 200 + 100;
      const ry = seededRandom(i * 40) * 150 + 80;
      const rotation = seededRandom(i * 50) * 360;

      const colors = isDark
        ? ['rgba(100, 60, 120, 0.15)', 'rgba(60, 100, 120, 0.15)', 'rgba(80, 120, 80, 0.12)']
        : ['rgba(200, 160, 220, 0.25)', 'rgba(160, 200, 220, 0.25)', 'rgba(180, 220, 180, 0.2)'];

      const color = colors[i % colors.length];

      result.push(
        <Ellipse
          key={i}
          cx={cx}
          cy={cy}
          rx={rx}
          ry={ry}
          fill={color}
          transform={`rotate(${rotation} ${cx} ${cy})`}
        />
      );
    }
    return result;
  }, [isDark]);

  const bgColor = isDark ? '#0a0a0a' : '#fafafa';

  return (
    <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT} style={StyleSheet.absoluteFill}>
      <Defs>
        <RadialGradient id="blobBg" cx="50%" cy="30%" r="70%">
          <Stop offset="0%" stopColor={isDark ? '#141418' : '#f8f8fc'} />
          <Stop offset="100%" stopColor={bgColor} />
        </RadialGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#blobBg)" />
      {blobs}
    </Svg>
  );
}

// Topographic Lines Pattern
function TopographicPattern({ isDark }: { isDark: boolean }) {
  const lines = useMemo(() => {
    const result = [];
    const lineCount = 25;

    for (let i = 0; i < lineCount; i++) {
      const baseY = (i / lineCount) * SCREEN_HEIGHT + seededRandom(i * 100) * 50;
      let path = `M0,${baseY}`;

      const segments = 20;
      for (let j = 1; j <= segments; j++) {
        const x = (j / segments) * SCREEN_WIDTH;
        const wave = Math.sin(j * 0.5 + i * 0.3) * 30;
        const noise = seededRandom(i * 1000 + j) * 20 - 10;
        const y = baseY + wave + noise;
        path += ` Q${x - SCREEN_WIDTH / segments / 2},${y + seededRandom(i * j) * 10} ${x},${y}`;
      }

      const opacity = seededRandom(i * 7) * 0.12 + 0.03;
      result.push(
        <Path
          key={i}
          d={path}
          fill="none"
          stroke={isDark ? '#8ba5b5' : '#5a7585'}
          strokeWidth={0.8}
          opacity={opacity}
        />
      );
    }
    return result;
  }, [isDark]);

  const bgColors = isDark
    ? ['#0a1015', '#0d1218', '#0a0f12']
    : ['#e8f0f5', '#f0f5f8', '#e5eef2'];

  return (
    <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT} style={StyleSheet.absoluteFill}>
      <Defs>
        <LinearGradient id="topoBg" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor={bgColors[0]} />
          <Stop offset="50%" stopColor={bgColors[1]} />
          <Stop offset="100%" stopColor={bgColors[2]} />
        </LinearGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#topoBg)" />
      {lines}
    </Svg>
  );
}

// Waves Pattern
function WavesPattern({ isDark }: { isDark: boolean }) {
  const waves = useMemo(() => {
    const result = [];
    const waveCount = 12;

    for (let i = 0; i < waveCount; i++) {
      const baseY = (i / waveCount) * SCREEN_HEIGHT * 1.2;
      let path = `M-50,${baseY}`;

      const amplitude = 30 + i * 3;
      const frequency = 0.008 - i * 0.0003;

      for (let x = 0; x <= SCREEN_WIDTH + 100; x += 20) {
        const y = baseY + Math.sin(x * frequency + i * 0.5) * amplitude;
        path += ` L${x},${y}`;
      }

      path += ` L${SCREEN_WIDTH + 100},${SCREEN_HEIGHT + 100} L-50,${SCREEN_HEIGHT + 100} Z`;

      const colors = isDark
        ? [`rgba(30, 60, 90, ${0.15 - i * 0.01})`, `rgba(40, 70, 100, ${0.12 - i * 0.008})`]
        : [`rgba(180, 210, 240, ${0.3 - i * 0.02})`, `rgba(200, 225, 250, ${0.25 - i * 0.015})`];

      result.push(
        <Path key={i} d={path} fill={colors[i % 2]} />
      );
    }
    return result;
  }, [isDark]);

  const bgColor = isDark ? '#05101a' : '#e0f0ff';

  return (
    <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT} style={StyleSheet.absoluteFill}>
      <Rect width="100%" height="100%" fill={bgColor} />
      {waves}
    </Svg>
  );
}

// Dots Grid Pattern
function DotsGridPattern({ isDark }: { isDark: boolean }) {
  const dots = useMemo(() => {
    const result = [];
    const spacing = 24;
    const cols = Math.ceil(SCREEN_WIDTH / spacing) + 1;
    const rows = Math.ceil(SCREEN_HEIGHT / spacing) + 1;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * spacing;
        const y = row * spacing;
        const distFromCenter = Math.sqrt(
          Math.pow(x - SCREEN_WIDTH / 2, 2) + Math.pow(y - SCREEN_HEIGHT / 2, 2)
        );
        const maxDist = Math.sqrt(Math.pow(SCREEN_WIDTH, 2) + Math.pow(SCREEN_HEIGHT, 2)) / 2;
        const sizeFactor = 1 - (distFromCenter / maxDist) * 0.5;
        const size = (1.5 + seededRandom(row * cols + col) * 1) * sizeFactor;
        const opacity = 0.15 + seededRandom(row * cols + col + 1000) * 0.1;

        result.push(
          <Circle
            key={`${row}-${col}`}
            cx={x}
            cy={y}
            r={size}
            fill={isDark ? Colors.text : Colors.background}
            opacity={opacity}
          />
        );
      }
    }
    return result;
  }, [isDark]);

  const bgColor = isDark ? '#0a0a0a' : '#f8f8f8';

  return (
    <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT} style={StyleSheet.absoluteFill}>
      <Rect width="100%" height="100%" fill={bgColor} />
      {dots}
    </Svg>
  );
}

// Circuit Board Pattern
function CircuitBoardPattern({ isDark }: { isDark: boolean }) {
  const circuits = useMemo(() => {
    const result = [];
    const gridSize = 40;
    const cols = Math.ceil(SCREEN_WIDTH / gridSize) + 1;
    const rows = Math.ceil(SCREEN_HEIGHT / gridSize) + 1;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * gridSize;
        const y = row * gridSize;
        const rand = seededRandom(row * cols + col);

        // Node
        if (rand > 0.7) {
          result.push(
            <Circle
              key={`node-${row}-${col}`}
              cx={x}
              cy={y}
              r={2}
              fill={isDark ? Colors.success : '#2a9d8f'}
              opacity={0.4}
            />
          );
        }

        // Horizontal line
        if (rand > 0.4 && rand < 0.7) {
          result.push(
            <Line
              key={`h-${row}-${col}`}
              x1={x}
              y1={y}
              x2={x + gridSize}
              y2={y}
              stroke={isDark ? Colors.success : '#2a9d8f'}
              strokeWidth={0.5}
              opacity={0.2}
            />
          );
        }

        // Vertical line
        if (rand > 0.2 && rand < 0.5) {
          result.push(
            <Line
              key={`v-${row}-${col}`}
              x1={x}
              y1={y}
              x2={x}
              y2={y + gridSize}
              stroke={isDark ? Colors.success : '#2a9d8f'}
              strokeWidth={0.5}
              opacity={0.2}
            />
          );
        }
      }
    }
    return result;
  }, [isDark]);

  const bgColor = isDark ? '#050a0a' : '#f0f8f8';

  return (
    <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT} style={StyleSheet.absoluteFill}>
      <Rect width="100%" height="100%" fill={bgColor} />
      {circuits}
    </Svg>
  );
}

// Mesh Gradient Pattern (simulated with overlapping gradients)
function MeshGradientPattern({ isDark }: { isDark: boolean }) {
  const meshElements = useMemo(() => {
    const result = [];
    const count = 6;

    const darkColors = [
      ['#1a0a20', '#0a1520'],
      ['#0a1a15', '#15100a'],
      ['#100a1a', '#0a1818'],
    ];

    const lightColors = [
      ['#ffe0f0', '#e0f0ff'],
      ['#e0fff0', '#fff0e0'],
      ['#f0e0ff', '#e0ffff'],
    ];

    for (let i = 0; i < count; i++) {
      const cx = seededRandom(i * 11) * SCREEN_WIDTH;
      const cy = seededRandom(i * 22) * SCREEN_HEIGHT;
      const r = seededRandom(i * 33) * 300 + 150;
      const colors = isDark ? darkColors[i % 3] : lightColors[i % 3];

      result.push(
        <G key={i}>
          <Defs>
            <RadialGradient id={`mesh-${i}`} cx={cx} cy={cy} r={r} gradientUnits="userSpaceOnUse">
              <Stop offset="0%" stopColor={colors[0]} stopOpacity={0.6} />
              <Stop offset="100%" stopColor={colors[1]} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect width="100%" height="100%" fill={`url(#mesh-${i})`} />
        </G>
      );
    }
    return result;
  }, [isDark]);

  const bgColor = isDark ? '#0a0a0a' : '#f5f5f5';

  return (
    <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT} style={StyleSheet.absoluteFill}>
      <Rect width="100%" height="100%" fill={bgColor} />
      {meshElements}
    </Svg>
  );
}

// Bokeh Pattern
function BokehPattern({ isDark }: { isDark: boolean }) {
  const bokehCircles = useMemo(() => {
    const result = [];
    const count = 30;

    for (let i = 0; i < count; i++) {
      const cx = seededRandom(i * 12) * SCREEN_WIDTH;
      const cy = seededRandom(i * 23) * SCREEN_HEIGHT;
      const r = seededRandom(i * 34) * 60 + 20;
      const opacity = seededRandom(i * 45) * 0.15 + 0.03;

      const darkColors = [Colors.error, Colors.success, '#ffe66d', '#a8dadc'];
      const lightColors = ['#ff9999', '#7eeee5', '#fff3a3', '#c5e8ea'];
      const colors = isDark ? darkColors : lightColors;
      const color = colors[i % colors.length];

      result.push(
        <Circle
          key={i}
          cx={cx}
          cy={cy}
          r={r}
          fill={color}
          opacity={opacity}
        />
      );
    }
    return result;
  }, [isDark]);

  const bgColor = isDark ? '#0a0808' : '#faf8f5';

  return (
    <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT} style={StyleSheet.absoluteFill}>
      <Rect width="100%" height="100%" fill={bgColor} />
      {bokehCircles}
    </Svg>
  );
}

// Crystals Pattern
function CrystalsPattern({ isDark }: { isDark: boolean }) {
  const crystals = useMemo(() => {
    const result = [];
    const count = 15;

    for (let i = 0; i < count; i++) {
      const cx = seededRandom(i * 13) * SCREEN_WIDTH;
      const cy = seededRandom(i * 24) * SCREEN_HEIGHT;
      const size = seededRandom(i * 35) * 80 + 40;
      const rotation = seededRandom(i * 46) * 360;
      const sides = Math.floor(seededRandom(i * 57) * 3) + 5;

      const points = [];
      for (let j = 0; j < sides; j++) {
        const angle = (Math.PI * 2 * j) / sides + (rotation * Math.PI) / 180;
        const r = size * (0.7 + seededRandom(i * 100 + j) * 0.3);
        points.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
      }

      const opacity = seededRandom(i * 68) * 0.1 + 0.02;
      const strokeOpacity = seededRandom(i * 79) * 0.15 + 0.05;

      result.push(
        <Polygon
          key={i}
          points={points.join(' ')}
          fill={isDark ? 'rgba(150, 200, 255, 0.03)' : 'rgba(100, 150, 200, 0.05)'}
          stroke={isDark ? '#aaccff' : '#6699cc'}
          strokeWidth={0.5}
          strokeOpacity={strokeOpacity}
          opacity={opacity}
        />
      );
    }
    return result;
  }, [isDark]);

  const bgColors = isDark
    ? ['#05080d', '#080510', '#0a0a10']
    : ['#f0f5fa', '#f5f0fa', '#f5f5fa'];

  return (
    <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT} style={StyleSheet.absoluteFill}>
      <Defs>
        <LinearGradient id="crystalBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={bgColors[0]} />
          <Stop offset="50%" stopColor={bgColors[1]} />
          <Stop offset="100%" stopColor={bgColors[2]} />
        </LinearGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#crystalBg)" />
      {crystals}
    </Svg>
  );
}

// Marble Pattern
function MarblePattern({ isDark }: { isDark: boolean }) {
  const veins = useMemo(() => {
    const result = [];
    const veinCount = 15;

    for (let i = 0; i < veinCount; i++) {
      const startX = seededRandom(i * 14) * SCREEN_WIDTH;
      const startY = seededRandom(i * 25) * SCREEN_HEIGHT;
      let path = `M${startX},${startY}`;

      const length = seededRandom(i * 36) * 400 + 200;
      const segments = 10;

      for (let j = 1; j <= segments; j++) {
        const angle = seededRandom(i * 100 + j) * Math.PI * 2;
        const dist = (length / segments) * (0.5 + seededRandom(i * j * 2) * 0.5);
        const prevPoint = path.split(' ').pop()?.split(',') || [startX, startY];
        const prevX = parseFloat(String(prevPoint[0]).replace(/[A-Z]/g, ''));
        const prevY = parseFloat(String(prevPoint[1]));
        const newX = prevX + Math.cos(angle) * dist;
        const newY = prevY + Math.sin(angle) * dist;
        const cpX = prevX + (newX - prevX) * 0.5 + (seededRandom(i * j * 3) - 0.5) * 30;
        const cpY = prevY + (newY - prevY) * 0.5 + (seededRandom(i * j * 4) - 0.5) * 30;
        path += ` Q${cpX},${cpY} ${newX},${newY}`;
      }

      const opacity = seededRandom(i * 47) * 0.08 + 0.02;
      result.push(
        <Path
          key={i}
          d={path}
          fill="none"
          stroke={isDark ? Colors.textMuted : Colors.textSecondary}
          strokeWidth={seededRandom(i * 58) * 2 + 0.5}
          opacity={opacity}
        />
      );
    }
    return result;
  }, [isDark]);

  const bgColor = isDark ? '#0d0d0d' : '#f8f8f8';

  return (
    <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT} style={StyleSheet.absoluteFill}>
      <Rect width="100%" height="100%" fill={bgColor} />
      {veins}
    </Svg>
  );
}

// Water Ripples Pattern
function WaterRipplesPattern({ isDark }: { isDark: boolean }) {
  const ripples = useMemo(() => {
    const result = [];
    const centers = 5;

    for (let c = 0; c < centers; c++) {
      const cx = seededRandom(c * 15) * SCREEN_WIDTH;
      const cy = seededRandom(c * 26) * SCREEN_HEIGHT;
      const maxRings = Math.floor(seededRandom(c * 37) * 5) + 5;

      for (let i = 0; i < maxRings; i++) {
        const r = (i + 1) * 40 + seededRandom(c * 100 + i) * 20;
        const opacity = (1 - i / maxRings) * 0.12;

        result.push(
          <Circle
            key={`${c}-${i}`}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={isDark ? '#6eb5ff' : '#3a8fd9'}
            strokeWidth={1}
            opacity={opacity}
          />
        );
      }
    }
    return result;
  }, [isDark]);

  const bgColors = isDark
    ? ['#050810', '#081015', '#051012']
    : ['#e8f4fc', '#f0f8ff', '#e5f2fa'];

  return (
    <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT} style={StyleSheet.absoluteFill}>
      <Defs>
        <LinearGradient id="rippleBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={bgColors[0]} />
          <Stop offset="50%" stopColor={bgColors[1]} />
          <Stop offset="100%" stopColor={bgColors[2]} />
        </LinearGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#rippleBg)" />
      {ripples}
    </Svg>
  );
}

// Fabric Weave Pattern
function FabricWeavePattern({ isDark }: { isDark: boolean }) {
  const threads = useMemo(() => {
    const result = [];
    const spacing = 8;
    const cols = Math.ceil(SCREEN_WIDTH / spacing) + 1;
    const rows = Math.ceil(SCREEN_HEIGHT / spacing) + 1;

    // Horizontal threads
    for (let row = 0; row < rows; row++) {
      const y = row * spacing;
      const opacity = 0.05 + seededRandom(row * 2) * 0.03;
      result.push(
        <Line
          key={`h-${row}`}
          x1={0}
          y1={y}
          x2={SCREEN_WIDTH}
          y2={y}
          stroke={isDark ? Colors.textMuted : Colors.textMuted}
          strokeWidth={0.5}
          opacity={opacity}
        />
      );
    }

    // Vertical threads
    for (let col = 0; col < cols; col++) {
      const x = col * spacing;
      const opacity = 0.04 + seededRandom(col * 3) * 0.03;
      result.push(
        <Line
          key={`v-${col}`}
          x1={x}
          y1={0}
          x2={x}
          y2={SCREEN_HEIGHT}
          stroke={isDark ? Colors.textMuted : Colors.textMuted}
          strokeWidth={0.5}
          opacity={opacity}
        />
      );
    }

    return result;
  }, [isDark]);

  const bgColor = isDark ? '#0d0d0d' : '#f5f5f5';

  return (
    <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT} style={StyleSheet.absoluteFill}>
      <Rect width="100%" height="100%" fill={bgColor} />
      {threads}
    </Svg>
  );
}

// Starfield Pattern
function StarfieldPattern({ isDark }: { isDark: boolean }) {
  const stars = useMemo(() => {
    const result = [];
    const count = 200;

    for (let i = 0; i < count; i++) {
      const x = seededRandom(i * 16) * SCREEN_WIDTH;
      const y = seededRandom(i * 27) * SCREEN_HEIGHT;
      const size = seededRandom(i * 38) * 2 + 0.5;
      const opacity = seededRandom(i * 49) * 0.7 + 0.2;

      result.push(
        <Circle
          key={i}
          cx={x}
          cy={y}
          r={size}
          fill={isDark ? Colors.text : '#aaaaaa'}
          opacity={opacity}
        />
      );

      // Some stars have a glow
      if (seededRandom(i * 60) > 0.85) {
        result.push(
          <Circle
            key={`glow-${i}`}
            cx={x}
            cy={y}
            r={size * 3}
            fill={isDark ? Colors.text : '#aaaaaa'}
            opacity={opacity * 0.15}
          />
        );
      }
    }
    return result;
  }, [isDark]);

  const bgColors = isDark
    ? ['#02050a', '#050810', '#020508']
    : ['#d0d8e0', '#e0e8f0', '#d5dde5'];

  return (
    <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT} style={StyleSheet.absoluteFill}>
      <Defs>
        <RadialGradient id="starBg" cx="50%" cy="40%" r="70%">
          <Stop offset="0%" stopColor={bgColors[1]} />
          <Stop offset="100%" stopColor={bgColors[0]} />
        </RadialGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#starBg)" />
      {stars}
    </Svg>
  );
}

// Aurora Bands Pattern
function AuroraBandsPattern({ isDark }: { isDark: boolean }) {
  const bands = useMemo(() => {
    const result = [];
    const bandCount = 8;

    for (let i = 0; i < bandCount; i++) {
      const baseY = (i / bandCount) * SCREEN_HEIGHT * 0.6 + SCREEN_HEIGHT * 0.1;
      let path = `M-50,${baseY + 50}`;

      // Top curve
      for (let x = 0; x <= SCREEN_WIDTH + 100; x += 30) {
        const wave1 = Math.sin(x * 0.01 + i * 0.8) * 40;
        const wave2 = Math.sin(x * 0.02 + i * 1.2) * 20;
        const y = baseY + wave1 + wave2;
        path += ` L${x},${y}`;
      }

      // Bottom curve
      path += ` L${SCREEN_WIDTH + 100},${baseY + 80}`;
      for (let x = SCREEN_WIDTH + 100; x >= -50; x -= 30) {
        const wave1 = Math.sin(x * 0.01 + i * 0.8 + 0.5) * 30;
        const wave2 = Math.sin(x * 0.02 + i * 1.2 + 0.5) * 15;
        const y = baseY + 60 + wave1 + wave2;
        path += ` L${x},${y}`;
      }
      path += ' Z';

      const darkColors = [
        'rgba(78, 205, 196, 0.12)',
        'rgba(100, 180, 255, 0.10)',
        'rgba(150, 100, 255, 0.08)',
        'rgba(78, 205, 196, 0.06)',
      ];

      const lightColors = [
        'rgba(78, 205, 196, 0.2)',
        'rgba(100, 180, 255, 0.18)',
        'rgba(150, 100, 255, 0.15)',
        'rgba(78, 205, 196, 0.12)',
      ];

      const colors = isDark ? darkColors : lightColors;

      result.push(
        <Path key={i} d={path} fill={colors[i % colors.length]} />
      );
    }
    return result;
  }, [isDark]);

  const bgColors = isDark
    ? ['#020810', '#051018', '#030812']
    : ['#e0f0f8', '#f0f8ff', '#e5f2f8'];

  return (
    <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT} style={StyleSheet.absoluteFill}>
      <Defs>
        <LinearGradient id="auroraBg" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor={bgColors[0]} />
          <Stop offset="50%" stopColor={bgColors[1]} />
          <Stop offset="100%" stopColor={bgColors[2]} />
        </LinearGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#auroraBg)" />
      {bands}
    </Svg>
  );
}

// Midnight Gold Luxe Leopard Pattern
// Premium leopard with gold rosettes - dark mode: black bg, light mode: cream/ivory bg
function MidnightGoldLeopardPattern({ isDark }: { isDark: boolean }) {
  const rosettes = useMemo(() => {
    const result = [];
    const rosetteCount = 45;

    // Midnight Gold color palette - adapts to light/dark mode
    const goldPrimary = isDark ? '#C9A227' : '#8B6914'; // Gold (darker in light mode for contrast)
    const goldLight = isDark ? Colors.accentGold : '#DAA520'; // Shimmer
    const goldDark = isDark ? '#8B7320' : '#5C4A15'; // Shadow spots
    const innerSpot = isDark ? '#0D0D0D' : '#3D2B10'; // Center (brown in light mode)

    for (let i = 0; i < rosetteCount; i++) {
      const cx = seededRandom(i * 17) * SCREEN_WIDTH;
      const cy = seededRandom(i * 28) * SCREEN_HEIGHT;
      const baseSize = seededRandom(i * 39) * 35 + 25;
      const rotation = seededRandom(i * 50) * 30 - 15;
      const rosetteOpacity = isDark
        ? seededRandom(i * 61) * 0.5 + 0.4
        : seededRandom(i * 61) * 0.4 + 0.5; // Higher opacity in light mode

      // Outer rosette ring
      const segments = Math.floor(seededRandom(i * 72) * 3) + 5;
      for (let j = 0; j < segments; j++) {
        const angleStart = (j / segments) * Math.PI * 2 + (seededRandom(i * 100 + j) * 0.3);
        const arcLength = (0.5 + seededRandom(i * j * 2) * 0.4) / segments * Math.PI * 2;
        const strokeWidth = seededRandom(i * j * 3) * 6 + 4;

        const x1 = cx + Math.cos(angleStart) * baseSize;
        const y1 = cy + Math.sin(angleStart) * baseSize;
        const x2 = cx + Math.cos(angleStart + arcLength) * baseSize;
        const y2 = cy + Math.sin(angleStart + arcLength) * baseSize;

        const largeArc = arcLength > Math.PI ? 1 : 0;
        const pathD = `M ${x1} ${y1} A ${baseSize} ${baseSize} 0 ${largeArc} 1 ${x2} ${y2}`;

        result.push(
          <Path
            key={`rosette-${i}-seg-${j}`}
            d={pathD}
            fill="none"
            stroke={goldPrimary}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            opacity={rosetteOpacity}
            transform={`rotate(${rotation} ${cx} ${cy})`}
          />
        );
      }

      // Inner spot
      const innerSize = baseSize * (0.3 + seededRandom(i * 83) * 0.2);
      result.push(
        <Ellipse
          key={`rosette-${i}-inner`}
          cx={cx}
          cy={cy}
          rx={innerSize}
          ry={innerSize * (0.8 + seededRandom(i * 94) * 0.4)}
          fill={innerSpot}
          opacity={rosetteOpacity * 0.9}
          transform={`rotate(${rotation} ${cx} ${cy})`}
        />
      );

      // Gold shimmer highlight
      if (seededRandom(i * 105) > 0.6) {
        result.push(
          <Circle
            key={`rosette-${i}-shimmer`}
            cx={cx + baseSize * 0.3}
            cy={cy - baseSize * 0.3}
            r={baseSize * 0.15}
            fill={goldLight}
            opacity={isDark ? 0.3 : 0.5}
          />
        );
      }
    }

    // Scattered smaller spots
    const spotCount = 60;
    for (let i = 0; i < spotCount; i++) {
      const x = seededRandom(i * 116 + 1000) * SCREEN_WIDTH;
      const y = seededRandom(i * 127 + 1000) * SCREEN_HEIGHT;
      const size = seededRandom(i * 138 + 1000) * 8 + 3;
      const opacity = seededRandom(i * 149 + 1000) * 0.4 + 0.2;

      result.push(
        <Circle
          key={`spot-${i}`}
          cx={x}
          cy={y}
          r={size}
          fill={goldDark}
          opacity={opacity}
        />
      );
    }

    return result;
  }, [isDark]);

  // Background: Dark mode = midnight black, Light mode = warm ivory/cream
  const bgColors = isDark
    ? ['#0D0D0D', '#0A0805', '#0D0D0D'] // Midnight black
    : ['#FFF8E7', '#F5ECD3', '#FFFAF0']; // Warm ivory/cream

  const glowOpacity = isDark ? 0.08 : 0.15;

  return (
    <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT} style={StyleSheet.absoluteFill}>
      <Defs>
        <RadialGradient id="leopardBg" cx="50%" cy="40%" r="80%">
          <Stop offset="0%" stopColor={bgColors[1]} />
          <Stop offset="100%" stopColor={bgColors[0]} />
        </RadialGradient>
        <RadialGradient id="goldGlow" cx="50%" cy="30%" r="60%">
          <Stop offset="0%" stopColor={isDark ? '#C9A227' : '#DAA520'} stopOpacity={glowOpacity} />
          <Stop offset="100%" stopColor={isDark ? '#C9A227' : '#DAA520'} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#leopardBg)" />
      <Rect width="100%" height="100%" fill="url(#goldGlow)" />
      {rosettes}
    </Svg>
  );
}

// Classic Safari Leopard Pattern
// Warm tan background with classic brown/chocolate rosettes
function ClassicSafariLeopardPattern({ isDark }: { isDark: boolean }) {
  const rosettes = useMemo(() => {
    const result = [];
    const rosetteCount = 50;

    // Classic Safari color palette
    const tanBase = isDark ? '#D4A574' : '#E8C9A0'; // Warm tan
    const rosetteOuter = '#2C1810'; // Dark chocolate brown
    const rosetteInner = '#8B5A2B'; // Sienna brown
    const highlight = isDark ? '#F5DEB3' : '#FAEBD7'; // Wheat highlight

    for (let i = 0; i < rosetteCount; i++) {
      const cx = seededRandom(i * 19) * SCREEN_WIDTH;
      const cy = seededRandom(i * 31) * SCREEN_HEIGHT;
      const baseSize = seededRandom(i * 43) * 30 + 20;
      const rotation = seededRandom(i * 55) * 40 - 20;
      const rosetteOpacity = seededRandom(i * 67) * 0.4 + 0.5;

      // Outer rosette segments
      const segments = Math.floor(seededRandom(i * 79) * 3) + 4;
      for (let j = 0; j < segments; j++) {
        const angleStart = (j / segments) * Math.PI * 2 + (seededRandom(i * 91 + j) * 0.4);
        const arcLength = (0.4 + seededRandom(i * j * 2) * 0.4) / segments * Math.PI * 2;
        const strokeWidth = seededRandom(i * j * 3) * 5 + 3;

        const x1 = cx + Math.cos(angleStart) * baseSize;
        const y1 = cy + Math.sin(angleStart) * baseSize;
        const x2 = cx + Math.cos(angleStart + arcLength) * baseSize;
        const y2 = cy + Math.sin(angleStart + arcLength) * baseSize;

        const largeArc = arcLength > Math.PI ? 1 : 0;
        const pathD = `M ${x1} ${y1} A ${baseSize} ${baseSize} 0 ${largeArc} 1 ${x2} ${y2}`;

        result.push(
          <Path
            key={`rosette-${i}-seg-${j}`}
            d={pathD}
            fill="none"
            stroke={rosetteOuter}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            opacity={rosetteOpacity}
            transform={`rotate(${rotation} ${cx} ${cy})`}
          />
        );
      }

      // Inner spot
      const innerSize = baseSize * (0.35 + seededRandom(i * 103) * 0.2);
      result.push(
        <Ellipse
          key={`rosette-${i}-inner`}
          cx={cx}
          cy={cy}
          rx={innerSize}
          ry={innerSize * (0.75 + seededRandom(i * 115) * 0.5)}
          fill={rosetteInner}
          opacity={rosetteOpacity * 0.85}
          transform={`rotate(${rotation} ${cx} ${cy})`}
        />
      );
    }

    // Scattered small spots
    const spotCount = 70;
    for (let i = 0; i < spotCount; i++) {
      const x = seededRandom(i * 127 + 2000) * SCREEN_WIDTH;
      const y = seededRandom(i * 139 + 2000) * SCREEN_HEIGHT;
      const size = seededRandom(i * 151 + 2000) * 6 + 2;
      const opacity = seededRandom(i * 163 + 2000) * 0.4 + 0.3;

      result.push(
        <Circle
          key={`spot-${i}`}
          cx={x}
          cy={y}
          r={size}
          fill={rosetteOuter}
          opacity={opacity}
        />
      );
    }

    return result;
  }, [isDark]);

  const bgColor = isDark ? '#D4A574' : '#E8C9A0';

  return (
    <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT} style={StyleSheet.absoluteFill}>
      <Defs>
        <RadialGradient id="safariBg" cx="50%" cy="50%" r="70%">
          <Stop offset="0%" stopColor={isDark ? '#E8C9A0' : '#F5DEB3'} />
          <Stop offset="100%" stopColor={bgColor} />
        </RadialGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#safariBg)" />
      {rosettes}
    </Svg>
  );
}

// Snow Leopard Frost Pattern
// Cool gray/white tones - light mode: white/gray, dark mode: cool dark gray
function SnowLeopardFrostPattern({ isDark }: { isDark: boolean }) {
  const rosettes = useMemo(() => {
    const result = [];
    const rosetteCount = 45;

    // Snow Leopard color palette - adapts to light/dark
    const rosettePrimary = isDark ? '#6B7280' : '#4B5563'; // Gray rosettes
    const rosetteSecondary = isDark ? '#4B5563' : '#374151'; // Deeper gray
    const innerSpot = isDark ? '#374151' : '#1F2937'; // Dark centers

    for (let i = 0; i < rosetteCount; i++) {
      const cx = seededRandom(i * 21) * SCREEN_WIDTH;
      const cy = seededRandom(i * 33) * SCREEN_HEIGHT;
      const baseSize = seededRandom(i * 45) * 35 + 25;
      const rotation = seededRandom(i * 57) * 25 - 12.5;
      const rosetteOpacity = seededRandom(i * 69) * 0.5 + 0.35;

      // Snow leopard has more irregular, larger rosettes
      const segments = Math.floor(seededRandom(i * 81) * 2) + 4;
      for (let j = 0; j < segments; j++) {
        const angleStart = (j / segments) * Math.PI * 2 + (seededRandom(i * 93 + j) * 0.5);
        const arcLength = (0.5 + seededRandom(i * j * 2) * 0.3) / segments * Math.PI * 2;
        const strokeWidth = seededRandom(i * j * 3) * 7 + 5;

        const x1 = cx + Math.cos(angleStart) * baseSize;
        const y1 = cy + Math.sin(angleStart) * baseSize;
        const x2 = cx + Math.cos(angleStart + arcLength) * baseSize;
        const y2 = cy + Math.sin(angleStart + arcLength) * baseSize;

        const largeArc = arcLength > Math.PI ? 1 : 0;
        const pathD = `M ${x1} ${y1} A ${baseSize} ${baseSize} 0 ${largeArc} 1 ${x2} ${y2}`;

        result.push(
          <Path
            key={`rosette-${i}-seg-${j}`}
            d={pathD}
            fill="none"
            stroke={rosettePrimary}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            opacity={rosetteOpacity}
            transform={`rotate(${rotation} ${cx} ${cy})`}
          />
        );
      }

      // Darker inner spot
      const innerSize = baseSize * (0.4 + seededRandom(i * 105) * 0.15);
      result.push(
        <Ellipse
          key={`rosette-${i}-inner`}
          cx={cx}
          cy={cy}
          rx={innerSize}
          ry={innerSize * (0.85 + seededRandom(i * 117) * 0.3)}
          fill={innerSpot}
          opacity={rosetteOpacity * 0.7}
          transform={`rotate(${rotation} ${cx} ${cy})`}
        />
      );
    }

    // Scattered irregular spots
    const spotCount = 55;
    for (let i = 0; i < spotCount; i++) {
      const x = seededRandom(i * 129 + 3000) * SCREEN_WIDTH;
      const y = seededRandom(i * 141 + 3000) * SCREEN_HEIGHT;
      const size = seededRandom(i * 153 + 3000) * 10 + 4;
      const opacity = seededRandom(i * 165 + 3000) * 0.35 + 0.2;

      result.push(
        <Ellipse
          key={`spot-${i}`}
          cx={x}
          cy={y}
          rx={size}
          ry={size * (0.6 + seededRandom(i * 177 + 3000) * 0.4)}
          fill={rosetteSecondary}
          opacity={opacity}
        />
      );
    }

    return result;
  }, [isDark]);

  // Dark mode: cool slate gray, Light mode: soft white/silver
  const bgColors = isDark
    ? ['#1F2937', '#111827', '#1F2937'] // Cool slate dark
    : ['#F9FAFB', '#F3F4F6', '#E5E7EB']; // Soft silver/white

  return (
    <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT} style={StyleSheet.absoluteFill}>
      <Defs>
        <LinearGradient id="snowBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={bgColors[0]} />
          <Stop offset="50%" stopColor={bgColors[1]} />
          <Stop offset="100%" stopColor={bgColors[2]} />
        </LinearGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#snowBg)" />
      {rosettes}
    </Svg>
  );
}

// Rose Gold Leopard Pattern
// Dark mode: deep mauve bg, Light mode: blush pink bg
function RoseGoldLeopardPattern({ isDark }: { isDark: boolean }) {
  const rosettes = useMemo(() => {
    const result = [];
    const rosetteCount = 48;

    // Rose Gold color palette - adapts to light/dark
    const roseGoldPrimary = isDark ? '#D4A5A5' : '#B76E79'; // Rose gold (lighter in dark mode for visibility)
    const roseGoldDark = isDark ? '#9B6B6B' : '#8B4A52'; // Dusty rose
    const roseGoldShimmer = isDark ? '#F0C4C4' : '#E8B4B8'; // Light rose shimmer
    const innerSpot = isDark ? '#3D2A2A' : '#4A2F33'; // Dark rose center

    for (let i = 0; i < rosetteCount; i++) {
      const cx = seededRandom(i * 23) * SCREEN_WIDTH;
      const cy = seededRandom(i * 35) * SCREEN_HEIGHT;
      const baseSize = seededRandom(i * 47) * 32 + 22;
      const rotation = seededRandom(i * 59) * 35 - 17.5;
      const rosetteOpacity = seededRandom(i * 71) * 0.45 + 0.4;

      // Rosette segments
      const segments = Math.floor(seededRandom(i * 83) * 3) + 5;
      for (let j = 0; j < segments; j++) {
        const angleStart = (j / segments) * Math.PI * 2 + (seededRandom(i * 95 + j) * 0.35);
        const arcLength = (0.45 + seededRandom(i * j * 2) * 0.35) / segments * Math.PI * 2;
        const strokeWidth = seededRandom(i * j * 3) * 5 + 4;

        const x1 = cx + Math.cos(angleStart) * baseSize;
        const y1 = cy + Math.sin(angleStart) * baseSize;
        const x2 = cx + Math.cos(angleStart + arcLength) * baseSize;
        const y2 = cy + Math.sin(angleStart + arcLength) * baseSize;

        const largeArc = arcLength > Math.PI ? 1 : 0;
        const pathD = `M ${x1} ${y1} A ${baseSize} ${baseSize} 0 ${largeArc} 1 ${x2} ${y2}`;

        result.push(
          <Path
            key={`rosette-${i}-seg-${j}`}
            d={pathD}
            fill="none"
            stroke={roseGoldPrimary}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            opacity={rosetteOpacity}
            transform={`rotate(${rotation} ${cx} ${cy})`}
          />
        );
      }

      // Inner dark rose spot
      const innerSize = baseSize * (0.32 + seededRandom(i * 107) * 0.18);
      result.push(
        <Ellipse
          key={`rosette-${i}-inner`}
          cx={cx}
          cy={cy}
          rx={innerSize}
          ry={innerSize * (0.8 + seededRandom(i * 119) * 0.4)}
          fill={innerSpot}
          opacity={rosetteOpacity * 0.8}
          transform={`rotate(${rotation} ${cx} ${cy})`}
        />
      );

      // Rose gold shimmer highlight
      if (seededRandom(i * 131) > 0.55) {
        result.push(
          <Circle
            key={`rosette-${i}-shimmer`}
            cx={cx + baseSize * 0.25}
            cy={cy - baseSize * 0.25}
            r={baseSize * 0.12}
            fill={roseGoldShimmer}
            opacity={0.4}
          />
        );
      }
    }

    // Scattered rose spots
    const spotCount = 65;
    for (let i = 0; i < spotCount; i++) {
      const x = seededRandom(i * 143 + 4000) * SCREEN_WIDTH;
      const y = seededRandom(i * 155 + 4000) * SCREEN_HEIGHT;
      const size = seededRandom(i * 167 + 4000) * 7 + 3;
      const opacity = seededRandom(i * 179 + 4000) * 0.35 + 0.25;

      result.push(
        <Circle
          key={`spot-${i}`}
          cx={x}
          cy={y}
          r={size}
          fill={roseGoldDark}
          opacity={opacity}
        />
      );
    }

    return result;
  }, [isDark]);

  // Dark mode: deep mauve/burgundy, Light mode: soft blush pink
  const bgColors = isDark
    ? ['#2D1F1F', '#1F1515', '#2A1C1C'] // Deep mauve/burgundy
    : ['#FFF0EB', '#FAE5E0', '#FDF2EE']; // Soft blush pink

  const glowColor = isDark ? '#D4A5A5' : '#B76E79';
  const glowOpacity = isDark ? 0.12 : 0.1;

  return (
    <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT} style={StyleSheet.absoluteFill}>
      <Defs>
        <RadialGradient id="roseBg" cx="40%" cy="30%" r="80%">
          <Stop offset="0%" stopColor={bgColors[1]} />
          <Stop offset="100%" stopColor={bgColors[0]} />
        </RadialGradient>
        <RadialGradient id="roseGlow" cx="60%" cy="40%" r="50%">
          <Stop offset="0%" stopColor={glowColor} stopOpacity={glowOpacity} />
          <Stop offset="100%" stopColor={glowColor} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#roseBg)" />
      <Rect width="100%" height="100%" fill="url(#roseGlow)" />
      {rosettes}
    </Svg>
  );
}

// Obsidian Leopard Pattern
// Ultra-modern monochrome - dark mode: black/gray, light mode: white/silver
function ObsidianLeopardPattern({ isDark }: { isDark: boolean }) {
  const rosettes = useMemo(() => {
    const result = [];
    const rosetteCount = 42;

    // Obsidian color palette - adapts for light/dark
    const rosettePrimary = isDark ? '#3D3D3D' : '#9CA3AF'; // Gray (lighter in light mode)
    const rosetteSecondary = isDark ? '#525252' : '#6B7280'; // Medium gray
    const innerSpot = isDark ? Colors.card : '#374151'; // Center spot

    for (let i = 0; i < rosetteCount; i++) {
      const cx = seededRandom(i * 25) * SCREEN_WIDTH;
      const cy = seededRandom(i * 37) * SCREEN_HEIGHT;
      const baseSize = seededRandom(i * 49) * 38 + 28;
      const rotation = seededRandom(i * 61) * 30 - 15;
      const rosetteOpacity = isDark
        ? seededRandom(i * 73) * 0.35 + 0.25
        : seededRandom(i * 73) * 0.4 + 0.35; // Higher opacity in light mode

      // Minimal, clean rosette segments
      const segments = Math.floor(seededRandom(i * 85) * 2) + 4;
      for (let j = 0; j < segments; j++) {
        const angleStart = (j / segments) * Math.PI * 2 + (seededRandom(i * 97 + j) * 0.3);
        const arcLength = (0.55 + seededRandom(i * j * 2) * 0.3) / segments * Math.PI * 2;
        const strokeWidth = seededRandom(i * j * 3) * 4 + 3;

        const x1 = cx + Math.cos(angleStart) * baseSize;
        const y1 = cy + Math.sin(angleStart) * baseSize;
        const x2 = cx + Math.cos(angleStart + arcLength) * baseSize;
        const y2 = cy + Math.sin(angleStart + arcLength) * baseSize;

        const largeArc = arcLength > Math.PI ? 1 : 0;
        const pathD = `M ${x1} ${y1} A ${baseSize} ${baseSize} 0 ${largeArc} 1 ${x2} ${y2}`;

        result.push(
          <Path
            key={`rosette-${i}-seg-${j}`}
            d={pathD}
            fill="none"
            stroke={rosettePrimary}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            opacity={rosetteOpacity}
            transform={`rotate(${rotation} ${cx} ${cy})`}
          />
        );
      }

      // Inner spot
      const innerSize = baseSize * (0.38 + seededRandom(i * 109) * 0.15);
      result.push(
        <Ellipse
          key={`rosette-${i}-inner`}
          cx={cx}
          cy={cy}
          rx={innerSize}
          ry={innerSize * (0.9 + seededRandom(i * 121) * 0.2)}
          fill={innerSpot}
          opacity={rosetteOpacity * 0.6}
          transform={`rotate(${rotation} ${cx} ${cy})`}
        />
      );
    }

    // Minimal scattered spots
    const spotCount = 40;
    for (let i = 0; i < spotCount; i++) {
      const x = seededRandom(i * 133 + 5000) * SCREEN_WIDTH;
      const y = seededRandom(i * 145 + 5000) * SCREEN_HEIGHT;
      const size = seededRandom(i * 157 + 5000) * 8 + 4;
      const opacity = seededRandom(i * 169 + 5000) * 0.25 + 0.15;

      result.push(
        <Circle
          key={`spot-${i}`}
          cx={x}
          cy={y}
          r={size}
          fill={rosetteSecondary}
          opacity={opacity}
        />
      );
    }

    return result;
  }, [isDark]);

  // Dark mode: soft black, Light mode: clean white/light gray
  const bgColors = isDark
    ? [Colors.card, '#151515', '#1C1C1C'] // Soft black
    : ['#F9FAFB', '#F3F4F6', Colors.text]; // Clean white/light gray

  return (
    <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT} style={StyleSheet.absoluteFill}>
      <Defs>
        <RadialGradient id="obsidianBg" cx="50%" cy="50%" r="70%">
          <Stop offset="0%" stopColor={bgColors[1]} />
          <Stop offset="100%" stopColor={bgColors[0]} />
        </RadialGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#obsidianBg)" />
      {rosettes}
    </Svg>
  );
}

// Cheetah Luxe Pattern
// Cheetah spots with gold accents - dark mode: dark brown bg, light mode: golden tan bg
function CheetahLuxePattern({ isDark }: { isDark: boolean }) {
  const spots = useMemo(() => {
    const result = [];

    // Cheetah Luxe color palette - adapts to light/dark
    const spotColor = isDark ? '#1A1008' : '#2C1810'; // Dark brown/black
    const goldAccent = isDark ? '#DAA520' : '#C9A227'; // Gold accent (brighter in dark mode)
    const goldLight = isDark ? Colors.accentGold : '#F5C842'; // Bright gold shimmer

    // Cheetah spots are solid circles, not rosettes
    const spotCount = 180;
    for (let i = 0; i < spotCount; i++) {
      const x = seededRandom(i * 27) * SCREEN_WIDTH;
      const y = seededRandom(i * 39) * SCREEN_HEIGHT;

      // Cheetah spots are smaller and more varied in size
      const size = seededRandom(i * 51) * 12 + 4;
      const opacity = seededRandom(i * 63) * 0.4 + 0.5;

      // Slightly elongated spots (cheetah characteristic)
      const stretch = 0.7 + seededRandom(i * 75) * 0.6;
      const rotation = seededRandom(i * 87) * 180;

      result.push(
        <Ellipse
          key={`spot-${i}`}
          cx={x}
          cy={y}
          rx={size}
          ry={size * stretch}
          fill={spotColor}
          opacity={opacity}
          transform={`rotate(${rotation} ${x} ${y})`}
        />
      );
    }

    // Gold accent spots (fewer, scattered)
    const goldSpotCount = 25;
    for (let i = 0; i < goldSpotCount; i++) {
      const x = seededRandom(i * 99 + 6000) * SCREEN_WIDTH;
      const y = seededRandom(i * 111 + 6000) * SCREEN_HEIGHT;
      const size = seededRandom(i * 123 + 6000) * 8 + 3;
      const opacity = seededRandom(i * 135 + 6000) * 0.4 + 0.3;

      result.push(
        <Circle
          key={`gold-${i}`}
          cx={x}
          cy={y}
          r={size}
          fill={goldAccent}
          opacity={opacity}
        />
      );

      // Gold shimmer on some
      if (seededRandom(i * 147 + 6000) > 0.6) {
        result.push(
          <Circle
            key={`shimmer-${i}`}
            cx={x + size * 0.3}
            cy={y - size * 0.3}
            r={size * 0.4}
            fill={goldLight}
            opacity={0.5}
          />
        );
      }
    }

    // Tear marks (characteristic cheetah facial markings) as decorative elements
    const tearCount = 6;
    for (let i = 0; i < tearCount; i++) {
      const startX = seededRandom(i * 159 + 7000) * SCREEN_WIDTH;
      const startY = seededRandom(i * 171 + 7000) * SCREEN_HEIGHT * 0.3;
      const length = seededRandom(i * 183 + 7000) * 60 + 40;

      result.push(
        <Path
          key={`tear-${i}`}
          d={`M ${startX} ${startY} Q ${startX + 5} ${startY + length * 0.5} ${startX} ${startY + length}`}
          fill="none"
          stroke={spotColor}
          strokeWidth={3}
          strokeLinecap="round"
          opacity={0.6}
        />
      );
    }

    return result;
  }, [isDark]);

  // Dark mode: rich dark brown, Light mode: warm golden tan
  const bgColors = isDark
    ? ['#1A1408', '#0F0A04', '#1C1610'] // Rich dark brown/chocolate
    : ['#E8C9A0', '#DDB892', '#F0D9B5']; // Warm golden tan

  const glowOpacity = isDark ? 0.15 : 0.12;

  return (
    <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT} style={StyleSheet.absoluteFill}>
      <Defs>
        <LinearGradient id="cheetahBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={bgColors[0]} />
          <Stop offset="50%" stopColor={bgColors[1]} />
          <Stop offset="100%" stopColor={bgColors[2]} />
        </LinearGradient>
        <RadialGradient id="cheetahGlow" cx="30%" cy="20%" r="50%">
          <Stop offset="0%" stopColor=Colors.accentGold stopOpacity={glowOpacity} />
          <Stop offset="100%" stopColor=Colors.accentGold stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#cheetahBg)" />
      <Rect width="100%" height="100%" fill="url(#cheetahGlow)" />
      {spots}
    </Svg>
  );
}

// ============================================
// HOLIDAY PATTERNS
// ============================================

// Christmas Festive Pattern
// Dark mode: deep green/red, Light mode: bright festive colors
function ChristmasFestivePattern({ isDark }: { isDark: boolean }) {
  const elements = useMemo(() => {
    const result = [];

    // Christmas color palette
    const red = isDark ? '#C41E3A' : '#DC143C'; // Christmas red
    const green = isDark ? '#228B22' : '#2E8B57'; // Forest/Sea green
    const gold = isDark ? Colors.accentGold : '#DAA520'; // Gold
    const white = isDark ? '#F5F5F5' : Colors.text; // Snow white
    const darkGreen = isDark ? '#0B3D0B' : '#1B5E20'; // Deep green

    // Pine branch/needle decorations
    const branchCount = 15;
    for (let i = 0; i < branchCount; i++) {
      const cx = seededRandom(i * 200) * SCREEN_WIDTH;
      const cy = seededRandom(i * 210) * SCREEN_HEIGHT;
      const size = seededRandom(i * 220) * 80 + 40;
      const rotation = seededRandom(i * 230) * 360;
      const opacity = seededRandom(i * 240) * 0.3 + 0.2;

      // Create pine branch shape
      for (let j = 0; j < 7; j++) {
        const angle = (j / 7) * Math.PI - Math.PI / 2;
        const needleLength = size * (0.6 + seededRandom(i * j * 2) * 0.4);
        const x2 = cx + Math.cos(angle + rotation * Math.PI / 180) * needleLength;
        const y2 = cy + Math.sin(angle + rotation * Math.PI / 180) * needleLength;

        result.push(
          <Path
            key={`branch-${i}-${j}`}
            d={`M ${cx} ${cy} L ${x2} ${y2}`}
            stroke={darkGreen}
            strokeWidth={2}
            opacity={opacity}
          />
        );
      }
    }

    // Ornament balls
    const ornamentCount = 25;
    for (let i = 0; i < ornamentCount; i++) {
      const x = seededRandom(i * 250 + 1000) * SCREEN_WIDTH;
      const y = seededRandom(i * 260 + 1000) * SCREEN_HEIGHT;
      const size = seededRandom(i * 270 + 1000) * 20 + 10;
      const opacity = seededRandom(i * 280 + 1000) * 0.4 + 0.4;
      const colorChoice = seededRandom(i * 290 + 1000);
      const color = colorChoice > 0.66 ? red : colorChoice > 0.33 ? gold : green;

      result.push(
        <Circle
          key={`ornament-${i}`}
          cx={x}
          cy={y}
          r={size}
          fill={color}
          opacity={opacity}
        />
      );

      // Shine highlight
      result.push(
        <Circle
          key={`shine-${i}`}
          cx={x - size * 0.3}
          cy={y - size * 0.3}
          r={size * 0.25}
          fill={white}
          opacity={opacity * 0.5}
        />
      );
    }

    // Snowflakes
    const snowflakeCount = 40;
    for (let i = 0; i < snowflakeCount; i++) {
      const x = seededRandom(i * 300 + 2000) * SCREEN_WIDTH;
      const y = seededRandom(i * 310 + 2000) * SCREEN_HEIGHT;
      const size = seededRandom(i * 320 + 2000) * 8 + 3;
      const opacity = seededRandom(i * 330 + 2000) * 0.4 + 0.2;

      // Simple 6-point snowflake
      for (let j = 0; j < 6; j++) {
        const angle = (j / 6) * Math.PI * 2;
        result.push(
          <Line
            key={`snow-${i}-${j}`}
            x1={x}
            y1={y}
            x2={x + Math.cos(angle) * size}
            y2={y + Math.sin(angle) * size}
            stroke={white}
            strokeWidth={1}
            opacity={opacity}
          />
        );
      }
    }

    // Gold stars
    const starCount = 12;
    for (let i = 0; i < starCount; i++) {
      const cx = seededRandom(i * 340 + 3000) * SCREEN_WIDTH;
      const cy = seededRandom(i * 350 + 3000) * SCREEN_HEIGHT;
      const size = seededRandom(i * 360 + 3000) * 15 + 8;
      const opacity = seededRandom(i * 370 + 3000) * 0.5 + 0.4;

      // 5-point star
      let starPath = '';
      for (let j = 0; j < 10; j++) {
        const angle = (j / 10) * Math.PI * 2 - Math.PI / 2;
        const r = j % 2 === 0 ? size : size * 0.4;
        const px = cx + Math.cos(angle) * r;
        const py = cy + Math.sin(angle) * r;
        starPath += j === 0 ? `M ${px} ${py}` : ` L ${px} ${py}`;
      }
      starPath += ' Z';

      result.push(
        <Path
          key={`star-${i}`}
          d={starPath}
          fill={gold}
          opacity={opacity}
        />
      );
    }

    return result;
  }, [isDark]);

  // Dark mode: deep forest, Light mode: soft cream/white
  const bgColors = isDark
    ? ['#0A1F0A', '#0D150D', '#051005'] // Deep forest green
    : ['#FFF8F0', '#F5F0E8', '#FFFAF5']; // Warm cream

  return (
    <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT} style={StyleSheet.absoluteFill}>
      <Defs>
        <RadialGradient id="christmasBg" cx="50%" cy="30%" r="80%">
          <Stop offset="0%" stopColor={bgColors[1]} />
          <Stop offset="100%" stopColor={bgColors[0]} />
        </RadialGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#christmasBg)" />
      {elements}
    </Svg>
  );
}

// Halloween Spooky Pattern
// Dark mode: deep purple/black, Light mode: orange/purple
function HalloweenSpookyPattern({ isDark }: { isDark: boolean }) {
  const elements = useMemo(() => {
    const result = [];

    // Halloween color palette
    const orange = isDark ? '#FF6B00' : '#FF8C00'; // Pumpkin orange
    const purple = isDark ? '#6B2D7B' : '#8B4789'; // Spooky purple
    const black = isDark ? Colors.card : '#2D2D2D'; // Deep black
    const green = isDark ? '#39FF14' : '#32CD32'; // Eerie green
    const white = isDark ? '#E8E8E8' : '#F0F0F0'; // Ghost white

    // Bats
    const batCount = 18;
    for (let i = 0; i < batCount; i++) {
      const x = seededRandom(i * 400) * SCREEN_WIDTH;
      const y = seededRandom(i * 410) * SCREEN_HEIGHT * 0.6;
      const size = seededRandom(i * 420) * 25 + 15;
      const opacity = seededRandom(i * 430) * 0.5 + 0.3;

      // Bat wing shape
      const batPath = `
        M ${x} ${y}
        Q ${x - size} ${y - size * 0.5} ${x - size * 1.5} ${y}
        Q ${x - size * 0.8} ${y + size * 0.3} ${x} ${y + size * 0.2}
        Q ${x + size * 0.8} ${y + size * 0.3} ${x + size * 1.5} ${y}
        Q ${x + size} ${y - size * 0.5} ${x} ${y}
        Z
      `;

      result.push(
        <Path
          key={`bat-${i}`}
          d={batPath}
          fill={black}
          opacity={opacity}
        />
      );
    }

    // Pumpkins
    const pumpkinCount = 12;
    for (let i = 0; i < pumpkinCount; i++) {
      const cx = seededRandom(i * 440 + 1000) * SCREEN_WIDTH;
      const cy = seededRandom(i * 450 + 1000) * SCREEN_HEIGHT * 0.5 + SCREEN_HEIGHT * 0.4;
      const size = seededRandom(i * 460 + 1000) * 30 + 20;
      const opacity = seededRandom(i * 470 + 1000) * 0.4 + 0.4;

      // Pumpkin body
      result.push(
        <Ellipse
          key={`pumpkin-${i}`}
          cx={cx}
          cy={cy}
          rx={size}
          ry={size * 0.8}
          fill={orange}
          opacity={opacity}
        />
      );

      // Stem
      result.push(
        <Rect
          key={`stem-${i}`}
          x={cx - size * 0.1}
          y={cy - size * 0.9}
          width={size * 0.2}
          height={size * 0.25}
          fill={isDark ? '#2D4A1C' : '#3D5A2C'}
          opacity={opacity}
        />
      );

      // Jack-o-lantern face (triangle eyes)
      if (seededRandom(i * 480 + 1000) > 0.5) {
        // Left eye
        result.push(
          <Polygon
            key={`eye-l-${i}`}
            points={`${cx - size * 0.35},${cy - size * 0.1} ${cx - size * 0.2},${cy - size * 0.3} ${cx - size * 0.05},${cy - size * 0.1}`}
            fill={isDark ? Colors.accentGold : '#FFA500'}
            opacity={opacity * 0.8}
          />
        );
        // Right eye
        result.push(
          <Polygon
            key={`eye-r-${i}`}
            points={`${cx + size * 0.35},${cy - size * 0.1} ${cx + size * 0.2},${cy - size * 0.3} ${cx + size * 0.05},${cy - size * 0.1}`}
            fill={isDark ? Colors.accentGold : '#FFA500'}
            opacity={opacity * 0.8}
          />
        );
      }
    }

    // Spiderwebs
    const webCount = 8;
    for (let i = 0; i < webCount; i++) {
      const cx = seededRandom(i * 490 + 2000) * SCREEN_WIDTH;
      const cy = seededRandom(i * 500 + 2000) * SCREEN_HEIGHT * 0.4;
      const size = seededRandom(i * 510 + 2000) * 60 + 40;
      const opacity = seededRandom(i * 520 + 2000) * 0.2 + 0.1;

      // Radial lines
      for (let j = 0; j < 8; j++) {
        const angle = (j / 8) * Math.PI * 2;
        result.push(
          <Line
            key={`web-rad-${i}-${j}`}
            x1={cx}
            y1={cy}
            x2={cx + Math.cos(angle) * size}
            y2={cy + Math.sin(angle) * size}
            stroke={white}
            strokeWidth={0.5}
            opacity={opacity}
          />
        );
      }

      // Concentric circles
      for (let k = 1; k <= 4; k++) {
        result.push(
          <Circle
            key={`web-circle-${i}-${k}`}
            cx={cx}
            cy={cy}
            r={size * k * 0.25}
            fill="none"
            stroke={white}
            strokeWidth={0.5}
            opacity={opacity * 0.8}
          />
        );
      }
    }

    // Glowing eyes in the dark
    const eyePairCount = 15;
    for (let i = 0; i < eyePairCount; i++) {
      const x = seededRandom(i * 530 + 3000) * SCREEN_WIDTH;
      const y = seededRandom(i * 540 + 3000) * SCREEN_HEIGHT;
      const size = seededRandom(i * 550 + 3000) * 4 + 2;
      const spacing = seededRandom(i * 560 + 3000) * 10 + 8;
      const opacity = seededRandom(i * 570 + 3000) * 0.5 + 0.3;

      result.push(
        <Circle key={`glow-l-${i}`} cx={x - spacing / 2} cy={y} r={size} fill={green} opacity={opacity} />
      );
      result.push(
        <Circle key={`glow-r-${i}`} cx={x + spacing / 2} cy={y} r={size} fill={green} opacity={opacity} />
      );
    }

    return result;
  }, [isDark]);

  // Dark mode: deep purple-black, Light mode: soft purple-orange
  const bgColors = isDark
    ? ['#1A0A1F', '#0D0510', '#150818'] // Deep purple-black
    : ['#F5E8F0', '#FFE8D5', '#F0E0F0']; // Soft lavender-peach

  return (
    <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT} style={StyleSheet.absoluteFill}>
      <Defs>
        <LinearGradient id="halloweenBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={bgColors[0]} />
          <Stop offset="50%" stopColor={bgColors[1]} />
          <Stop offset="100%" stopColor={bgColors[2]} />
        </LinearGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#halloweenBg)" />
      {elements}
    </Svg>
  );
}

// Thanksgiving Harvest Pattern
// Dark mode: deep browns/oranges, Light mode: warm golden harvest
function ThanksgivingHarvestPattern({ isDark }: { isDark: boolean }) {
  const elements = useMemo(() => {
    const result = [];

    // Harvest color palette
    const orange = isDark ? '#D2691E' : '#E07830'; // Harvest orange
    const brown = isDark ? '#8B4513' : '#A0522D'; // Saddle brown
    const gold = isDark ? '#DAA520' : Colors.accentGold; // Golden rod
    const red = isDark ? '#8B0000' : '#B22222'; // Dark/Fire brick red
    const wheat = isDark ? '#DEB887' : '#F5DEB3'; // Wheat

    // Fall leaves
    const leafCount = 45;
    for (let i = 0; i < leafCount; i++) {
      const cx = seededRandom(i * 600) * SCREEN_WIDTH;
      const cy = seededRandom(i * 610) * SCREEN_HEIGHT;
      const size = seededRandom(i * 620) * 25 + 15;
      const rotation = seededRandom(i * 630) * 360;
      const opacity = seededRandom(i * 640) * 0.4 + 0.3;
      const colorChoice = seededRandom(i * 650);
      const color = colorChoice > 0.66 ? orange : colorChoice > 0.33 ? red : gold;

      // Maple leaf shape (simplified)
      const leafPath = `
        M ${cx} ${cy - size}
        Q ${cx + size * 0.3} ${cy - size * 0.6} ${cx + size * 0.8} ${cy - size * 0.3}
        L ${cx + size * 0.4} ${cy}
        L ${cx + size * 0.9} ${cy + size * 0.4}
        Q ${cx + size * 0.3} ${cy + size * 0.3} ${cx} ${cy + size * 0.8}
        Q ${cx - size * 0.3} ${cy + size * 0.3} ${cx - size * 0.9} ${cy + size * 0.4}
        L ${cx - size * 0.4} ${cy}
        L ${cx - size * 0.8} ${cy - size * 0.3}
        Q ${cx - size * 0.3} ${cy - size * 0.6} ${cx} ${cy - size}
        Z
      `;

      result.push(
        <Path
          key={`leaf-${i}`}
          d={leafPath}
          fill={color}
          opacity={opacity}
          transform={`rotate(${rotation} ${cx} ${cy})`}
        />
      );
    }

    // Wheat stalks
    const wheatCount = 20;
    for (let i = 0; i < wheatCount; i++) {
      const x = seededRandom(i * 660 + 1000) * SCREEN_WIDTH;
      const baseY = SCREEN_HEIGHT * 0.7 + seededRandom(i * 670 + 1000) * SCREEN_HEIGHT * 0.3;
      const height = seededRandom(i * 680 + 1000) * 100 + 80;
      const opacity = seededRandom(i * 690 + 1000) * 0.4 + 0.3;
      const sway = seededRandom(i * 700 + 1000) * 20 - 10;

      // Stalk
      result.push(
        <Path
          key={`stalk-${i}`}
          d={`M ${x} ${baseY} Q ${x + sway} ${baseY - height / 2} ${x + sway * 1.5} ${baseY - height}`}
          stroke={wheat}
          strokeWidth={2}
          fill="none"
          opacity={opacity}
        />
      );

      // Wheat head (kernels)
      for (let j = 0; j < 8; j++) {
        const ky = baseY - height + j * 8;
        const kx = x + sway * 1.5 + (j % 2 === 0 ? -4 : 4);
        result.push(
          <Ellipse
            key={`kernel-${i}-${j}`}
            cx={kx}
            cy={ky}
            rx={3}
            ry={6}
            fill={gold}
            opacity={opacity * 0.8}
          />
        );
      }
    }

    // Small pumpkins
    const pumpkinCount = 10;
    for (let i = 0; i < pumpkinCount; i++) {
      const cx = seededRandom(i * 710 + 2000) * SCREEN_WIDTH;
      const cy = seededRandom(i * 720 + 2000) * SCREEN_HEIGHT * 0.3 + SCREEN_HEIGHT * 0.6;
      const size = seededRandom(i * 730 + 2000) * 20 + 15;
      const opacity = seededRandom(i * 740 + 2000) * 0.4 + 0.4;

      result.push(
        <Ellipse
          key={`pumpkin-${i}`}
          cx={cx}
          cy={cy}
          rx={size}
          ry={size * 0.7}
          fill={orange}
          opacity={opacity}
        />
      );
    }

    // Acorns
    const acornCount = 25;
    for (let i = 0; i < acornCount; i++) {
      const x = seededRandom(i * 750 + 3000) * SCREEN_WIDTH;
      const y = seededRandom(i * 760 + 3000) * SCREEN_HEIGHT;
      const size = seededRandom(i * 770 + 3000) * 8 + 5;
      const opacity = seededRandom(i * 780 + 3000) * 0.4 + 0.3;

      // Acorn cap
      result.push(
        <Ellipse
          key={`acorn-cap-${i}`}
          cx={x}
          cy={y - size * 0.3}
          rx={size * 0.6}
          ry={size * 0.3}
          fill={brown}
          opacity={opacity}
        />
      );
      // Acorn body
      result.push(
        <Ellipse
          key={`acorn-body-${i}`}
          cx={x}
          cy={y + size * 0.2}
          rx={size * 0.5}
          ry={size * 0.7}
          fill={isDark ? '#CD853F' : '#DEB887'}
          opacity={opacity}
        />
      );
    }

    return result;
  }, [isDark]);

  // Dark mode: rich brown, Light mode: warm golden tan
  const bgColors = isDark
    ? ['#1A140A', '#0F0A05', '#1C1108'] // Rich chocolate brown
    : ['#FFF5E0', '#F5E8D0', '#FFFAF0']; // Warm golden cream

  return (
    <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT} style={StyleSheet.absoluteFill}>
      <Defs>
        <LinearGradient id="thanksgivingBg" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor={bgColors[2]} />
          <Stop offset="50%" stopColor={bgColors[1]} />
          <Stop offset="100%" stopColor={bgColors[0]} />
        </LinearGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#thanksgivingBg)" />
      {elements}
    </Svg>
  );
}

// Fourth of July Pattern
// Patriotic red, white, blue with stars and fireworks
function FourthOfJulyPattern({ isDark }: { isDark: boolean }) {
  const elements = useMemo(() => {
    const result = [];

    // Patriotic color palette
    const red = isDark ? '#B22234' : '#E31B23'; // Old Glory Red
    const white = isDark ? '#E8E8E8' : Colors.text; // White
    const blue = isDark ? '#3C3B6E' : '#002868'; // Old Glory Blue

    // Stars - scattered across the sky
    const starCount = 50;
    for (let i = 0; i < starCount; i++) {
      const cx = seededRandom(i * 800) * SCREEN_WIDTH;
      const cy = seededRandom(i * 810) * SCREEN_HEIGHT;
      const size = seededRandom(i * 820) * 12 + 6;
      const opacity = seededRandom(i * 830) * 0.5 + 0.4;
      const colorChoice = seededRandom(i * 840);
      const color = colorChoice > 0.5 ? white : (colorChoice > 0.25 ? red : blue);

      // 5-point star
      let starPath = '';
      for (let j = 0; j < 10; j++) {
        const angle = (j / 10) * Math.PI * 2 - Math.PI / 2;
        const r = j % 2 === 0 ? size : size * 0.4;
        const px = cx + Math.cos(angle) * r;
        const py = cy + Math.sin(angle) * r;
        starPath += j === 0 ? `M ${px} ${py}` : ` L ${px} ${py}`;
      }
      starPath += ' Z';

      result.push(
        <Path
          key={`star-${i}`}
          d={starPath}
          fill={color}
          opacity={opacity}
        />
      );
    }

    // Firework bursts
    const fireworkCount = 12;
    for (let i = 0; i < fireworkCount; i++) {
      const cx = seededRandom(i * 850 + 1000) * SCREEN_WIDTH;
      const cy = seededRandom(i * 860 + 1000) * SCREEN_HEIGHT * 0.6;
      const size = seededRandom(i * 870 + 1000) * 60 + 40;
      const opacity = seededRandom(i * 880 + 1000) * 0.4 + 0.3;
      const colorChoice = seededRandom(i * 890 + 1000);
      const color = colorChoice > 0.66 ? red : (colorChoice > 0.33 ? white : blue);

      // Radiating lines (firework burst)
      const rays = 12 + Math.floor(seededRandom(i * 900 + 1000) * 6);
      for (let j = 0; j < rays; j++) {
        const angle = (j / rays) * Math.PI * 2;
        const rayLength = size * (0.5 + seededRandom(i * j * 2) * 0.5);

        result.push(
          <Line
            key={`fw-ray-${i}-${j}`}
            x1={cx}
            y1={cy}
            x2={cx + Math.cos(angle) * rayLength}
            y2={cy + Math.sin(angle) * rayLength}
            stroke={color}
            strokeWidth={2}
            opacity={opacity}
            strokeLinecap="round"
          />
        );

        // Sparkle at end
        result.push(
          <Circle
            key={`fw-sparkle-${i}-${j}`}
            cx={cx + Math.cos(angle) * rayLength}
            cy={cy + Math.sin(angle) * rayLength}
            r={3}
            fill={color}
            opacity={opacity * 0.8}
          />
        );
      }
    }

    // Stripes (subtle)
    const stripeCount = 13;
    const stripeHeight = SCREEN_HEIGHT / stripeCount;
    for (let i = 0; i < stripeCount; i++) {
      const isRed = i % 2 === 0;
      result.push(
        <Rect
          key={`stripe-${i}`}
          x={0}
          y={i * stripeHeight}
          width={SCREEN_WIDTH}
          height={stripeHeight}
          fill={isRed ? red : white}
          opacity={0.05}
        />
      );
    }

    return result;
  }, [isDark]);

  // Dark mode: deep navy, Light mode: soft sky blue
  const bgColors = isDark
    ? ['#0A0A1A', '#050518', '#0D0D20'] // Deep navy
    : ['#E8F0F8', '#F0F5FF', '#E5EEF8']; // Soft sky blue

  return (
    <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT} style={StyleSheet.absoluteFill}>
      <Defs>
        <RadialGradient id="julyBg" cx="50%" cy="40%" r="70%">
          <Stop offset="0%" stopColor={bgColors[1]} />
          <Stop offset="100%" stopColor={bgColors[0]} />
        </RadialGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#julyBg)" />
      {elements}
    </Svg>
  );
}

// Valentine's Hearts Pattern
// Romantic pinks and reds with hearts
function ValentinesHeartsPattern({ isDark }: { isDark: boolean }) {
  const elements = useMemo(() => {
    const result = [];

    // Valentine color palette
    const hotPink = isDark ? '#FF1493' : '#FF69B4'; // Hot pink
    const red = isDark ? '#DC143C' : '#E31B23'; // Crimson red
    const pink = isDark ? '#FFB6C1' : '#FFC0CB'; // Light pink
    const rose = isDark ? '#C71585' : '#DB7093'; // Medium violet red
    const white = isDark ? '#FFF0F5' : Colors.text; // Lavender blush

    // Hearts
    const heartCount = 35;
    for (let i = 0; i < heartCount; i++) {
      const cx = seededRandom(i * 910) * SCREEN_WIDTH;
      const cy = seededRandom(i * 920) * SCREEN_HEIGHT;
      const size = seededRandom(i * 930) * 30 + 15;
      const rotation = seededRandom(i * 940) * 30 - 15;
      const opacity = seededRandom(i * 950) * 0.4 + 0.3;
      const colorChoice = seededRandom(i * 960);
      const color = colorChoice > 0.75 ? red : colorChoice > 0.5 ? hotPink : colorChoice > 0.25 ? rose : pink;

      // Heart shape using bezier curves
      const heartPath = `
        M ${cx} ${cy + size * 0.3}
        C ${cx} ${cy - size * 0.3} ${cx - size * 0.8} ${cy - size * 0.3} ${cx - size * 0.8} ${cy}
        C ${cx - size * 0.8} ${cy + size * 0.4} ${cx} ${cy + size * 0.6} ${cx} ${cy + size}
        C ${cx} ${cy + size * 0.6} ${cx + size * 0.8} ${cy + size * 0.4} ${cx + size * 0.8} ${cy}
        C ${cx + size * 0.8} ${cy - size * 0.3} ${cx} ${cy - size * 0.3} ${cx} ${cy + size * 0.3}
        Z
      `;

      result.push(
        <Path
          key={`heart-${i}`}
          d={heartPath}
          fill={color}
          opacity={opacity}
          transform={`rotate(${rotation} ${cx} ${cy})`}
        />
      );

      // Shine highlight on some hearts
      if (seededRandom(i * 970) > 0.6) {
        result.push(
          <Circle
            key={`shine-${i}`}
            cx={cx - size * 0.3}
            cy={cy - size * 0.1}
            r={size * 0.15}
            fill={white}
            opacity={opacity * 0.5}
          />
        );
      }
    }

    // Small floating hearts
    const miniHeartCount = 40;
    for (let i = 0; i < miniHeartCount; i++) {
      const x = seededRandom(i * 980 + 1000) * SCREEN_WIDTH;
      const y = seededRandom(i * 990 + 1000) * SCREEN_HEIGHT;
      const size = seededRandom(i * 1000 + 1000) * 8 + 4;
      const opacity = seededRandom(i * 1010 + 1000) * 0.3 + 0.2;

      result.push(
        <Circle
          key={`mini-${i}`}
          cx={x}
          cy={y}
          r={size}
          fill={pink}
          opacity={opacity}
        />
      );
    }

    // Sparkles
    const sparkleCount = 30;
    for (let i = 0; i < sparkleCount; i++) {
      const x = seededRandom(i * 1020 + 2000) * SCREEN_WIDTH;
      const y = seededRandom(i * 1030 + 2000) * SCREEN_HEIGHT;
      const size = seededRandom(i * 1040 + 2000) * 6 + 2;
      const opacity = seededRandom(i * 1050 + 2000) * 0.5 + 0.3;

      // 4-point sparkle
      result.push(
        <G key={`sparkle-${i}`}>
          <Line x1={x - size} y1={y} x2={x + size} y2={y} stroke={white} strokeWidth={1.5} opacity={opacity} />
          <Line x1={x} y1={y - size} x2={x} y2={y + size} stroke={white} strokeWidth={1.5} opacity={opacity} />
        </G>
      );
    }

    return result;
  }, [isDark]);

  // Dark mode: deep rose/burgundy, Light mode: soft blush pink
  const bgColors = isDark
    ? ['#1F0A10', '#150810', '#1A0D12'] // Deep rose/burgundy
    : ['#FFF0F5', '#FFE4EC', '#FFF5F8']; // Soft blush pink

  return (
    <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT} style={StyleSheet.absoluteFill}>
      <Defs>
        <RadialGradient id="valentineBg" cx="50%" cy="50%" r="80%">
          <Stop offset="0%" stopColor={bgColors[1]} />
          <Stop offset="100%" stopColor={bgColors[0]} />
        </RadialGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#valentineBg)" />
      {elements}
    </Svg>
  );
}

// Easter Spring Pattern
// Pastel colors with eggs and spring flowers
function EasterSpringPattern({ isDark }: { isDark: boolean }) {
  const elements = useMemo(() => {
    const result = [];

    // Easter pastel palette
    const pastelPink = isDark ? '#E8A0B0' : '#FFB6C1';
    const pastelBlue = isDark ? '#87CEEB' : '#ADD8E6';
    const pastelYellow = isDark ? '#F0E68C' : '#FFFACD';
    const pastelGreen = isDark ? '#90EE90' : '#98FB98';
    const pastelPurple = isDark ? '#DDA0DD' : '#E6E6FA';
    const white = isDark ? '#F0F0F0' : Colors.text;

    const pastels = [pastelPink, pastelBlue, pastelYellow, pastelGreen, pastelPurple];

    // Easter eggs
    const eggCount = 25;
    for (let i = 0; i < eggCount; i++) {
      const cx = seededRandom(i * 1100) * SCREEN_WIDTH;
      const cy = seededRandom(i * 1110) * SCREEN_HEIGHT;
      const sizeX = seededRandom(i * 1120) * 20 + 15;
      const sizeY = sizeX * 1.3;
      const rotation = seededRandom(i * 1130) * 40 - 20;
      const opacity = seededRandom(i * 1140) * 0.4 + 0.4;
      const color = pastels[Math.floor(seededRandom(i * 1150) * pastels.length)];

      // Egg shape
      result.push(
        <Ellipse
          key={`egg-${i}`}
          cx={cx}
          cy={cy}
          rx={sizeX}
          ry={sizeY}
          fill={color}
          opacity={opacity}
          transform={`rotate(${rotation} ${cx} ${cy})`}
        />
      );

      // Decorative stripes on eggs
      const stripeCount = 3;
      for (let j = 0; j < stripeCount; j++) {
        const stripeY = cy - sizeY * 0.4 + (j + 1) * (sizeY * 0.8 / (stripeCount + 1));
        const stripeWidth = sizeX * 2 * Math.cos(Math.asin((stripeY - cy) / sizeY));

        result.push(
          <Line
            key={`stripe-${i}-${j}`}
            x1={cx - stripeWidth / 2 * 0.8}
            y1={stripeY}
            x2={cx + stripeWidth / 2 * 0.8}
            y2={stripeY}
            stroke={pastels[(Math.floor(seededRandom(i * 1160 + j) * pastels.length) + 1) % pastels.length]}
            strokeWidth={3}
            opacity={opacity * 0.7}
            transform={`rotate(${rotation} ${cx} ${cy})`}
          />
        );
      }
    }

    // Spring flowers (simple daisies)
    const flowerCount = 20;
    for (let i = 0; i < flowerCount; i++) {
      const cx = seededRandom(i * 1170 + 1000) * SCREEN_WIDTH;
      const cy = seededRandom(i * 1180 + 1000) * SCREEN_HEIGHT;
      const size = seededRandom(i * 1190 + 1000) * 15 + 10;
      const opacity = seededRandom(i * 1200 + 1000) * 0.4 + 0.3;

      // Petals
      const petalCount = 6;
      for (let j = 0; j < petalCount; j++) {
        const angle = (j / petalCount) * Math.PI * 2;
        const px = cx + Math.cos(angle) * size * 0.7;
        const py = cy + Math.sin(angle) * size * 0.7;

        result.push(
          <Ellipse
            key={`petal-${i}-${j}`}
            cx={px}
            cy={py}
            rx={size * 0.35}
            ry={size * 0.5}
            fill={white}
            opacity={opacity}
            transform={`rotate(${angle * 180 / Math.PI + 90} ${px} ${py})`}
          />
        );
      }

      // Center
      result.push(
        <Circle
          key={`center-${i}`}
          cx={cx}
          cy={cy}
          r={size * 0.3}
          fill={pastelYellow}
          opacity={opacity}
        />
      );
    }

    // Grass tufts at bottom
    const grassCount = 30;
    for (let i = 0; i < grassCount; i++) {
      const x = seededRandom(i * 1210 + 2000) * SCREEN_WIDTH;
      const baseY = SCREEN_HEIGHT - seededRandom(i * 1220 + 2000) * 50;
      const height = seededRandom(i * 1230 + 2000) * 40 + 20;
      const opacity = seededRandom(i * 1240 + 2000) * 0.3 + 0.2;

      for (let j = 0; j < 3; j++) {
        const sway = (j - 1) * 8;
        result.push(
          <Path
            key={`grass-${i}-${j}`}
            d={`M ${x + j * 4} ${baseY} Q ${x + sway + j * 4} ${baseY - height / 2} ${x + sway * 1.5 + j * 4} ${baseY - height}`}
            stroke={pastelGreen}
            strokeWidth={2}
            fill="none"
            opacity={opacity}
          />
        );
      }
    }

    // Butterflies
    const butterflyCount = 8;
    for (let i = 0; i < butterflyCount; i++) {
      const x = seededRandom(i * 1250 + 3000) * SCREEN_WIDTH;
      const y = seededRandom(i * 1260 + 3000) * SCREEN_HEIGHT * 0.6;
      const size = seededRandom(i * 1270 + 3000) * 15 + 10;
      const opacity = seededRandom(i * 1280 + 3000) * 0.4 + 0.4;
      const color = pastels[Math.floor(seededRandom(i * 1290 + 3000) * pastels.length)];

      // Wings
      result.push(
        <Ellipse key={`wing-l-${i}`} cx={x - size * 0.6} cy={y} rx={size * 0.5} ry={size * 0.7} fill={color} opacity={opacity} />
      );
      result.push(
        <Ellipse key={`wing-r-${i}`} cx={x + size * 0.6} cy={y} rx={size * 0.5} ry={size * 0.7} fill={color} opacity={opacity} />
      );
      // Body
      result.push(
        <Ellipse key={`body-${i}`} cx={x} cy={y} rx={size * 0.15} ry={size * 0.5} fill={isDark ? '#4A4A4A' : Colors.textMuted} opacity={opacity} />
      );
    }

    return result;
  }, [isDark]);

  // Dark mode: soft sage/lavender, Light mode: bright pastel sky
  const bgColors = isDark
    ? ['#151818', '#121515', '#181A1A'] // Soft dark sage
    : ['#F0FFF0', '#F5FFFA', '#E8F5E9']; // Honeydew/mint cream

  return (
    <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT} style={StyleSheet.absoluteFill}>
      <Defs>
        <LinearGradient id="easterBg" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor={bgColors[1]} />
          <Stop offset="100%" stopColor={bgColors[0]} />
        </LinearGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#easterBg)" />
      {elements}
    </Svg>
  );
}

// Cinco de Mayo Pattern
// Vibrant festive Mexican colors with papel picado style
function CincoDeMayoPattern({ isDark }: { isDark: boolean }) {
  // Define background colors first so they can be used in useMemo
  const bgColors = isDark
    ? ['#1A1008', '#0D0805', '#1C1410'] // Rich warm brown-black
    : ['#FFF8E8', '#FFFAF0', '#FFF5E0']; // Warm cream/ivory

  const elements = useMemo(() => {
    const result = [];

    // Vibrant Mexican color palette
    const red = isDark ? '#E41A1C' : '#FF2400'; // Mexican red
    const green = isDark ? '#00A550' : '#009F4D'; // Mexican green
    const orange = isDark ? '#FF6B00' : '#FF8C00'; // Vibrant orange
    const pink = isDark ? '#FF1493' : '#FF69B4'; // Hot pink
    const yellow = isDark ? Colors.accentGold : '#FFFF00'; // Bright yellow
    const purple = isDark ? '#9B30FF' : '#8B008B'; // Purple
    const white = isDark ? '#F5F5F5' : Colors.text;

    // Background color for cutouts
    const cutoutBg = isDark ? '#1A1008' : '#FFF8E8';

    const festiveColors = [red, green, orange, pink, yellow, purple];

    // Papel picado banners
    const bannerCount = 5;
    for (let b = 0; b < bannerCount; b++) {
      const baseY = 50 + b * 150;
      const flagCount = 12;

      // String line
      result.push(
        <Path
          key={`string-${b}`}
          d={`M -20 ${baseY} Q ${SCREEN_WIDTH / 2} ${baseY + 30} ${SCREEN_WIDTH + 20} ${baseY}`}
          stroke={isDark ? '#8B4513' : '#A0522D'}
          strokeWidth={2}
          fill="none"
          opacity={0.6}
        />
      );

      for (let f = 0; f < flagCount; f++) {
        const x = (f / flagCount) * SCREEN_WIDTH + 20;
        const yOffset = Math.sin((f / flagCount) * Math.PI) * 30;
        const y = baseY + yOffset;
        const width = SCREEN_WIDTH / flagCount - 10;
        const height = seededRandom(b * 100 + f) * 30 + 40;
        const color = festiveColors[f % festiveColors.length];
        const opacity = seededRandom(b * 200 + f) * 0.3 + 0.5;

        // Flag rectangle
        result.push(
          <Rect
            key={`flag-${b}-${f}`}
            x={x}
            y={y}
            width={width}
            height={height}
            fill={color}
            opacity={opacity}
          />
        );

        // Decorative cutouts (papel picado style)
        const cutoutCount = 3;
        for (let c = 0; c < cutoutCount; c++) {
          const cutX = x + width * 0.2 + c * (width * 0.3);
          const cutY = y + height * 0.3;
          const cutSize = seededRandom(b * f * c + 1000) * 6 + 4;

          // Diamond cutout
          result.push(
            <Polygon
              key={`cut-${b}-${f}-${c}`}
              points={`${cutX},${cutY - cutSize} ${cutX + cutSize},${cutY} ${cutX},${cutY + cutSize} ${cutX - cutSize},${cutY}`}
              fill={cutoutBg}
              opacity={0.8}
            />
          );
        }

        // Scalloped bottom edge
        const scallops = 4;
        for (let s = 0; s < scallops; s++) {
          const sX = x + (s + 0.5) * (width / scallops);
          result.push(
            <Circle
              key={`scallop-${b}-${f}-${s}`}
              cx={sX}
              cy={y + height}
              r={width / scallops / 2}
              fill={cutoutBg}
              opacity={0.9}
            />
          );
        }
      }
    }

    // Marigold flowers (Cempasúchil)
    const flowerCount = 15;
    for (let i = 0; i < flowerCount; i++) {
      const cx = seededRandom(i * 1300) * SCREEN_WIDTH;
      const cy = seededRandom(i * 1310) * SCREEN_HEIGHT * 0.4 + SCREEN_HEIGHT * 0.5;
      const size = seededRandom(i * 1320) * 20 + 15;
      const opacity = seededRandom(i * 1330) * 0.4 + 0.4;

      // Multiple layers of petals
      for (let layer = 0; layer < 3; layer++) {
        const layerSize = size * (1 - layer * 0.2);
        const petalCount = 12 - layer * 2;
        for (let p = 0; p < petalCount; p++) {
          const angle = (p / petalCount) * Math.PI * 2 + layer * 0.2;
          const px = cx + Math.cos(angle) * layerSize * 0.5;
          const py = cy + Math.sin(angle) * layerSize * 0.5;

          result.push(
            <Circle
              key={`marigold-${i}-${layer}-${p}`}
              cx={px}
              cy={py}
              r={layerSize * 0.25}
              fill={layer === 0 ? orange : yellow}
              opacity={opacity * (1 - layer * 0.15)}
            />
          );
        }
      }
    }

    // Confetti
    const confettiCount = 80;
    for (let i = 0; i < confettiCount; i++) {
      const x = seededRandom(i * 1340 + 2000) * SCREEN_WIDTH;
      const y = seededRandom(i * 1350 + 2000) * SCREEN_HEIGHT;
      const width = seededRandom(i * 1360 + 2000) * 8 + 3;
      const height = seededRandom(i * 1370 + 2000) * 12 + 5;
      const rotation = seededRandom(i * 1380 + 2000) * 360;
      const opacity = seededRandom(i * 1390 + 2000) * 0.4 + 0.3;
      const color = festiveColors[Math.floor(seededRandom(i * 1400 + 2000) * festiveColors.length)];

      result.push(
        <Rect
          key={`confetti-${i}`}
          x={x}
          y={y}
          width={width}
          height={height}
          fill={color}
          opacity={opacity}
          transform={`rotate(${rotation} ${x + width / 2} ${y + height / 2})`}
        />
      );
    }

    return result;
  }, [isDark]);

  return (
    <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT} style={StyleSheet.absoluteFill}>
      <Defs>
        <LinearGradient id="cincoBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={bgColors[0]} />
          <Stop offset="50%" stopColor={bgColors[1]} />
          <Stop offset="100%" stopColor={bgColors[2]} />
        </LinearGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#cincoBg)" />
      {elements}
    </Svg>
  );
}

// Main component that renders the appropriate pattern
export function PatternBackground({ pattern, isDark }: PatternBackgroundProps) {
  switch (pattern) {
    case 'noise-grain':
      return <NoiseGrainPattern isDark={isDark} />;
    case 'geometric-hexagons':
      return <GeometricHexagonsPattern isDark={isDark} />;
    case 'organic-blobs':
      return <OrganicBlobsPattern isDark={isDark} />;
    case 'topographic':
      return <TopographicPattern isDark={isDark} />;
    case 'waves':
      return <WavesPattern isDark={isDark} />;
    case 'dots-grid':
      return <DotsGridPattern isDark={isDark} />;
    case 'circuit-board':
      return <CircuitBoardPattern isDark={isDark} />;
    case 'mesh-gradient':
      return <MeshGradientPattern isDark={isDark} />;
    case 'bokeh':
      return <BokehPattern isDark={isDark} />;
    case 'crystals':
      return <CrystalsPattern isDark={isDark} />;
    case 'marble':
      return <MarblePattern isDark={isDark} />;
    case 'water-ripples':
      return <WaterRipplesPattern isDark={isDark} />;
    case 'fabric-weave':
      return <FabricWeavePattern isDark={isDark} />;
    case 'starfield':
      return <StarfieldPattern isDark={isDark} />;
    case 'aurora-bands':
      return <AuroraBandsPattern isDark={isDark} />;
    case 'midnight-gold-leopard':
      return <MidnightGoldLeopardPattern isDark={isDark} />;
    case 'classic-safari-leopard':
      return <ClassicSafariLeopardPattern isDark={isDark} />;
    case 'snow-leopard-frost':
      return <SnowLeopardFrostPattern isDark={isDark} />;
    case 'rose-gold-leopard':
      return <RoseGoldLeopardPattern isDark={isDark} />;
    case 'obsidian-leopard':
      return <ObsidianLeopardPattern isDark={isDark} />;
    case 'cheetah-luxe':
      return <CheetahLuxePattern isDark={isDark} />;
    // Holiday patterns
    case 'christmas-festive':
      return <ChristmasFestivePattern isDark={isDark} />;
    case 'halloween-spooky':
      return <HalloweenSpookyPattern isDark={isDark} />;
    case 'thanksgiving-harvest':
      return <ThanksgivingHarvestPattern isDark={isDark} />;
    case 'fourth-of-july':
      return <FourthOfJulyPattern isDark={isDark} />;
    case 'valentines-hearts':
      return <ValentinesHeartsPattern isDark={isDark} />;
    case 'easter-spring':
      return <EasterSpringPattern isDark={isDark} />;
    case 'cinco-de-mayo':
      return <CincoDeMayoPattern isDark={isDark} />;
    default:
      return <NoiseGrainPattern isDark={isDark} />;
  }
}

export default PatternBackground;
