// ============================================
// RIATTAGOTCHI - The Complete Pixel Edition
// ============================================

let gameState = "intro";
let cat, ui, mood, scene;
let food = null, toy = null, petHand = null;
let lastInteractionTime = 0, inactivityThreshold = 15000;
let isPlaying = false, isFeedingMode = false;

// Assets
let bgMusic, meowSound, snoreSound;
let catStartImg, catImg, catHappyImg, catPlayingImg, catSleepingImg, roomImg;
let myFont;

function preload() {
  // Update paths to look inside the assets folder
  catStartImg = loadImage("assets/CatStart.jpeg");
  catImg = loadImage("assets/Cat.jpeg");
  catHappyImg = loadImage("assets/CatHappy.jpeg");
  catPlayingImg = loadImage("assets/CatPlaying.jpeg");
  catSleepingImg = loadImage("assets/CatSleeping.jpeg");
  roomImg = loadImage("assets/Riattagotchi.jpg");

  bgMusic = loadSound("assets/Song.mp3");
  meowSound = loadSound("assets/meow.mp3");
  snoreSound = loadSound("assets/snore.mp3");

  // Keep Font.ttf at the top level
  myFont = loadFont('Font.ttf');
}

function setup() {
  createCanvas(400, 500);
  frameRate(60);
  textFont(myFont);
  
  mood = new MoodSystem();
  ui = new UISystem();
  scene = new SceneManager();
  cat = new Cat(200, 260);

  bgMusic.loop();
}

function draw() {
  background(240, 230, 245);
  textFont(myFont);

  if (millis() - lastInteractionTime > inactivityThreshold) {
    mood.sleepiness = min(100, mood.sleepiness + 0.02);
  }

  mood.update();

  if (gameState === "intro") {
    scene.drawIntro();
    if (scene.startButtonClicked) {
      bgMusic.pause();
      meowSound.play();
      bgMusic.loop(); 
      gameState = "main";
      scene.startButtonClicked = false;
      lastInteractionTime = millis();
    }
  } else if (gameState === "main" || gameState === "needsAttention") {
    drawMainGame();
  } else if (gameState === "sleep") {
    drawSleepMode();
  }
}

function drawMainGame() {
  drawRoom();
  cat.update(mood);
  if (isPlaying && toy) {
    cat.chaseToy(toy.x, toy.y);
  }
  cat.display();
  ui.displayButtons();
  drawMeterPanel();
  if (petHand !== null) {
    petHand.update();
    if (petHand !== null) petHand.display();
  }
  if (food) food.display(); 
  if (toy) toy.display();
  if (mood.hunger < 20 || mood.happiness < 20 || mood.sleepiness > 80) {
    gameState = "needsAttention";
    drawNeedsAttentionAlert();
  } else {
    gameState = "main";
  }
}

function drawSleepMode() {
  background(25, 30, 50);
  image(roomImg, 20, 60, 360, 330);
  fill(0, 0, 50, 180); 
  rect(20, 60, 360, 330);
  cat.sleepMode = true;
  cat.display();
  if (!snoreSound.isPlaying()) snoreSound.loop();
  fill(255);
  textSize(24);
  textAlign(CENTER);
  text("...SLEEPING...", 200, 435);
  mood.sleepiness = max(0, mood.sleepiness - 0.2);
  mood.hunger = max(0, mood.hunger - 0.05);
  if (mood.sleepiness < 5) {
    cat.sleepMode = false;
    snoreSound.stop();
    gameState = "main";
  }
}

function drawRoom() {
  image(roomImg, 20, 60, 360, 330);
  stroke(180, 150, 200);
  strokeWeight(4);
  noFill();
  rect(10, 50, 380, 350, 4);
  fill(100, 80, 120);
  noStroke();
  textSize(28);
  textAlign(CENTER);
  text("RIATTAGOTCHI", 200, 35);
}

function drawMeterPanel() {
  let meterY = 415;
  fill(100, 80, 120);
  textSize(14);
  textAlign(LEFT);
  text("HUNGER", 30, meterY);
  drawMeter(30, meterY + 5, 140, 10, mood.hunger, color(255, 150, 100));
  text("HAPPINESS", 220, meterY);
  drawMeter(220, meterY + 5, 140, 10, mood.happiness, color(255, 200, 100));
  textSize(12);
  text("SLEEPINESS: " + floor(mood.sleepiness) + "%", 30, meterY + 30);
}

function drawMeter(x, y, w, h, value, col) {
  stroke(100, 80, 120);
  strokeWeight(1);
  fill(255, 255, 255, 150);
  rect(x, y, w, h);
  noStroke();
  fill(col);
  let fillWidth = constrain((value / 100) * w, 0, w);
  rect(x + 1, y + 1, fillWidth - 2, h - 2);
}

function drawNeedsAttentionAlert() {
  push();
  textFont("Arial");
  if ((millis() / 400) % 2 < 1) {
    fill(255, 50, 50);
    textSize(40);
    text("!", 365, 95);
  }
  pop();
}

class Cat {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.bounceTimer = 0; this.pettingTimer = 0;
    this.sleepMode = false; this.isHappy = false; this.isPlayingAnim = false;
  }
  update(mood) {
    this.bounceTimer++;
    if (this.pettingTimer > 0) this.pettingTimer--;
    this.x = constrain(this.x, 70, 330);
    this.y = constrain(this.y, 110, 340);
  }
  chaseToy(tx, ty) {
    let dx = tx - this.x;
    let dy = ty - this.y;
    let angle = atan2(dy, dx);
    if (dist(this.x, this.y, tx, ty) > 10) {
      this.x += cos(angle) * 4;
      this.y += sin(angle) * 4;
    }
  }
  display() {
    let bounce = 0, xShake = 0, img = catImg;
    if (this.sleepMode) img = catSleepingImg;
    else if (this.isPlayingAnim) {
      img = catPlayingImg; bounce = sin(this.bounceTimer * 0.5) * 10; xShake = cos(this.bounceTimer * 0.5) * 5;
    } else if (this.isHappy) {
      img = catHappyImg; bounce = sin(this.bounceTimer * 0.2) * 8;
    } else { bounce = sin(this.bounceTimer * 0.12) * 6; }
    imageMode(CENTER);
    image(img, this.x + xShake, this.y + bounce, 110, 110);
    imageMode(CORNER);
    if (this.pettingTimer > 0) {
      push();
      textFont("Arial"); 
      fill(255, 50, 100);
      textSize(30);
      text("♥", this.x + random(-20, 20), this.y - 70);
      pop();
    }
  }
  pet() {
    this.isHappy = true; this.pettingTimer = 60;
    mood.happiness = min(100, mood.happiness + 15);
    meowSound.play();
    setTimeout(() => (this.isHappy = false), 2000);
  }
  feed() {
    this.isHappy = true; mood.hunger = min(100, mood.hunger + 25);
    meowSound.play();
    setTimeout(() => (this.isHappy = false), 2000);
  }
  play() {
    this.isPlayingAnim = true; mood.happiness = min(100, mood.happiness + 20);
    setTimeout(() => { this.isPlayingAnim = false; }, 3000);
  }
}

class MoodSystem {
  constructor() { this.hunger = 80; this.happiness = 70; this.sleepiness = 10; }
  update() {
    if (gameState !== "sleep") {
      this.hunger = max(0, this.hunger - 0.015);
      this.happiness = max(0, this.happiness - 0.01);
      this.sleepiness = min(100, this.sleepiness + 0.01);
    }
  }
}

class UISystem {
  constructor() {
    this.buttons = [
      { label: "FEED", x: 30, y: 455, w: 80, h: 30, action: "feed" },
      { label: "PET", x: 120, y: 455, w: 80, h: 30, action: "pet" },
      { label: "PLAY", x: 210, y: 455, w: 80, h: 30, action: "play" },
      { label: "SLEEP", x: 300, y: 455, w: 80, h: 30, action: "sleep" },
    ];
  }
  displayButtons() {
    for (let b of this.buttons) {
      let hover = mouseX > b.x && mouseX < b.x + b.w && mouseY > b.y && mouseY < b.y + b.h;
      stroke(100, 80, 120); strokeWeight(2);
      fill(hover ? 255 : 210, 190, 230);
      rect(b.x, b.y, b.w, b.h, 2);
      noStroke(); fill(60, 40, 80);
      textSize(14); textAlign(CENTER, CENTER);
      text(b.label, b.x + b.w / 2, b.y + b.h / 2 + 5); 
    }
  }
  checkClick() {
    for (let b of this.buttons) {
      if (mouseX > b.x && mouseX < b.x + b.w && mouseY > b.y && mouseY < b.y + b.h) return b.action;
    }
    return null;
  }
}

class SceneManager {
  constructor() { this.startButtonClicked = false; }
  drawIntro() {
    background(210, 230, 250);
    fill(80, 60, 120); textSize(34); textAlign(CENTER);
    text("RIATTAGOTCHI", 200, 45); 
    imageMode(CENTER);
    image(catStartImg, 200, 190, 240, 180);
    imageMode(CORNER);
    fill(130, 100, 180);
    rect(125, 310, 150, 50, 4);
    fill(255); textSize(20);
    text("START", 200, 345);
    fill(80, 60, 120); textSize(13);
    text("Take care of your Riattagotchi!\nDrag objects to feed and play!", 200, 410);
  }
}

class DragObject {
  constructor(x, y, emoji, size) { 
    this.x = x; this.y = y; this.e = emoji; this.s = size; 
  }
  display() { 
    push();
    textFont("Arial"); 
    textAlign(CENTER, CENTER); 
    textSize(this.s); 
    text(this.e, this.x, this.y); 
    pop();
  }
}

class PetHand {
  constructor(x, y) { this.x = x; this.y = y; this.t = 45; }
  update() { this.t--; if (this.t <= 0) petHand = null; }
  display() {
    push();
    translate(this.x + sin(this.t * 0.2) * 15, this.y - 50);
    noStroke(); fill(255, 220, 200);
    rect(-10, 0, 20, 18, 4); rect(-10, -8, 4, 10, 2); rect(-5, -10, 4, 12, 2);
    rect(0, -10, 4, 12, 2); rect(5, -8, 4, 10, 2); rect(-14, 5, 6, 4, 2);
    pop();
  }
}

function mousePressed() {
  if (getAudioContext().state !== 'running') getAudioContext().resume();
  if (gameState === "intro") {
    if (mouseX > 125 && mouseX < 275 && mouseY > 310 && mouseY < 360)
      scene.startButtonClicked = true;
  } else {
    let a = ui.checkClick();
    if (a === "feed") {
      food = new DragObject(mouseX, mouseY, "🍖", 40);
      isFeedingMode = true;
    } else if (a === "pet") {
      cat.pet();
      petHand = new PetHand(cat.x, cat.y);
    } else if (a === "play") {
      cat.play();
      toy = new DragObject(mouseX, mouseY, "🎾", 35);
      isPlaying = true;
    } else if (a === "sleep") {
      gameState = "sleep";
    } else if (dist(mouseX, mouseY, cat.x, cat.y) < 60) {
      cat.pet();
      petHand = new PetHand(cat.x, cat.y);
    }
  }
  lastInteractionTime = millis();
}

function mouseDragged() {
  if (food) {
    food.x = mouseX; food.y = mouseY;
    if (dist(food.x, food.y, cat.x, cat.y) < 50) {
      cat.feed(); food = null; isFeedingMode = false;
    }
  }
  if (toy) { toy.x = mouseX; toy.y = mouseY; }
}

function mouseReleased() {
  if (isFeedingMode) { food = null; isFeedingMode = false; }
  if (isPlaying) { isPlaying = false; toy = null; }
}