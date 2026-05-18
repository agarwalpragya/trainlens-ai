import { useRef, useState, useEffect } from 'react';
import * as d3 from 'd3';
import type { TrainingMetric, Anomaly } from '../types/analysis';

interface Props {
  metrics: TrainingMetric[];
  anomalies: Anomaly[];
  selectedAnomaly: Anomaly | null;
  onAnomalyClick: (anomaly: Anomaly) => void;
}

const CHART_HEIGHT = 300;
const MARGIN = { top: 20, right: 24, bottom: 38, left: 50 };

// Match the design token colors from globals.css.
const TRAIN_COLOR = '#3b82f6';
const VAL_COLOR   = '#a855f7';
const SEVERITY_COLOR: Record<string, string> = {
  critical: '#ef4444',
  warning:  '#f59e0b',
  info:     '#3b82f6',
};

function severityColor(severity: string): string {
  return SEVERITY_COLOR[severity] ?? '#64748b';
}

export function LossCurveChart({ metrics, anomalies, selectedAnomaly, onAnomalyClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef       = useRef<SVGSVGElement>(null);
  const [width, setWidth] = useState(700);

  // Track container width so the chart stays responsive.
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width;
      if (w > 0) setWidth(w);
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Redraw whenever data, selection, or width changes.
  useEffect(() => {
    if (!svgRef.current || metrics.length === 0) return;

    const innerWidth  = width - MARGIN.left - MARGIN.right;
    const innerHeight = CHART_HEIGHT - MARGIN.top - MARGIN.bottom;

    // ── Scales ──────────────────────────────────────────────────────────
    const steps = metrics.map((d) => d.step);

    const xScale = d3
      .scaleLinear()
      .domain([d3.min(steps)!, d3.max(steps)!])
      .range([0, innerWidth]);

    const allLossValues = metrics.flatMap((d) =>
      d.val_loss != null ? [d.train_loss, d.val_loss] : [d.train_loss],
    );
    const yScale = d3
      .scaleLinear()
      .domain([0, (d3.max(allLossValues) ?? 1) * 1.15])
      .range([innerHeight, 0])
      .nice();

    // ── SVG root ─────────────────────────────────────────────────────────
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const g = svg
      .append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    // ── Horizontal grid lines ────────────────────────────────────────────
    g.append('g')
      .selectAll<SVGLineElement, number>('line')
      .data(yScale.ticks(5))
      .join('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', (d) => yScale(d))
      .attr('y2', (d) => yScale(d))
      .attr('stroke', '#e2e8f0')
      .attr('stroke-width', 1);

    // ── X axis ───────────────────────────────────────────────────────────
    const xAxis = d3
      .axisBottom<number>(xScale)
      .ticks(steps.length <= 10 ? steps.length : 8)
      .tickFormat((d) => String(d.valueOf()));

    if (steps.length <= 10) xAxis.tickValues(steps);

    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .call((sel) => {
        sel.select('.domain').attr('stroke', '#e2e8f0');
        sel.selectAll('.tick line').attr('stroke', '#e2e8f0');
        sel
          .selectAll('.tick text')
          .attr('fill', '#64748b')
          .attr('font-size', '11px')
          .attr('font-family', 'system-ui, sans-serif');
      });

    // X axis label
    g.append('text')
      .attr('x', innerWidth / 2)
      .attr('y', innerHeight + 32)
      .attr('text-anchor', 'middle')
      .attr('fill', '#94a3b8')
      .attr('font-size', '11px')
      .attr('font-family', 'system-ui, sans-serif')
      .text('Step');

    // ── Y axis ───────────────────────────────────────────────────────────
    g.append('g')
      .call(d3.axisLeft(yScale).ticks(5))
      .call((sel) => {
        sel.select('.domain').attr('stroke', '#e2e8f0');
        sel.selectAll('.tick line').attr('stroke', '#e2e8f0');
        sel
          .selectAll('.tick text')
          .attr('fill', '#64748b')
          .attr('font-size', '11px')
          .attr('font-family', 'system-ui, sans-serif');
      });

    // Y axis label
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', -40)
      .attr('text-anchor', 'middle')
      .attr('fill', '#94a3b8')
      .attr('font-size', '11px')
      .attr('font-family', 'system-ui, sans-serif')
      .text('Loss');

    // ── Train loss line ──────────────────────────────────────────────────
    const trainLine = d3
      .line<TrainingMetric>()
      .x((d) => xScale(d.step))
      .y((d) => yScale(d.train_loss));

    g.append('path')
      .datum(metrics)
      .attr('fill', 'none')
      .attr('stroke', TRAIN_COLOR)
      .attr('stroke-width', 2)
      .attr('stroke-linejoin', 'round')
      .attr('stroke-linecap', 'round')
      .attr('d', trainLine);

    // ── Val loss line (only when present) ────────────────────────────────
    const hasValLoss = metrics.some((d) => d.val_loss != null);
    if (hasValLoss) {
      const valLine = d3
        .line<TrainingMetric>()
        .defined((d) => d.val_loss != null)
        .x((d) => xScale(d.step))
        .y((d) => yScale(d.val_loss!));

      g.append('path')
        .datum(metrics)
        .attr('fill', 'none')
        .attr('stroke', VAL_COLOR)
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,3')
        .attr('stroke-linejoin', 'round')
        .attr('stroke-linecap', 'round')
        .attr('d', valLine);
    }

    // ── Anomaly markers ──────────────────────────────────────────────────
    anomalies.forEach((anomaly) => {
      const metric = metrics.find((m) => m.step === anomaly.detected_at_step);
      if (!metric) return;

      const cx    = xScale(metric.step);
      const cy    = yScale(metric.train_loss);
      const color = severityColor(anomaly.severity);
      const isSelected =
        selectedAnomaly?.anomaly_type === anomaly.anomaly_type;

      // Outer ring shown when this marker is selected.
      if (isSelected) {
        g.append('circle')
          .attr('cx', cx)
          .attr('cy', cy)
          .attr('r', 13)
          .attr('fill', 'none')
          .attr('stroke', color)
          .attr('stroke-width', 2)
          .attr('opacity', 0.35)
          .attr('pointer-events', 'none');
      }

      // Marker circle — clickable.
      g.append('circle')
        .attr('cx', cx)
        .attr('cy', cy)
        .attr('r', isSelected ? 7 : 5)
        .attr('fill', color)
        .attr('stroke', '#fff')
        .attr('stroke-width', isSelected ? 2.5 : 2)
        .attr('cursor', 'pointer')
        .on('click', () => onAnomalyClick(anomaly));
    });

    // ── Legend ───────────────────────────────────────────────────────────
    const legendX = innerWidth - (hasValLoss ? 120 : 90);
    const legend  = g.append('g').attr('transform', `translate(${legendX},4)`);

    legend
      .append('line')
      .attr('x1', 0).attr('x2', 18).attr('y1', 5).attr('y2', 5)
      .attr('stroke', TRAIN_COLOR)
      .attr('stroke-width', 2);
    legend
      .append('text')
      .attr('x', 23).attr('y', 9)
      .attr('fill', '#64748b')
      .attr('font-size', '11px')
      .attr('font-family', 'system-ui, sans-serif')
      .text('Train loss');

    if (hasValLoss) {
      legend
        .append('line')
        .attr('x1', 0).attr('x2', 18).attr('y1', 22).attr('y2', 22)
        .attr('stroke', VAL_COLOR)
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,3');
      legend
        .append('text')
        .attr('x', 23).attr('y', 26)
        .attr('fill', '#64748b')
        .attr('font-size', '11px')
        .attr('font-family', 'system-ui, sans-serif')
        .text('Val loss');
    }
  }, [metrics, anomalies, selectedAnomaly, width, onAnomalyClick]);

  return (
    <div className="card">
      <div className="card-title">Loss curve</div>
      <div ref={containerRef}>
        <svg
          ref={svgRef}
          width={width}
          height={CHART_HEIGHT}
          style={{ overflow: 'visible', display: 'block' }}
        />
      </div>
    </div>
  );
}
