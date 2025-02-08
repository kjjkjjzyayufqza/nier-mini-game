import { EventEmitter } from "events";

export interface GamepadState {
  buttons: Record<string, boolean>; // 当前按下的按钮状态
  axes: Record<string, number>; // 当前摇杆的轴状态
  connected: boolean; // 是否连接
  id?: string; // 手柄的 ID
  type?: string; // 手柄的类型 xbox 或者 dualsense
}

export class GamepadManager extends EventEmitter {
  private gamepadState: GamepadState;
  private vibrationSupported: boolean;
  private isIdle: boolean;
  private lastActiveTime: number;
  private idleTimeout: number;
  private deadZoneThreshold: number;
  private animationFrameId: number | null;

  private xboxButtonMapping = [
    "A",
    "B",
    "X",
    "Y",
    "LB",
    "RB",
    "LT",
    "RT",
    "Back",
    "Start",
    "Left Stick",
    "Right Stick",
    "D-Pad Up",
    "D-Pad Down",
    "D-Pad Left",
    "D-Pad Right",
    "Xbox",
  ];

  private playstationButtonMapping = [
    "Cross", // 对应 A
    "Circle", // 对应 B
    "Square", // 对应 X
    "Triangle", // 对应 Y
    "L1", // 对应 LB
    "R1", // 对应 RB
    "L2", // 对应 LT
    "R2", // 对应 RT
    "Share", // 对应 Back
    "Options", // 对应 Start
    "Left Stick", // 左摇杆按下
    "Right Stick", // 右摇杆按下
    "D-Pad Up",
    "D-Pad Down",
    "D-Pad Left",
    "D-Pad Right",
    "PS", // PlayStation 按钮
  ];

  private xboxAxisMapping = [
    "Left Stick Horizontal",
    "Left Stick Vertical",
    "Right Stick Horizontal",
    "Right Stick Vertical",
  ];

  private playstationAxisMapping = [
    "Left Stick Horizontal",
    "Left Stick Vertical",
    "Right Stick Horizontal",
    "Right Stick Vertical",
  ];

  private buttonMapping: string[] = this.xboxButtonMapping; // 默认使用 Xbox 映射
  private axisMapping: string[] = this.xboxAxisMapping; // 默认使用 Xbox 映射

  constructor(deadZoneThreshold = 0.3, idleTimeout = 3000) {
    super();

    this.gamepadState = {
      buttons: {},
      axes: {},
      connected: false,
    };

    this.vibrationSupported = false;
    this.isIdle = false;
    this.lastActiveTime = Date.now();
    this.deadZoneThreshold = deadZoneThreshold;
    this.idleTimeout = idleTimeout;
    this.animationFrameId = null;

    this.handleGamepadConnected = this.handleGamepadConnected.bind(this);
    this.handleGamepadDisconnected = this.handleGamepadDisconnected.bind(this);
    this.updateGamepadState = this.updateGamepadState.bind(this);

    if (typeof window !== "undefined") {
      window.addEventListener("gamepadconnected", this.handleGamepadConnected);
      window.addEventListener(
        "gamepaddisconnected",
        this.handleGamepadDisconnected
      );
      this.startPolling();
    }
  }

  private detectGamepadType(gamepad: Gamepad): "dualsense" | "xbox" {
    const id = gamepad.id.toLowerCase();
    console.log(id);
    if (id.includes("dualsense")) {
      return "dualsense";
    } else {
      return "xbox";
    }
  }

  private handleGamepadConnected(event: GamepadEvent) {
    const gamepad = event.gamepad;
    const type = this.detectGamepadType(gamepad);

    // 根据手柄类型设置映射
    if (type === "dualsense") {
      this.buttonMapping = this.playstationButtonMapping;
      this.axisMapping = this.playstationAxisMapping;
    } else if (type === "xbox") {
      this.buttonMapping = this.xboxButtonMapping;
      this.axisMapping = this.xboxAxisMapping;
    }

    if (
      gamepad.vibrationActuator &&
      typeof gamepad.vibrationActuator.playEffect === "function"
    ) {
      this.vibrationSupported = true;
    } else {
      this.vibrationSupported = false;
    }

    this.gamepadState = {
      buttons: this.processButtons(gamepad.buttons as any),
      axes: this.processAxes(gamepad.axes as any),
      connected: true,
      id: gamepad.id,
      type,
    };

    this.lastActiveTime = Date.now();
    this.isIdle = false;

    this.emit("connected", this.gamepadState);
  }

  private handleGamepadDisconnected(event: GamepadEvent) {
    this.gamepadState = {
      ...this.gamepadState,
      connected: false,
      id: undefined,
    };

    this.vibrationSupported = false;
    this.isIdle = false;

    this.emit("disconnected", this.gamepadState);
  }

  private processButtons(buttons: GamepadButton[]): Record<string, boolean> {
    return buttons.reduce((acc, button, index) => {
      const buttonName = this.buttonMapping[index] || `Button ${index}`;
      acc[buttonName] = button.pressed;
      return acc;
    }, {} as Record<string, boolean>);
  }

  private processAxes(axes: number[]): Record<string, number> {
    const processedAxes: Record<string, number> = {};

    // 遍历每对轴（例如左摇杆的水平和垂直轴）
    for (let i = 0; i < axes.length; i += 2) {
      const horizontalAxis = axes[i]; // 水平轴
      const verticalAxis = axes[i + 1]; // 垂直轴

      // 如果当前轴对在映射范围内
      if (i / 2 < this.axisMapping.length / 2) {
        const axisNameHorizontal = this.axisMapping[i];
        const axisNameVertical = this.axisMapping[i + 1];

        // 矢量化处理
        const vector = this.applyDeadZoneToVector(
          horizontalAxis,
          verticalAxis,
          this.deadZoneThreshold
        );

        // 归一化后的值
        processedAxes[axisNameHorizontal] = vector.x;
        processedAxes[axisNameVertical] = vector.y;
      }
    }

    return processedAxes;
  }

  private applyDeadZoneToVector(
    x: number,
    y: number,
    threshold: number
  ): { x: number; y: number } {
    // 新增步骤：将输入限制在单位圆内
    let magnitude = Math.sqrt(x * x + y * y);
    if (magnitude > 1) {
      const scale = 1 / magnitude;
      x *= scale;
      y *= scale;
      magnitude = 1;
    }

    if (magnitude < threshold) {
      return { x: 0, y: 0 };
    }

    const normalizedX = x / magnitude;
    const normalizedY = y / magnitude;
    const scaledMagnitude = (magnitude - threshold) / (1 - threshold);

    return {
      x: normalizedX * scaledMagnitude,
      y: normalizedY * scaledMagnitude,
    };
  }

  private updateGamepadState() {
    const gamepads = navigator.getGamepads();
    if (!gamepads) return;

    //使用第一个不是null的手柄
    const gamepad = Array.from(gamepads).find((gamepad) => gamepad !== null);
    if (gamepad) {
      const newButtons = this.processButtons(gamepad.buttons as any);

      const newAxes = this.processAxes(gamepad.axes as any);
      const hasChanged =
        JSON.stringify(newButtons) !==
          JSON.stringify(this.gamepadState.buttons) ||
        JSON.stringify(newAxes) !== JSON.stringify(this.gamepadState.axes);

      if (hasChanged) {
        this.gamepadState = {
          ...this.gamepadState,
          buttons: newButtons,
          axes: newAxes,
        };

        this.lastActiveTime = Date.now();
        this.isIdle = false;

        this.emit("update", this.gamepadState);
      }
    }

    if (Date.now() - this.lastActiveTime > this.idleTimeout) {
      if (!this.isIdle) {
        this.isIdle = true;
        this.emit("idle", this.gamepadState);
      }
    }
  }

  private startPolling() {
    const poll = () => {
      this.updateGamepadState();
      this.animationFrameId = requestAnimationFrame(poll);
    };

    poll();
  }

  public stopPolling() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public vibrate(duration = 200, strongMagnitude = 1.0, weakMagnitude = 0.5) {
    const gamepads = navigator.getGamepads();
    const gamepad = Array.from(gamepads).find((gamepad) => gamepad !== null);
    if (gamepad?.vibrationActuator) {
      gamepad.vibrationActuator.playEffect("dual-rumble", {
        duration,
        strongMagnitude,
        weakMagnitude,
      });
    }
  }

  public getState() {
    return this.gamepadState;
  }

  public isConnected() {
    return this.gamepadState.connected;
  }

  public isVibrationSupported() {
    return this.vibrationSupported;
  }

  public isGamepadIdle() {
    return this.isIdle;
  }
}
