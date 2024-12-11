import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

const ScrollActionGame = () => {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState('start'); // 'start', 'playing', 'gameOver'

  // Sound effects
  const jumpSoundRef = useRef(null);
  const gameOverSoundRef = useRef(null);

  // Game configuration
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

  // Player and game state
  const gameRef = useRef({
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
  });

  const resetGame = () => {
    // 完全初期化
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
    setScore(0);
    setGameState('playing');
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const spawnObstacle = () => {
      gameRef.current.obstacles.push({
        x: config.width,
        y: config.height - config.obstacleHeight,
        width: config.obstacleWidth,
        height: config.obstacleHeight
      });
    };

    const updateGame = () => {
      const game = gameRef.current;
      const player = game.player;

      // Apply gravity
      player.velocityY += config.gravity;
      player.y += player.velocityY;

      // Ground collision
      if (player.y >= config.height - config.playerHeight) {
        player.y = config.height - config.playerHeight;
        player.velocityY = 0;
        player.jumpCount = 0; // Reset jump count when on ground
      }

      // Move obstacles and background
      game.backgroundOffset -= game.gameSpeed;
      game.obstacles.forEach(obstacle => {
        obstacle.x -= game.gameSpeed;
      });

      // Remove off-screen obstacles
      game.obstacles = game.obstacles.filter(obstacle => obstacle.x > -obstacle.width);

      // Spawn new obstacles
      if (Math.random() < 0.02) {
        spawnObstacle();
      }

      // Check collision
      game.obstacles.forEach(obstacle => {
        if (
          player.x < obstacle.x + obstacle.width &&
          player.x + config.playerWidth > obstacle.x &&
          player.y < obstacle.y + obstacle.height &&
          player.y + config.playerHeight > obstacle.y
        ) {
          // Play game over sound
          if (gameOverSoundRef.current) {
            gameOverSoundRef.current.currentTime = 0;
            gameOverSoundRef.current.play();
          }
          setGameState('gameOver');
        }
      });

      // Increase score
      setScore(prevScore => prevScore + 1);
    };

    const drawGame = () => {
      ctx.clearRect(0, 0, config.width, config.height);

      // Draw background
      ctx.fillStyle = '#87CEEB';
      ctx.fillRect(0, 0, config.width, config.height);

      // Draw ground
      ctx.fillStyle = '#2E8B57';
      ctx.fillRect(0, config.height - 50, config.width, 50);

      // Draw player
      const game = gameRef.current;
      ctx.fillStyle = 'red';
      ctx.fillRect(game.player.x, game.player.y, config.playerWidth, config.playerHeight);

      // Draw obstacles
      ctx.fillStyle = 'black';
      game.obstacles.forEach(obstacle => {
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
      });

      // Draw score and jump count
      ctx.fillStyle = 'black';
      ctx.font = '20px Arial';
      ctx.fillText(`スコア: ${score}`, 10, 30);
      ctx.fillText(`ジャンプ: ${game.player.maxJumps - game.player.jumpCount}`, 10, 60);
    };

    const gameLoop = () => {
      if (gameState === 'playing') {
        updateGame();
        drawGame();
      }
    };

    const jumpPlayer = () => {
      const player = gameRef.current.player;

      // Allow jump if jump count is less than max jumps
      if (player.jumpCount < player.maxJumps) {
        // Play jump sound
        if (jumpSoundRef.current) {
          jumpSoundRef.current.currentTime = 0;
          jumpSoundRef.current.play();
        }

        player.velocityY = -config.jumpStrength;
        player.jumpCount++;
      }
    };

    const handleClick = () => {
      switch (gameState) {
        case 'playing':
          jumpPlayer();
          break;
        default:
          // それ以外(start, gameOver)はクリックで何もしない
          break;
      }
    };

    // Set up game loop
    const intervalId = setInterval(gameLoop, 1000 / 60); // 60 FPS

    // Add click event listener
    canvas.addEventListener('click', handleClick);

    // Cleanup
    return () => {
      clearInterval(intervalId);
      canvas.removeEventListener('click', handleClick);
    };
  }, [gameState, score]);

  return (
    <div className="flex flex-col items-center justify-center p-4">
      {/* Sound effect audio elements */}
      <audio ref={jumpSoundRef} src="/se_jump_001.wav" />
      <audio ref={gameOverSoundRef} src="/se_powerdown_001.wav" />

      <canvas
        ref={canvasRef}
        width={config.width}
        height={config.height}
        className="border-2 border-black"
      />
      {gameState === 'start' && (
        <div className="mt-4 text-center">
          <h2 className="text-xl mb-2">クリックで2段ジャンプ！障害物を避けて高スコアを目指せ！</h2>
          <Button onClick={resetGame}>ゲーム開始</Button>
        </div>
      )}
      {gameState === 'gameOver' && (
        <div className="mt-4 text-center">
          <h2 className="text-xl mb-2">ゲームオーバー！スコア: {score}</h2>
          <Button onClick={resetGame}>もう一度プレイ</Button>
        </div>
      )}
    </div>
  );
};

export default ScrollActionGame;