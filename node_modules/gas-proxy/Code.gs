/**
 * ============================================================================
 * Baseball Analytics Video Creator - GAS Proxy Backend (v1.0.0)
 * ============================================================================
 * 
 * このファイルはGoogle Apps Script側のメインコードです。
 * Reactアプリから呼び出され、Gemini TTS APIの代理実行、
 * Google Drive上のBGMライブラリ一覧取得、生成履歴ログ保存を担当します。
 *
 * 【初期設定手順】
 * 1. https://script.google.com/ にアクセスし「新しいプロジェクト」作成
 * 2. このコード全体を Code.gs に貼り付け
 * 3. 左メニュー「プロジェクトの設定」→「スクリプト プロパティ」で以下を追加:
 *    - GEMINI_API_KEY: Google AI StudioのAPIキー
 *    - AUTH_TOKEN: 任意のランダム文字列（例: クリプトで生成した32文字のhex）
 *    - BGM_FOLDER_ID: Google Drive上のBGM格納フォルダID
 *    - LOG_SHEET_ID: (任意) コスト記録用Google SheetsのID
 * 4. 「デプロイ」→「新しいデプロイ」→「ウェブアプリ」選択
 *    - 実行ユーザー: 自分
 *    - アクセス権: 全員
 * 5. 発行されたURLをReactアプリの環境変数に設定
 * ============================================================================
 */

const CONFIG = {
  GEMINI_TTS_MODEL: 'gemini-3.1-flash-tts-preview',
  GEMINI_TTS_ENDPOINT: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-tts-preview:generateContent',
  RATE_LIMIT_PER_DAY: 500,
  MAX_TEXT_LENGTH: 500
};

const VOICE_PROFILES = {
  // Aは冷静なアナリスト。Charon (calm, professional male) を継続。1.8倍速でも明瞭さを保つよう指示。
  A: {
    voiceName: 'Charon',
    stylePrompt: '落ち着いた30代男性アナリストの声で、論理的に断定しつつ、語頭と語尾をクリアに発音してください。早口気味でも1語1語の輪郭がはっきり聞こえる話し方で、感情論は排し、短いセンテンスで簡潔に。'
  },
  // Bはテンション高めのファン。Puck (upbeat, lively male) で驚き・感動の表情豊かさを最大化。
  // Aoede(女性)から Puck(男性)に変更: A/Bとも男性になるが声質(低vs高)で差別化、感情表現の幅でPuckが圧勝。
  B: {
    voiceName: 'Puck',
    stylePrompt: '好奇心旺盛で感情豊かな20代男性ファンの声で、驚き・納得・感心を素直に表現してください。高速再生(1.6〜1.8倍)でも明瞭に聞こえるよう、母音を粒立てて発音し、感嘆詞や語尾上げは自然に。アナリストと被らないよう明るめのトーンを維持してください。'
  }
};

// ============================================================================
// エントリポイント: POST リクエスト処理
// ============================================================================
function doPost(e) {
  try {
    const request = JSON.parse(e.postData.contents);
    
    if (!validateAuth(request.token)) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }
    
    if (!checkRateLimit()) {
      return jsonResponse({ error: 'Rate limit exceeded' }, 429);
    }
    
    const action = request.action;
    
    switch (action) {
      case 'tts':
        return handleTTS(request);
      case 'list_bgm':
        return handleListBgm(request);
      case 'log':
        return handleLog(request);
      case 'health':
        return jsonResponse({ status: 'ok', timestamp: new Date().toISOString() });
      default:
        return jsonResponse({ error: 'Unknown action: ' + action }, 400);
    }
  } catch (err) {
    console.error('doPost error:', err);
    return jsonResponse({ error: err.toString(), stack: err.stack }, 500);
  }
}

// GET も受け付けるが、CORS プリフライト対応とヘルスチェックのみ
function doGet(e) {
  return jsonResponse({ 
    status: 'ok', 
    message: 'Baseball Analytics GAS Proxy v1.0.0',
    endpoints: ['tts', 'list_bgm', 'log', 'health']
  });
}

// ============================================================================
// アクション1: TTS 生成
// ============================================================================
function handleTTS(request) {
  const { text, speaker } = request;
  
  if (!text || typeof text !== 'string') {
    return jsonResponse({ error: 'text is required' }, 400);
  }
  if (text.length > CONFIG.MAX_TEXT_LENGTH) {
    return jsonResponse({ error: 'text too long (max ' + CONFIG.MAX_TEXT_LENGTH + ')' }, 400);
  }
  if (!speaker || !VOICE_PROFILES[speaker]) {
    return jsonResponse({ error: 'speaker must be A or B' }, 400);
  }
  
  const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  if (!apiKey) {
    return jsonResponse({ error: 'GEMINI_API_KEY not configured' }, 500);
  }
  
  const voice = VOICE_PROFILES[speaker];
  const directorPrompt = voice.stylePrompt + '\n\n以下のセリフを読み上げてください:\n' + text;
  
  const payload = {
    contents: [{ parts: [{ text: directorPrompt }] }],
    generationConfig: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: voice.voiceName }
        }
      }
    }
  };
  
  const response = UrlFetchApp.fetch(
    CONFIG.GEMINI_TTS_ENDPOINT + '?key=' + apiKey,
    {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    }
  );
  
  const responseCode = response.getResponseCode();
  const responseText = response.getContentText();
  
  if (responseCode !== 200) {
    console.error('Gemini API error:', responseCode, responseText);
    return jsonResponse({ 
      error: 'Gemini API failed', 
      statusCode: responseCode,
      detail: responseText.substring(0, 500)
    }, responseCode);
  }
  
  const data = JSON.parse(responseText);
  const audioBase64 = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  
  if (!audioBase64) {
    return jsonResponse({ error: 'No audio data in response' }, 500);
  }
  
  incrementRateLimit();
  
  const outputSec = text.length * 0.15;
  const estimatedCost = (outputSec * 25 * 20 + text.length * 0.5 * 1) / 1000000;
  
  return jsonResponse({
    audioBase64: audioBase64,
    mimeType: 'audio/wav',
    sampleRate: 24000,
    speaker: speaker,
    voiceName: voice.voiceName,
    estimatedCostUsd: estimatedCost
  });
}

// ============================================================================
// アクション2: BGM ライブラリ一覧取得
// ============================================================================
function handleListBgm(request) {
  const folderId = PropertiesService.getScriptProperties().getProperty('BGM_FOLDER_ID');
  if (!folderId) {
    return jsonResponse({ error: 'BGM_FOLDER_ID not configured' }, 500);
  }
  
  try {
    const folder = DriveApp.getFolderById(folderId);
    const files = folder.getFiles();
    const results = [];
    
    while (files.hasNext()) {
      const file = files.next();
      const mime = file.getMimeType();
      if (mime === 'audio/mpeg' || mime === 'audio/mp3' || mime === 'audio/wav' || mime === 'audio/ogg') {
        const name = file.getName();
        const description = file.getDescription() || '';
        const tags = parseDescription(description);
        
        results.push({
          id: file.getId(),
          name: name.replace(/\.(mp3|wav|ogg|mpeg)$/i, ''),
          fileName: name,
          url: 'https://drive.google.com/uc?export=download&id=' + file.getId(),
          directStreamUrl: getDriveStreamUrl(file.getId()),
          mimeType: mime,
          sizeBytes: file.getSize(),
          modifiedAt: file.getLastUpdated().toISOString(),
          genre: tags.genre || '未分類',
          mood: tags.mood || '',
          duration: tags.duration || null
        });
      }
    }
    
    results.sort((a, b) => a.name.localeCompare(b.name, 'ja'));
    
    return jsonResponse({ files: results, count: results.length });
  } catch (err) {
    console.error('listBgm error:', err);
    return jsonResponse({ error: 'Drive access failed: ' + err.toString() }, 500);
  }
}

function parseDescription(desc) {
  const result = {};
  if (!desc) return result;
  const lines = desc.split('\n');
  for (const line of lines) {
    const match = line.match(/^(\w+):\s*(.+)$/);
    if (match) result[match[1].trim()] = match[2].trim();
  }
  return result;
}

function getDriveStreamUrl(fileId) {
  return 'https://drive.google.com/uc?export=view&id=' + fileId;
}

// ============================================================================
// アクション3: 生成履歴ログ保存
// ============================================================================
function handleLog(request) {
  const sheetId = PropertiesService.getScriptProperties().getProperty('LOG_SHEET_ID');
  if (!sheetId) {
    return jsonResponse({ success: false, reason: 'LOG_SHEET_ID not configured (logging disabled)' });
  }
  
  try {
    const sheet = SpreadsheetApp.openById(sheetId).getActiveSheet();
    const row = [
      new Date(),
      request.videoId || '',
      request.playerName || '',
      request.pattern || '',
      request.layoutType || '',
      request.scriptsCount || 0,
      request.costUsd || 0,
      request.costJpy || 0,
      request.ttsEngine || '',
      request.note || ''
    ];
    sheet.appendRow(row);
    
    return jsonResponse({ success: true, row: sheet.getLastRow() });
  } catch (err) {
    console.error('log error:', err);
    return jsonResponse({ success: false, reason: err.toString() });
  }
}

// ============================================================================
// 認証・レート制限
// ============================================================================
function validateAuth(token) {
  const expected = PropertiesService.getScriptProperties().getProperty('AUTH_TOKEN');
  if (!expected) {
    console.warn('AUTH_TOKEN not set - skipping auth check');
    return true;
  }
  return token === expected;
}

function checkRateLimit() {
  const cache = CacheService.getScriptCache();
  const today = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd');
  const key = 'rate_limit_' + today;
  const count = parseInt(cache.get(key) || '0');
  return count < CONFIG.RATE_LIMIT_PER_DAY;
}

function incrementRateLimit() {
  const cache = CacheService.getScriptCache();
  const today = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd');
  const key = 'rate_limit_' + today;
  const count = parseInt(cache.get(key) || '0') + 1;
  cache.put(key, count.toString(), 86400);
}

// ============================================================================
// 共通ユーティリティ
// ============================================================================
function jsonResponse(obj, statusCode) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================================
// 開発・デバッグ用関数（GASエディタから直接実行）
// ============================================================================

// 最初にAPIキーを設定するためのヘルパー
// GASエディタで1回だけ手動実行して使う
function setupInitialProperties() {
  const props = PropertiesService.getScriptProperties();
  props.setProperties({
    'GEMINI_API_KEY': 'AIza...ここに本物のキーを入れて1回だけ実行...',
    'AUTH_TOKEN': Utilities.getUuid().replace(/-/g, ''),
    'BGM_FOLDER_ID': 'ここにDriveのBGMフォルダIDを入れる',
    'LOG_SHEET_ID': ''
  });
  
  const check = props.getProperties();
  console.log('Properties set:');
  console.log('- GEMINI_API_KEY: ' + (check.GEMINI_API_KEY ? '(set)' : '(missing)'));
  console.log('- AUTH_TOKEN: ' + check.AUTH_TOKEN);
  console.log('- BGM_FOLDER_ID: ' + check.BGM_FOLDER_ID);
  console.log('- LOG_SHEET_ID: ' + (check.LOG_SHEET_ID || '(disabled)'));
  console.log('');
  console.log('>>> この AUTH_TOKEN をReactアプリ側にも設定してください <<<');
}

// TTS呼び出しの疎通確認
function testTTS() {
  const mockRequest = {
    token: PropertiesService.getScriptProperties().getProperty('AUTH_TOKEN'),
    action: 'tts',
    text: 'これはテスト音声です。',
    speaker: 'A'
  };
  const response = handleTTS(mockRequest);
  const content = response.getContent();
  const parsed = JSON.parse(content);
  if (parsed.audioBase64) {
    console.log('TTS test OK');
    console.log('- audio data size: ' + parsed.audioBase64.length + ' chars');
    console.log('- voice: ' + parsed.voiceName);
    console.log('- estimated cost: $' + parsed.estimatedCostUsd.toFixed(6));
  } else {
    console.error('TTS test FAILED:', parsed);
  }
}

// BGM一覧取得の疎通確認
function testListBgm() {
  const mockRequest = {
    token: PropertiesService.getScriptProperties().getProperty('AUTH_TOKEN'),
    action: 'list_bgm'
  };
  const response = handleListBgm(mockRequest);
  const parsed = JSON.parse(response.getContent());
  console.log('BGM count: ' + parsed.count);
  if (parsed.files) {
    parsed.files.slice(0, 5).forEach(f => {
      console.log('- ' + f.name + ' (' + f.genre + ') ' + (f.sizeBytes / 1024).toFixed(0) + 'KB');
    });
  }
}

// レート制限カウンタリセット（トラブルシュート用）
function resetRateLimit() {
  const cache = CacheService.getScriptCache();
  const today = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd');
  cache.remove('rate_limit_' + today);
  console.log('Rate limit counter reset for ' + today);
}
