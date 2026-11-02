export const CAPACITY = 4;

export const COLORS = ["rose", "sage", "sky"] as const;

export type Color = (typeof COLORS)[number];

/** Balls are stored bottom to top. */
export type Tube = Color[];

export type GameState = {
  readonly tubes: readonly Tube[];
  readonly selected: number | null;
};

function deal(): Tube[] {
  const balls: Color[] = COLORS.flatMap((color) =>
    Array<Color>(CAPACITY).fill(color),
  );

  for (let i = balls.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [balls[i], balls[j]] = [balls[j]!, balls[i]!];
  }

  const tubes = Array.from({ length: COLORS.length + 1 }, (_, tube) =>
    balls.slice(tube * CAPACITY, (tube + 1) * CAPACITY),
  );

  // The balls fill three tubes; move the free tube somewhere random.
  const empty = Math.floor(Math.random() * tubes.length);
  const last = tubes.length - 1;
  [tubes[empty], tubes[last]] = [tubes[last]!, tubes[empty]!];

  return tubes;
}

function isSolved(tubes: readonly Tube[]): boolean {
  return tubes.every(
    (tube) =>
      !tube.length ||
      (tube.length === CAPACITY && tube.every((color) => color === tube[0])),
  );
}

export class Game {
  readonly tubes: readonly Tube[];
  readonly selected: number | null;
  /** Every saved state, starting with the initial deal. */
  readonly states: readonly GameState[];
  /** How many moves have been made (or how far into a replay we are). */
  readonly moves: number;

  private constructor(
    tubes: readonly Tube[],
    selected: number | null,
    states: readonly GameState[],
    moves: number,
  ) {
    this.tubes = tubes;
    this.selected = selected;
    this.states = states;
    this.moves = moves;
  }

  /** A fresh deal: three mixed tubes and one empty tube. */
  static create(): Game {
    const state: GameState = { tubes: deal(), selected: null };
    return new Game(state.tubes, state.selected, [state], 0);
  }

  get canReplay(): boolean {
    return this.states.length > 1;
  }

  get solved(): boolean {
    return isSolved(this.tubes);
  }

  /** The tubes the selected ball can move into. */
  destinations(): number[] {
    const from = this.selected;
    if (from === null || !this.tubes[from]?.length) return [];

    return this.tubes.flatMap((tube, index) =>
      index !== from && tube.length < CAPACITY ? [index] : [],
    );
  }

  /** Select a tube, move into a destination, or clear the selection. */
  tap(index: number): Game {
    if (this.moves !== this.states.length - 1) return this;

    const tube = this.tubes[index];
    if (!tube) return this;

    const from = this.selected;

    if (from === null) return tube.length ? this.select(index) : this;
    if (from === index) return this.select(null);
    if (!this.destinations().includes(index)) {
      return this.select(tube.length ? index : null);
    }

    const tubes = this.tubes.map((tube) => [...tube]);
    tubes[index]!.push(tubes[from]!.pop()!);

    const states = [...this.states, { tubes, selected: null }];
    return new Game(tubes, null, states, states.length - 1);
  }

  /** A new shuffled game. */
  shuffle(): Game {
    return Game.create();
  }

  clearSelection(): Game {
    return this.selected === null ? this : this.select(null);
  }

  /** A read-only view of an earlier saved state. */
  at(step: number): Game {
    const index = Math.max(0, Math.min(step, this.states.length - 1));
    const state = this.states[index]!;
    return new Game(state.tubes, state.selected, this.states, index);
  }

  private select(selected: number | null): Game {
    return new Game(this.tubes, selected, this.states, this.moves);
  }
}
