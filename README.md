# cannorin's controller mapping files for Mixxx

This repository contains the controller mapping files for
[Mixxx](https://github.com/mixxxdj/), which I regularly use in IRL/URL gigs.

It also comes with the TS type definition file (`midi-components-0.0.d.ts`)
for Mixxx's [MIDI Components JS](https://github.com/mixxxdj/mixxx/wiki/Components-JS).
You might be interested in it if you also happen to write your own mapping files.

## Installation

Simply put the entire repository on the [Controller Mapping File Location](https://github.com/mixxxdj/mixxx/wiki/controller%20mapping%20file%20locations).

## Building

`cd` into the `cannorin` directory, then run `npm install && npm run build`.

## Controller(s)

### XONE:K2

Heavily modified version of [the official binding](https://github.com/mixxxdj/mixxx/wiki/Allen-%26-Heath-Xone-K2-K1).

- Added an ability to use two effect units while maintaining the full 4-deck setup.
  - Other layouts (such as 2 decks & 2 effect units) are removed.
  - Decks are ordered as `3 1 2 4`.
- Layers have been replaced to achieve the above:
  - GREEN: Loop & Beat Jump
  - RED: Hotcue & Intro/Outro Cue
  - AMBER: Effect Units
- `LAYER` is actually the SHIFT button and `EXIT SETUP` is used for switching layers. This is because
  most Pioneer gears have SHIFT buttons on the left and I've got too used to it.

more docs: coming soon (tm)

## License

It is licensed under GPLv2 since it contains some pieces of code from the
original Mixxx mapping files, which is also licensed under GPLv2. I didn't
choose GPLv3 so that it can easily be merged back to Mixxx (if they wish).
