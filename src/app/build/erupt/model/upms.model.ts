import {KV} from "./util.model";

export enum UpmsScope {

    ORG = "ORG",
    USER = "USER",
    ROLE = "ROLE",
    POST = "POST"

}

export class UpmsData {

    users: KV<number, string>[] = [];

    posts: KV<number, string>[] = [];

    roles: KV<number, string>[] = [];

    orgs: KV<number, string>[] = [];

}
