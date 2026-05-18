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

const CHART_HEIGHT = 200;
const GPU_COLOR    = '#2dd4bf'; // teal-400 — distinct from loss/memory lines
const THRESHOLD    = 50;

export function GpuUtilizationChart({ metrics, anomalies, selectedAnomaly, onAnomalyClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef       = useRef<SVGSVGElement>(null);
  const [width, setWidth] = useState(0);

  const hasData = metrics.some((m) => m.gpu_utilization_percent != null);

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

    const gpuMetrics = metrics.filter((m) => m.gpu_utilization_percent != null);
    const innerWidth  = width - MARGIN.left - MARGIN.right;
    const innerHeight = CHART_HEIGHT - MARGIN.top - MARGIN.bottom;

    const steps  = gpuMetrics.map((d) => d.step);
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

    // Threshold line at 50%
    const ty = yScale(THRESHOLD);
    g.append('line')
      .attr('x1', 0).attr('x2', innerWidth)
      .attr('y1', ty).attr('y2', ty)
      .attr('stroke', '#fbbf24').attr('stroke-width', 1)
      .attr('stroke-dasharray', '4,3').attr('opacity', 0.55);

    g.append('text')
      .attr('x', innerWidth - 2).attr('y', ty - 4)
      .attr('text-anchor', 'end').attr('fill', '#fbbf24')
      .attr('font-size', '10px').attr('font-family', CHART_FONT).attr('opacity', 0.75)
      .text('50% underutilization threshold');

    // GPU utilization line
    const line = d3.line<TrainingMetric>()
      .defined((d) => d.gpu_utilization_percent != null)
      .x((d) => xScale(d.step))
      .y((d) => yScale(d.gpu_utilization_percent!));

    g.append('path')
      .datum(metrics)
      .attr('fill', 'none')
      .attr('stroke', GPU_COLOR)
      .attr('stroke-width', 2)
      .attr('stroke-linejoin', 'round')
      .attr('stroke-linecap', 'round')
      .attr('d', line);

    // Anomaly markers for gpu_underutilization only
    anomalies
      .filter((a) => a.anomaly_type === 'gpu_underutilization')
      .forEach((anomaly) => {
        const metric = gpuMetrics.find((m) => m.step === anomaly.detected_at_step);
        if (!metric || metric.gpu_utilization_percent == null) return;

        const cx       = xScale(metric.step);
        const cy       = yScale(metric.gpu_utilization_percent);
        const color    = getSeverityColor(anomaly.severity);
        const isSel    = selectedAnomaly?.anomaly_type === anomaly.anomaly_type;

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
      <div className="card-title">GPU utilization</div>
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
            GPU utilization data is not available for this run.
          </div>
        )}
      </div>
    </div>
  );
}
