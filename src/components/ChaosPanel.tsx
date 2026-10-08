import { useState } from 'react';
import { chaos, updateChaos } from '../mocks/chaos';

// A small panel to make the mock API slower or fail more often (useful for the demo video).
export function ChaosPanel() {
  const [failRate, setFailRate] = useState(chaos.failRate);
  const [delay, setDelay] = useState(`${chaos.minDelay}-${chaos.maxDelay}`);

  return (
    <details className="chaos">
      <summary>Network chaos (mock API)</summary>

      <label>
        Failure rate
        <select
          value={failRate}
          onChange={(e) => {
            const value = Number(e.target.value);
            setFailRate(value);
            updateChaos({ failRate: value });
          }}
        >
          <option value={0}>0% (never fail)</option>
          <option value={0.1}>10% (assignment default)</option>
          <option value={0.5}>50%</option>
          <option value={1}>100% (always fail)</option>
        </select>
      </label>

      <label>
        Delay
        <select
          value={delay}
          onChange={(e) => {
            setDelay(e.target.value);
            const [min, max] = e.target.value.split('-').map(Number);
            updateChaos({ minDelay: min, maxDelay: max });
          }}
        >
          <option value="50-200">50–200 ms (fast)</option>
          <option value="200-3000">200 ms – 3 s (assignment default)</option>
          <option value="2000-6000">2–6 s (very slow)</option>
        </select>
      </label>
    </details>
  );
}
