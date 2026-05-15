/**
 * useSpringNumber.js ()
 *
 * 数値を「バネの動き」でカウントアップ/ダウンするカスタムフック。
 * 線形ではなく、オーバーシュート → 戻り → 収束 の自然な物理アニメーション。
 *
 * 使い方:
 *   const displayed = useSpringNumber(targetValue, { stiffness: 120, damping: 14 });
 *   return <span>{displayed.toFixed(3)}</span>;
 *
 * stiffness: バネの硬さ (大きい = 速く到達、オーバーシュートも大きい)
 * damping:   減衰 (大きい = オーバーシュート少ない、スムーズ)
 * mass:      質量 (大きい = ゆっくり動く)
 * precision: この差以下で収束とみなす
 */

import { useState, useEffect, useRef } from 'react';

export function useSpringNumber(target, options = {}) {
  const {
    // 一瞬すぎ問題の修正: デフォルトをゆっくり寄りに
    //   旧: stiffness 120, damping 14 (約 0.5s で収束)
    //   新: stiffness 50, damping 11 (約 1.5-2s かけて収束、目で追える)
    stiffness = 50,
    damping = 11,
    mass = 1,
    precision = 0.005,
  } = options;

  const [current, setCurrent] = useState(target);
  const velocityRef = useRef(0);
  const currentRef = useRef(target);
  const targetRef = useRef(target);
  const rafRef = useRef(null);

  useEffect(() => {
    targetRef.current = target;

    // アニメーションループ開始
    if (rafRef.current) return; // 既に走っている場合は何もしない

    const step = () => {
      const dt = 1 / 60; // 60fps 想定
      const displacement = currentRef.current - targetRef.current;
      const springForce = -stiffness * displacement;
      const dampingForce = -damping * velocityRef.current;
      const acceleration = (springForce + dampingForce) / mass;

      velocityRef.current += acceleration * dt;
      currentRef.current += velocityRef.current * dt;

      // 収束判定
      if (
        Math.abs(velocityRef.current) < precision &&
        Math.abs(currentRef.current - targetRef.current) < precision
      ) {
        currentRef.current = targetRef.current;
        velocityRef.current = 0;
        setCurrent(targetRef.current);
        rafRef.current = null;
        return; // ループ停止
      }

      setCurrent(currentRef.current);
      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [target, stiffness, damping, mass, precision]);

  return current;
}

/**
 * CSS cubic-bezier でバネ風イージング (JS なしで使いたい場所用)
 *
 * spring-bounce:  オーバーシュートあり (グラフバー伸長、カード出現)
 * spring-smooth:  スムーズ減速 (テロップ、フェード)
 * spring-snappy:  キビキビした動き (ボタン、バッジ)
 */
export const SPRING_EASINGS = {
  bounce:  'cubic-bezier(0.34, 1.56, 0.64, 1)',    // オーバーシュート → 戻り
  smooth:  'cubic-bezier(0.25, 0.46, 0.45, 0.94)',  // ease-out 改良
  snappy:  'cubic-bezier(0.68, -0.55, 0.27, 1.55)', // パキッと動いて戻り
  elastic: 'cubic-bezier(0.68, -0.6, 0.32, 1.6)',   // もっと弾む
};
