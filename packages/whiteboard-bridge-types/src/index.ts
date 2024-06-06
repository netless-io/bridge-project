
import {
    WhiteWebSdkConfiguration, 
    ReplayRoomParams, 
    JoinRoomParams, 
    CameraBound, 
    RoomState,
    MemberState,
    ApplianceNames, 
    ShapeType,
    PlayerState,
    DisplayerState,
    ViewMode as VM
    } from "white-web-sdk";
import {BaseTypeKey, Writable, NumberType} from "./generic";
import { MountParams, PageState } from "@netless/window-manager";
import { TeleBoxState } from "@netless/telebox-insider";

export type { 
    BroadcastState, 
    GlobalState, 
    ImageInformation, 
    RoomPhase, 
    SceneDefinition, 
    SceneState, 
    WhiteScene, 
    MediaType,
    PlayerPhase,
    PlayerState,
    PlayerSeekingResult,
    ObserverMode } from "white-web-sdk";
export type { AddPageParams } from "@netless/window-manager";
export type { BaseTypeKey, Writable, NumberType } from "./generic";
export type { TeleBoxState, TeleBoxColorScheme } from "@netless/telebox-insider";

// 插件注册信息
export type PluginParams = {
    // 注册的插件名称。
    name: string;
    // 注册插件，在 window 的变量名。
    variable: string;
    // 插件的配置参数。
    params: {[key: string]: any};
}

// 插件上下文配置，对应插件会在本地获取到这部分 context（非全局，常常用来配置权限，以及 log）
export type PluginContext = {
    // 需要注册上下文配置信息的插件名称
    name: string;
    params: {[key: string]: any};
}

// window manager 中 RegisterParams 的子集
export type AppRegisterParams = {
    // 注册的 app 名称
    kind: string;
    // 直接提供js代码
    javascriptString?: string;
    // 挂载在 window 上的变量名。
    variable?: string;
    // js 插件部署的网址
    url?: string;
    // 初始化 app 实例时，会被传入的参数。这段配置不会被同步其他端，属于本地设置。常常用来设置 debug 的开关。
    appOptions?: {
        [key: string]: any;
    };
};

// window manager 中 删除page的参数
export type RemovePageParams = {
    index?: number
}

export type NativeSDKConfig = {
    /** enableImgErrorCallback */
    enableImgErrorCallback?: boolean;
    /** 开启图片拦截功能 */
    enableInterrupterAPI?: boolean;
    /** 是否开启 debug 模式，打印命令输出 */
    log?: boolean;
    /** 是否显示用户头像 */
    userCursor?: boolean;
    /** 路线备用，在 web-sdk 启用多域名之前的临时补充方案 */
    routeBackup?: boolean;
    enableIFramePlugin?: boolean;
    /** Enable Agora RTC audio mixing. Conflict with enableRtcAudioEffectIntercept. */
    enableRtcIntercept?: boolean;
    /** Enable Agora RTC audio effect. Conflict with enableRtcIntercept. */
    enableRtcAudioEffectIntercept?: boolean;
    enableSyncedStore?: boolean;
    /** Enable @netless/appliance-plugin */
    enableAppliancePlugin?: boolean;
    __nativeTags?: any;
    /** native 预热结果，web sdk 升级至 2.8.0 后，该功能不再需要主动测一遍。保留该字段，是为了兼容，以及抽离选项 */
    initializeOriginsStates?: any;
    __platform: "ios" | "android" | "bridge" | "rn";
    __netlessUA?: [string];
    /** 多窗口在初始化的时候，需要配置 useMobxState 为 true，所以在初始化 sdk 的时候，就需要知道参数 */
    useMultiViews?: boolean;
    enableSlideInterrupterAPI?: boolean;
    slideAppOptions?: NativeSlideAppOptions;
} & WhiteWebSdkConfiguration;

// Android 使用 enum 名称，请勿随意改动
export enum ScaleMode  {
    Scale,
    AspectFit,
    AspectFitScale,
    AspectFitSpace,
    AspectFill,
    AspectFillScale,
}

export type ScaleModeKey = keyof typeof ScaleMode;

export type ContentModeType = {
    mode: ScaleMode | ScaleModeKey;
    scale?: number;
    space?: number;
};

type NumberCameraBound = NumberType<CameraBound>;
/** 移除掉方法参数，使用自定义类替换 */
export type NativeCameraBound = NumberCameraBound & {
    maxContentMode?: ContentModeType;
    minContentMode?: ContentModeType;
};

type BaseTypeRoomParams = BaseTypeKey<JoinRoomParams>;
export type NativeJoinRoomParams = BaseTypeRoomParams & {
    cameraBound?: NativeCameraBound;
    timeout?: number;
    windowParams?: Omit<Omit<MountParams, 'room'>, 'container'>;
    userPayload?: {[key in string]: any};
    nativeWebSocket?: boolean;
    // 在房间没有写权限时，如果主动调用了写操作，此时 时候需要抛出异常。
    // 若设置为 true， error 回调会出现在 onThrowError 中。
    enableRejectReadonlyError?: boolean;
};

type BaseTypeReplayParams = Writable<BaseTypeKey<ReplayRoomParams>>;
export type NativeReplayParams = BaseTypeReplayParams & {
    cameraBound?: NativeCameraBound;
    step?: number;
    mediaURL?: string;
    windowParams?: MountParams;
};

export type ViewMode = `${VM}`;
export type Appliance = `${ApplianceNames}`;
export type ApplianceShape = `${ShapeType}`;
export type RoomMemberState = Omit<Omit<MemberState, 'currentApplianceName'>, 'shapeType'> & {
    currentApplianceName: Appliance,
    shapeType: ApplianceShape
}

export type WhiteRoomState = RoomState & {
    windowBoxState: TeleBoxState,
    pageState: PageState
}

export type EventEntry = {
    eventName: string;
    payload: any;
};

export type PlayerTimeInfo = {
    scheduleTime: number;
    timeDuration: number;
    framesCount: number;
    beginTimestamp: number;
}

export type NativeDisplayerState = DisplayerState & {
    pageState: PageState;
    windowBoxState: TeleBoxState;
}

export type NativePlayerState = PlayerState & NativeDisplayerState;

export type NativeSlideAppOptions = {
    /** 是否开启 debug 模式，打印命令输出 */
    debug?: boolean;
    showRenderError?: boolean;
}   

export const pptNamespace = "ppt";
export const roomSyncNamespace = "room.sync";
export const roomNamespace = "room";
export const roomStateNamespace = "room.state";
export const sdkNameSpace = 'sdk';

export const playerNameSpace = "player";
export const playerStateNameSpace = "player.state";
