"use client";

import { useEffect } from "react";

// The markup the game drives. Everything after mount is imperative: src/game/main.js boots once,
// builds the three.js cabinet into #stage and owns these elements from then on.
export default function Game() {
  useEffect(() => {
    import("@/game/main.js");
  }, []);

  return (
    <>
      <div id="stage"></div>
      <div id="scoreboard">
        <div className="label">SCORE</div>
        <div id="score">0</div>
        <div id="hearts"></div>
        <div className="meta">
          <span id="best">BEST 0</span>
          <span id="left"></span>
        </div>
        <div id="streak"></div>
        <div id="assist-tag" hidden>
          AIM ASSIST &middot; UNRANKED
        </div>
        <button id="quit" type="button">
          QUIT &amp; SAVE
        </button>
        <div id="bag" aria-label="Prize bag">
          <div className="bag-label">
            PRIZE BAG <span id="bag-count"></span>
          </div>
          <div id="bag-items"></div>
        </div>
      </div>
      <div id="hud">
        <div className="carriage">
          <div className="bezel">
            <canvas id="screen" width="170" height="320"></canvas>
          </div>
        </div>
      </div>
      <div id="sound">
        <button
          type="button"
          data-help=""
          aria-label="How to play"
          title="How to play (H)"
        >
          ?
        </button>
        <button
          type="button"
          data-settings=""
          aria-label="Menu"
          title="Menu (O)"
        >
          <svg
            viewBox="0 0 12 12"
            shapeRendering="crispEdges"
            aria-hidden="true"
          >
            <path d="M1 2h10v2H1zM1 5h10v2H1zM1 8h10v2H1z" />
          </svg>
        </button>
        <button type="button" data-sound="music" aria-label="Music">
          <svg
            viewBox="0 0 12 12"
            shapeRendering="crispEdges"
            aria-hidden="true"
          >
            <path d="M4 1h7v7h-1V3H5v6H4zM1 8h4v3H1zM7 6h4v3H7z" />
          </svg>
        </button>
        <button type="button" data-sound="sfx" aria-label="Sound effects">
          <svg
            viewBox="0 0 12 12"
            shapeRendering="crispEdges"
            aria-hidden="true"
          >
            <path d="M1 4h3l3-3h1v10H7L4 8H1zM9 4h1v4H9zM10 2h1v8h-1z" />
          </svg>
        </button>
      </div>
      <div id="popups"></div>
      <div id="overlay" className="overlay">
        <div className="panel" id="panel"></div>
      </div>
      <div id="howto" className="overlay" hidden>
        <div
          className="panel"
          role="dialog"
          aria-modal="true"
          id="howto-panel"
        ></div>
      </div>
      <div id="settings" className="overlay" hidden>
        <div
          className="panel"
          role="dialog"
          aria-modal="true"
          aria-label="Settings"
          id="settings-panel"
        ></div>
      </div>
      <div id="confirm" className="overlay" hidden>
        <div className="panel small" role="dialog" aria-modal="true">
          <h1 id="confirm-title"></h1>
          <p id="confirm-text"></p>
          <div className="actions">
            <button className="btn ghost" id="confirm-no" type="button">
              KEEP PLAYING
            </button>
            <button className="btn" id="confirm-yes" type="button"></button>
          </div>
        </div>
      </div>
      {/* For Mikaela: opens when she clears the machine and signs it with her name. */}
      <div id="love" className="overlay" hidden>
        <div className="love-hearts" aria-hidden="true"></div>
        <div
          className="love-card"
          role="dialog"
          aria-modal="true"
          aria-label="I made this for you"
          id="love-panel"
        ></div>
      </div>
      <canvas id="fx"></canvas>
      {/* The 4K theme's camcorder viewfinder. Decoration only. */}
      <div id="viewfinder" hidden aria-hidden="true">
        <span className="corner tl"></span>
        <span className="corner tr"></span>
        <span className="corner bl"></span>
        <span className="corner br"></span>
        <span className="rec">
          REC <span id="viewfinder-time">00:00:00:00</span>
        </span>
        <span className="spec">4K UHD &middot; HDR10 &middot; 60P</span>
        <span className="battery"></span>
      </div>
    </>
  );
}
