# i18n — 新增多语言翻译

为 `src/erupt.i18n.csv` 添加一条或多条新的多语言条目。

## 用法

```
/i18n <key> <中文原文>
/i18n <key> <中文原文> [附加上下文说明]
```

**示例：**
```
/i18n global.save 保存
/i18n flow.approve 审批通过 （工作流节点操作按钮）
```

---

## 执行步骤

### 1. 读取 CSV 文件

读取 `/Users/liyuepeng/git/erupt-web/src/erupt.i18n.csv`，确认：
- 表头顺序：`key,zh-CN,zh-TW,en-US,fr-FR,ja-JP,ko-KR,ru-RU,es-ES,de-DE,pt-PT,id-ID,ar-SA`
- 检查 `$ARGUMENTS` 中提供的 key 是否已存在（若已存在，提示用户并询问是否覆盖）

### 2. 生成翻译

根据提供的中文原文（zh-CN），为以下 12 种语言生成**地道、简洁**的 UI 界面翻译：

| 列索引 | 语言代码 | 语言名称 |
|--------|----------|----------|
| 1 | zh-CN | 简体中文（原文） |
| 2 | zh-TW | 繁體中文 |
| 3 | en-US | English |
| 4 | fr-FR | Français |
| 5 | ja-JP | 日本語 |
| 6 | ko-KR | 한국어 |
| 7 | ru-RU | Русский |
| 8 | es-ES | Español |
| 9 | de-DE | Deutsch |
| 10 | pt-PT | Português |
| 11 | id-ID | Bahasa Indonesia |
| 12 | ar-SA | العربية |

翻译原则：
- 保持与 UI 按钮/标签场景一致，用词简洁
- 若翻译文字中含有英文逗号 `,`，需用双引号包裹整个字段，例如：`"Yes, confirm"`
- 繁体中文（zh-TW）与简体（zh-CN）尽量保持转换准确

### 3. 追加到 CSV

将新行追加到 `src/erupt.i18n.csv` 末尾，格式为：
```
key,zh-CN值,zh-TW值,en-US值,fr-FR值,ja-JP值,ko-KR值,ru-RU值,es-ES值,de-DE值,pt-PT值,id-ID值,ar-SA值
```

如果同时新增多个 key，每个 key 一行，依次追加。

### 4. 输出使用示例

新增完成后，展示该 key 的使用方式：

**在 Angular 模板中（使用 `translate` pipe）：**
```html
{{ 'YOUR_KEY' | translate }}

<!-- 用于属性绑定 -->
<input [placeholder]="'YOUR_KEY' | translate" />
<button [nzTooltipTitle]="'YOUR_KEY' | translate">...</button>
```

**在 TypeScript 中（注入 `I18NService`）：**
```typescript
import { I18NService } from '@core';

constructor(private i18n: I18NService) {}

// 翻译文本
const label = this.i18n.fanyi('YOUR_KEY');
```

---

## 注意事项

- key 命名约定：使用点分隔的命名空间，如 `global.save`、`table.export`、`flow.approve`
- 不要修改已有行的内容，只追加新行
- 如果用户没有提供 `$ARGUMENTS`，提示用户提供 key 和中文原文
