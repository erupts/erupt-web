---
name: i18n
description: i18n — add multilingual translations. Use when the user wants to add new translation keys to erupt.i18n.csv, e.g. "/i18n global.save 保存", "add a translation for me", "add an i18n key".
---

# i18n — Add Multilingual Translations

Add one or more new multilingual entries to `src/erupt.i18n.csv`.

## Usage

```
/i18n <key> <Chinese source text>
/i18n <key> <Chinese source text> [additional context]
```

**Examples:**
```
/i18n global.save 保存
/i18n flow.approve 审批通过 (workflow node action button)
```

---

## Steps

### 1. Read the CSV file

Read `/Users/liyuepeng/git/erupt-web/src/erupt.i18n.csv` and confirm:
- Header order: `key,zh-CN,zh-TW,en-US,fr-FR,ja-JP,ko-KR,ru-RU,es-ES,de-DE,pt-PT,id-ID,ar-SA`
- Check whether the key provided in `$ARGUMENTS` already exists (if so, notify the user and ask whether to overwrite)

### 2. Generate translations

Based on the provided Chinese source text (zh-CN), generate **idiomatic, concise** UI translations for the following 12 languages:

| Column index | Language code | Language name |
|--------------|---------------|---------------|
| 1 | zh-CN | Simplified Chinese (source) |
| 2 | zh-TW | Traditional Chinese |
| 3 | en-US | English |
| 4 | fr-FR | French |
| 5 | ja-JP | Japanese |
| 6 | ko-KR | Korean |
| 7 | ru-RU | Russian |
| 8 | es-ES | Spanish |
| 9 | de-DE | German |
| 10 | pt-PT | Portuguese |
| 11 | id-ID | Indonesian |
| 12 | ar-SA | Arabic |

Translation principles:
- Keep wording concise and appropriate for UI buttons/labels
- If a translation contains an English comma `,`, wrap the entire field in double quotes, e.g. `"Yes, confirm"`
- Traditional Chinese (zh-TW) should be an accurate conversion of the Simplified Chinese (zh-CN)

### 3. Append to the CSV

Append the new row to the end of `src/erupt.i18n.csv` in this format:
```
key,zh-CN value,zh-TW value,en-US value,fr-FR value,ja-JP value,ko-KR value,ru-RU value,es-ES value,de-DE value,pt-PT value,id-ID value,ar-SA value
```

If adding multiple keys at once, append one row per key.

### 4. Show usage examples

After adding, show how to use the key:

**In Angular templates (via the `translate` pipe):**
```html
{{ 'YOUR_KEY' | translate }}

<!-- For attribute bindings -->
<input [placeholder]="'YOUR_KEY' | translate" />
<button [nzTooltipTitle]="'YOUR_KEY' | translate">...</button>
```

**In TypeScript (inject `I18NService`):**
```typescript
import { I18NService } from '@core';

constructor(private i18n: I18NService) {}

// Translate text
const label = this.i18n.fanyi('YOUR_KEY');
```

---

## Notes

- Key naming convention: use dot-separated namespaces, e.g. `global.save`, `table.export`, `flow.approve`
- Never modify existing rows; only append new ones
- If the user did not provide `$ARGUMENTS`, ask them for the key and the Chinese source text
