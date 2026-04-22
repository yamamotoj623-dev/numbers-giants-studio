/**
 * OutroPanel v5.0.0 UI確定版
 * デモv15のフェーズDと1対1対応
 *
 * 構造:
 * - .outro-date (右上・日付)
 * - .outro-avatars (左上・A/Bアバター)
 * - .outro-stack
 *   - .outro-summary (分析まとめタイトル + 3点チェックリスト)
 *   - .outro-cta (視聴者への問いかけ)
 *   - .outro-actions (いいね・登録ボタン)
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

  // CTA
  const ctaTitle = projectData.outroCta?.title || `${playerName}の今季`;
  const ctaBig = projectData.outroCta?.big || '予想';
  const ctaSuffix = projectData.outroCta?.suffix || 'は？';

  // summary title
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

        <div className="outro-cta">
          <div className="outro-cta-q">
            {ctaTitle}<span className="big">{ctaBig}</span>{ctaSuffix}
          </div>
          <div className="outro-cta-hint">💬 コメントで教えて！</div>
        </div>
      </div>
    </>
  );
}
