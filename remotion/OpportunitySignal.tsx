import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

type Signal = {
  label: string;
  value: string;
  color: string;
};

export type OpportunitySignalProps = {
  title: string;
  subtitle: string;
  signals: Signal[];
};

const ink = '#0d1117';
const paper = '#fffdf8';
const lime = '#d7ff4f';
const coral = '#ff705e';
const blue = '#5964ff';

export const OpportunitySignal: React.FC<OpportunitySignalProps> = ({ title, subtitle, signals }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const intro = spring({ frame, fps, config: { damping: 200, stiffness: 100 } });
  const pulse = interpolate(frame % 60, [0, 30, 60], [0.35, 1, 0.35]);
  const scan = interpolate(frame % 180, [0, 180], [-0.2, 1.2]);

  return (
    <AbsoluteFill style={{ backgroundColor: ink, color: paper, fontFamily: 'Arial, sans-serif', padding: 64, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, opacity: 0.14, backgroundImage: 'linear-gradient(#687586 1px, transparent 1px), linear-gradient(90deg, #687586 1px, transparent 1px)', backgroundSize: 48 }} />
      <div style={{ position: 'absolute', top: `${scan * 100}%`, left: 0, right: 0, height: 3, backgroundColor: lime, opacity: 0.25 }} />
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', color: '#a9b4c1', fontSize: 18, fontWeight: 700, letterSpacing: 4 }}>
        <span>HB / OPPORTUNITY SIGNAL</span><span style={{ color: lime }}>LIVE</span>
      </div>
      <div style={{ position: 'relative', zIndex: 1, marginTop: 92, transform: `translateY(${interpolate(intro, [0, 1], [60, 0])}px)`, opacity: intro }}>
        <div style={{ color: lime, fontSize: 22, fontWeight: 700, letterSpacing: 3 }}>{subtitle.toUpperCase()}</div>
        <div style={{ maxWidth: 950, marginTop: 18, fontSize: 76, lineHeight: 0.98, fontWeight: 900, letterSpacing: -5 }}>{title}</div>
      </div>
      <div style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18, marginTop: 86 }}>
        {signals.map((signal, index) => {
          const delay = index * 8;
          const progress = spring({ frame: Math.max(0, frame - delay), fps, config: { damping: 200, stiffness: 120 } });
          return (
            <div key={signal.label} style={{ padding: 24, border: '1px solid #45515e', backgroundColor: '#151c24', transform: `translateY(${interpolate(progress, [0, 1], [40, 0])}px)`, opacity: progress }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#a9b4c1', fontSize: 16, fontWeight: 700, letterSpacing: 2 }}><span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: signal.color, opacity: pulse }} />{signal.label.toUpperCase()}</div>
              <div style={{ marginTop: 32, fontSize: 28, fontWeight: 800 }}>{signal.value}</div>
            </div>
          );
        })}
      </div>
      <div style={{ position: 'absolute', right: 64, bottom: 52, zIndex: 1, display: 'flex', gap: 18, alignItems: 'center', color: '#a9b4c1', fontSize: 18, fontWeight: 700, letterSpacing: 2 }}><span style={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: coral }} />PROOF → PRODUCT → DEMAND</div>
      <div style={{ position: 'absolute', bottom: -170, left: -90, width: 500, height: 500, border: `2px solid ${blue}`, borderRadius: '50%', opacity: .45 }} />
    </AbsoluteFill>
  );
};
