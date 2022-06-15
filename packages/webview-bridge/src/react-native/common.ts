
export enum BridgeEventType {
    // RN 主动发送的消息
    req = 'req',
    // bridge 主动发送的消息
    evt = 'evt',
    // 远端根据本地发送的请求，被动返回的消息
    ack = 'ack',
}

export type BridgeAckPayload = {
    data: any;
    actionId: string;
    complete: boolean;
}

export const ackTypeSuccess = "success";
export const ackTypeError = "error";
 
/**
 * 
 * @param type 事件类型
 * @param actionId action Id 事件唯一标识
 * @param method 方法名，当事件类型为 ack 时，该值为 @link ackTypeSuccess 时，表示成功 @link ackTypeError 时，payload 为错误信息。该字段为 bridge 与 rn 方面共享同步。
 * @param payload 数据信息
 * @returns 
 */
export function bridgeMessageTemplate(type: BridgeEventType, actionId: string, method: string, payload: any): string {
    return JSON.stringify({type, actionId, method, payload});
}

export function parseBridgeMessage(message: string): {type: BridgeEventType, actionId: string, method: string, payload: any} {
    const {type, actionId, method, payload} = JSON.parse(message);
    return {type: type as BridgeEventType, actionId, method, payload};
}