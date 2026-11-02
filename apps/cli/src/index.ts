import { CAPACITY, Game, type Color } from "@colors/core";

const reset = "\x1b[0m";
const dim = "\x1b[2m";
const bold = "\x1b[1m";

const style: Record<Color, { bg: string; fg: string; name: string }> = {
  rose: {
    bg: "\x1b[48;2;242;223;226m",
    fg: "\x1b[38;2;154;107;114m",
    name: "rose",
  },
  sage: {
    bg: "\x1b[48;2;227;236;222m",
    fg: "\x1b[38;2;110;137;100m",
    name: "sage",
  },
  sky: {
    bg: "\x1b[48;2;223;233;242m",
    fg: "\x1b[38;2;104;130;153m",
    name: "sky",
  },
};

function ball(color: Color, top: boolean): string {
  const { bg, fg } = style[color];
  return `${bg}${fg} ${top ? "◆" : "●"} ${reset}`;
}

const TUBE_WIDTH = 3;
const TUBE_GAP = " ";

function tube(
  tube: readonly Color[],
  selected: boolean,
  available: boolean,
): string[] {
  const lines: string[] = [];

  for (let slot = CAPACITY - 1; slot >= 0; slot--) {
    const color = tube[slot];
    const next = available && slot === tube.length;

    if (color) {
      lines.push(ball(color, selected && slot === tube.length - 1));
    } else if (next) {
      lines.push(`${dim} + ${reset}`);
    } else {
      lines.push(`${dim} · ${reset}`);
    }
  }

  return lines;
}

function status(game: Game): string {
  if (game.solved) return "sorted.";
  if (game.selected === null) return "pick a tube.";

  const top = game.tubes[game.selected]?.at(-1);
  if (!top) return "pick a tube.";
  if (!game.destinations().length) return `no room for ${style[top].name}.`;
  return `move the ${style[top].name} ball.`;
}

function draw(game: Game, note?: string): void {
  const open = game.destinations();

  console.clear();
  console.log("");
  console.log(
    `  ${bold}colors${reset}  ${dim}four tubes · three colors · one empty${reset}`,
  );
  console.log("");

  const columns = game.tubes.map((balls, index) =>
    tube(balls, game.selected === index, open.includes(index)),
  );

  const rail = `${dim}│${reset}`;

  for (let line = 0; line < (columns[0]?.length ?? 0); line++) {
    const row = columns.map((column) => column[line]).join(TUBE_GAP);
    console.log(`  ${rail} ${row} ${rail}`);
  }

  const labels = game.tubes.map((_, index) => {
    const padding = " ".repeat((TUBE_WIDTH - 1) / 2);
    const label = `${padding}${index + 1}${padding}`;
    return game.selected === index
      ? `${bold}${label}${reset}`
      : `${dim}${label}${reset}`;
  });

  console.log("");
  console.log(`    ${labels.join(TUBE_GAP)}`);

  console.log("");
  console.log(`  ${note ?? status(game)}`);
  console.log(
    `  ${dim}${game.moves} ${game.moves === 1 ? "move" : "moves"} · 1-4 choose · r replay · s shuffle · q quit${reset}`,
  );
  console.log("");
}

const STEP_MS = 520;

let game = Game.create();
let replayTimer: ReturnType<typeof setInterval> | null = null;

function stopReplay(): boolean {
  if (replayTimer === null) return false;

  clearInterval(replayTimer);
  replayTimer = null;
  return true;
}

function startReplay(): void {
  if (replayTimer !== null) return;

  if (!game.canReplay) {
    draw(game, "nothing to replay yet.");
    return;
  }

  game = game.clearSelection();

  const total = game.moves;
  let step = 0;

  draw(game.at(0), `replaying 0 of ${total} · enter stops replay`);

  replayTimer = setInterval(() => {
    step += 1;

    if (step >= total) {
      stopReplay();
      draw(
        game.at(total),
        `replay finished · ${total} ${total === 1 ? "move" : "moves"}.`,
      );
      return;
    }

    draw(game.at(step), `replaying ${step} of ${total} · enter stops replay`);
  }, STEP_MS);
}

draw(game);

for await (const line of console) {
  const input = line.trim().toLowerCase();

  if (stopReplay()) {
    if (input === "q" || input === "quit") break;

    draw(game, "replay stopped.");
    continue;
  }

  if (input === "q" || input === "quit") break;

  if (input === "r") {
    startReplay();
    continue;
  }

  if (input === "s") {
    game = game.shuffle();
    draw(game);
    continue;
  }

  if (!input) {
    draw(game);
    continue;
  }

  const index = Number(input) - 1;

  if (!/^\d+$/.test(input) || index < 0 || index >= game.tubes.length) {
    draw(game, "choose 1-4.");
    continue;
  }

  game = game.tap(index);
  draw(game);
}

console.log("bye.");
