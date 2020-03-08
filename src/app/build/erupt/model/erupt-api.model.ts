/**
 * Created by liyuepeng on 11/1/18.
 */
export interface EruptApiModel {
    status: Status;
    success: boolean;
    message: string;
    data: any;
    errorIntercept: boolean;
    promptWay: PromptWay;
}

export enum PromptWay {
    DIALOG = "DIALOG",
    MESSAGE = "MESSAGE",
    NOTIFY = "NOTIFY"
}

export enum Status {
    INFO = "INFO",
    SUCCESS = "SUCCESS",
    WARNING = "WARNING",
    ERROR = "ERROR",
}
