// === הגדרות בסיס ===
let hoverAnimationDuration = 300;
let centerGrowDuration = 1800;
let surroundingMoveDuration = 2500;
let baseDistance = 150;
let wiggleSpeed = 0.01;
let wiggleRadius = 20;
let easeInPower = 4;
let easeOutPower = 10;

// === הגדרות טקסט ===
let textShadowBlur = 0;
let textShadowColor = 'white';
let textMaxSizePercentage = 0.6;
let textContentPadding = 30; // משפיע כעת גם על העיגול המרכזי בסטטוס 1
let textFadeInDelay = 200;
let textFadeInSpeed = 0.5;

// === סטטוס 0 (דיפולטיבי) ===
let centerDefaultSize = 180;

// === סטטוס 1 (גדילה) ===
let growthMultiplier = 1.5;
let status1ExpansionAmount = 100;
let status1CenterDelay = 0;
let status1DelayRandomRange = [4, 20];

// === סטטוס 2 (התכווצות/מיקוד) ===
let status2ShrinkDuration = 3500;
let status2CenterOffset = 100;
let status2CenterShrinkFactor = 0.4;
let status2GrowDuration = 2500;
let status2MinExpandedSize = 300;
let status2MaxExpandedSize = 500;
let status2DelayRandomRange = [4, 20];

// === משתנים נוספים למבנה האנימציה ===
let centerNode;
let surroundingNodes = [];
let status = 0;
let focusedNodeIndex = null;
let transitionStartTime = 0;
let hoverStartTimes = [];
let winkyFont;
let focusSwitchTimer = null;
let pendingFocusedIndex = null;
let isFocusSwitching = false;
let BlinkyStar;

// === תוכן נוסף לעיגולים ===
let defaultContent = "This is a paragraph of sample text that will appear when the circle is focused.";

// === שינוי בקוד - שימוש ב-padding גם בעיגול המרכזי במצב סטטוס 1 ===
// (שאר הקוד נשאר זהה, רק שינוי בקטע הצגת הטקסט של centerNode במצב status === 1)
// ...

      if (centerNode.contentAlpha > 10) {
        push();
        fill(0, centerNode.contentAlpha);
        noStroke();
        textSize(16);
        textAlign(CENTER, CENTER);
        rectMode(CENTER);
        let textWidth = centerNode.currentR * 0.7;
        let textHeight = centerNode.currentR * 0.6;
        let adjustedPadding = textContentPadding * (centerNode.currentR / 400); // הוספת השפעת padding
        text(
          centerNode.content,
          centerDisplayX,
          centerDisplayY + titleOffset + centerTextSize + adjustedPadding,
          textWidth,
          textHeight
        );
        pop();
      }
// ...
