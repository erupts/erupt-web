import {Component, Input, OnInit} from '@angular/core';
import {DashboardDSL, FieldMapping, SubModelDSL} from '../../model/dashboard.model';
import {BaseField, CubeMeta} from '../../model/cube.model';
import {CubeApiService} from '../../service/cube-api.service';
import {VL} from '../../../erupt/model/erupt-field.model';
import {cloneDeep} from 'lodash';

@Component({
    selector: 'cube-puzzle-sub-model-config',
    templateUrl: './cube-puzzle-sub-model-config.html',
    styleUrls: ['./cube-puzzle-sub-model-config.less'],
    standalone: false
})
export class CubePuzzleSubModelConfig implements OnInit {

    @Input() cubeMeta: CubeMeta;
    @Input() dsl: DashboardDSL;

    subModels: SubModelDSL[] = [];
    cubesList: VL[] = [];
    exploresMap: { [cube: string]: VL[] } = {};
    subMetaMap: { [key: string]: CubeMeta } = {};

    searchKeyword = '';

    get filteredSubModels(): { item: SubModelDSL; origIndex: number }[] {
        const kw = this.searchKeyword.trim().toLowerCase();
        return this.subModels
            .map((item, origIndex) => ({item, origIndex}))
            .filter(({item}) =>
                !kw ||
                item.alias?.toLowerCase().includes(kw) ||
                this.getCubeLabel(item.cube)?.toLowerCase().includes(kw) ||
                this.getExploreLabel(item.cube, item.explore)?.toLowerCase().includes(kw)
            );
    }

    readonly NEW_IDX = -2;
    editingIndex: number = -1;
    editForm: SubModelDSL = null;
    editSubMeta: CubeMeta = null;
    loadingExplores = false;
    loadingMeta = false;

    constructor(private cubeApiService: CubeApiService) {
    }

    ngOnInit() {
        if (!this.dsl.subModels) this.dsl.subModels = [];
        this.subModels = this.dsl.subModels;
        this.cubeApiService.cubes().subscribe(res => {
            this.cubesList = res.data || [];
        });
    }

    onCubeChange(cube: string) {
        this.editForm.explore = null;
        this.editSubMeta = null;
        if (!cube) return;
        if (this.exploresMap[cube]) return;
        this.loadingExplores = true;
        this.cubeApiService.explores(cube).subscribe(res => {
            this.exploresMap[cube] = res.data || [];
            this.loadingExplores = false;
        });
    }

    onExploreChange() {
        this.editForm.fieldMappings = [];
        this.editSubMeta = null;
        this.loadSubMeta();
    }

    loadSubMeta() {
        if (!this.editForm?.cube || !this.editForm?.explore) return;
        const key = `${this.editForm.cube}/${this.editForm.explore}`;
        if (this.subMetaMap[key]) {
            this.editSubMeta = this.subMetaMap[key];
            return;
        }
        this.loadingMeta = true;
        this.cubeApiService.cubeMetadata(this.editForm.cube, this.editForm.explore).subscribe(res => {
            const meta = res.data;
            const fieldTitleMap = new Map<string, string>();
            const fieldMap = new Map<string, BaseField>();
            meta.dimensions?.forEach(it => {
                fieldTitleMap.set(it.code, it.title);
                fieldMap.set(it.code, it);
            });
            meta.measures?.forEach(it => {
                fieldTitleMap.set(it.code, it.title);
                fieldMap.set(it.code, it);
            });
            meta.parameters?.forEach(it => {
                fieldTitleMap.set(it.code, it.title);
                fieldMap.set(it.code, it);
            });
            meta.fieldTitleMap = fieldTitleMap;
            meta.fieldMap = fieldMap;
            this.subMetaMap[key] = meta;
            this.editSubMeta = meta;
            this.loadingMeta = false;
        });
    }

    private generateId(): string {
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
            return crypto.randomUUID();
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = Math.random() * 16 | 0;
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
    }

    addNew() {
        this.editingIndex = this.NEW_IDX;
        this.editForm = {id: this.generateId(), alias: '', cube: '', explore: '', fieldMappings: []};
        this.editSubMeta = null;
    }

    startEdit(index: number) {
        this.editingIndex = index;
        this.editForm = cloneDeep(this.subModels[index]);
        this.editSubMeta = null;
        if (this.editForm.cube) {
            if (!this.exploresMap[this.editForm.cube]) {
                this.loadingExplores = true;
                this.cubeApiService.explores(this.editForm.cube).subscribe(res => {
                    this.exploresMap[this.editForm.cube] = res.data || [];
                    this.loadingExplores = false;
                });
            }
            if (this.editForm.explore) {
                this.loadSubMeta();
            }
        }
    }

    confirmEdit() {
        if (!this.editForm?.alias?.trim()) return;
        if (this.editingIndex === this.NEW_IDX) {
            this.subModels.push(this.editForm);
        } else {
            this.subModels[this.editingIndex] = this.editForm;
        }
        this.cancelEdit();
    }

    cancelEdit() {
        this.editingIndex = -1;
        this.editForm = null;
    }

    remove(index: number) {
        this.subModels.splice(index, 1);
        if (this.editingIndex === index) {
            this.cancelEdit();
        } else if (this.editingIndex > index) {
            this.editingIndex--;
        }
    }

    onDashboardFieldChange(mapping: FieldMapping) {
        if (!mapping.subField) return;
        const dashType = this.cubeMeta?.fieldMap?.get(mapping.dashboardField)?.type;
        const subType = this.editSubMeta?.fieldMap?.get(mapping.subField)?.type;
        if (dashType !== subType) {
            mapping.subField = null;
        }
    }

    getCompatibleSubDimensions(dashboardFieldCode: string) {
        const type = this.cubeMeta?.fieldMap?.get(dashboardFieldCode)?.type;
        return (this.editSubMeta?.dimensions || []).filter(f => !f.hidden && f.type === type);
    }

    getCompatibleSubParameters(dashboardFieldCode: string) {
        const type = this.cubeMeta?.fieldMap?.get(dashboardFieldCode)?.type;
        return (this.editSubMeta?.parameters || []).filter(f => !f.hidden && f.type === type);
    }

    addMapping() {
        if (!this.editForm.fieldMappings) this.editForm.fieldMappings = [];
        this.editForm.fieldMappings.push({dashboardField: null, subField: null});
    }

    removeMapping(index: number) {
        this.editForm.fieldMappings.splice(index, 1);
    }

    getAllMainFields() {
        if (!this.cubeMeta) return [];
        return [
            ...(this.cubeMeta.dimensions || []),
            ...(this.cubeMeta.parameters || [])
        ].filter(f => !f.hidden);
    }

    getAllSubFields() {
        if (!this.editSubMeta) return [];
        return [
            ...(this.editSubMeta.dimensions || []),
            ...(this.editSubMeta.parameters || [])
        ].filter(f => !f.hidden);
    }

    getCubeLabel(cube: string): string {
        return this.cubesList.find(c => c.value === cube)?.label || cube;
    }

    getExploreLabel(cube: string, explore: string): string {
        return (this.exploresMap[cube] || []).find(e => e.value === explore)?.label || explore;
    }

    getFieldLabel(meta: CubeMeta, code: string): string {
        return meta?.fieldTitleMap?.get(code) || code;
    }

}
