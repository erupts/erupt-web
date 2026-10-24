import {Injectable} from '@angular/core';
import {_HttpClient} from '@delon/theme';
import {Observable} from 'rxjs';
import {RestPath} from '../erupt/model/erupt.enum';
import {EruptApiModel} from '../erupt/model/erupt-api.model';

export type Stage = 'DRAFT' | 'REVIEW' | 'QUEUED' | 'RUNNING' | 'VERIFYING' | 'ACCEPTANCE' | 'DELIVERED' | 'FAILED' | 'CANCELLED';

export interface DevProject {
    id: number;
    code: string;
    name: string;
    role: 'OWNER' | 'MAINTAINER' | 'REVIEWER' | 'MEMBER';
    repos: string[];
}

export interface DevRow {
    id: number;
    code: string;
    title: string;
    stage: Stage;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    progress: number;
    phase: string | null;
    repos: string[];
    verdict: string | null;
    statusMessage: string | null;
    createBy: string | null;
    reviewer: string | null;
    agent: string | null;
    createTime: string;
    updateTime: string;
    // created by the current user / waiting for the current user's review
    mine: boolean;
    toReview: boolean;
    // avatar paths as stored, null when the user has none
    createByAvatar: string | null;
    reviewerAvatar: string | null;
    // model id the executor was given, null for its default
    model: string | null;
    // executor code (claude, codex…) and the icon configured for it
    executor: string;
    executorIcon: string | null;
    // the latest delivery of each repository, by alias; empty until delivered
    deliveries: { [alias: string]: { status: DevDelivery['status'], branch: string, message: string | null } };
}

export interface DevSession {
    id: number;
    role: 'DEVELOPER' | 'QA';
    agentName: string;
    executor: string;
    status: 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'STOPPED';
    summary: string | null;
    costUsd: number | null;
    tokens: number | null;
    startedAt: string;
    endedAt: string | null;
}

export interface DevDelivery {
    repoAlias: string;
    branch: string;
    commitSha: string | null;
    status: 'PENDING' | 'PUSHED' | 'SKIPPED' | 'CONFLICT' | 'REJECTED' | 'FAILED';
    message: string | null;
    deliveredAt: string;
}

export interface DevDetail {
    requirement: DevRow;
    description: string | null;
    projectId: number;
    projectName: string;
    qaAgent: string | null;
    sessions: DevSession[];
    deliveries: DevDelivery[];
    canReview: boolean;
    // approve / reject: a reviewer, and not the creator unless the project allows self review
    canApprove: boolean;
    executorEnabled: boolean;
    // every approval and rejection, newest first
    reviews: DevReview[];
}

export interface DevReview {
    decision: 'APPROVED' | 'REJECTED';
    comment: string | null;
    reviewer: string | null;
    reviewerAvatar: string | null;
    reviewedAt: string;
}

/** One repository of a requirement's workspace on the server; path only for super admins. */
export interface DevWorkspace {
    alias: string;
    branch: string;
    base: string;
    exists: boolean;
    ahead: number;
    changed: number;
    path: string | null;
}

export interface DevEvent {
    seq: number;
    kind: 'SYSTEM' | 'TEXT' | 'TOOL' | 'TOOL_RESULT' | 'RESULT' | 'ERROR';
    name: string | null;
    content: string | null;
    time: string;
}

export interface DevRepoDiff {
    alias: string;
    base: string;
    branch: string;
    files: string[];
    patch: string;
    truncated: boolean;
}

/** The read side of the requirement pool; writes go through the DevRequirement model's own API. */
@Injectable({providedIn: 'root'})
export class AiDevService {

    static readonly base = RestPath.erupt + '/ai-dev';

    // the model, its scope and the menu the page lives under, as erupt-ai-dev declares them
    static readonly erupt = 'DevRequirement';
    static readonly scope = 'DevProjectScope';
    static readonly page = '/ai-dev/pool';

    constructor(private _http: _HttpClient) {
    }

    projects(): Observable<EruptApiModel> {
        return this._http.get<EruptApiModel>(AiDevService.base + '/pool/projects');
    }

    // the coding CLIs installed on the server and the one a new requirement starts with
    executors(project: number): Observable<EruptApiModel> {
        return this._http.get<EruptApiModel>(AiDevService.base + '/pool/executors', {project});
    }

    workspace(id: number): Observable<EruptApiModel> {
        return this._http.get<EruptApiModel>(AiDevService.base + '/pool/requirement/' + id + '/workspace');
    }

    requirements(project: number): Observable<EruptApiModel> {
        return this._http.get<EruptApiModel>(AiDevService.base + '/pool/requirements', {project});
    }

    requirement(id: number): Observable<EruptApiModel> {
        return this._http.get<EruptApiModel>(AiDevService.base + '/pool/requirement/' + id);
    }

    diff(id: number): Observable<EruptApiModel> {
        return this._http.get<EruptApiModel>(AiDevService.base + '/pool/requirement/' + id + '/diff');
    }

    events(session: number, after: number): Observable<{ status: DevSession['status'], events: DevEvent[] }> {
        return this._http.get(AiDevService.base + '/session/' + session + '/events', {after});
    }

}
