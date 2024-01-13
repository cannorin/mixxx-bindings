"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var XoneK2;
(function (XoneK2) {
    var midiChannels = {
        decksInModdle: 0xE,
        effectsInMiddle: 0xD,
        decksOnLeft: 0xC,
        decksOnRight: 0xB,
        fourDecks3124: 0xA,
        fourDecks1234: 0x9,
        fourEffects3124: 0x8,
        fourEffects1234: 0x7
    };
    var midiChannelValues = [
        midiChannels.decksInModdle,
        midiChannels.effectsInMiddle,
        midiChannels.decksOnLeft,
        midiChannels.decksOnRight,
        midiChannels.fourDecks3124,
        midiChannels.fourDecks1234,
        midiChannels.fourEffects3124,
        midiChannels.fourEffects1234
    ];
    var decks = [1, 2, 3, 4];
    var columns = [1, 2, 3, 4];
    var deckStrings = {
        1: "[Channel1]",
        2: "[Channel2]",
        3: "[Channel3]",
        4: "[Channel4]"
    };
    var otherDecksMap = {
        1: [2, 4, 3],
        2: [1, 3, 4],
        3: [4, 2, 1],
        4: [3, 1, 2]
    };
    var color = {
        red: 0,
        amber: 36,
        green: 72
    };
    // The MIDI note offsets for different colors with the layer button is different
    // from the rest of the buttons.
    var layerButtonColor = {
        red: 0x0F,
        amber: 0x13,
        green: 0x17
    };
    var deckBottomButtonLayers = [
        { name: 'cue', layerButtonNoteNumber: layerButtonColor.red },
        { name: 'loop', layerButtonNoteNumber: layerButtonColor.green },
        { name: 'fx', layerButtonNoteNumber: layerButtonColor.amber },
    ];
    var deckBottomButtonLayerNames = deckBottomButtonLayers.map(function (x) { return x.name; });
    XoneK2.controllers = {};
    function TrueBPMSync(deckNumber) {
        var otherDecks = otherDecksMap[deckNumber];
        if (!otherDecks)
            return;
        var deckString = deckStrings[deckNumber];
        for (var i = 0; i < 3; i++) {
            var otherDeckNumber = otherDecks[i];
            var otherDeckString = deckStrings[otherDeckNumber];
            if (engine.getValue(otherDeckString, "play_latched") === 1) {
                var otherBpm = engine.getValue(otherDeckString, "bpm");
                engine.setValue(deckString, "bpm", otherBpm);
                return;
            }
        }
    }
    function TrueBeatAdjust(deckNumber, direction) {
        var deckString = deckStrings[deckNumber];
        var bpm = engine.getValue(deckString, "bpm");
        engine.setValue(deckString, "bpm", bpm + 0.1 * direction);
    }
    var Button = /** @class */ (function (_super) {
        __extends(Button, _super);
        function Button(options) {
            var _a;
            var _this = _super.call(this, options) || this;
            _this.color = (_a = options.color) !== null && _a !== void 0 ? _a : color.red;
            return _this;
        }
        Button.prototype.supershift = function () { };
        ;
        Button.prototype.send = function (value) {
            if (!this.midi || !this.midi[0] || !this.midi[1]) {
                return;
            }
            // The LEDs are turned on with a Note On MIDI message (first nybble of first byte 9)
            // and turned off with a Note Off MIDI message (first nybble of first byte 8).
            if (value > 0) {
                midi.sendShortMsg(this.midi[0] + 0x10, this.midi[1] + this.color, value);
            }
            else {
                midi.sendShortMsg(this.midi[0], this.midi[1], 0x7F);
            }
        };
        Button.prototype.isPress = function (channel, control, value, status) {
            return (status & 0xF0) === 0x90;
        };
        return Button;
    }(components.Button));
    var ExtendableButton = Button;
    var PlayButton = /** @class */ (function (_super) {
        __extends(PlayButton, _super);
        function PlayButton(options) {
            return _super.call(this, options) || this;
        }
        PlayButton.prototype.startDeckPickMode = function () { };
        PlayButton.prototype.stopDeckPickMode = function () { };
        return PlayButton;
    }(Button));
    var UnifiedCueButton = /** @class */ (function (_super) {
        __extends(UnifiedCueButton, _super);
        function UnifiedCueButton(options) {
            var _this = _super.call(this, options) || this;
            _this.cueName = options.cueName;
            _this.cueName2 = options.cueName2;
            _this.outKey = _this.cueName + '_enabled';
            return _this;
        }
        UnifiedCueButton.prototype.unshift = function () {
            this.inKey = this.cueName + '_activate';
            this.outKey = this.cueName + '_enabled';
            this.input = UnifiedCueButton.prototype.input;
        };
        ;
        UnifiedCueButton.prototype.shift = function () {
            this.inKey = this.cueName2 + '_activate';
            this.outKey = this.cueName2 + '_enabled';
            this.input = UnifiedCueButton.prototype.input;
        };
        ;
        UnifiedCueButton.prototype.supershift = function () {
            this.inKey = this.cueName + '_clear';
            this.outKey = this.cueName + '_enabled';
            this.input = UnifiedCueButton.prototype.input;
        };
        return UnifiedCueButton;
    }(Button));
    var setTopEncoderPressMidi = function (topEncoderPressObject, columnNumber, midiChannel) {
        topEncoderPressObject.midi = [0x80 + midiChannel, 0x34 + (columnNumber - 1)];
    };
    var setTopButtonsMidi = function (topButtonsObject, columnNumber, midiChannel) {
        for (var _i = 0, _a = [1, 2, 3]; _i < _a.length; _i++) {
            var c = _a[_i];
            topButtonsObject[c].midi = [0x80 + midiChannel,
                0x30 - (c - 1) * 4 + (columnNumber - 1)];
        }
    };
    var setBottomButtonsMidi = function (bottomButtonsObject, columnNumber, midiChannel) {
        for (var _i = 0, columns_1 = columns; _i < columns_1.length; _i++) {
            var c = columns_1[_i];
            bottomButtonsObject[c].midi = [0x80 + midiChannel,
                0x24 - (c - 1) * 4 + (columnNumber - 1)];
        }
    };
    var setDeckMidi = function (deck, columnNumber, midiChannel) {
        setTopEncoderPressMidi(deck.encoderPress, columnNumber, midiChannel);
        setTopButtonsMidi(deck.topButtons, columnNumber, midiChannel);
        setBottomButtonsMidi(deck.bottomButtons, columnNumber, midiChannel);
    };
    var Deck = /** @class */ (function (_super) {
        __extends(Deck, _super);
        function Deck(columnNumber, deckNumber, midiChannel) {
            var _this = _super.call(this, deckNumber) || this;
            _this.deckString = deckStrings[deckNumber];
            var parent = _this;
            _this.encoder = new components.Encoder({
                unshift: function () {
                    this.input = function (channel, control, value, status) {
                        var direction = (value === 1) ? 1 : -1;
                        engine.setValue(this.group, "jog", direction * 3);
                    };
                },
                shift: function () {
                    this.input = function (channel, control, value, status) {
                        var direction = (value === 1) ? 1 : -1;
                        var gain = engine.getValue(this.group, "pregain");
                        engine.setValue(this.group, "pregain", gain + 0.025 * direction);
                    };
                },
                supershift: function () {
                    this.input = function (channel, control, value, status) {
                        var direction = (value === 1) ? 1 : -1;
                        TrueBeatAdjust(deckNumber, direction);
                    };
                }
            });
            _this.encoderPress = new Button({
                outKey: 'beat_active',
                unshift: function () {
                    this.input = function (channel, control, value, status) {
                        if (this.isPress(channel, control, value, status)) {
                            TrueBPMSync(deckNumber);
                        }
                    };
                },
                shift: function () {
                    this.input = Button.prototype.input;
                    this.group = parent.deckString;
                    this.inKey = 'pregain_set_default';
                    this.type = Button.prototype.types.push;
                },
                supershift: function () {
                    this.input = function () {
                        engine.setValue(parent.deckString, "bpm", engine.getValue(parent.deckString, "file_bpm"));
                    };
                }
            });
            _this.knobs = new components.ComponentContainer();
            for (var _i = 0, _a = [1, 2]; _i < _a.length; _i++) {
                var k = _a[_i];
                _this.knobs[k] = new components.Pot({
                    group: "[EqualizerRack1_".concat(parent.deckString, "_Effect1]"),
                    inKey: "parameter".concat(4 - k)
                });
            }
            // Low EQ knob. With shift, switches to QuickEffect superknob. Stays as
            // QuickEffect superknob until shift is pressed again to allow using the
            // QuickEffect superknob without having to keep shift held down. This
            // allows using the QuickEffect superknob for a transition while using
            // the other hand for another control.
            _this.knobs[3] = new components.Pot({
                hasBeenTurnedSinceShiftToggle: false,
                input: function (channel, control, value, status) {
                    components.Pot.prototype.input.call(this, channel, control, value, status);
                    this.hasBeenTurnedSinceShiftToggle = true;
                },
                unshift: function () {
                    if (!this.hasBeenTurnedSinceShiftToggle) {
                        this.disconnect();
                        this.group = "[EqualizerRack1_".concat(parent.deckString, "_Effect1]");
                        this.inKey = 'parameter1';
                        this.connect();
                    }
                    this.hasBeenTurnedSinceShiftToggle = false;
                },
                shift: function () {
                    this.disconnect();
                    this.group = "[QuickEffectRack1_".concat(parent.deckString, "]");
                    this.inKey = 'super1';
                    this.connect();
                    this.hasBeenTurnedSinceShiftToggle = false;
                }
            });
            _this.fader = new components.Pot({ inKey: 'volume' });
            _this.topButtons = new components.ComponentContainer();
            _this.topButtons[1] = new Button({
                unshift: function () {
                    this.disconnect();
                    this.type = Button.prototype.types.toggle;
                    this.inKey = 'pfl';
                    this.outKey = 'pfl';
                    this.color = color.red;
                    this.connect();
                    this.trigger();
                },
                shift: function () {
                    this.disconnect();
                    this.type = Button.prototype.types.push;
                    this.inKey = 'pitch_up';
                    this.outKey = 'play_indicator';
                    this.color = color.green;
                    this.connect();
                    this.trigger();
                },
                supershift: function () {
                    this.disconnect();
                    this.type = Button.prototype.types.toggle;
                    this.inKey = "quantize";
                    this.outKey = "quantize";
                    this.color = color.amber;
                    this.connect();
                    this.trigger();
                }
            });
            _this.topButtons[2] = new Button({
                unshift: function () {
                    this.disconnect();
                    this.type = Button.prototype.types.push;
                    this.inKey = 'cue_default';
                    this.outKey = 'cue_indicator';
                    this.color = color.red;
                    this.connect();
                    this.trigger();
                },
                shift: function () {
                    this.disconnect();
                    this.type = Button.prototype.types.push;
                    this.inKey = 'pitch_down';
                    this.outKey = 'play_indicator';
                    this.color = color.green;
                    this.connect();
                    this.trigger();
                },
                supershift: function () {
                    this.disconnect();
                    this.type = Button.prototype.types.toggle;
                    this.inKey = "keylock";
                    this.outKey = "keylock";
                    this.color = color.amber;
                    this.connect();
                    this.trigger();
                }
            });
            _this.topButtons[3] = new PlayButton({
                unshift: function () {
                    this.disconnect();
                    this.inKey = 'play';
                    this.outKey = 'play_indicator';
                    this.color = color.red;
                    this.connect();
                    this.trigger();
                },
                shift: function () {
                    this.disconnect();
                    this.inKey = 'pitch_set_default';
                    this.outKey = 'play_indicator';
                    this.color = color.green;
                    this.connect();
                    this.trigger();
                },
                supershift: function () {
                    this.disconnect();
                    this.group = parent.deckString;
                    this.inKey = 'eject';
                    this.outKey = 'play_indicator';
                    this.color = color.amber;
                    this.connect();
                    this.trigger();
                },
                startDeckPickMode: function () {
                    this.input = function (channel, control, value, status) {
                        if (this.isPress(channel, control, value, status)) {
                            engine.setValue(this.group, "LoadSelectedTrack", 1);
                            XoneK2.controllers[channel].deckPicked = true;
                            TrueBPMSync(deckNumber);
                        }
                    };
                },
                stopDeckPickMode: function () {
                    // The inKey and outKey are still set from before startDeckPickMode was
                    // called, so all that is needed to get back to that mode is to fall back
                    // to the prototype input function.
                    this.input = Button.prototype.input;
                },
                type: Button.prototype.types.toggle
            });
            // This should not be a ComponentContainer, otherwise strange things will
            // happen when iterating over the Deck with reconnectComponents.
            _this.bottomButtonLayers = {
                cue: new components.ComponentContainer(),
                loop: new components.ComponentContainer(),
                fx: new components.ComponentContainer()
            };
            _this.bottomButtonLayers.cue[1] = new UnifiedCueButton({
                cueName: "hotcue_1",
                cueName2: "intro_start",
                color: color.red
            });
            _this.bottomButtonLayers.cue[2] = new UnifiedCueButton({
                cueName: "hotcue_2",
                cueName2: "intro_end",
                color: color.red
            });
            _this.bottomButtonLayers.cue[3] = new UnifiedCueButton({
                cueName: "hotcue_3",
                cueName2: "outro_start",
                color: color.red
            });
            _this.bottomButtonLayers.cue[4] = new UnifiedCueButton({
                cueName: "hotcue_4",
                cueName2: "outro_end",
                color: color.red
            });
            _this.bottomButtonLayers.loop[1] = new Button({
                outKey: 'loop_enabled',
                unshift: function () {
                    this.inKey = 'beatloop_activate';
                    this.input = Button.prototype.input;
                },
                shift: function () {
                    this.input = function (channel, control, value, status) {
                        if (this.isPress(channel, control, value, status)) {
                            engine.setValue(this.group, 'beatloop_size', engine.getValue(this.group, 'beatloop_size') / 2);
                        }
                    };
                },
                supershift: function () {
                    this.inKey = 'loop_in';
                    this.input = Button.prototype.input;
                },
                trigger: function () {
                    this.send(this.on);
                },
                color: color.green
            });
            _this.bottomButtonLayers.loop[2] = new Button({
                outKey: 'loop_enabled',
                unshift: function () {
                    this.inKey = 'reloop_toggle';
                    this.input = Button.prototype.input;
                },
                shift: function () {
                    this.input = function (channel, control, value, status) {
                        if (this.isPress(channel, control, value, status)) {
                            engine.setValue(this.group, 'beatloop_size', engine.getValue(this.group, 'beatloop_size') * 2);
                        }
                    };
                },
                supershift: function () {
                    this.inKey = 'loop_out';
                    this.input = Button.prototype.input;
                },
                trigger: function () {
                    this.send(this.on);
                },
                color: color.green
            });
            _this.bottomButtonLayers.loop[3] = new Button({
                unshift: function () {
                    this.inKey = 'beatjump_backward';
                    this.input = Button.prototype.input;
                },
                shift: function () {
                    this.input = function (channel, control, value, status) {
                        if (this.isPress(channel, control, value, status)) {
                            engine.setValue(this.group, 'beatjump_size', engine.getValue(this.group, 'beatjump_size') / 2);
                        }
                    };
                },
                supershift: function () {
                    this.input = function (channel, control, value, status) {
                        if (this.isPress(channel, control, value, status)) {
                            engine.setValue(this.group, 'beatjump_size', 1);
                        }
                    };
                },
                trigger: function () {
                    this.send(this.on);
                },
                color: color.green
            });
            _this.bottomButtonLayers.loop[4] = new Button({
                unshift: function () {
                    this.inKey = 'beatjump_forward';
                    this.input = Button.prototype.input;
                },
                shift: function () {
                    this.input = function (channel, control, value, status) {
                        if (this.isPress(channel, control, value, status)) {
                            engine.setValue(this.group, 'beatjump_size', engine.getValue(this.group, 'beatjump_size') * 2);
                        }
                    };
                },
                supershift: function () {
                    this.input = function (channel, control, value, status) {
                        if (this.isPress(channel, control, value, status)) {
                            engine.setValue(this.group, 'beatjump_size', 8);
                        }
                    };
                },
                trigger: function () {
                    this.send(this.on);
                },
                color: color.green
            });
            if (deckNumber === 1 || deckNumber === 2) {
                var _loop_1 = function (effectIndex) {
                    this_1.bottomButtonLayers.fx[effectIndex] = new Button({
                        color: color.amber,
                        group: "[EffectRack1_EffectUnit".concat(deckNumber, "_Effect").concat(effectIndex, "]"),
                        outKey: "enabled",
                        input: function (channel, control, value, status) {
                            if (this.isPress(channel, control, value, status)) {
                                XoneK2.controllers[channel].fxEditMode.push({
                                    unit: deckNumber,
                                    index: effectIndex
                                });
                            }
                            else {
                                XoneK2.controllers[channel].fxEditMode =
                                    XoneK2.controllers[channel].fxEditMode.filter(function (_a) {
                                        var unit = _a.unit, index = _a.index;
                                        return unit !== deckNumber || index !== effectIndex;
                                    });
                            }
                        },
                        disconnect: function () {
                            Button.prototype.disconnect.apply(this);
                            XoneK2.controllers[midiChannel].fxEditMode = [];
                        }
                    });
                };
                var this_1 = this;
                for (var _b = 0, _c = [1, 2, 3]; _b < _c.length; _b++) {
                    var effectIndex = _c[_b];
                    _loop_1(effectIndex);
                }
                _this.bottomButtonLayers.fx[4] = new ExtendableButton({
                    color: color.red,
                    input: function (channel, control, value, status, group) {
                        if (this.isPress(channel, control, value, status)) {
                            var enabled = true;
                            for (var _i = 0, _a = [1, 2, 3]; _i < _a.length; _i++) {
                                var index = _a[_i];
                                var group_1 = "[EffectRack1_EffectUnit".concat(deckNumber, "_Effect").concat(index, "]");
                                if (engine.getValue(group_1, "enabled")) {
                                    enabled = false;
                                    break;
                                }
                            }
                            for (var _b = 0, _c = [1, 2, 3]; _b < _c.length; _b++) {
                                var index = _c[_b];
                                var group_2 = "[EffectRack1_EffectUnit".concat(deckNumber, "_Effect").concat(index, "]");
                                engine.setValue(group_2, "enabled", enabled ? 1 : 0);
                            }
                            this.color = enabled ? color.green : color.red;
                            this.send(this.on);
                        }
                    },
                    trigger: function () {
                        this.send(this.on);
                    }
                });
            }
            else {
                var unit = deckNumber === 3 ? 1 : 2;
                for (var _d = 0, decks_1 = decks; _d < decks_1.length; _d++) {
                    var deck = decks_1[_d];
                    _this.bottomButtonLayers.fx[deck] = new Button({
                        type: Button.prototype.types.toggle,
                        group: "[EffectRack1_EffectUnit".concat(unit, "]"),
                        inKey: "group_".concat(deckStrings[deck], "_enable"),
                        outKey: "group_".concat(deckStrings[deck], "_enable"),
                        color: color.amber
                    });
                }
            }
            var setGroup = function (component) {
                if (!component.group) {
                    component.group = parent.deckString;
                }
            };
            for (var _e = 0, deckBottomButtonLayerNames_1 = deckBottomButtonLayerNames; _e < deckBottomButtonLayerNames_1.length; _e++) {
                var layerName = deckBottomButtonLayerNames_1[_e];
                setBottomButtonsMidi(_this.bottomButtonLayers[layerName], columnNumber, midiChannel);
                _this.bottomButtonLayers[layerName].forEachComponent(setGroup);
            }
            _this.bottomButtons = _this.bottomButtonLayers[deckBottomButtonLayers[0].name];
            setDeckMidi(_this, columnNumber, midiChannel);
            _this.reconnectComponents(setGroup);
            return _this;
        }
        return Deck;
    }(components.Deck));
    function init() {
        for (var _i = 0, midiChannelValues_1 = midiChannelValues; _i < midiChannelValues_1.length; _i++) {
            var channel = midiChannelValues_1[_i];
            XoneK2.controllers[channel] = {
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
            XoneK2.decksLayerButton(channel, null, 0x90 + channel, 0);
        }
    }
    XoneK2.init = init;
    function shutdown() {
        var turnOff = function (component) { return component.send(0); };
        for (var _i = 0, midiChannelValues_2 = midiChannelValues; _i < midiChannelValues_2.length; _i++) {
            var channel = midiChannelValues_2[_i];
            for (var _a = 0, decks_2 = decks; _a < decks_2.length; _a++) {
                var deck = decks_2[_a];
                XoneK2.controllers[channel].columns[deck].forEachComponent(turnOff);
            }
        }
    }
    XoneK2.shutdown = shutdown;
    XoneK2.shiftButton = function (channel, control, value, status) {
        XoneK2.controllers[channel].isShifted = (status & 0xF0) === 0x90;
        if (XoneK2.controllers[channel].isShifted) {
            for (var _i = 0, columns_2 = columns; _i < columns_2.length; _i++) {
                var z = columns_2[_i];
                XoneK2.controllers[channel].columns[z].shift();
            }
        }
        else {
            for (var _a = 0, columns_3 = columns; _a < columns_3.length; _a++) {
                var z = columns_3[_a];
                XoneK2.controllers[channel].columns[z].unshift();
            }
        }
        midi.sendShortMsg(status, 0x0C, value);
    };
    XoneK2.decksLayerButton = function (channel, control, value, status) {
        if (!XoneK2.controllers[channel].isShifted) {
            // Cycle the deck layers
            if (components.Button.prototype.isPress(channel, control, value, status)) {
                XoneK2.controllers[channel].deckLayerIndex++;
                if (XoneK2.controllers[channel].deckLayerIndex === deckBottomButtonLayers.length) {
                    XoneK2.controllers[channel].deckLayerIndex = 0;
                }
                var newLayer = deckBottomButtonLayers[XoneK2.controllers[channel].deckLayerIndex];
                for (var _i = 0, decks_3 = decks; _i < decks_3.length; _i++) {
                    var x = decks_3[_i];
                    var deckColumn = XoneK2.controllers[channel].columns[x];
                    deckColumn.bottomButtons.forEachComponent(function (c) { return c.disconnect(); });
                    deckColumn.bottomButtons = deckColumn.bottomButtonLayers[newLayer.name];
                    deckColumn.bottomButtons.forEachComponent(function (c) {
                        c.disconnect();
                        c.connect();
                        c.trigger();
                    });
                }
                midi.sendShortMsg(status, newLayer.layerButtonNoteNumber, 0x7F);
            }
        }
        else {
            if (components.Button.prototype.isPress(channel, control, value, status)) {
                // Activate supershift mode
                var supershift = function (c) {
                    if (c.supershift !== undefined) {
                        c.supershift();
                    }
                };
                for (var _a = 0, decks_4 = decks; _a < decks_4.length; _a++) {
                    var x = decks_4[_a];
                    var deckColumn = XoneK2.controllers[channel].columns[x];
                    deckColumn.forEachComponent(supershift);
                    deckColumn.bottomButtons.forEachComponent(supershift);
                }
            }
            else {
                // Shift button is still held down, so exit supershift mode by going back to
                // plain shift mode
                var shift = function (c) {
                    var _a;
                    if ((c === null || c === void 0 ? void 0 : c.supershift) !== undefined) {
                        (_a = c === null || c === void 0 ? void 0 : c.shift) === null || _a === void 0 ? void 0 : _a.call(c);
                    }
                };
                for (var _b = 0, decks_5 = decks; _b < decks_5.length; _b++) {
                    var x = decks_5[_b];
                    var deckColumn = XoneK2.controllers[channel].columns[x];
                    deckColumn.forEachComponent(shift);
                    deckColumn.bottomButtons.forEachComponent(shift);
                }
            }
        }
    };
    XoneK2.decksBottomLeftEncoderPress = function (channel, control, value, status) {
        XoneK2.controllers[channel].leftEncoderIsPressed = (status & 0xF0) === 0x90;
        if (XoneK2.controllers[channel].isShifted && XoneK2.controllers[channel].leftEncoderIsPressed) {
            script.toggleControl('[Master]', 'headSplit');
        }
    };
    XoneK2.decksBottomLeftEncoder = function (channel, control, value, status) {
        if (!XoneK2.controllers[channel].isShifted) {
            if (!XoneK2.controllers[channel].leftEncoderIsPressed) {
                var gain = engine.getValue("[Master]", "gain");
                if (value === 1) {
                    gain += 0.025;
                }
                else {
                    gain -= 0.025;
                }
                engine.setValue("[Master]", "gain", gain);
            }
            else {
                var mix = engine.getValue("[Master]", "headMix");
                if (value === 1) {
                    mix += 1;
                }
                else {
                    mix -= 1;
                }
                engine.setValue("[Master]", "headMix", mix);
            }
        }
        else {
            var gain = engine.getValue("[Master]", "headGain");
            if (value === 1) {
                gain += 0.025;
            }
            else {
                gain -= 0.025;
            }
            engine.setValue("[Master]", "headGain", gain);
        }
    };
    XoneK2.decksBottomRightEncoderPress = function (channel, control, value, status) {
        XoneK2.controllers[channel].rightEncoderIsPressed = (status & 0xF0) === 0x90;
        var fxEditMode = XoneK2.controllers[channel].fxEditMode;
        if (fxEditMode.length > 0) {
            if (XoneK2.controllers[channel].rightEncoderIsPressed) {
                for (var _i = 0, fxEditMode_1 = fxEditMode; _i < fxEditMode_1.length; _i++) {
                    var _a = fxEditMode_1[_i], unit = _a.unit, index = _a.index;
                    var group = "[EffectRack1_EffectUnit".concat(unit, "_Effect").concat(index, "]");
                    var enabled = engine.getValue(group, "enabled");
                    engine.setValue(group, "enabled", enabled ? 0 : 1);
                }
            }
        }
        else if (XoneK2.controllers[channel].isShifted) {
            if (XoneK2.controllers[channel].rightEncoderIsPressed)
                engine.setValue("[Library]", "MoveFocus", 1);
        }
        else if (XoneK2.controllers[channel].rightEncoderIsPressed) {
            for (var _b = 0, decks_6 = decks; _b < decks_6.length; _b++) {
                var x = decks_6[_b];
                var deckColumn = XoneK2.controllers[channel].columns[x];
                if (!(deckColumn instanceof Deck)) {
                    continue;
                }
                deckColumn.topButtons[3].startDeckPickMode();
            }
        }
        else {
            for (var _c = 0, decks_7 = decks; _c < decks_7.length; _c++) {
                var x = decks_7[_c];
                var deckColumn_1 = XoneK2.controllers[channel].columns[x];
                if (!(deckColumn_1 instanceof Deck)) {
                    continue;
                }
                deckColumn_1.topButtons[3].stopDeckPickMode();
            }
            if (XoneK2.controllers[channel].deckPicked === true) {
                XoneK2.controllers[channel].deckPicked = false;
            }
            else {
                engine.setValue("[Library]", "GoToItem", 1);
            }
        }
    };
    XoneK2.decksBottomRightEncoder = function (channel, control, value, status) {
        var fxEditMode = XoneK2.controllers[channel].fxEditMode;
        if (fxEditMode.length > 0) {
            for (var _i = 0, fxEditMode_2 = fxEditMode; _i < fxEditMode_2.length; _i++) {
                var _a = fxEditMode_2[_i], unit = _a.unit, index = _a.index;
                var group = "[EffectRack1_EffectUnit".concat(unit, "_Effect").concat(index, "]");
                var direction = value === 1 ? 1 : -1;
                var p1 = engine.getParameter(group, "meta");
                engine.setParameter(group, "meta", p1 + 0.1 * direction);
            }
        }
        else if (!XoneK2.controllers[channel].isShifted) {
            if (value === 1) {
                engine.setValue("[Library]", "MoveDown", 1);
            }
            else {
                engine.setValue("[Library]", "MoveUp", 1);
            }
        }
        else {
            var direction = value === 1 ? 1 : -1;
            TrueBeatAdjust(1, direction);
            TrueBeatAdjust(2, direction);
            TrueBeatAdjust(3, direction);
            TrueBeatAdjust(4, direction);
        }
    };
})(XoneK2 || (XoneK2 = {}));
