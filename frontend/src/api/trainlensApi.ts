import axios from 'axios';
import type { AnalyzeRequest, AnalyzeResponse, AskRequest, AskResponse } from '../types/analysis';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

const client = axios.create({ baseURL: BASE_URL });

export async function analyzeRun(request: AnalyzeRequest): Promise<AnalyzeResponse> {
  const response = await client.post<AnalyzeResponse>('/api/analyze', request);
  return response.data;
}

export async function askQuestion(request: AskRequest): Promise<AskResponse> {
  const response = await client.post<AskResponse>('/api/ask', request);
  return response.data;
}
