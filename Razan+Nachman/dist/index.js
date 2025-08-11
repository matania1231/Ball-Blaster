var GameModel = /** @class */ (function () {
    function GameModel() {
        this.bullets = [];
        this.balls = [];
        this.coins = 0;
        this.ballSpeed = 2;
        this.lives = 3;
    }
    GameModel.prototype.addBullet = function (bullet) {
        this.bullets.push(bullet);
    };
    GameModel.prototype.removeBullet = function (bullet) {
        var index = this.bullets.indexOf(bullet);
        if (index !== -1) {
            clearInterval(bullet.intervalId);
            bullet.element.remove();
            this.bullets.splice(index, 1);
        }
    };
    GameModel.prototype.addBall = function (ball) {
        this.balls.push(ball);
    };
    GameModel.prototype.removeBall = function (ball) {
        var index = this.balls.indexOf(ball);
        if (index !== -1) {
            clearInterval(ball.intervalId);
            ball.element.remove();
            this.balls.splice(index, 1);
        }
    };
    return GameModel;
}());
// CONTROLLER
var GameController = /** @class */ (function () {
    function GameController(model, view) {
        this.isPaused = false;
        this.model = model;
        this.view = view;
        this.init();
        this.spawnBalls();
        this.increaseDifficulty();
        this.setupPauseButton();
    }
    GameController.prototype.init = function () {
        this.view.background.addEventListener("mousemove", this.handleMouseMove.bind(this));
        this.view.background.addEventListener("click", this.handleClick.bind(this));
    };
    GameController.prototype.handleMouseMove = function (e) {
        var backgroundRect = this.view.background.getBoundingClientRect();
        var cannonWidth = this.view.cannon.offsetWidth;
        var x = e.clientX - backgroundRect.left - cannonWidth / 2;
        if (x < 0)
            x = 0;
        if (x > backgroundRect.width - cannonWidth)
            x = backgroundRect.width - cannonWidth;
        this.view.moveCannon(x);
    };
    GameController.prototype.handleClick = function () {
        var _this = this;
        var cannonRect = this.view.cannon.getBoundingClientRect();
        var backgroundRect = this.view.background.getBoundingClientRect();
        var bulletX = cannonRect.left + cannonRect.width / 2 - backgroundRect.left - 2.5;
        var bulletY = cannonRect.top - backgroundRect.top;
        var bulletEl = this.view.createBullet(bulletX, bulletY);
        var intervalId = window.setInterval(function () {
            var top = parseFloat(bulletEl.style.top);
            if (top <= -20) {
                _this.model.removeBullet({ element: bulletEl, intervalId: intervalId });
            }
            else {
                bulletEl.style.top = top - 10 + "px";
                _this.checkCollision();
            }
        }, 20);
        this.model.addBullet({ element: bulletEl, intervalId: intervalId });
    };
    GameController.prototype.createBall = function () {
        var _this = this;
        var ballEl = document.createElement("div");
        ballEl.classList.add("ball");
        var radius = 15 + Math.random() * 35;
        var margin = 20;
        var x = margin + Math.random() * (this.view.background.offsetWidth - radius * 2 - margin * 2);
        var y = 0;
        ballEl.style.width = ballEl.style.height = radius * 2 + "px";
        ballEl.style.left = x + "px";
        ballEl.style.top = y + "px";
        this.view.background.appendChild(ballEl);
        var hue = Math.floor(Math.random() * 360);
        ballEl.style.setProperty('--hue', "" + hue);
        ballEl.classList.add("ball", "random-color");
        var ball = {
            element: ballEl,
            x: x,
            y: y,
            radius: radius,
            intervalId: window.setInterval(function () {
                y += _this.model.ballSpeed;
                ball.y = y;
                ballEl.style.top = y + "px";
                if (y > _this.view.background.offsetHeight) {
                    _this.model.removeBall(ball);
                    _this.loseLife();
                }
            }, 16)
        };
        this.model.addBall(ball);
    };
    GameController.prototype.spawnBalls = function () {
        var _this = this;
        this.spawnIntervalId = window.setInterval(function () {
            _this.createBall();
        }, 1500);
    };
    GameController.prototype.checkCollision = function () {
        var _this = this;
        if (this.isPaused)
            return; // skip collision checks when paused
        this.model.bullets.forEach(function (bullet) {
            var bulletRect = bullet.element.getBoundingClientRect();
            _this.model.balls.forEach(function (ball) {
                var ballRect = ball.element.getBoundingClientRect();
                var collision = bulletRect.left < ballRect.right &&
                    bulletRect.right > ballRect.left &&
                    bulletRect.top < ballRect.bottom &&
                    bulletRect.bottom > ballRect.top;
                if (collision) {
                    _this.model.removeBall(ball);
                    _this.model.removeBullet(bullet);
                    _this.model.coins += 1;
                    _this.view.updateCoinCount(_this.model.coins);
                }
            });
        });
    };
    GameController.prototype.increaseDifficulty = function () {
        var _this = this;
        setInterval(function () {
            if (!_this.isPaused) {
                _this.model.ballSpeed += 0.5;
            }
        }, 2000);
    };
    GameController.prototype.loseLife = function () {
        this.model.lives--;
        this.view.updateHearts(this.model.lives);
        if (this.model.lives <= 0) {
            alert("Game Over!");
            location.reload();
        }
    };
    GameController.prototype.setupPauseButton = function () {
        var _this = this;
        var pauseBtn = document.getElementById("pauseButton");
        pauseBtn.addEventListener("click", function () {
            _this.isPaused = !_this.isPaused;
            if (_this.isPaused) {
                pauseBtn.innerHTML = '<i class="fa fa-play"></i>';
                _this.pauseGame();
            }
            else {
                pauseBtn.innerHTML = '<i class="fa fa-pause"></i>';
                _this.resumeGame();
            }
        });
    };
    GameController.prototype.pauseGame = function () {
        clearInterval(this.spawnIntervalId);
        clearInterval(this.difficultyIntervalId);
        this.model.bullets.forEach(function (bullet) { return clearInterval(bullet.intervalId); });
        this.model.balls.forEach(function (ball) { return clearInterval(ball.intervalId); });
    };
    GameController.prototype.resumeGame = function () {
        var _this = this;
        this.increaseDifficulty();
        this.spawnBalls();
        this.model.bullets.forEach(function (bullet) {
            bullet.intervalId = window.setInterval(function () {
                var top = parseFloat(bullet.element.style.top);
                if (top <= -20) {
                    _this.model.removeBullet(bullet);
                }
                else {
                    bullet.element.style.top = top - 10 + "px";
                    _this.checkCollision();
                }
            }, 20);
        });
        this.model.balls.forEach(function (ball) {
            ball.intervalId = window.setInterval(function () {
                ball.y += _this.model.ballSpeed;
                ball.element.style.top = ball.y + "px";
                if (ball.y > _this.view.background.offsetHeight) {
                    _this.model.removeBall(ball);
                    _this.loseLife();
                }
            }, 16);
        });
    };
    return GameController;
}());
// VIEW
var GameView = /** @class */ (function () {
    function GameView() {
        this.cannon = document.getElementById("cannon");
        this.background = document.querySelector(".game-container__background");
        this.coinCountEl = document.getElementById("coinCount");
        this.heartsContainer = document.getElementById("heartsContainer");
    }
    GameView.prototype.moveCannon = function (x) {
        this.cannon.style.left = x + "px";
    };
    GameView.prototype.createBullet = function (x, y) {
        var bullet = document.createElement("div");
        bullet.classList.add("bullet");
        bullet.style.left = x + "px";
        bullet.style.top = y + "px";
        this.background.appendChild(bullet);
        return bullet;
    };
    GameView.prototype.updateCoinCount = function (coins) {
        this.coinCountEl.textContent = coins.toString();
    };
    GameView.prototype.updateHearts = function (lives) {
        this.heartsContainer.textContent = "❤️".repeat(lives);
    };
    return GameView;
}());
// INIT
document.addEventListener("DOMContentLoaded", function () {
    var model = new GameModel();
    var view = new GameView();
    view.updateCoinCount(model.coins);
    view.updateHearts(model.lives);
    new GameController(model, view);
});
