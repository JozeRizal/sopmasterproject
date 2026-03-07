import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

interface MermaidProps {
  chart: string;
}

const Mermaid: React.FC<MermaidProps> = ({ chart }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
      theme: 'default',
      securityLevel: 'loose',
    });
    
    if (containerRef.current) {
      mermaid.contentLoaded();
    }
  }, [chart]);

  return (
    <div className="mermaid" ref={containerRef}>
      {chart}
    </div>
  );
};

export default Mermaid;
