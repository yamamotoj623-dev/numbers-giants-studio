/**
 * GAS バックエンドの API クライアント
 * TTS呼び出しは TTSAdapter 内で直接行うが、その他の雑用（BGM一覧、ログ）はここに集約
 */

import { GAS_CONFIG } from './config';

async function post(payload) {
  if (!GAS_CONFIG.endpoint) throw new Error('GAS endpoint not configured');
  const response = await fetch(GAS_CONFIG.endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ token: GAS_CONFIG.authToken, ...payload }),
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`GAS error ${response.status}: ${errText}`);
  }
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data;
}

export async function fetchBgmLibrary() {
  const data = await post({ action: 'list_bgm' });
  return data.files || [];
}

export async function logVideoGeneration(entry) {
  try {
    await post({ action: 'log', ...entry });
    return true;
  } catch (err) {
    console.warn('Log failed (non-fatal):', err);
    return false;
  }
}

export async function healthCheck() {
  try {
    const data = await post({ action: 'health' });
    return data.status === 'ok';
  } catch {
    return false;
  }
}
