declare namespace components {
  type Control = string | null;

  type RewriteThisParameter<T, TThis> =
    T extends (...args: infer A) => infer R
    ? (this: TThis, ...args: A) => R
    : T

  type PartialPreservingThisParameter<T> = {
    [K in keyof T]?: RewriteThisParameter<T[K], T>;
  }

  interface Constructor<C, A extends any[] = []> {
    new <T = {}>(base?: PartialPreservingThisParameter<C & T> & T): C & T
    new(...args: A): C;
    prototype: C;
  }

  interface Component {
    group: string;
    inKey: string;
    outKey: string;
    isShifted: boolean;
    midi: number[];

    inValueScale(value: number): number;
    input(channel: number, control: Control, value: number, status: number, group?: string): void;
    outValueScale(value: number): number;
    output(value: number, group: string, control: Control): void;
    outConnect: boolean;
    outTrigger: boolean;

    max: number;

    inGetParameter(): number;
    inSetParameter(value: number): void;
    inGetValue(): number;
    inSetValue(value: number): void;
    inToggle(): void;
    outGetParameter(): number;
    outSetParameter(value: number): void;
    outGetValue(): number;
    outSetValue(value: number): void;
    outToggle(): void;

    connect(): void;
    disconnect(): void;
    trigger(): void;
    shift?(): void;
    unshift?(): void;
    shiftOffset: number;
    sendShifted: boolean;
    shiftChannel: boolean;
    shiftControl: boolean;
    send(value: number): void;
    shutdown(): void;
  }
  const Component: Constructor<Component>;

  interface Button extends Component {
    types: {
      push: 0, toggle: 1, powerWindow: 2
    };
    type: 0 | 1 | 2;
    on: 127;
    off: 0;
    longPressTimeout: number;
    isPress(channel: number, control: Control, value: number, status: number): boolean;
    outValueScale(value: number): 127 | 0;
  }
  const Button: Constructor<Button>;

  interface PlayButton extends Button { }
  const PlayButton: Constructor<PlayButton>;

  interface CueButton extends Button { }
  const CueButton: Constructor<CueButton>;

  interface SyncButton extends Button { }
  const SyncButton: Constructor<SyncButton>;

  interface LoopToggleButton extends Button { }
  const LoopToggleButton: Constructor<LoopToggleButton>;

  interface HotCueButton extends Button {
    number: number;
    outputColor(colorCode: number): void;
    sendRGB(colorObject: {}): void;
  }
  const HotCueButton: Constructor<HotCueButton>;

  interface SamplerButton extends Button {
    volumeByVelocity: number;
  }
  const SamplerButton: Constructor<SamplerButton>;

  interface EffectAssignmentButton extends Button { }
  const EffectAssignmentButton: Constructor<EffectAssignmentButton>;

  interface Pot extends Component {
    firstValueReceived: boolean;
    softTakeover: boolean;

    inputMSB: Component["input"];
    inputLSB: Component["input"];
  }
  const Pot: Constructor<Pot>;

  interface Encoder extends Component { }
  const Encoder: Constructor<Encoder>;

  interface ComponentContainer extends Component {
    shift: NonNullable<Component["shift"]>;

    unshift: NonNullable<Component["unshift"]>;

    forEachComponent(operation: (this: ComponentContainer, obj: Component) => void, recursive?: boolean): void;

    forEachComponentContainer(operation: (this: ComponentContainer, obj: ComponentContainer) => void, recursive?: boolean): void;

    reconnectComponents(operation: (this: ComponentContainer, obj: Component) => void, recursive?: boolean): void;

    applyLayer(newLayer: this, reconnectComponents?: boolean): void;
  }
  const ComponentContainer: Constructor<ComponentContainer>;

  interface Deck extends ComponentContainer {
    deckNumbers: number[];
    setCurrentDeck(newGroup: string): void;
    toggle(): void;
  }
  const Deck: Constructor<Deck, [number]>;
}
