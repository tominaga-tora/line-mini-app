import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import liff from '@line/liff';
import { useAtom } from 'jotai';
import { isLiffBrowserAtom } from '../shared/atoms/atoms';

const ScrollActionGame = () => {
  // canvasの参照を保持するためのuseRef
  const canvasRef = useRef(null);
  // ジャンプ音とゲームオーバー音の参照
  const jumpSoundRef = useRef(null);
  const gameOverSoundRef = useRef(null);

  // ゲームスコアを管理するuseState
  const [score, setScore] = useState(0);
  // ゲーム状態を管理するuseState ('start', 'playing', 'gameOver')
  const [gameState, setGameState] = useState('start');
  // LIFFブラウザ内かどうかを判定するグローバル状態を取得
  const [isLiffBrowser] = useAtom(isLiffBrowserAtom);
  // シェアやエラーのメッセージを管理するuseState
  const [message, setMessage] = useState("");

  // ゲームの設定（キャンバスサイズ、プレイヤーサイズ、障害物サイズ、重力など）
  const config = {
    width: 800,
    height: 400,
    playerWidth: 50,
    playerHeight: 50,
    obstacleWidth: 30,
    obstacleHeight: 60,
    gravity: 0.5,
    jumpStrength: 10
  };

  // キャンバスサイズを動的に管理
  const [canvasSize, setCanvasSize] = useState({ width: config.width, height: config.height });

  // ゲームの状態を管理するuseRef
  const gameRef = useRef({
    player: {
      x: 100,
      y: config.height - config.playerHeight, // プレイヤーの初期位置
      velocityY: 0,
      jumpCount: 0,
      maxJumps: 2 // 最大ジャンプ回数
    },
    obstacles: [], // 障害物の配列
    backgroundOffset: 0,
    gameSpeed: 5
  });

  // ゲームを初期状態にリセット
  const resetGame = () => {
    gameRef.current = {
      player: {
        x: 100,
        y: config.height - config.playerHeight,
        velocityY: 0,
        jumpCount: 0,
        maxJumps: 2
      },
      obstacles: [],
      backgroundOffset: 0,
      gameSpeed: 5
    };
    setScore(0); // スコアをリセット
    setGameState('playing'); // ゲーム状態を「playing」に設定
    setMessage(""); // メッセージをリセット
  };

  // スコアをLINEでシェアする機能
  const handleShare = () => {
    // LIFFのシェアターゲットピッカーを利用
    if (liff.isApiAvailable("shareTargetPicker")) {
      liff.shareTargetPicker([
        {
          "type": "flex",
          "altText": "シューティングゲームのスコアをシェア！",
          "contents": {
            "type": "bubble",
            "hero": {
              "type": "image",
              "url": "./jump-mini-app-icon.png",
              "size": "full",
              "aspectRatio": "20:13",
              "aspectMode": "cover"
            },
            "body": {
              "type": "box",
              "layout": "vertical",
              "contents": [
                {
                  "type": "text",
                  "text": `シューティングゲームで${score}点をとったよ！`,
                  "size": "lg",
                  "color": "#000000",
                  "weight": "bold",
                  "wrap": true
                }
              ]
            }
          }
        }
      ])
        .then((res) => {
          if (res) {
            setMessage("シェアしました！");
          } else {
            setMessage("シェアをキャンセルしました。");
          }
        })
        .catch(() => {
          setMessage("エラーが発生しました。");
        });
    }
  };

  // ウィンドウサイズ変更時にキャンバスをリサイズ
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;

      let newWidth = w;
      let newHeight = w * (config.height / config.width);

      if (newHeight > h) {
        const ratio = h / newHeight;
        newWidth *= ratio;
        newHeight *= ratio;
      }

      setCanvasSize({ width: newWidth, height: newHeight });
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [config.width, config.height]);

  // ゲームループ処理
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // 障害物を生成
    const spawnObstacle = () => {
      gameRef.current.obstacles.push({
        x: config.width,
        y: config.height - config.obstacleHeight,
        width: config.obstacleWidth,
        height: config.obstacleHeight
      });
    };

    // ゲーム状態を更新
    const updateGame = () => {
      const game = gameRef.current;
      const player = game.player;

      // プレイヤーの重力と位置を計算
      player.velocityY += config.gravity;
      player.y += player.velocityY;

      if (player.y >= config.height - config.playerHeight) {
        player.y = config.height - config.playerHeight;
        player.velocityY = 0;
        player.jumpCount = 0;
      }

      // 背景と障害物の移動
      game.backgroundOffset -= game.gameSpeed;
      game.obstacles.forEach(obstacle => {
        obstacle.x -= game.gameSpeed;
      });

      // 画面外の障害物を削除
      game.obstacles = game.obstacles.filter(obstacle => obstacle.x > -obstacle.width);

      // ランダムに障害物を生成
      if (Math.random() < 0.02) {
        spawnObstacle();
      }

      // プレイヤーと障害物の衝突判定
      game.obstacles.forEach(obstacle => {
        if (
          player.x < obstacle.x + obstacle.width &&
          player.x + config.playerWidth > obstacle.x &&
          player.y < obstacle.y + obstacle.height &&
          player.y + config.playerHeight > obstacle.y
        ) {
          if (gameOverSoundRef.current) {
            gameOverSoundRef.current.currentTime = 0;
            gameOverSoundRef.current.play();
          }
          setGameState('gameOver');
        }
      });

      // スコアを更新
      setScore(prevScore => prevScore + 1);
    };

    // キャンバスに描画
    const drawGame = () => {
      ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
      const scaleX = canvasSize.width / config.width;
      const scaleY = canvasSize.height / config.height;
      ctx.save();
      ctx.scale(scaleX, scaleY);

      // 背景描画
      ctx.fillStyle = '#87CEEB';
      ctx.fillRect(0, 0, config.width, config.height);

      ctx.fillStyle = '#2E8B57';
      ctx.fillRect(0, config.height - 50, config.width, 50);

      // プレイヤー描画
      const game = gameRef.current;
      ctx.fillStyle = 'red';
      ctx.fillRect(game.player.x, game.player.y, config.playerWidth, config.playerHeight);

      // 障害物描画
      ctx.fillStyle = 'black';
      game.obstacles.forEach(obstacle => {
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
      });

      // スコア描画
      ctx.fillStyle = 'black';
      ctx.font = '20px Arial';
      ctx.fillText(`スコア: ${score}`, 10, 30);
      ctx.fillText(`ジャンプ: ${game.player.maxJumps - game.player.jumpCount}`, 10, 60);

      ctx.restore();
    };

    const gameLoop = () => {
      if (gameState === 'playing') {
        updateGame();
        drawGame();
      }
    };

    const intervalId = setInterval(gameLoop, 1000 / 60);

    return () => {
      clearInterval(intervalId);
    };
  }, [gameState, score, canvasSize]);

  // プレイヤーがジャンプする処理
  const jumpPlayer = () => {
    const player = gameRef.current.player;
    if (player.jumpCount < player.maxJumps) {
      if (jumpSoundRef.current) {
        jumpSoundRef.current.currentTime = 0;
        jumpSoundRef.current.play();
      }
      player.velocityY = -config.jumpStrength;
      player.jumpCount++;
    }
  };

  // タップ時の動作
  const handleTap = () => {
    switch (gameState) {
      case 'playing':
        jumpPlayer();
        break;
      case 'gameOver':
        resetGame();
        break;
      default:
        break;
    }
  };

  return (
    <div 
      style={{
        width: '100vw',
        height: '100vh',
        margin: 0,
        padding: 0,
        overflow: 'hidden',
        background: '#000',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative'
      }}
      onClick={handleTap}
    >
      {/* 音声ファイル */}
      <audio ref={jumpSoundRef} src="/se_jump_001.wav" />
      <audio ref={gameOverSoundRef} src="/se_powerdown_001.wav" />

      {/* キャンバスとUI */}
      <div style={{ position: 'relative', width: canvasSize.width, height: canvasSize.height }}>
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          style={{
            display: 'block',
            background: '#000',
            width: `${canvasSize.width}px`,
            height: `${canvasSize.height}px`
          }}
        />

        {/* メッセージ表示 */}
        {message && (
          <div
            style={{
              position: 'absolute',
              bottom: '10px',
              width: '100%',
              textAlign: 'center',
              color: '#fff',
              background: 'rgba(0,0,0,0.5)',
              padding: '5px'
            }}
          >
            {message}
          </div>
        )}

        {/* ゲーム開始画面 */}
        {gameState === 'start' && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              color: '#fff',
              textAlign: 'center'
            }}
          >
            <h2 className="text-xl mb-2" style={{ color: '#fff' }}>タップで2段ジャンプ！障害物を避けて高スコアを目指せ！</h2>
            <Button onClick={resetGame}>ゲーム開始</Button>
          </div>
        )}

        {/* ゲームオーバー画面 */}
        {gameState === 'gameOver' && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              color: '#fff',
              textAlign: 'center',
              background: 'rgba(0,0,0,0.5)'
            }}
          >
            <h2 className="text-xl mb-2" style={{ color: '#fff' }}>ゲームオーバー！スコア: {score}</h2>
            <Button onClick={resetGame}>もう一度プレイ</Button>
            {isLiffBrowser && (
              <Button className="mt-2" onClick={handleShare}>シェア！</Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScrollActionGame;
