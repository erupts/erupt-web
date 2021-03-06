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
    NOTIFY = "NOTIFY",
    NONE = "NONE"
}

export enum Status {
    INFO = "INFO",
    SUCCESS = "SUCCESS",
    WARNING = "WARNING",
    ERROR = "ERROR",
}
