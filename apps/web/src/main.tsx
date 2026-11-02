import { StrictMode, useEffect, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { CAPACITY, COLORS, Game, type Color } from "@colors/core";
import "./styles.css";

const names: Record<Color, string> = {
  rose: "rose",
  sage: "sage",
  sky: "sky",
};

function statusFor(game: Game): string {
  if (game.solved) return "sorted.";
  if (game.selected === null) return "pick a tube.";

  const top = game.tubes[game.selected]?.at(-1);
  if (!top) return "pick a tube.";
  if (game.destinations().length === 0) return `no room for ${names[top]}.`;
  return `move the ${names[top]} ball.`;
}

function tubeLabel(game: Game, index: number): string {
  const tube = game.tubes[index]!;
  const balls = tube.length
    ? tube.map((color) => names[color]).join(", ")
    : "empty";
  const selected = game.selected === index ? ", selected" : "";
  const available = game.destinations().includes(index) ? ", available" : "";
  return `Tube ${index + 1}: ${balls}${selected}${available}`;
}

function PlayIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      stroke="none"
      aria-hidden="true"
    >
      <path d="M5.2 3.7v8.6L12.6 8 5.2 3.7Z" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      stroke="none"
      aria-hidden="true"
    >
      <rect x="4.5" y="4.5" width="7" height="7" rx="1" />
    </svg>
  );
}

function App() {
  const [game, setGame] = useState<Game>(() => Game.create());
  const [replayStep, setReplayStep] = useState<number | null>(null);

  const replaying = replayStep !== null;
  const view = replaying ? game.at(replayStep) : game;
  const open = view.destinations();
  const solved = view.solved;
  const status = replaying
    ? `replaying ${replayStep} of ${game.moves}.`
    : statusFor(view);

  useEffect(() => {
    if (replayStep === null) return;

    if (replayStep >= game.moves) {
      setReplayStep(null);
      return;
    }

    const timer = setTimeout(() => {
      setReplayStep((step) => (step === null ? null : step + 1));
    }, 520);

    return () => clearTimeout(timer);
  }, [replayStep, game.moves]);

  function play(index: number) {
    if (replayStep !== null) {
      setReplayStep(null);
      return;
    }

    setGame(game.tap(index));
  }

  function shuffle() {
    setReplayStep(null);
    setGame(game.shuffle());
  }

  function toggleReplay() {
    if (replayStep !== null) {
      setReplayStep(null);
      return;
    }

    if (!game.canReplay) return;

    setGame(game.clearSelection());
    setReplayStep(0);
  }

  return (
    <main className="page">
      <header className="masthead">
        <div className="brand" aria-label="colors">
          colors
          <span className="brand-dot" aria-hidden="true" />
        </div>
        <div className="actions">
          <button
            className={`action${replaying ? " active" : ""}`}
            type="button"
            onClick={toggleReplay}
            disabled={!replaying && !game.canReplay}
            aria-pressed={replaying}
          >
            {replaying ? <StopIcon /> : <PlayIcon />}
            {replaying ? "stop" : "replay"}
          </button>
          <button className="action" type="button" onClick={shuffle}>
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M13.2 8a5.2 5.2 0 1 1-1.6-3.8" />
              <path d="M13.2 2.8v3.4H9.8" />
            </svg>
            shuffle
          </button>
        </div>
      </header>

      <section
        className={`stage${solved ? " solved" : ""}`}
        aria-label="Colors game"
      >
        <div className="intro">
          <p className="eyebrow">four tubes · three colors · one empty</p>
          <p className="status" aria-live={replaying ? "off" : "polite"}>
            {status}
          </p>
        </div>

        <div className="rack">
          {view.tubes.map((tube, index) => {
            const selected = view.selected === index;
            const available = open.includes(index);

            return (
              <button
                key={index}
                type="button"
                className={`tube${selected ? " selected" : ""}${available ? " available" : ""}`}
                onClick={() => play(index)}
                aria-pressed={selected}
                aria-label={tubeLabel(view, index)}
              >
                <span className="glass">
                  <span className="stack">
                    {Array.from({ length: CAPACITY }, (_, slot) => {
                      const color = tube[slot];

                      if (!color) {
                        const next = available && slot === tube.length;
                        return (
                          <span
                            key={slot}
                            className={`empty${next ? " next" : ""}`}
                            aria-hidden="true"
                          >
                            {next ? "+" : ""}
                          </span>
                        );
                      }

                      const top = selected && slot === tube.length - 1;
                      return (
                        <span
                          key={slot}
                          className={`ball ${color}${top ? " top" : ""}`}
                          aria-hidden="true"
                        />
                      );
                    })}
                  </span>
                </span>
                <span className="tube-index" aria-hidden="true">
                  {index + 1}
                </span>
              </button>
            );
          })}
        </div>

        <div className="tray">
          <ul className="legend" aria-label="Ball colors">
            {COLORS.map((color) => (
              <li key={color}>
                <span className={`swatch ${color}`} aria-hidden="true" />
                {names[color]}
              </li>
            ))}
          </ul>
          <p className="moves">
            {view.moves} {view.moves === 1 ? "move" : "moves"}
          </p>
        </div>
      </section>

      <footer className="colophon">any ball · any open tube</footer>
    </main>
  );
}

const root = document.getElementById("root")!;
const app = (
  <StrictMode>
    <App />
  </StrictMode>
);

type HotData = { root?: Root };

((import.meta.hot.data as HotData).root ??= createRoot(root)).render(app);
