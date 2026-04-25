/**
 * useVideoRecorder
 *
 * ブラウザの getDisplayMedia API でタブを録画し、
 * AudioContext の出力 (TTS/BGM/SE ミックス済み) を音声トラックとして合成。
 *
 * 利用フロー:
 *  1. startRecording() を呼ぶ
 *  2. ブラウザが「録画するタブを選んでください」ダイアログを出す → ユーザーが現在のタブを選ぶ
 *  3. 自動で再生開始
 *  4. 動画終了 (または手動停止) で webm ファイル自動ダウンロード
 *
 * 出力: video/webm (vp9 + opus)
 */
import { useRef, useState, useCallback } from 'react';

export function useVideoRecorder({ getAudioStream } = {}) {
  const [isRecording, setIsRecording] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const displayStreamRef = useRef(null);

  const startRecording = useCallback(async ({ filename = 'shorts.webm', onStop } = {}) => {
    setErrorMessage(null);
    if (!navigator.mediaDevices?.getDisplayMedia) {
      setErrorMessage('お使いのブラウザは画面録画に対応していません。Chrome/Edge/Safariの最新版をお試しください。');
      return false;
    }

    try {
      // 1. ユーザーに「録画するタブ」を選んでもらう (タブ音声も含める)
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          frameRate: { ideal: 30, max: 60 },
          width: { ideal: 1080 },
          height: { ideal: 1920 },
        },
        audio: true, // タブ音声をキャプチャ → BGM/SE/TTS 全部入る
        preferCurrentTab: true,
      });
      displayStreamRef.current = displayStream;

      // 2. 動画トラックは getDisplayMedia から、音声トラックも同じく
      // (getDisplayMedia が audio:true で取得した音声には HTMLAudioElement の出力も含まれる)
      const videoTracks = displayStream.getVideoTracks();
      const audioTracks = displayStream.getAudioTracks();

      if (audioTracks.length === 0) {
        console.warn('タブ音声がキャプチャされていません。共有時に「タブの音声を共有」をオンにしてください。');
      }

      // 3. オプション: 自前のAudioContextがあれば追加でミックス (フォールバック)
      let extraAudioTracks = [];
      if (typeof getAudioStream === 'function' && audioTracks.length === 0) {
        const audioStream = getAudioStream();
        if (audioStream) {
          extraAudioTracks = audioStream.getAudioTracks();
        }
      }

      const combinedStream = new MediaStream([
        ...videoTracks,
        ...audioTracks,
        ...extraAudioTracks,
      ]);

      // 4. MediaRecorder セットアップ
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
          ? 'video/webm;codecs=vp8,opus'
          : 'video/webm';

      const recorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: 5_000_000,
        audioBitsPerSecond: 192_000,
      });
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        // ストリーム解放
        displayStream.getTracks().forEach(t => t.stop());
        displayStreamRef.current = null;

        // ダウンロード
        if (chunksRef.current.length > 0) {
          const blob = new Blob(chunksRef.current, { type: mimeType });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(url), 5000);
        }

        setIsRecording(false);
        if (typeof onStop === 'function') onStop();
      };

      // 5. ユーザーが「共有を停止」を押した時にも止める
      displayStream.getVideoTracks()[0].addEventListener('ended', () => {
        if (recorderRef.current?.state !== 'inactive') {
          recorderRef.current.stop();
        }
      });

      recorder.start(100);
      setIsRecording(true);
      return true;
    } catch (err) {
      console.error('録画開始失敗:', err);
      const msg = err?.name === 'NotAllowedError'
        ? '画面共有がキャンセルされました。'
        : `録画開始失敗: ${err?.message || err}`;
      setErrorMessage(msg);
      setIsRecording(false);
      return false;
    }
  }, [getAudioStream]);

  const stopRecording = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
    if (displayStreamRef.current) {
      displayStreamRef.current.getTracks().forEach(t => t.stop());
      displayStreamRef.current = null;
    }
    setIsRecording(false);
  }, []);

  return { isRecording, errorMessage, startRecording, stopRecording };
}
