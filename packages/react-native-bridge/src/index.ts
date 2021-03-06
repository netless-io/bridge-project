import WebView from 'react-native-webview';
import { RNCommon } from '@netless/webview-bridge';
import uuid from "react-native-uuid";

export class Bridge {
    private webview: WebView | undefined = undefined;
    private methods: Map<string, any> = new Map();
    private queue: Map<string | number[], any> = new Map();
    private isReady = false;
    private pendingAction: any[] = [];

    public bind(webview: WebView) {
        this.webview = webview;
    }

    public ready() {
        this.isReady = this.webview != undefined;
        if (!this.isReady) {
            return;
        }
        this.pendingAction.forEach(action => {
            action();
        });
    }

    public destroy() {
        if (this.isReady) {
            this.pendingAction = [];
        }
        this.isReady = false;
    }

    public call(method: string, ...args: any) {
        if (!this.isReady) {
            this.pendingAction.push(() => {
                this.call(method, ...args);
            });
            return;
        }
        const actionId = uuid.v4();
        const message = RNCommon.bridgeMessageTemplate(RNCommon.BridgeEventType.req, `${actionId}`, method, args);
        this.queue.set(actionId, { ack: false });
        this.webview!.postMessage(message);
        return actionId;
    }

    public callAsync(method: string, ...args: any): Promise<any> {
        if (!this.isReady) {
            return new Promise((resolve, reject) => {
                this.pendingAction.push(() => {
                    this.callAsync(method, ...args).then(resolve, reject);
                });
            });
        };
        return new Promise((resolve, reject) => {
            const actionId = uuid.v4();
            const message = RNCommon.bridgeMessageTemplate(RNCommon.BridgeEventType.req, `${actionId}`, method, args);
            this.queue.set(actionId, { ack: false, resolve: resolve, reject: reject });
            this.webview!.postMessage(message);
        });
    }


    public register(name: string, fun: any) {
        this.methods.set(name, fun);
    }

    public recv(protocol: string) {
        if (typeof protocol === 'string') {
            const { type, actionId, method, payload } = RNCommon.parseBridgeMessage(protocol);
            switch (type) {
                case RNCommon.BridgeEventType.ack:
                    if (this.queue.has(actionId)) {
                        const q = this.queue.get(actionId);
                        q.ack = true;
                        const ackPayload = payload as RNCommon.BridgeAckPayload;
                        if (q.resolve) {
                            if (method === RNCommon.ackTypeError) {
                                q.reject(payload);
                            } else {
                                q.resolve(ackPayload.data);
                            }
                            if (ackPayload.complete) {
                                this.queue.delete(actionId);
                            }
                        } else {
                            q.ret = method;
                            this.queue.set(actionId, q);
                        }
                    }
                    break;
                case RNCommon.BridgeEventType.evt:
                    if (this.methods.has(method)) {
                        let fun = this.methods.get(method);
                        let thisObj = this.methods;
                        if (!fun) {
                            const names = method.split(".")
                            if (names.length < 2) {
                                console.log(`method ${method} not found`);
                                return;
                            }
                            const namespaceMethod = names.pop();
                            const namespace = names.join(".");
                            if (this.methods.has(namespace)) {
                                thisObj = this.methods.get(namespace);
                                fun = this.methods.get(namespace)[namespaceMethod!];
                            } else {
                                console.log(`namespace ${namespace} not found`);
                                return;
                            }
                        }
                        try {
                            const ret: RNCommon.BridgeAckPayload = {
                                data: undefined,
                                actionId: actionId,
                                complete: true
                            }
                            ret.data = fun.call(thisObj, payload);
                            const protocolForAck = RNCommon.bridgeMessageTemplate(RNCommon.BridgeEventType.ack, actionId, RNCommon.ackTypeSuccess, ret);
                            this.webview!.postMessage(protocolForAck);
                        } catch (e) {
                            const protocolForAck = RNCommon.bridgeMessageTemplate(RNCommon.BridgeEventType.ack, actionId, RNCommon.ackTypeError, e);
                            this.webview!.postMessage(protocolForAck);
                        }
                    }
                    break;
            }
        }
    }
}
