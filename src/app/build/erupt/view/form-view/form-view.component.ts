import {Component, Inject, OnDestroy, OnInit, ViewChild} from "@angular/core";
import {ActivatedRoute} from "@angular/router";
import {Subscription} from "rxjs";
import {DataService} from "@shared/service/data.service";
import {DataHandlerService} from "../../service/data-handler.service";
import {EruptBuildModel} from "../../model/erupt-build.model";
import {Scene} from "../../model/erupt.enum";
import {EditTypeComponent} from "../../components/edit-type/edit-type.component";
import {I18NService} from "@core";
import {NzMessageService} from "ng-zorro-antd/message";
import {Status} from "../../model/erupt-api.model";
import {AppViewService} from "@shared/service/app-view.service";

@Component({
    standalone: false,
    selector: "erupt-form-view",
    templateUrl: "./form-view.component.html",
    styleUrls: ["./form-view.component.less"]
})
export class FormViewComponent implements OnInit, OnDestroy {

    eruptBuildModel: EruptBuildModel;
    eruptName: string;
    loading: boolean = false;
    saving: boolean = false;
    readonly Scene = Scene;

    @ViewChild("eruptEdit", {static: false}) eruptEditComponent: EditTypeComponent;

    private router$: Subscription;

    constructor(
        private route: ActivatedRoute,
        private dataService: DataService,
        private dataHandlerService: DataHandlerService,
        private appViewService: AppViewService,
        private i18n: I18NService,
        @Inject(NzMessageService) private msg: NzMessageService
    ) {
    }

    ngOnInit(): void {
        this.router$ = this.route.params.subscribe((params: any) => {
            this.eruptBuildModel = null;
            this.eruptName = params.name;
            this.loading = true;
            this.dataService.getEruptBuild(this.eruptName).subscribe(eb => {
                this.appViewService.setRouterViewDesc(eb.eruptModel.eruptJson.desc);
                this.dataHandlerService.initErupt(eb);
                this.eruptBuildModel = eb;
                this.loadFormData();
            });
        });
    }

    private loadFormData(): void {
        this.dataHandlerService.emptyEruptValue(this.eruptBuildModel);
        this.loading = true;
        this.dataService.getFormViewData(this.eruptName).subscribe(data => {
            if (data) {
                this.dataHandlerService.objectToEruptValue(data, this.eruptBuildModel);
            }
            setTimeout(() => {
                this.loading = false;
            }, 50);
        }, () => {
            this.loading = false;
        });
    }

    save(): void {
        if (this.loading) {
            this.msg.warning(this.i18n.fanyi('global.update.loading.hint'));
            return;
        }
        if (!this.eruptEditComponent.eruptEditValidate()) {
            return;
        }
        const data = this.dataHandlerService.eruptValueToObject(this.eruptBuildModel);
        this.saving = true;
        this.dataService.saveFormViewData(this.eruptName, data).subscribe(res => {
            this.saving = false;
            if (res) {
                if (res.status === Status.SUCCESS) {
                    this.msg.success(res.message || this.i18n.fanyi('global.update.success'));
                } else if (res.status === Status.ERROR) {
                    this.msg.error(res.message);
                } else if (res.status === Status.WARNING) {
                    this.msg.warning(res.message);
                } else {
                    this.msg.success(this.i18n.fanyi('global.update.success'));
                }
            } else {
                this.msg.success(this.i18n.fanyi('global.update.success'));
            }
        }, () => {
            this.saving = false;
        });
    }

    reset(): void {
        this.loadFormData();
    }

    ngOnDestroy(): void {
        this.router$.unsubscribe();
    }
}
