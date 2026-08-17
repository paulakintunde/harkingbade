import React from 'react';
import { Composition } from 'remotion';
import { OpportunitySignal } from './OpportunitySignal';
import type { OpportunitySignalProps } from './OpportunitySignal';

const defaultProps: OpportunitySignalProps = {
  title: 'Make the value visible.',
  subtitle: 'From raw material to useful momentum',
  signals: [
    { label: 'INPUT', value: 'Property photos', color: '#d7ff4f' },
    { label: 'MOVE', value: 'Motion + story', color: '#ff705e' },
    { label: 'OUTPUT', value: 'More reasons to act', color: '#5964ff' },
  ],
};

export const RemotionRoot: React.FC = () => (
  <Composition
    id="OpportunitySignal"
    component={OpportunitySignal}
    durationInFrames={240}
    fps={30}
    width={1200}
    height={675}
    defaultProps={defaultProps}
  />
);
