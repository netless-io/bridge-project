import { v4 as uuid } from "uuid";
import type { JsonValue, CallFunction, AsyncCallFunction, SyncCallFunction, RegisterFunction, RegisterAsyncFunction, RegisterProcessFunction, JsNormalFunctionHandler, AsyncJsFunctionHandler, ProcessJsFunctionHandler, JsNormalFunction, AsyncJsFunction, ProcessJsFunction, AsyncPromiseFunction, AsyncCallbackFunction } from "./types";

export interface WebViewBridgeCall {
    call: CallFunction;
    asyncCall: AsyncCallFunction;
    syncCall: SyncCallFunction;
}

export interface WebViewRegister {
    register: RegisterFunction;
    registerAsync: RegisterAsyncFunction;
    registerProgress: RegisterProcessFunction;
}

type RegisterMap = {
    normal: {
        [key: string]: JsNormalFunctionHandler;
    },
    async: {
        [key: string]: AsyncJsFunctionHandler;
    },
    progress: {
        [key: string]: ProcessJsFunctionHandler;
    },
    [key: string]: {
        [key: string]: JsNormalFunctionHandler | AsyncJsFunctionHandler | ProcessJsFunctionHandler
    };
}

declare global {
    interface Window {
        // 利用 dsbridge native 版本时，android native 注入的字段
        _dsbridge?: any;
        webkit?: any;
        _handleMessageFromNative: any;
        // dsbridge 注入给 native 端，告知注册成功的标识
        _dsInit?: boolean;
    }
}

class WebViewBridge implements WebViewRegister, WebViewBridgeCall {
    public registerMap: RegisterMap = {
        normal: {},
        async: {},
        progress: {}
    }

    call(nativeMethod: string, parameter?: JsonValue): void {
        const arg = { data: parameter === undefined ? null : parameter };
        if (window._dsbridge) {
            window._dsbridge.call(nativeMethod, JSON.stringify(arg));
        } else if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.asyncBridge) {
            window.webkit.messageHandlers.asyncBridge.postMessage({
                method: nativeMethod,
                arg: JSON.stringify(arg),
            });
        }
    }

    asyncCall(nativeMethod: string, parameter?: JsonValue): Promise<JsonValue> {
        const arg = { data: parameter === undefined ? null : parameter };
        return new Promise<JsonValue>(resolve => {
            const callbackId = "asyncCall_" + uuid().replace(/-/g, "");
            (window as any)[callbackId] = (result: JsonValue) => {
                resolve(result);
            }

            (arg as any)[callbackField] = callbackId;
            if (window._dsbridge) {
                window._dsbridge.call(nativeMethod, JSON.stringify(arg));
            } else if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.asyncBridge) {
                window.webkit.messageHandlers.asyncBridge.postMessage({
                    method: nativeMethod,
                    arg: JSON.stringify(arg),
                });
            }
        });
    }

    syncCall(nativeMethod: string, parameter?: JsonValue): JsonValue {
        const arg = { data: parameter === undefined ? null : parameter };
        let ret = "";
        if (window._dsbridge) {
            // android 只能传递 string 之类的原始类型
            window._dsbridge.call(nativeMethod, JSON.stringify(parameter));
        } else {
            ret = prompt("_dsbridge=" + nativeMethod, JSON.stringify(arg)) || "";
        }
        try {
            return JSON.parse(ret || '{}').data;
        } catch (e) {
            return undefined;
        }
    }

    register(handlerName: string, handler: JsNormalFunctionHandler): void {
        this.postReady();
        this.registerMap.normal[handlerName] = handler;
    }

    registerAsync(handlerName: string, handler: AsyncJsFunctionHandler): void {
        this.postReady();
        this.registerMap.async[handlerName] = handler;
    }

    registerProgress(handlerName: string, handler: ProcessJsFunctionHandler): void {
        this.postReady();
        this.registerMap.progress[handlerName] = handler;
    }

    private postReady = () => {
        if (!window._dsInit) {
            window._dsInit = true;
            //notify native that js apis register successfully on next event loop
            setTimeout(function () {
                bridge.call("_dsb.dsinit");
            }, 0);
        }
    }

    private splitNativeMethod(method: string): [namespace: string, method: string] {
        const methods = method.split(".");
        const func = methods.pop()!;
        const namespace = methods.join(".");
        return [namespace, func];
    }

    private getFunction(handlerName: string): { type: string, function: JsNormalFunction | AsyncJsFunction | ProcessJsFunction, obj: any } | undefined {

        for (const key in this.registerMap) {
            if (Object.prototype.hasOwnProperty.call(this.registerMap, key)) {
                const element = this.registerMap[key];
                const funOrObj = element[handlerName];
                if (funOrObj && typeof funOrObj === "function") {
                    return { type: key, function: funOrObj, obj: undefined };
                }
                const [namespace, func] = this.splitNativeMethod(handlerName);
                const obj = (element[namespace] || {});
                if (typeof obj === "object" && typeof obj[func] === "function") {
                    return { type: key, function: obj[func], obj };
                }
            }
        }
        return undefined;
    }

    private structuredError(error: unknown): JsonValue {
        if (error instanceof Error) {
            return {
                name: error.name,
                message: error.message,
                stack: error.stack,
            };
        }
        return {
            name: "UnknownError",
            message: String(error),
            stack: "",
        };
    }

    handleMessageFromNative = (info: JsonValue) => {
        const { method, data, callbackId } = info as { method: string, data: string, callbackId: string };
        // dsBridge native 端将传入的参数（数组）转换成了 string，所以需要转换回来
        const args = JSON.parse(data) as [...JsonValue[]];
        const ret: ReturnType = {
            id: callbackId,
            complete: true,
            data: undefined,
            error: undefined,
        }

        const result = this.getFunction(method);
        if (!result) {
            return;
        }
        const { type, function: func, obj } = result;
        switch (type) {
            case "normal": {
                const normalFunc = func as JsNormalFunction;
                try {
                    ret.data = normalFunc.apply(obj, args);
                } catch (error) {
                    ret.error = this.structuredError(error);
                }
                this.call(returnFunction, ret);
                break;
            }
            case "async": {
                const asyncF = func as AsyncJsFunction;
                // check function is promise or not
                if ((asyncF as unknown as Promise<JsonValue>).then) {
                    const async1 = asyncF as AsyncPromiseFunction;
                    async1.apply(obj, args)
                        .then(r => {
                            ret.data = r;
                            this.call(returnFunction, ret);
                        })
                        .catch(e => {
                            ret.error = this.structuredError(e);
                            this.call(returnFunction, ret);
                        });
                } else {
                    const async1 = func as AsyncCallbackFunction;
                    const argsWithCallback = [...args, (r: JsonValue) => {
                        ret.data = r;
                        this.call(returnFunction, ret);
                    }] as [...JsonValue[], (r: JsonValue) => void];
                    try {
                        async1.apply(obj, argsWithCallback);
                    } catch (error) {
                        ret.error = this.structuredError(error);
                        this.call(returnFunction, ret);
                    }
                }
                break;
            }
            case "progress": {
                const processF = func as ProcessJsFunction;
                const argsWithProgress = [...args, (t: JsonValue, complete: boolean) => {
                    ret.data = t;
                    ret.complete = complete;
                    this.call(returnFunction, ret);
                }] as [...JsonValue[], (t: JsonValue, complete: boolean) => void];
                try {
                    processF.apply(obj, argsWithProgress);
                } catch (error) {
                    ret.error = this.structuredError(error);
                    this.call(returnFunction, ret);
                }
                break;
            }
        }
    }
}

const callbackField = "_dscbstub";
const returnFunction = "_dsb.returnValue";

type ReturnType = {
    id: string;
    complete: boolean;
    data: JsonValue | undefined;
    error: JsonValue | undefined;
}

export const bridge = new WebViewBridge();
window._handleMessageFromNative = bridge.handleMessageFromNative;