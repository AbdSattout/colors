# colors

A tiny color-sorting game. Four tubes, three colors, one empty.

Pick a tube, then pick a tube with space. Fill three tubes with four matching
balls and leave one tube empty.

The whole thing is Bun: workspaces, `Bun.serve`, React, the bundler, `bun check`,
`bun fmt`, and `for await (const line of console)`.

## run

```sh
bun install
bun run dev      # web app at http://localhost:3000
bun run cli      # terminal version
bun run build    # static web build in apps/web/dist
bun run typecheck
bun run fmt
```

## layout

```text
packages/core   the game, with no UI
apps/web        React + Bun fullstack dev server
apps/cli        console.log + async iterable console
```

## core api

```ts
import { Game } from "@colors/core";

let game = Game.create();

game = game.tap(0); // select tube 1
game = game.tap(3); // move its top ball into tube 4

game.tubes;
game.selected;
game.destinations();
game.solved;
game.moves;

game.states; // every saved state, starting with the initial deal
game.at(1); // a read-only view of an earlier state
game.canReplay;
```

Balls are stored bottom to top in each tube. A move always takes the top ball,
and any ball can go into any tube with space — there is no color-matching rule.
The game is immutable: `tap`, `shuffle`, and `clearSelection` return a new
`Game`. Both apps use the saved states to replay moves.

## cli controls

```text
1-4   select a tube or drop the selected ball
r     replay the saved moves
s     shuffle a fresh game
q     quit
```

Any input stops a running replay. A replay that reaches the end stops on its
own.
