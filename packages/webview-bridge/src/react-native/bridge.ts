import {v4 as uuid} from 'uuid';
import {bridgeMessageTemplate, BridgeEventType, BridgeAckPayload, parseBridgeMessage, ackTypeSuccess, ackTypeError} from "./common";

interface ReactNativeWebView {
    postMessage(message: string): void;
}
declare global {
    interface Window {
        // React Native WebView 中，会嵌入的对象
        ReactNativeWebView?: ReactNativeWebView;
    }
}

type storageType = {ack: boolean, method: string, resolve: (data: any) => void, reject: (e: any) => void, callback: any };

export class Bridge {
    methods: Map<string, any> = new Map();
    asyncMethods: Map<string, any> = new Map();
    queue: Map<string|number[], storageType> = new Map();
    private verbose = false;

    public constructor() {
        // https://github.com/react-native-webview/react-native-webview/issues/1688#issuecomment-735434550
        if (this.isAndroid()) {
            document.addEventListener("message", this.listen);
        } else {
            window.addEventListener("message", this.listen);
        }
    }

    public enableLog() {
        this.verbose = true;
    }

    public destroy() {
        window.removeEventListener("message", this.listen);
        document.addEventListener("message", this.listen);
    }

    private isAndroid = () => {
        return /android/i.test(navigator.userAgent) || /android/i.test(`${(window as any).__platform}`);
    }

    private listen = (e: any) => {
        this.recv(e.data);
    }

    public call(method: string, args: any, callback: any): Promise<any> {
        return new Promise((resolve, reject) => {
            const actionId = uuid();
            const message = bridgeMessageTemplate(BridgeEventType.evt, actionId, method, args);
            this.queue.set(actionId, { ack: false, resolve: resolve, reject: reject, method, callback });
            window.ReactNativeWebView!.postMessage(message); 
        });
    }

    public register(name: string, fun: any) {
        this.methods.set(name, fun);
    }

    public registerAsyn(name: string, fun: any) {
        this.asyncMethods.set(name, fun);
    }

    private recv(protocol: string) {
        if (typeof protocol == "string") {
            const {type, actionId, method, payload} = parseBridgeMessage(protocol);
            this.verbose && console.log({type, actionId, method, payload});
            switch (type) {
                case BridgeEventType.req:
                {
                    const ret: BridgeAckPayload = {
                        data: undefined,
                        actionId: actionId,
                        complete: true
                    }
                    const call = function (f: any, ob: any) {
                        try {
                            ret.data = f.apply(ob, payload);
                            const ackMessage =  bridgeMessageTemplate(BridgeEventType.ack, actionId, ackTypeSuccess, ret);
                            window.ReactNativeWebView!.postMessage(ackMessage);
                        } catch (e) {
                            const ackMessage = bridgeMessageTemplate(BridgeEventType.ack, actionId, ackTypeError, e);
                            window.ReactNativeWebView!.postMessage(ackMessage);
                        }
                    }
                    const callWithProgressCallback = function (f: any, ob: any) {
                        payload.push(function (data: any, complete: boolean) {
                            ret.data = data;
                            ret.complete = complete!==false;
                            let ackMessage = "";
                            // TODO: 此处逻辑与 whiteboard-bridge 耦合，暂时先这样。
                            if (ret.data.__error || ret.data.error) {
                                ackMessage =  bridgeMessageTemplate(BridgeEventType.ack, actionId, ackTypeError, ret.data);
                            } else {
                                ackMessage =  bridgeMessageTemplate(BridgeEventType.ack, actionId, ackTypeSuccess, ret);
                            }
                            window.ReactNativeWebView!.postMessage(ackMessage);

                        })
                        try {
                            f.apply(ob, payload);
                        } catch (e) {
                            const ackMessage = bridgeMessageTemplate(BridgeEventType.ack, actionId, ackTypeError, e);
                            window.ReactNativeWebView!.postMessage(ackMessage);
                        }
                    }
                    const fun = this.methods.get(method);
                    const funWithProgressCallback = this.asyncMethods.get(method);
                    if (fun) {
                        call(fun, this.methods);
                    } else if (funWithProgressCallback) {
                        callWithProgressCallback(funWithProgressCallback, this.asyncMethods);
                    } else {
                        const names = method.split(".")
                        if (names.length < 2) {
                            return;
                        }
                        const namespaceMethod = names.pop();
                        const namespace = names.join(".");
                        const namespaceObj = this.methods.get(namespace);
                        if (namespaceObj) {
                            const fun = namespaceObj[namespaceMethod!];
                            if (fun && typeof fun === "function") {
                                call(fun, namespaceObj);
                                return;
                            }
                        }
                        const progressNamespaceObj = this.asyncMethods.get(namespace);
                        if (progressNamespaceObj) {
                            const fun = progressNamespaceObj[namespaceMethod!];
                            if (fun && typeof fun === "function") {
                                callWithProgressCallback(fun, progressNamespaceObj);
                                return;
                            }
                        }
                        console.log(`method ${method} not found`);
                    }
                    break;
                }    
                case BridgeEventType.ack:
                {
                    const ackPayload = payload as BridgeAckPayload;
                    if (this.queue.has(actionId)) {
                        const q = this.queue.get(actionId)!;
                        q.ack = true;
                        if (method === ackTypeError) {
                            q.reject(payload);
                        } else {
                            q.resolve(ackPayload.data);
                            // callback 是兼容 dsbridge API，await 模式更好一些。
                            q.callback(ackPayload.data);
                        }
                        if (ackPayload.complete) {
                            this.queue.delete(actionId);
                        }
                    }
                    break;
                }
            }
        }
    }
}

export const bridge = new Bridge();