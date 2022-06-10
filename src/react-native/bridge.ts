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

export class Bridge {
    methods: Map<string, any> = new Map();
    asyncMethods: Map<string, any> = new Map();
    queue: Map<string|number[], any> = new Map();

    public call(method: string, ...args: any): Promise<any> {
        return new Promise((resolve, reject) => {
            const actionId = uuid();
            const message = bridgeMessageTemplate(BridgeEventType.evt, method, actionId, args);
            this.queue.set(actionId, { ack: false, resolve: resolve, reject: reject, method });
            window.ReactNativeWebView!.postMessage(message); 
        });
    }

    public register(name: string, fun: any) {
        this.methods.set(name, fun);
    }

    public registerAsyn(name: string, fun: any) {
        this.asyncMethods.set(name, fun);
    }

    public recv(protocol: string) {
        if (typeof protocol == "string") {
            const {type, actionId, method, payload} = parseBridgeMessage(protocol);
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
                        })
                        try {
                            f.apply(ob, payload);
                            const ackMessage =  bridgeMessageTemplate(BridgeEventType.ack, actionId, ackTypeSuccess, ret);
                            window.ReactNativeWebView!.postMessage(ackMessage);
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
                    }
                    break;
                }    
                case BridgeEventType.ack:
                {
                    const ackPayload = payload as BridgeAckPayload;
                    if (this.queue.has(actionId)) {
                        const q = this.queue.get(actionId);
                        q.ack = true;
                        if (method === ackTypeError) {
                            q.reject(payload);
                        } else {
                            q.resolve(ackPayload.data);
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
const bridge = new Bridge();
export default bridge;