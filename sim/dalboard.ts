/// <reference path="../node_modules/pxt-core/built/pxtsim.d.ts"/>
/// <reference path="../node_modules/pxt-core/localtypings/pxtarget.d.ts"/>
/// <reference path="../built/common-sim.d.ts"/>

namespace pxsim {
    export module CPlayPinName {
        export let A0 = -1;
        export let A1 = -1;
        export let A2 = -1;
        export let A3 = -1;
        export let A4 = -1;
        export let A5 = -1;
        export let A6 = -1;
        export let A7 = -1;
        export let A8 = -1;
        export let A9 = -1;
        export let D4 = -1;
        export let D5 = -1;
        export let D6 = -1;
        export let D7 = -1;
        export let D8 = -1;
        export let D13 = -1;
        export let BUTTON_LEFT = -1;

        export function init() {
            let v = CPlayPinName as any
            for (let k of Object.keys(v)) {
                let key = getConfigKey("PIN_" + k)
                if (key != null) {
                    v[k] = getConfig(key)
                }
            }
        }
    }

    export class DalBoard extends CoreBoard implements
        AccelerometerBoard,
        AccelBoard,
        CommonBoard,
        LightBoard,
        LightSensorBoard,
        MusicBoard,
        DisplayBoard,
        SlideSwitchBoard,
        TemperatureBoard
        {
        // state & update logic for component services
        _neopixelState: pxt.Map<CommonNeoPixelState>;
        buttonState: CommonButtonState;
        slideSwitchState: SlideSwitchState;
        lightSensorState: AnalogSensorState;
        thermometerState: AnalogSensorState;
        thermometerUnitState: number;
        edgeConnectorState: EdgeConnectorState;
        accelerometerState: AccelerometerState;
        displayState: DisplayState;
        audioState: AudioState;
        lightBulbState: LightBulbState;
        accelState: AccelState;

        invertAccelerometerYAxis = true;

        view: SVGSVGElement;

        constructor() {
            super()

            CPlayPinName.init()

            this._neopixelState = {};
            this.bus.setNotify(DAL.DEVICE_ID_NOTIFY, DAL.DEVICE_ID_NOTIFY_ONE);

            // IDs do matter!
            this.buttonState = new CommonButtonState([
                new CommonButton(15), // left
                new CommonButton(45), // right
                new CommonButton(5), // up
                new CommonButton(26) // down
            ]);
            this.builtinParts["lightbulb"] = this.lightBulbState = new LightBulbState();
            this.builtinParts["display"] = this.displayState = new DisplayState(); 
            this.builtinParts["accelerometer"] = this.accelState = new AccelState(); 
            this.builtinParts["switch"] = this.slideSwitchState = new SlideSwitchState();
            this.builtinParts["audio"] = this.audioState = new AudioState();
            this.builtinParts["lightsensor"] = this.lightSensorState = new AnalogSensorState(DAL.DEVICE_ID_LIGHT_SENSOR, 0, 255);
            this.builtinParts["thermometer"] = this.thermometerState = new AnalogSensorState(DAL.DEVICE_ID_THERMOMETER, -5, 50);

            this.builtinParts["accelerometer"] = this.accelerometerState = new AccelerometerState(runtime);
            this.builtinParts["edgeconnector"] = this.edgeConnectorState = new EdgeConnectorState({
                pins: [
                    pxsim.CPlayPinName.A0,
                    pxsim.CPlayPinName.A1,
                    pxsim.CPlayPinName.A2,
                    pxsim.CPlayPinName.A3,
                    pxsim.CPlayPinName.A4,
                    pxsim.CPlayPinName.A5,
                    pxsim.CPlayPinName.A6,
                    pxsim.CPlayPinName.A7,
                    pxsim.CPlayPinName.A8,
                    pxsim.CPlayPinName.A9,
                    pxsim.CPlayPinName.D4,
                    pxsim.CPlayPinName.D5,
                    pxsim.CPlayPinName.D6,
                    pxsim.CPlayPinName.D7,
                    pxsim.CPlayPinName.D8,
                    pxsim.CPlayPinName.D13
                ]
            });
            this.builtinParts["microservo"] = this.edgeConnectorState;
            this.builtinVisuals["microservo"] = () => new visuals.MicroServoView();
            this.builtinPartVisuals["microservo"] = (xy: visuals.Coord) => visuals.mkMicroServoPart(xy);
        }

        receiveMessage(msg: SimulatorMessage) {
            if (!runtime || runtime.dead) return;

            switch (msg.type || "") {
                case "eventbus": {
                    let ev = <SimulatorEventBusMessage>msg;
                    this.bus.queue(ev.id, ev.eventid, ev.value);
                    break;
                }
                case "serial": {
                    let data = (<SimulatorSerialMessage>msg).data || "";
                    // TODO
                    break;
                }
            }
        }

        initAsync(msg: SimulatorRunMessage): Promise<void> {
            super.initAsync(msg);

            const options = (msg.options || {}) as pxt.RuntimeOptions;

            const boardDef = msg.boardDefinition;
            const cmpsList = msg.parts;
            const cmpDefs = msg.partDefinitions || {};
            const fnArgs = msg.fnArgs;

            const opts: visuals.BoardHostOpts = {
                state: this,
                boardDef: boardDef,
                partsList: cmpsList,
                partDefs: cmpDefs,
                fnArgs: fnArgs,
                maxWidth: "100%",
                maxHeight: "100%",
            };
            const viewHost = new visuals.BoardHost(pxsim.visuals.mkBoardView({
                visual: boardDef.visual
            }), opts);

            document.body.innerHTML = ""; // clear children
            document.body.appendChild(this.view = viewHost.getView() as SVGSVGElement);

            return Promise.resolve();
        }

        screenshot(): string {
            return svg.toDataUri(new XMLSerializer().serializeToString(this.view));
        }

        tryGetNeopixelState(pinId: number): CommonNeoPixelState {
            return this._neopixelState[pinId];
        }

        neopixelState(pinId: number): CommonNeoPixelState {
            let state = this._neopixelState[pinId];
            if (!state) state = this._neopixelState[pinId] = new CommonNeoPixelState();
            return state;
        }

        defaultNeopixelPin() {
            return this.edgeConnectorState.getPin(CPlayPinName.D8);
        }

        getDefaultPitchPin() {
            return this.edgeConnectorState.getPin(CPlayPinName.D6);
        }
    }

    export function initRuntimeWithDalBoard() {
        U.assert(!runtime.board);
        let b = new DalBoard();
        runtime.board = b;
        runtime.postError = (e) => {
            // TODO
            runtime.updateDisplay();
        }
    }

    if (!pxsim.initCurrentRuntime) {
        pxsim.initCurrentRuntime = initRuntimeWithDalBoard;
    }
}