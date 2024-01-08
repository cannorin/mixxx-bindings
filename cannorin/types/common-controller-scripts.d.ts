declare function print(string: any): void;
declare function printObject(obj: any, maxdepth: any): void;
declare function stringifyObject(obj: any, maxdepth: any, checked: any, prefix: any): any;
declare function arrayContains(array: any, elem: any): boolean;
declare function secondstominutes(secs: any): string;
declare function msecondstominutes(msecs: any): string;
declare function colorCodeFromObject(color: any): number;
declare function colorCodeToObject(colorCode: any): {
    red: number;
    green: number;
    blue: number;
};
declare function script(): void;
declare namespace script {
    function debug(channel: any, control: any, value: any, status: any, group: any): void;
    function pitch(LSB: any, MSB: any, status: any): number | false;
    function absoluteSlider(group: any, key: any, value: any, low: any, high: any, min: any, max: any): void;
    function midiDebug(channel: any, control: any, value: any, status: any, group: any): void;
    function deckFromGroup(group: any): number;
    function bindConnections(group: any, controlsToFunctions: any, remove: any): void;
    function toggleControl(group: any, control: any): void;
    function triggerControl(group: any, control: any, delay: any): void;
    function absoluteLin(value: any, low: any, high: any, min: any, max: any): any;
    function absoluteLinInverse(value: any, low: any, high: any, min: any, max: any): any;
    function absoluteNonLin(value: any, low: any, mid: any, high: any, min: any, max: any): any;
    function absoluteNonLinInverse(value: any, low: any, mid: any, high: any, min: any, max: any): any;
    function crossfaderCurve(value: any, min: any, max: any): void;
    function posMod(a: any, m: any): number;
    function loopMove(group: any, direction: any, numberOfBeats: any): void;
    function midiPitch(LSB: any, MSB: any, status: any): number | false;
    function spinback(channel: any, control: any, value: any, status: any, group: any, factor: any, rate: any): void;
    function brake(channel: any, control: any, value: any, status: any, group: any, factor: any): void;
    function softStart(channel: any, control: any, value: any, status: any, group: any, factor: any): void;
    let samplerRegEx: RegExp;
    let channelRegEx: RegExp;
    let eqRegEx: RegExp;
    let quickEffectRegEx: RegExp;
    let effectUnitRegEx: RegExp;
    let individualEffectRegEx: RegExp;
}
declare function bpm(): void;
declare namespace bpm {
    let tapTime: number;
    let previousTapDelta: number;
    let tap: any[];
    function tapButton(deck: any): void;
}
