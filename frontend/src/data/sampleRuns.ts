import type { AnalyzeRequest } from '../types/analysis';

export interface SampleRun {
  key: string;
  label: string;
  payload: AnalyzeRequest;
}

export const sampleRuns: SampleRun[] = [
  {
    key: 'normal_run',
    label: 'Healthy Run',
    payload: {
      run_name: 'resnet50_healthy_run_demo',
      metrics: [
        { step: 100, train_loss: 0.92, val_loss: 0.98, gpu_utilization_percent: 78, memory_used_gb: 9.0, memory_total_gb: 24, gradient_norm: 1.1, learning_rate: 0.001, batch_size: 64, throughput_samples_per_sec: 520, timestamp: '2026-05-17T10:00:00Z' },
        { step: 200, train_loss: 0.78, val_loss: 0.84, gpu_utilization_percent: 80, memory_used_gb: 9.2, memory_total_gb: 24, gradient_norm: 0.9, learning_rate: 0.001, batch_size: 64, throughput_samples_per_sec: 524, timestamp: '2026-05-17T10:01:00Z' },
        { step: 300, train_loss: 0.63, val_loss: 0.70, gpu_utilization_percent: 81, memory_used_gb: 9.3, memory_total_gb: 24, gradient_norm: 0.8, learning_rate: 0.001, batch_size: 64, throughput_samples_per_sec: 526, timestamp: '2026-05-17T10:02:00Z' },
        { step: 400, train_loss: 0.52, val_loss: 0.59, gpu_utilization_percent: 82, memory_used_gb: 9.4, memory_total_gb: 24, gradient_norm: 0.7, learning_rate: 0.001, batch_size: 64, throughput_samples_per_sec: 528, timestamp: '2026-05-17T10:03:00Z' },
        { step: 500, train_loss: 0.43, val_loss: 0.50, gpu_utilization_percent: 83, memory_used_gb: 9.5, memory_total_gb: 24, gradient_norm: 0.6, learning_rate: 0.001, batch_size: 64, throughput_samples_per_sec: 530, timestamp: '2026-05-17T10:04:00Z' },
        { step: 600, train_loss: 0.36, val_loss: 0.43, gpu_utilization_percent: 84, memory_used_gb: 9.6, memory_total_gb: 24, gradient_norm: 0.5, learning_rate: 0.001, batch_size: 64, throughput_samples_per_sec: 532, timestamp: '2026-05-17T10:05:00Z' },
      ],
    },
  },
  {
    key: 'diverging_run',
    label: 'Loss Divergence',
    payload: {
      run_name: 'resnet50_diverging_loss_demo',
      metrics: [
        { step: 100, train_loss: 0.92, val_loss: 1.04, gpu_utilization_percent: 78, memory_used_gb: 9.1, memory_total_gb: 24, gradient_norm: 1.1, learning_rate: 0.001, batch_size: 64, throughput_samples_per_sec: 520, timestamp: '2026-05-17T10:00:00Z' },
        { step: 200, train_loss: 0.71, val_loss: 0.91, gpu_utilization_percent: 80, memory_used_gb: 9.3, memory_total_gb: 24, gradient_norm: 1.2, learning_rate: 0.001, batch_size: 64, throughput_samples_per_sec: 525, timestamp: '2026-05-17T10:01:00Z' },
        { step: 300, train_loss: 0.56, val_loss: 0.82, gpu_utilization_percent: 81, memory_used_gb: 9.5, memory_total_gb: 24, gradient_norm: 1.4, learning_rate: 0.001, batch_size: 64, throughput_samples_per_sec: 530, timestamp: '2026-05-17T10:02:00Z' },
        { step: 400, train_loss: 0.48, val_loss: 0.77, gpu_utilization_percent: 82, memory_used_gb: 9.8, memory_total_gb: 24, gradient_norm: 1.5, learning_rate: 0.001, batch_size: 64, throughput_samples_per_sec: 528, timestamp: '2026-05-17T10:03:00Z' },
        { step: 500, train_loss: 2.35, val_loss: 2.91, gpu_utilization_percent: 84, memory_used_gb: 10.2, memory_total_gb: 24, gradient_norm: 87.4, learning_rate: 0.001, batch_size: 64, throughput_samples_per_sec: 522, timestamp: '2026-05-17T10:04:00Z' },
        { step: 600, train_loss: 7.82, val_loss: 9.21, gpu_utilization_percent: 85, memory_used_gb: 10.6, memory_total_gb: 24, gradient_norm: 132.6, learning_rate: 0.001, batch_size: 64, throughput_samples_per_sec: 518, timestamp: '2026-05-17T10:05:00Z' },
      ],
    },
  },
  {
    key: 'vanishing_gradients',
    label: 'Vanishing Gradients',
    payload: {
      run_name: 'bert_vanishing_gradients_demo',
      metrics: [
        { step: 100, train_loss: 0.90, val_loss: 0.95, gpu_utilization_percent: 78, memory_used_gb: 9.1, memory_total_gb: 24, gradient_norm: 0.5, learning_rate: 0.001, batch_size: 64, throughput_samples_per_sec: 520, timestamp: '2026-05-17T10:00:00Z' },
        { step: 200, train_loss: 0.82, val_loss: 0.88, gpu_utilization_percent: 80, memory_used_gb: 9.2, memory_total_gb: 24, gradient_norm: 0.4, learning_rate: 0.001, batch_size: 64, throughput_samples_per_sec: 522, timestamp: '2026-05-17T10:01:00Z' },
        { step: 300, train_loss: 0.75, val_loss: 0.81, gpu_utilization_percent: 79, memory_used_gb: 9.3, memory_total_gb: 24, gradient_norm: 0.0005, learning_rate: 0.001, batch_size: 64, throughput_samples_per_sec: 519, timestamp: '2026-05-17T10:02:00Z' },
        { step: 400, train_loss: 0.70, val_loss: 0.76, gpu_utilization_percent: 77, memory_used_gb: 9.3, memory_total_gb: 24, gradient_norm: 0.0003, learning_rate: 0.001, batch_size: 64, throughput_samples_per_sec: 518, timestamp: '2026-05-17T10:03:00Z' },
        { step: 500, train_loss: 0.66, val_loss: 0.72, gpu_utilization_percent: 76, memory_used_gb: 9.4, memory_total_gb: 24, gradient_norm: 0.0002, learning_rate: 0.001, batch_size: 64, throughput_samples_per_sec: 517, timestamp: '2026-05-17T10:04:00Z' },
        { step: 600, train_loss: 0.63, val_loss: 0.69, gpu_utilization_percent: 75, memory_used_gb: 9.4, memory_total_gb: 24, gradient_norm: 0.0004, learning_rate: 0.001, batch_size: 64, throughput_samples_per_sec: 516, timestamp: '2026-05-17T10:05:00Z' },
        { step: 700, train_loss: 0.61, val_loss: 0.67, gpu_utilization_percent: 74, memory_used_gb: 9.5, memory_total_gb: 24, gradient_norm: 0.0001, learning_rate: 0.001, batch_size: 64, throughput_samples_per_sec: 515, timestamp: '2026-05-17T10:06:00Z' },
      ],
    },
  },
  {
    key: 'gpu_underutilized',
    label: 'GPU Underutilization',
    payload: {
      run_name: 'resnet50_gpu_underutilized_demo',
      metrics: [
        { step: 100, train_loss: 0.90, val_loss: 0.95, gpu_utilization_percent: 78, memory_used_gb: 9.1, memory_total_gb: 24, gradient_norm: 1.1, learning_rate: 0.001, batch_size: 64, throughput_samples_per_sec: 520, timestamp: '2026-05-17T10:00:00Z' },
        { step: 200, train_loss: 0.80, val_loss: 0.86, gpu_utilization_percent: 75, memory_used_gb: 9.2, memory_total_gb: 24, gradient_norm: 1.0, learning_rate: 0.001, batch_size: 64, throughput_samples_per_sec: 518, timestamp: '2026-05-17T10:01:00Z' },
        { step: 300, train_loss: 0.71, val_loss: 0.78, gpu_utilization_percent: 30, memory_used_gb: 9.3, memory_total_gb: 24, gradient_norm: 0.9, learning_rate: 0.001, batch_size: 64, throughput_samples_per_sec: 210, timestamp: '2026-05-17T10:02:00Z' },
        { step: 400, train_loss: 0.64, val_loss: 0.71, gpu_utilization_percent: 35, memory_used_gb: 9.3, memory_total_gb: 24, gradient_norm: 0.8, learning_rate: 0.001, batch_size: 64, throughput_samples_per_sec: 215, timestamp: '2026-05-17T10:03:00Z' },
        { step: 500, train_loss: 0.58, val_loss: 0.65, gpu_utilization_percent: 25, memory_used_gb: 9.4, memory_total_gb: 24, gradient_norm: 0.7, learning_rate: 0.001, batch_size: 64, throughput_samples_per_sec: 200, timestamp: '2026-05-17T10:04:00Z' },
        { step: 600, train_loss: 0.53, val_loss: 0.60, gpu_utilization_percent: 40, memory_used_gb: 9.4, memory_total_gb: 24, gradient_norm: 0.7, learning_rate: 0.001, batch_size: 64, throughput_samples_per_sec: 212, timestamp: '2026-05-17T10:05:00Z' },
        { step: 700, train_loss: 0.49, val_loss: 0.56, gpu_utilization_percent: 20, memory_used_gb: 9.5, memory_total_gb: 24, gradient_norm: 0.6, learning_rate: 0.001, batch_size: 64, throughput_samples_per_sec: 195, timestamp: '2026-05-17T10:06:00Z' },
      ],
    },
  },
  {
    key: 'oom_risk',
    label: 'OOM Risk',
    payload: {
      run_name: 'vit_oom_risk_demo',
      metrics: [
        { step: 100, train_loss: 0.90, val_loss: 0.95, gpu_utilization_percent: 82, memory_used_gb: 9.0, memory_total_gb: 24, gradient_norm: 1.1, learning_rate: 0.001, batch_size: 128, throughput_samples_per_sec: 480, timestamp: '2026-05-17T10:00:00Z' },
        { step: 200, train_loss: 0.78, val_loss: 0.84, gpu_utilization_percent: 84, memory_used_gb: 14.0, memory_total_gb: 24, gradient_norm: 1.2, learning_rate: 0.001, batch_size: 128, throughput_samples_per_sec: 478, timestamp: '2026-05-17T10:01:00Z' },
        { step: 300, train_loss: 0.66, val_loss: 0.73, gpu_utilization_percent: 85, memory_used_gb: 18.5, memory_total_gb: 24, gradient_norm: 1.3, learning_rate: 0.001, batch_size: 128, throughput_samples_per_sec: 475, timestamp: '2026-05-17T10:02:00Z' },
        { step: 400, train_loss: 0.57, val_loss: 0.64, gpu_utilization_percent: 86, memory_used_gb: 22.0, memory_total_gb: 24, gradient_norm: 1.4, learning_rate: 0.001, batch_size: 128, throughput_samples_per_sec: 470, timestamp: '2026-05-17T10:03:00Z' },
        { step: 500, train_loss: 0.50, val_loss: 0.57, gpu_utilization_percent: 87, memory_used_gb: 23.5, memory_total_gb: 24, gradient_norm: 1.5, learning_rate: 0.001, batch_size: 128, throughput_samples_per_sec: 465, timestamp: '2026-05-17T10:04:00Z' },
      ],
    },
  },
  {
    key: 'training_stall',
    label: 'Training Stall',
    payload: {
      run_name: 'gpt2_training_stall_demo',
      metrics: [
        { step: 100, train_loss: 0.90, val_loss: 0.95, gpu_utilization_percent: 80, memory_used_gb: 9.1, memory_total_gb: 24, gradient_norm: 1.1, learning_rate: 0.001, batch_size: 64, throughput_samples_per_sec: 520, timestamp: '2026-05-17T10:00:00Z' },
        { step: 200, train_loss: 0.80, val_loss: 0.85, gpu_utilization_percent: 81, memory_used_gb: 9.2, memory_total_gb: 24, gradient_norm: 1.0, learning_rate: 0.001, batch_size: 64, throughput_samples_per_sec: 522, timestamp: '2026-05-17T10:01:00Z' },
        { step: 300, train_loss: 0.70, val_loss: 0.60, gpu_utilization_percent: 80, memory_used_gb: 9.3, memory_total_gb: 24, gradient_norm: 0.9, learning_rate: 0.001, batch_size: 64, throughput_samples_per_sec: 520, timestamp: '2026-05-17T10:02:00Z' },
        { step: 400, train_loss: 0.62, val_loss: 0.60005, gpu_utilization_percent: 79, memory_used_gb: 9.3, memory_total_gb: 24, gradient_norm: 0.05, learning_rate: 0.00001, batch_size: 64, throughput_samples_per_sec: 519, timestamp: '2026-05-17T10:03:00Z' },
        { step: 500, train_loss: 0.55, val_loss: 0.59998, gpu_utilization_percent: 78, memory_used_gb: 9.4, memory_total_gb: 24, gradient_norm: 0.04, learning_rate: 0.00001, batch_size: 64, throughput_samples_per_sec: 518, timestamp: '2026-05-17T10:04:00Z' },
        { step: 600, train_loss: 0.50, val_loss: 0.60001, gpu_utilization_percent: 78, memory_used_gb: 9.4, memory_total_gb: 24, gradient_norm: 0.04, learning_rate: 0.00001, batch_size: 64, throughput_samples_per_sec: 517, timestamp: '2026-05-17T10:05:00Z' },
        { step: 700, train_loss: 0.46, val_loss: 0.60003, gpu_utilization_percent: 77, memory_used_gb: 9.5, memory_total_gb: 24, gradient_norm: 0.03, learning_rate: 0.00001, batch_size: 64, throughput_samples_per_sec: 516, timestamp: '2026-05-17T10:06:00Z' },
        { step: 800, train_loss: 0.43, val_loss: 0.60002, gpu_utilization_percent: 77, memory_used_gb: 9.5, memory_total_gb: 24, gradient_norm: 0.03, learning_rate: 0.00001, batch_size: 64, throughput_samples_per_sec: 515, timestamp: '2026-05-17T10:07:00Z' },
      ],
    },
  },
];
