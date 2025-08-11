// MODEL
interface Bullet {
  element: HTMLDivElement;
  intervalId: number;
}

interface Ball {
  element: HTMLDivElement;
  x: number;
  y: number;
  radius: number;
  intervalId: number;
}

class GameModel {
  bullets: Bullet[] = [];
  balls: Ball[] = [];
  coins: number = 0; 
  ballSpeed: number = 2;
  lives: number = 3;

  addBullet(bullet: Bullet): void {
    this.bullets.push(bullet);
  }

  removeBullet(bullet: Bullet): void {
    const index = this.bullets.indexOf(bullet);
    if (index !== -1) {
      clearInterval(bullet.intervalId);
      bullet.element.remove();
      this.bullets.splice(index, 1);
    }
  }

  addBall(ball: Ball): void {
    this.balls.push(ball);
  }

  removeBall(ball: Ball): void {
    const index = this.balls.indexOf(ball);
    if (index !== -1) {
      clearInterval(ball.intervalId);
      ball.element.remove();
      this.balls.splice(index, 1);
    }
  }
}


// CONTROLLER
class GameController {
  model: GameModel;
  view: GameView;
  isPaused: boolean = false;
  spawnIntervalId?: number;
  difficultyIntervalId?: number;

  constructor(model: GameModel, view: GameView) {
    this.model = model;
    this.view = view;
    this.init();
    this.spawnBalls();
    this.increaseDifficulty(); 
    this.setupPauseButton();
    
  }

  init(): void {
    this.view.background.addEventListener("mousemove", this.handleMouseMove.bind(this));
    this.view.background.addEventListener("click", this.handleClick.bind(this));
  }

  handleMouseMove(e: MouseEvent): void {
    const backgroundRect = this.view.background.getBoundingClientRect();
    const cannonWidth = this.view.cannon.offsetWidth;
    let x = e.clientX - backgroundRect.left - cannonWidth / 2;

    if (x < 0) x = 0;
    if (x > backgroundRect.width - cannonWidth) x = backgroundRect.width - cannonWidth;

    this.view.moveCannon(x);
  }

  handleClick(): void {
    const cannonRect = this.view.cannon.getBoundingClientRect();
    const backgroundRect = this.view.background.getBoundingClientRect();

    const bulletX = cannonRect.left + cannonRect.width / 2 - backgroundRect.left - 2.5;
    const bulletY = cannonRect.top - backgroundRect.top;

    const bulletEl = this.view.createBullet(bulletX, bulletY);

    const intervalId = window.setInterval(() => {
      const top = parseFloat(bulletEl.style.top);
      if (top <= -20) {
        this.model.removeBullet({ element: bulletEl, intervalId });
      } else {
        bulletEl.style.top = `${top - 10}px`;
        this.checkCollision();
      }
    }, 20);

    this.model.addBullet({ element: bulletEl, intervalId });
  }

  createBall(): void {
    const ballEl = document.createElement("div");
    ballEl.classList.add("ball");

    const radius = 15 + Math.random() * 35;
    const margin = 20;
    const x = margin + Math.random() * (this.view.background.offsetWidth - radius * 2 - margin * 2);
    let y = 0;

    ballEl.style.width = ballEl.style.height = `${radius * 2}px`;
    ballEl.style.left = `${x}px`;
    ballEl.style.top = `${y}px`;

    this.view.background.appendChild(ballEl);

    const hue = Math.floor(Math.random() * 360);
    ballEl.style.setProperty('--hue', `${hue}`);
    ballEl.classList.add("ball", "random-color");

    const ball: Ball = {
      element: ballEl,
      x,
      y,
      radius,
      intervalId: window.setInterval(() => {
        y += this.model.ballSpeed;
        ball.y = y;
        ballEl.style.top = `${y}px`;

        if (y > this.view.background.offsetHeight) {
          this.model.removeBall(ball);
          this.loseLife();
        }
      }, 16),
    };

    this.model.addBall(ball);
  }

    spawnBalls(): void {
    this.spawnIntervalId = window.setInterval(() => {
      this.createBall();
    }, 1500);
  }


  checkCollision(): void {
  if (this.isPaused) return; // skip collision checks when paused

  this.model.bullets.forEach((bullet) => {
    const bulletRect = bullet.element.getBoundingClientRect();

    this.model.balls.forEach((ball) => {
      const ballRect = ball.element.getBoundingClientRect();

      const collision =
        bulletRect.left < ballRect.right &&
        bulletRect.right > ballRect.left &&
        bulletRect.top < ballRect.bottom &&
        bulletRect.bottom > ballRect.top;

      if (collision) {
        this.model.removeBall(ball);
        this.model.removeBullet(bullet);

        this.model.coins += 1;
        this.view.updateCoinCount(this.model.coins);
        const highscore = this.getHighscore();
        if (this.model.coins > highscore) {
          this.setHighscore(this.model.coins);
          this.view.showHighscoreMessage();
          }
      }
    });
  });
}
  increaseDifficulty(): void {
  setInterval(() => {
    if (!this.isPaused) {
      this.model.ballSpeed += 0.5;
    }
  }, 2000);
  }
  loseLife(): void {
  this.model.lives--;
  this.view.updateHearts(this.model.lives);

  if (this.model.lives <= 0) {
    alert("Game Over!");
    location.reload();
  }
  }
    setupPauseButton(): void {
    const pauseBtn = document.getElementById("pauseButton") as HTMLButtonElement;
    pauseBtn.addEventListener("click", () => {
      this.isPaused = !this.isPaused;

      if (this.isPaused) {
        pauseBtn.innerHTML = '<i class="fa fa-play"></i>';
        this.pauseGame();
        } else {
        pauseBtn.innerHTML = '<i class="fa fa-pause"></i>';
        this.resumeGame();
      }
    });
  }
    pauseGame(): void {
    clearInterval(this.spawnIntervalId);
    clearInterval(this.difficultyIntervalId);

    this.model.bullets.forEach(bullet => clearInterval(bullet.intervalId));
    this.model.balls.forEach(ball => clearInterval(ball.intervalId));
}


  resumeGame(): void {

  this.increaseDifficulty();
  this.spawnBalls();

  this.model.bullets.forEach(bullet => {
    bullet.intervalId = window.setInterval(() => {
      const top = parseFloat(bullet.element.style.top);
      if (top <= -20) {
        this.model.removeBullet(bullet);
      } else {
        bullet.element.style.top = `${top - 10}px`;
        this.checkCollision();
      }
    }, 20);
  });

  this.model.balls.forEach(ball => {
    ball.intervalId = window.setInterval(() => {
      ball.y += this.model.ballSpeed;
      ball.element.style.top = `${ball.y}px`;

      if (ball.y > this.view.background.offsetHeight) {
        this.model.removeBall(ball);
        this.loseLife();
      }
    }, 16);
  });
}
getHighscore(): number {
  return Number(localStorage.getItem('highscore') || '0');
}

setHighscore(score: number): void {
  localStorage.setItem('highscore', score.toString());
}

}

// VIEW
class GameView {
  cannon: HTMLImageElement;
  background: HTMLElement;
  coinCountEl: HTMLElement;
  heartsContainer: HTMLElement;
  highscoreMessageEl: HTMLElement;

  constructor() {
    this.cannon = document.getElementById("cannon") as HTMLImageElement;
    this.background = document.querySelector(".game-container__background") as HTMLElement;
    this.coinCountEl = document.getElementById("coinCount") as HTMLElement;
    this.heartsContainer = document.getElementById("heartsContainer") as HTMLElement;
    this.highscoreMessageEl = document.getElementById('highscoreMessage') as HTMLElement;
  }

  moveCannon(x: number): void {
    this.cannon.style.left = `${x}px`;
  }

  createBullet(x: number, y: number): HTMLDivElement {
    const bullet = document.createElement("div");
    bullet.classList.add("bullet");
    bullet.style.left = `${x}px`;
    bullet.style.top = `${y}px`;
    this.background.appendChild(bullet);
    return bullet;
  }
  updateCoinCount(coins: number): void {
    this.coinCountEl.textContent = coins.toString();
  }
  updateHearts(lives: number): void {
    this.heartsContainer.textContent = "❤️".repeat(lives);
  }
  showHighscoreMessage(): void {
    this.highscoreMessageEl.style.display = 'block';

    setTimeout(() => {
      this.highscoreMessageEl.style.display = 'none';
    }, 3000); 
  }
}

// INIT
document.addEventListener("DOMContentLoaded", () => {
  const model = new GameModel();
  const view = new GameView();
  view.updateCoinCount(model.coins);
  view.updateHearts(model.lives);
  new GameController(model, view);
});