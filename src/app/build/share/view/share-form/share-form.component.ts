import {Component, Inject, OnDestroy, OnInit, ViewChild} from "@angular/core";
import {ActivatedRoute} from "@angular/router";
import {Subscription} from "rxjs";
import {NzMessageService} from "ng-zorro-antd/message";
import {DataService} from "@shared/service/data.service";
import {StatusService} from "@shared/service/status.service";
import {WindowModel} from "@shared/model/window.model";
import {I18NService} from "@core";
import {DataHandlerService} from "../../../erupt/service/data-handler.service";
import {EruptBuildModel} from "../../../erupt/model/erupt-build.model";
import {Scene} from "../../../erupt/model/erupt.enum";
import {EditTypeComponent} from "../../../erupt/components/edit-type/edit-type.component";

/**
 * The add form of one erupt, standing alone for a visitor who came through a share link.
 * Nothing but the form and a submit button: the session only allows adding, so there is
 * nothing else to offer. After a submit the visitor may fill another.
 */
@Component({
    standalone: false,
    selector: "erupt-share-form",
    templateUrl: "./share-form.component.html",
    styleUrls: ["./share-form.component.less"]
})
export class ShareFormComponent implements OnInit, OnDestroy {

    eruptBuildModel: EruptBuildModel | null = null;
    eruptName: string;
    loading = false;
    submitting = false;
    submitted = false;
    title = WindowModel.title;
    readonly Scene = Scene;

    @ViewChild("eruptEdit", {static: false}) eruptEditComponent: EditTypeComponent;

    private router$: Subscription;

    constructor(private route: ActivatedRoute,
                private dataService: DataService,
                private dataHandlerService: DataHandlerService,
                private statusService: StatusService,
                private i18n: I18NService,
                @Inject(NzMessageService) private msg: NzMessageService) {
    }

    ngOnInit(): void {
        this.statusService.isFillLayout = true;
        this.router$ = this.route.params.subscribe(params => {
            this.eruptName = params["erupt"];
            this.eruptBuildModel = null;
            this.submitted = false;
            this.loading = true;
            this.dataService.getEruptBuild(this.eruptName).subscribe({
                next: eb => {
                    this.dataHandlerService.initErupt(eb);
                    this.eruptBuildModel = eb;
                    this.blank();
                    this.loading = false;
                },
                error: () => this.loading = false
            });
        });
    }

    ngOnDestroy(): void {
        this.statusService.isFillLayout = false;
        this.router$?.unsubscribe();
    }

    submit(): void {
        if (this.submitting || !this.eruptBuildModel) return;
        if (!this.eruptEditComponent.eruptEditValidate()) return;
        this.submitting = true;
        this.dataService.addEruptData(this.eruptName, this.dataHandlerService.eruptValueToObject(this.eruptBuildModel)).subscribe({
            next: () => {
                this.submitting = false;
                this.submitted = true;
            },
            error: () => this.submitting = false
        });
    }

    another(): void {
        this.blank();
        this.submitted = false;
    }

    private blank(): void {
        if (this.eruptBuildModel) this.dataHandlerService.emptyEruptValue(this.eruptBuildModel);
    }
}
