namespace XoneK2 {
  const midiChannels = {
    decksInModdle: 0xE,
    effectsInMiddle: 0xD,
    decksOnLeft: 0xC,
    decksOnRight: 0xB,
    fourDecks3124: 0xA,
    fourDecks1234: 0x9,
    fourEffects3124: 0x8,
    fourEffects1234: 0x7
  };

  const midiChannelValues = [
    midiChannels.decksInModdle,
    midiChannels.effectsInMiddle,
    midiChannels.decksOnLeft,
    midiChannels.decksOnRight,
    midiChannels.fourDecks3124,
    midiChannels.fourDecks1234,
    midiChannels.fourEffects3124,
    midiChannels.fourEffects1234
  ];

  const decks = [1, 2, 3, 4] as const;
  const columns = [1, 2, 3, 4] as const;

  const deckStrings = {
    1: "[Channel1]",
    2: "[Channel2]",
    3: "[Channel3]",
    4: "[Channel4]"
  };

  const otherDecksMap = {
    1: [2, 4, 3],
    2: [1, 3, 4],
    3: [4, 2, 1],
    4: [3, 1, 2]
  } as const;

  const color = {
    red: 0,
    amber: 36,
    green: 72
  };

  // The MIDI note offsets for different colors with the layer button is different
  // from the rest of the buttons.
  const layerButtonColor = {
    red: 0x0F,
    amber: 0x13,
    green: 0x17,
  };

  const deckBottomButtonLayers = [
    { name: 'loop', layerButtonNoteNumber: layerButtonColor.green },
    { name: 'cue', layerButtonNoteNumber: layerButtonColor.red },
    { name: 'fx', layerButtonNoteNumber: layerButtonColor.amber },
  ] as const;
  const deckBottomButtonLayerNames: typeof deckBottomButtonLayers[number]["name"][] =
    deckBottomButtonLayers.map((x) => x.name);

  interface Controller {
    columns: Record<1 | 2 | 3 | 4, Deck>;
    isShifted: boolean;
    fxEditMode: { unit: 1 | 2, index: 1 | 2 | 3; }[];
    leftEncoderIsPressed: boolean;
    rightEncoderIsPressed: boolean;
    deckPicked: boolean;
    deckLayerIndex: number;
  }

  export const controllers: Record<number, Controller> = {};

  function TrueBPMSync(deckNumber: 1 | 2 | 3 | 4) {
    const otherDecks = otherDecksMap[deckNumber];
    if (!otherDecks) return;
    const deckString = deckStrings[deckNumber]
    for (var i = 0; i < 3; i++) {
      const otherDeckNumber = otherDecks[i];
      const otherDeckString = deckStrings[otherDeckNumber];
      if (engine.getValue(otherDeckString, "play_latched") === 1) {
        const otherBpm = engine.getValue(otherDeckString, "bpm");
        engine.setValue(deckString, "bpm", otherBpm);
        return;
      }
    }
  }

  function TrueBeatAdjust(deckNumber: 1 | 2 | 3 | 4, direction: number) {
    const deckString = deckStrings[deckNumber];
    const bpm = engine.getValue(deckString, "bpm");
    engine.setValue(deckString, "bpm", bpm + 0.1 * direction);
  }

  type Colored<T = {}> = T & { color: number };
  type Supershift<T = {}> = T & { supershift(): void };

  class Button extends components.Button implements Supershift, Colored {
    color: number;

    supershift() { };

    send(value: number) {
      if (!this.midi || !this.midi[0] || !this.midi[1]) {
        return;
      }
      // The LEDs are turned on with a Note On MIDI message (first nybble of first byte 9)
      // and turned off with a Note Off MIDI message (first nybble of first byte 8).
      if (value > 0) {
        midi.sendShortMsg(this.midi[0] + 0x10, this.midi[1] + this.color, value);
      } else {
        midi.sendShortMsg(this.midi[0], this.midi[1], 0x7F);
      }
    }

    isPress(channel: number, control: string | null, value: number, status: number) {
      return (status & 0xF0) === 0x90;
    }

    constructor(options: components.PartialPreservingThisParameter<Button>) {
      super(options as unknown as components.PartialPreservingThisParameter<components.Button>);
      this.color = options.color ?? color.red;
    }
  }
  const ExtendableButton = Button as unknown as components.Constructor<Button>;

  class PlayButton extends Button implements Supershift, Colored {
    startDeckPickMode() { }
    stopDeckPickMode() { }

    constructor(options: components.PartialPreservingThisParameter<PlayButton>) {
      super(options as unknown as components.PartialPreservingThisParameter<Button>);
    }
  }

  class UnifiedCueButton extends Button implements Supershift, Colored {
    cueName: string;
    cueName2: string;
    unshift() {
      this.inKey = this.cueName + '_activate';
      this.outKey = this.cueName + '_enabled';
      this.input = UnifiedCueButton.prototype.input;
    };
    shift() {
      this.inKey = this.cueName2 + '_activate';
      this.outKey = this.cueName2 + '_enabled';
      this.input = UnifiedCueButton.prototype.input;
    };
    supershift() {
      this.inKey = this.cueName + '_clear';
      this.outKey = this.cueName + '_enabled';
      this.input = UnifiedCueButton.prototype.input;
    }
    constructor(options: components.PartialPreservingThisParameter<UnifiedCueButton> & Pick<UnifiedCueButton, "cueName" | "cueName2">) {
      super(options as unknown as components.PartialPreservingThisParameter<Button>);
      this.cueName = options.cueName;
      this.cueName2 = options.cueName2;
      this.outKey = this.cueName + '_enabled';
    }
  }

  type MidiSetter<T = components.Component> =
    (obj: T, columnNumber: 1 | 2 | 3 | 4, midiChannel: number) => void;

  const setTopEncoderPressMidi: MidiSetter<Deck["encoderPress"]> =
    (topEncoderPressObject, columnNumber, midiChannel) => {
      topEncoderPressObject.midi = [0x80 + midiChannel, 0x34 + (columnNumber - 1)];
    }

  const setTopButtonsMidi: MidiSetter<Deck["topButtons"]> =
    (topButtonsObject, columnNumber, midiChannel) => {
      for (const c of [1, 2, 3] as const) {
        topButtonsObject[c].midi = [0x80 + midiChannel,
        0x30 - (c - 1) * 4 + (columnNumber - 1)];
      }
    };

  const setBottomButtonsMidi: MidiSetter<Deck["bottomButtons"]> =
    (bottomButtonsObject, columnNumber, midiChannel) => {
      for (const c of columns) {
        bottomButtonsObject[c].midi = [0x80 + midiChannel,
        0x24 - (c - 1) * 4 + (columnNumber - 1)];
      }
    };

  const setDeckMidi: MidiSetter<Deck> = (deck, columnNumber, midiChannel) => {
    setTopEncoderPressMidi(deck.encoderPress, columnNumber, midiChannel);
    setTopButtonsMidi(deck.topButtons, columnNumber, midiChannel);
    setBottomButtonsMidi(deck.bottomButtons, columnNumber, midiChannel);
  };

  class Deck extends components.Deck {
    encoder: Supershift<components.Encoder>;
    encoderPress: Supershift<Button>;
    knobs: components.ComponentContainer & Record<1 | 2 | 3, components.Pot>;
    topButtons: components.ComponentContainer & Record<1 | 2, Button> & Record<3, PlayButton>;
    fader: components.Pot;
    bottomButtonLayers: Record<
      typeof deckBottomButtonLayers[number]["name"],
      components.ComponentContainer & Record<1 | 2 | 3 | 4, Button>
    >;
    bottomButtons: (typeof this.bottomButtonLayers)[typeof deckBottomButtonLayers[number]["name"]];

    deckString: string;

    constructor(columnNumber: 1 | 2 | 3 | 4, deckNumber: 1 | 2 | 3 | 4, midiChannel: number) {
      super(deckNumber);
      this.deckString = deckStrings[deckNumber];
      const parent = this;

      this.encoder = new components.Encoder({
        unshift() {
          this.input = function (channel, control, value, status) {
            const direction = (value === 1) ? 1 : -1;
            engine.setValue(this.group, "jog", direction * 3);
          };
        },
        shift() {
          this.input = function (channel, control, value, status) {
            const direction = (value === 1) ? 1 : -1;
            const gain = engine.getValue(this.group, "pregain");
            engine.setValue(this.group, "pregain", gain + 0.025 * direction);
          };
        },
        supershift() {
          this.input = function (channel, control, value, status) {
            const direction = (value === 1) ? 1 : -1;
            TrueBeatAdjust(deckNumber, direction);
          };
        }
      });

      this.encoderPress = new Button({
        outKey: 'beat_active',
        unshift() {
          this.input = function (channel, control, value, status) {
            if (this.isPress(channel, control, value, status)) {
              TrueBPMSync(deckNumber);
            }
          };
        },
        shift() {
          this.input = Button.prototype.input;
          this.group = parent.deckString;
          this.inKey = 'pregain_set_default';
          this.type = Button.prototype.types.push;
        },
        supershift() {
          this.input = function () {
            engine.setValue(parent.deckString, "bpm",
              engine.getValue(parent.deckString, "file_bpm"));
          }
        },
      });

      this.knobs = new components.ComponentContainer();
      for (const k of [1, 2] as const) {
        this.knobs[k] = new components.Pot({
          group: `[EqualizerRack1_${parent.deckString}_Effect1]`,
          inKey: `parameter${4 - k}`
        });
      }

      // Low EQ knob. With shift, switches to QuickEffect superknob.
      this.knobs[3] = new components.Pot({
        unshift() {
          this.disconnect();
          this.group = `[EqualizerRack1_${parent.deckString}_Effect1]`;
          this.inKey = 'parameter1';
          this.connect();
        },
        shift() {
          this.disconnect();
          this.group = `[QuickEffectRack1_${parent.deckString}]`;
          this.inKey = 'super1';
          this.connect();
        }
      });

      this.fader = new components.Pot({ inKey: 'volume' });

      this.topButtons = new components.ComponentContainer();
      this.topButtons[1] = new Button({
        unshift() {
          this.disconnect();
          this.type = Button.prototype.types.toggle;
          this.inKey = 'pfl';
          this.outKey = 'pfl';
          this.color = color.red;
          this.connect();
          this.trigger();
        },
        shift() {
          this.disconnect();
          this.type = Button.prototype.types.push;
          this.inKey = 'pitch_up';
          this.outKey = 'play_indicator';
          this.color = color.green;
          this.connect();
          this.trigger();
        },
        supershift() {
          this.disconnect();
          this.type = Button.prototype.types.toggle;
          this.inKey = `quantize`;
          this.outKey = `quantize`;
          this.color = color.amber;
          this.connect();
          this.trigger();
        },
      });
      this.topButtons[2] = new Button({
        unshift() {
          this.disconnect();
          this.type = Button.prototype.types.push;
          this.inKey = 'cue_default';
          this.outKey = 'cue_indicator';
          this.color = color.red;
          this.connect();
          this.trigger();
        },
        shift() {
          this.disconnect();
          this.type = Button.prototype.types.push;
          this.inKey = 'pitch_down';
          this.outKey = 'play_indicator';
          this.color = color.green;
          this.connect();
          this.trigger();
        },
        supershift() {
          this.disconnect();
          this.type = Button.prototype.types.toggle;
          this.inKey = `keylock`;
          this.outKey = `keylock`;
          this.color = color.amber;
          this.connect();
          this.trigger();
        },
      });
      this.topButtons[3] = new PlayButton({
        unshift() {
          this.disconnect();
          this.inKey = 'play';
          this.outKey = 'play_indicator';
          this.color = color.red;
          this.connect();
          this.trigger();
        },
        shift() {
          this.disconnect();
          this.inKey = 'pitch_set_default';
          this.outKey = 'play_indicator';
          this.color = color.green;
          this.connect();
          this.trigger();
        },
        supershift() {
          this.disconnect();
          this.group = parent.deckString;
          this.inKey = 'eject';
          this.outKey = 'play_indicator';
          this.color = color.amber;
          this.connect();
          this.trigger();
        },
        startDeckPickMode() {
          this.input = function (channel, control, value, status) {
            if (this.isPress(channel, control, value, status)) {
              engine.setValue(this.group, "LoadSelectedTrack", 1);
              controllers[channel].deckPicked = true;
              TrueBPMSync(deckNumber);
            }
          };
        },
        stopDeckPickMode() {
          // The inKey and outKey are still set from before startDeckPickMode was
          // called, so all that is needed to get back to that mode is to fall back
          // to the prototype input function.
          this.input = Button.prototype.input;
        },
        type: Button.prototype.types.toggle,
      });

      // This should not be a ComponentContainer, otherwise strange things will
      // happen when iterating over the Deck with reconnectComponents.
      this.bottomButtonLayers = {
        cue: new components.ComponentContainer(),
        loop: new components.ComponentContainer(),
        fx: new components.ComponentContainer(),
      };

      this.bottomButtonLayers.cue[1] = new UnifiedCueButton({
        cueName: "hotcue_1",
        cueName2: "intro_start",
        color: color.red
      });
      this.bottomButtonLayers.cue[2] = new UnifiedCueButton({
        cueName: "hotcue_2",
        cueName2: "intro_end",
        color: color.red
      });
      this.bottomButtonLayers.cue[3] = new UnifiedCueButton({
        cueName: "hotcue_3",
        cueName2: "outro_start",
        color: color.red
      });
      this.bottomButtonLayers.cue[4] = new UnifiedCueButton({
        cueName: "hotcue_4",
        cueName2: "outro_end",
        color: color.red
      });

      this.bottomButtonLayers.loop[1] = new Button({
        outKey: 'loop_enabled',
        unshift() {
          this.inKey = 'beatloop_activate';
          this.input = Button.prototype.input
        },
        shift() {
          this.input = function (channel, control, value, status) {
            if (this.isPress(channel, control, value, status)) {
              engine.setValue(this.group, 'beatloop_size',
                engine.getValue(this.group, 'beatloop_size') / 2);
            }
          }
        },
        supershift() {
          this.inKey = 'loop_in';
          this.input = Button.prototype.input
        },
        trigger() {
          this.send(this.on);
        },
        color: color.green,
      });
      this.bottomButtonLayers.loop[2] = new Button({
        outKey: 'loop_enabled',
        unshift() {
          this.inKey = 'reloop_toggle';
          this.input = Button.prototype.input
        },
        shift() {
          this.input = function (channel, control, value, status) {
            if (this.isPress(channel, control, value, status)) {
              engine.setValue(this.group, 'beatloop_size',
                engine.getValue(this.group, 'beatloop_size') * 2);
            }
          }
        },
        supershift() {
          this.inKey = 'loop_out';
          this.input = Button.prototype.input
        },
        trigger() {
          this.send(this.on);
        },
        color: color.green,
      });
      this.bottomButtonLayers.loop[3] = new Button({
        unshift() {
          this.inKey = 'beatjump_backward';
          this.input = Button.prototype.input;
        },
        shift() {
          this.input = function (channel, control, value, status) {
            if (this.isPress(channel, control, value, status)) {
              engine.setValue(this.group, 'beatjump_size',
                engine.getValue(this.group, 'beatjump_size') / 2);
            }
          }
        },
        supershift() {
          this.input = function (channel, control, value, status) {
            if (this.isPress(channel, control, value, status)) {
              engine.setValue(this.group, 'beatjump_size', 1);
            }
          };
        },
        trigger() {
          this.send(this.on);
        },
        color: color.green,
      });
      this.bottomButtonLayers.loop[4] = new Button({
        unshift() {
          this.inKey = 'beatjump_forward';
          this.input = Button.prototype.input;
        },
        shift() {
          this.input = function (channel, control, value, status) {
            if (this.isPress(channel, control, value, status)) {
              engine.setValue(this.group, 'beatjump_size',
                engine.getValue(this.group, 'beatjump_size') * 2);
            }
          }
        },
        supershift() {
          this.input = function (channel, control, value, status) {
            if (this.isPress(channel, control, value, status)) {
              engine.setValue(this.group, 'beatjump_size', 8);
            }
          };
        },
        trigger() {
          this.send(this.on);
        },
        color: color.green,
      });

      if (deckNumber === 1 || deckNumber === 2) {
        for (const effectIndex of [1, 2, 3] as const) {
          this.bottomButtonLayers.fx[effectIndex] = new Button({
            color: color.amber,
            group: `[EffectRack1_EffectUnit${deckNumber}_Effect${effectIndex}]`,
            outKey: "enabled",
            input(channel, control, value, status) {
              if (this.isPress(channel, control, value, status)) {
                controllers[channel].fxEditMode.push({
                  unit: deckNumber,
                  index: effectIndex
                });
              } else {
                controllers[channel].fxEditMode =
                  controllers[channel].fxEditMode.filter(({ unit, index }) =>
                    unit !== deckNumber || index !== effectIndex
                  );
              }
            },
            disconnect() {
              Button.prototype.disconnect.apply(this);
              controllers[midiChannel].fxEditMode = [];
            },
          })
        }
        this.bottomButtonLayers.fx[4] = new ExtendableButton({
          color: color.red,
          input(channel, control, value, status, group) {
            if (this.isPress(channel, control, value, status)) {
              var enabled = true;
              for (const index of [1, 2, 3] as const) {
                const group = `[EffectRack1_EffectUnit${deckNumber}_Effect${index}]`;
                if (engine.getValue(group, "enabled")) {
                  enabled = false;
                  break;
                }
              }
              for (const index of [1, 2, 3] as const) {
                const group = `[EffectRack1_EffectUnit${deckNumber}_Effect${index}]`;
                engine.setValue(group, "enabled", enabled ? 1 : 0);
              }
              this.color = enabled ? color.green : color.red;
              this.send(this.on);
            }
          },
          trigger() {
            this.send(this.on);
          },
        })
      }
      else {
        const unit = deckNumber === 3 ? 1 : 2;
        for (const deck of decks) {
          this.bottomButtonLayers.fx[deck] = new Button({
            type: Button.prototype.types.toggle,
            group: `[EffectRack1_EffectUnit${unit}]`,
            inKey: `group_${deckStrings[deck]}_enable`,
            outKey: `group_${deckStrings[deck]}_enable`,
            color: color.amber
          })
        }
      }

      const setGroup = (component: components.Component) => {
        if (!component.group) {
          component.group = parent.deckString;
        }
      };

      for (const layerName of deckBottomButtonLayerNames) {
        setBottomButtonsMidi(this.bottomButtonLayers[layerName], columnNumber, midiChannel);
        this.bottomButtonLayers[layerName].forEachComponent(setGroup);
      }

      this.bottomButtons = this.bottomButtonLayers[deckBottomButtonLayers[0].name];

      setDeckMidi(this, columnNumber, midiChannel);
      this.reconnectComponents(setGroup);
    }
  }

  export function init() {
    for (const channel of midiChannelValues) {
      controllers[channel] = {
        isShifted: false,
        fxEditMode: [],
        leftEncoderIsPressed: false,
        rightEncoderIsPressed: false,
        deckPicked: false,
        deckLayerIndex: -1,
        columns: {
          1: new Deck(1, 3, channel),
          2: new Deck(2, 1, channel),
          3: new Deck(3, 2, channel),
          4: new Deck(4, 4, channel)
        }
      };
      decksLayerButton(channel, null, 0x90 + channel, 0);
    }
  }

  export function shutdown() {
    const turnOff = (component: components.Component) => component.send(0);

    for (const channel of midiChannelValues) {
      for (const deck of decks) {
        controllers[channel].columns[deck].forEachComponent(turnOff);
      }
    }
  }

  type MidiInput = (channel: number, control: string | null, value: number, status: number) => void;

  export const shiftButton: MidiInput = (channel, control, value, status) => {
    controllers[channel].isShifted = (status & 0xF0) === 0x90;
    if (controllers[channel].isShifted) {
      for (const z of columns) {
        controllers[channel].columns[z].shift();
      }
    } else {
      for (const z of columns) {
        controllers[channel].columns[z].unshift();
      }
    }
    midi.sendShortMsg(status, 0x0C, value);
  };

  export const decksLayerButton: MidiInput = (channel, control, value, status) => {
    if (!controllers[channel].isShifted) {
      // Cycle the deck layers
      if (components.Button.prototype.isPress(channel, control, value, status)) {
        controllers[channel].deckLayerIndex++;
        if (controllers[channel].deckLayerIndex === deckBottomButtonLayers.length) {
          controllers[channel].deckLayerIndex = 0;
        }
        const newLayer = deckBottomButtonLayers[controllers[channel].deckLayerIndex];

        for (const x of decks) {
          const deckColumn = controllers[channel].columns[x];
          deckColumn.bottomButtons.forEachComponent((c) => c.disconnect());
          deckColumn.bottomButtons = deckColumn.bottomButtonLayers[newLayer.name];
          deckColumn.bottomButtons.forEachComponent((c) => {
            c.disconnect();
            c.connect();
            c.trigger();
          });
        }
        midi.sendShortMsg(status, newLayer.layerButtonNoteNumber, 0x7F);
      }
    } else {
      if (components.Button.prototype.isPress(channel, control, value, status)) {
        // Activate supershift mode
        const supershift = (c: Partial<Supershift<components.Component>>) => {
          if (c.supershift !== undefined) {
            c.supershift();
          }
        };

        for (const x of decks) {
          const deckColumn = controllers[channel].columns[x];
          deckColumn.forEachComponent(supershift);
          deckColumn.bottomButtons.forEachComponent(supershift);
        }
      } else {
        // Shift button is still held down, so exit supershift mode by going back to
        // plain shift mode
        const shift = (c: Partial<Supershift<components.Component>>) => {
          if (c?.supershift !== undefined) {
            c?.shift?.();
          }
        };

        for (const x of decks) {
          const deckColumn = controllers[channel].columns[x];
          deckColumn.forEachComponent(shift);
          deckColumn.bottomButtons.forEachComponent(shift);
        }
      }
    }
  }

  export const decksBottomLeftEncoderPress: MidiInput = (channel, control, value, status) => {
    controllers[channel].leftEncoderIsPressed = (status & 0xF0) === 0x90;
    if (controllers[channel].isShifted && controllers[channel].leftEncoderIsPressed) {
      script.toggleControl('[Master]', 'headSplit');
    }
  };

  export const decksBottomLeftEncoder: MidiInput = (channel, control, value, status) => {
    if (!controllers[channel].isShifted) {
      if (!controllers[channel].leftEncoderIsPressed) {
        var gain = engine.getValue("[Master]", "gain");
        if (value === 1) {
          gain += 0.025;
        } else {
          gain -= 0.025;
        }
        engine.setValue("[Master]", "gain", gain);
      } else {
        var mix = engine.getValue("[Master]", "headMix");
        if (value === 1) {
          mix += 1;
        } else {
          mix -= 1;
        }
        engine.setValue("[Master]", "headMix", mix);
      }
    } else {
      var gain = engine.getValue("[Master]", "headGain");
      if (value === 1) {
        gain += 0.025;
      } else {
        gain -= 0.025;
      }
      engine.setValue("[Master]", "headGain", gain);
    }
  };

  export const decksBottomRightEncoderPress: MidiInput = (channel, control, value, status) => {
    controllers[channel].rightEncoderIsPressed = (status & 0xF0) === 0x90;
    const fxEditMode = controllers[channel].fxEditMode;
    if (fxEditMode.length > 0) {
      if (controllers[channel].rightEncoderIsPressed) {
        for (const { unit, index } of fxEditMode) {
          const group = `[EffectRack1_EffectUnit${unit}_Effect${index}]`;
          const enabled = engine.getValue(group, "enabled");
          engine.setValue(group, "enabled", enabled ? 0 : 1);
        }
      }
    }
    else if (controllers[channel].isShifted) {
      if (controllers[channel].rightEncoderIsPressed)
        engine.setValue("[Library]", "MoveFocus", 1);
    }
    else if (controllers[channel].rightEncoderIsPressed) {
      for (const x of decks) {
        var deckColumn = controllers[channel].columns[x];
        if (!(deckColumn instanceof Deck)) {
          continue;
        }
        deckColumn.topButtons[3].startDeckPickMode();
      }
    } else {
      for (const x of decks) {
        const deckColumn = controllers[channel].columns[x];
        if (!(deckColumn instanceof Deck)) {
          continue;
        }
        deckColumn.topButtons[3].stopDeckPickMode();
      }

      if (controllers[channel].deckPicked === true) {
        controllers[channel].deckPicked = false;
      } else {
        engine.setValue("[Library]", "GoToItem", 1);
      }
    }
  };

  export const decksBottomRightEncoder: MidiInput = (channel, control, value, status) => {
    const fxEditMode = controllers[channel].fxEditMode;
    if (fxEditMode.length > 0) {
      for (const { unit, index } of fxEditMode) {
        const group = `[EffectRack1_EffectUnit${unit}_Effect${index}]`;
        const direction = value === 1 ? 1 : -1;
        const p1 = engine.getParameter(group, "meta");
        engine.setParameter(group, "meta", p1 + 0.1 * direction);
      }
    }
    else if (!controllers[channel].isShifted) {
      if (value === 1) {
        engine.setValue("[Library]", "MoveDown", 1);
      } else {
        engine.setValue("[Library]", "MoveUp", 1);
      }
    } else {
      const direction = value === 1 ? 1 : -1;
      TrueBeatAdjust(1, direction);
      TrueBeatAdjust(2, direction);
      TrueBeatAdjust(3, direction);
      TrueBeatAdjust(4, direction);
    }
  };
}