import axios from 'axios';

const API_BASE = '/api';

export async function analyzeDocument(file) {
  const formData = new FormData();
  formData.append('file', file);
  const response = await axios.post(`${API_BASE}/analyze`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000,
  });
  return response.data;
}

export async function getSamples() {
  const response = await axios.get(`${API_BASE}/samples`);
  return response.data;
}

export async function analyzeSample(sampleId) {
  const response = await axios.post(`${API_BASE}/analyze-sample/${sampleId}`, {}, {
    timeout: 120000,
  });
  return response.data;
}

export async function healthCheck() {
  const response = await axios.get(`${API_BASE}/health`);
  return response.data;
}
