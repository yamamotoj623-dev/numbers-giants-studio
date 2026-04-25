/**
 * OutroPanel v2 (改修)
 *
 * v2 改修点 (動画テストフィードバック反映):
 * - ★まとめの文字サイズを大きく★ (16px → 20px、12px → 14px)
 * - ★いいね/登録ボタンを目立つように★ (display:none を廃止し、視覚的に強調)
 * - ★コメントで教えて文言を削除★ (ダサい、いいね/登録誘導に振り切る)
 * - ★二者択一の唐突な疑問は廃止★ (Gemini プロンプト側のルール変更と連動)
 *
 * 構造 (v2):
 * - .outro-date (右上・日付)
 * - .outro-avatars (左上・A/Bアバター)
 * - .outro-stack
 *   - .outro-summary (分析まとめ、文字大きく、3点チェックリスト)
 *   - .outro-actions (★復活★ いいね・登録ボタン)
 */

import React from 'react';

export function OutroPanel({ projectData }) {
  const comps = projectData.comparisons || [];
  const wins = comps.filter(c => c.winner === 'main').slice(0, 2);
  const losses = comps.filter(c => c.winner === 'sub').slice(0, 1);

  const points = [
    ...wins.map(c => ({
      strong: `${c.label} ${c.valMain}${c.unit || ''}`,
      rest: c.desc ? ` ${c.desc}` : ' 好調',
    })),
    ...losses.map(c => ({
      strong: `${c.label} ${c.valMain}${c.unit || ''}`,
      rest: ' 要改善',
    })),
  ].slice(0, 3);

  const playerName = projectData.mainPlayer?.name || '選手';

  // emojis: A=落ち着いた表情、B=ポジティブ
  const emojiA = '👨‍🏫';
  const emojiB = '🥰';

  // summary title (デフォルトは選手名+「の分析」)
  const summaryTitle = projectData.outroSummary?.title || `${playerName}の分析`;
  const summaryAccent = projectData.outroSummary?.accent || 'ポイント';

  return (
    <>
      <div className="outro-date">
        <span className="ping"></span>
        {projectData.period || ''}
      </div>

      <div className="outro-avatars">
        <div className="outro-avatar a">
          <div className="circle"><span className="emoji">{emojiA}</span></div>
        </div>
        <div className="outro-avatar b">
          <div className="circle"><span className="emoji">{emojiB}</span></div>
        </div>
      </div>

      <div className="outro-stack">
        {/* まとめ (文字大きく) */}
        <div className="outro-summary">
          <div className="outro-summary-label">▼ 今日の分析まとめ</div>
          <div className="outro-summary-title">
            {summaryTitle}<br />
            <span className="accent">{summaryAccent}</span>
          </div>
          <div className="outro-points">
            {points.map((p, i) => (
              <div key={i} className="outro-point">
                <span className="check">✓</span>
                <span><strong>{p.strong}</strong>{p.rest}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ★復活★ いいね/登録ボタン */}
        <div className="outro-actions">
          <div className="outro-action like">
            <span className="icon">👍</span>
            <span className="lbl">役立ったら<br/>いいね！</span>
          </div>
          <div className="outro-action sub">
            <span className="icon">🔔</span>
            <span className="lbl">チャンネル<br/>登録お願い！</span>
          </div>
        </div>
      </div>
    </>
  );
}
