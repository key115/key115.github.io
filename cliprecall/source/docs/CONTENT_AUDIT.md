# ClipRecall content audit

Reviewed the latest application source on 2026-10-01 at commit `59061859a0f60d08dc6ca7675285bac09a1e6254`. The private application's source is not copied into this public website.

| Website statement | Implementation checked |
| --- | --- |
| macOS 14 or later | `project.yml` deployment target |
| Option + V by default; shortcut customizable | `SettingsStore.swift` / `HotKeySettings` |
| Capture on; Direct Paste off by default | `AppSettings` initial values |
| 25 regular items; pins excluded; 4 MiB per item | `RetentionPolicy.swift` |
| Return restores; arrow keys select; Right opens preview; Left closes it | `HistoryPanelKeyRouting.swift` |
| Tab / Shift + Tab switches tabs; Escape dismisses preview first | `HistoryPanelKeyRouting.swift` |
| Hover preview enabled by default; can be disabled | `SettingsStore.swift`, `HistoryPanelView.swift` |
| Standard and Compact density | `PanelDensity.swift`, `HistoryPanelView.swift` |
| Permission guidance may require restart | `DirectPasteGuidance.swift` |
| English, Japanese, Simplified Chinese, Spanish, Brazilian Portuguese | `AppLanguage` in `SettingsStore.swift` |
| Unpinned history in memory; pins encrypted locally | Privacy/security documentation and application README |
| No clipboard transmission or analytics; optional tips via StoreKit | Privacy/security documentation; network-free application entitlements |

The guide distinguishes default clipboard restoration from optional automatic pasting. It does not promise search, cloud sync, automatic detection of secrets, or permanent storage for unpinned history. Storage warnings and destructive data deletion are explained in context. Latest-source behavior is documented without claiming an App Store release version.
