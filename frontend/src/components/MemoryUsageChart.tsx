import { useRef, useState, useEffect } from 'react';
import * as d3 from 'd3';
import type { TrainingMetric, Anomaly } from '../types/analysis';
import {
  CHART_MARGIN as MARGIN,
  GRID_STROKE, AXIS_STROKE, TICK_FILL, LABEL_FILL, CHART_FONT, SURFACE_COLOR,
  getSeverityColor,
} from '../utils/chartHelpers';

interface Props {
  metrics: TrainingMetric[];
  anomalies: Anomaly[];
  selectedAnomaly: Anomaly | null;
  onAnomalyClick: (anomaly: Anomaly) => void;
}

const CHART_HEIGHT  = 200;
const MEMORY_COLOR  = '#fb923c'; // orange-400 — distinct from loss/GPU lines
const THRESHOLD     = 90;

function memPct(m: TrainingMetric): number | null {
  if (m.memory_used_gb == null || m.memory_total_gb == null || m.memory_total_gb === 0) return null;
  return (m.memory_used_gb / m.memory_total_gb) * 100;
}

export function MemoryUsageChart({ metrics, anomalies, selectedAnomaly, onAnomalyClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef       = useRef<SVGSVGElement>(null);
  const [width, setWidth] = useState(0);

  const hasData = metrics.some((m) => memPct(m) != null);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width;
      if (w > 0) setWidth(w);
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current || !hasData || width === 0) return;

    const memMetrics  = metrics.filter((m) => memPct(m) != null);
    const innerWidth  = width - MARGIN.left - MARGIN.right;
    const innerHeight = CHART_HEIGHT - MARGIN.top - MARGIN.bottom;

    const steps  = memMetrics.map((d) => d.step);
    const xScale = d3.scaleLinear().domain([d3.min(steps)!, d3.max(steps)!]).range([0, innerWidth]);
    const yScale = d3.scaleLinear().domain([0, 100]).range([innerHeight, 0]);

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const g = svg.append('g').attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    // Grid lines
    g.append('g')
      .selectAll<SVGLineElement, number>('line')
      .data(yScale.ticks(4))
      .join('line')
      .attr('x1', 0).attr('x2', innerWidth)
      .attr('y1', (d) => yScale(d)).attr('y2', (d) => yScale(d))
      .attr('stroke', GRID_STROKE).attr('stroke-width', 1);

    // X axis
    const xAxis = d3.axisBottom<number>(xScale)
      .ticks(steps.length <= 10 ? steps.length : 6)
      .tickFormat((d) => String(d.valueOf()));
    if (steps.length <= 10) xAxis.tickValues(steps);

    g.append('g').attr('transform', `translate(0,${innerHeight})`).call(xAxis)
      .call((sel) => {
        sel.select('.domain').attr('stroke', AXIS_STROKE);
        sel.selectAll('.tick line').attr('stroke', AXIS_STROKE);
        sel.selectAll('.tick text').attr('fill', TICK_FILL).attr('font-size', '11px').attr('font-family', CHART_FONT);
      });

    g.append('text')
      .attr('x', innerWidth / 2).attr('y', innerHeight + 32)
      .attr('text-anchor', 'middle').attr('fill', LABEL_FILL)
      .attr('font-size', '11px').attr('font-family', CHART_FONT)
      .text('Step');

    // Y axis
    g.append('g').call(d3.axisLeft(yScale).ticks(4).tickFormat((d) => `${d}%`))
      .call((sel) => {
        sel.select('.domain').attr('stroke', AXIS_STROKE);
        sel.selectAll('.tick line').attr('stroke', AXIS_STROKE);
        sel.selectAll('.tick text').attr('fill', TICK_FILL).attr('font-size', '11px').attr('font-family', CHART_FONT);
      });

    // Threshold line at 90%
    const ty = yScale(THRESHOLD);
    g.append('line')
      .attr('x1', 0).attr('x2', innerWidth)
      .attr('y1', ty).attr('y2', ty)
      .attr('stroke', '#f87171').attr('stroke-width', 1)
      .attr('stroke-dasharray', '4,3').attr('opacity', 0.55);

    g.append('text')
      .attr('x', innerWidth - 2).attr('y', ty - 4)
      .attr('text-anchor', 'end').attr('fill', '#f87171')
      .attr('font-size', '10px').attr('font-family', CHART_FONT).attr('opacity', 0.75)
      .text('90% OOM risk threshold');

    // Memory utilization area + line
    const area = d3.area<TrainingMetric>()
      .defined((d) => memPct(d) != null)
      .x((d) => xScale(d.step))
      .y0(innerHeight)
      .y1((d) => yScale(memPct(d)!));

    g.append('path')
      .datum(metrics)
      .attr('fill', MEMORY_COLOR)
      .attr('fill-opacity', 0.08)
      .attr('d', area);

    const line = d3.line<TrainingMetric>()
      .defined((d) => memPct(d) != null)
      .x((d) => xScale(d.step))
      .y((d) => yScale(memPct(d)!));

    g.append('path')
      .datum(metrics)
      .attr('fill', 'none')
      .attr('stroke', MEMORY_COLOR)
      .attr('stroke-width', 2)
      .attr('stroke-linejoin', 'round')
      .attr('stroke-linecap', 'round')
      .attr('d', line);

    // Anomaly markers for oom_risk only
    anomalies
      .filter((a) => a.anomaly_type === 'oom_risk')
      .forEach((anomaly) => {
        const metric = memMetrics.find((m) => m.step === anomaly.detected_at_step);
        const pct    = metric ? memPct(metric) : null;
        if (!metric || pct == null) return;

        const cx    = xScale(metric.step);
        const cy    = yScale(pct);
        const color = getSeverityColor(anomaly.severity);
        const isSel = selectedAnomaly?.anomaly_type === anomaly.anomaly_type;

        if (isSel) {
          g.append('circle').attr('cx', cx).attr('cy', cy).attr('r', 13)
            .attr('fill', 'none').attr('stroke', color).attr('stroke-width', 2)
            .attr('opacity', 0.35).attr('pointer-events', 'none');
        }

        g.append('circle').attr('cx', cx).attr('cy', cy)
          .attr('r', isSel ? 7 : 5)
          .attr('fill', color)
          .attr('stroke', SURFACE_COLOR)
          .attr('stroke-width', isSel ? 2.5 : 2)
          .attr('cursor', 'pointer')
          .on('click', () => onAnomalyClick(anomaly));
      });

  }, [metrics, anomalies, selectedAnomaly, width, onAnomalyClick, hasData]);

  return (
    <div className="card">
      <div className="card-title">Memory utilization</div>
      <div ref={containerRef}>
        {hasData ? (
          <svg
            ref={svgRef}
            width={width}
            height={CHART_HEIGHT}
            style={{ overflow: 'visible', display: 'block' }}
          />
        ) : (
          <div className="chart-empty-state">
            Memory usage data is not available for this run.
          </div>
        )}
      </div>
    </div>
  );
}
