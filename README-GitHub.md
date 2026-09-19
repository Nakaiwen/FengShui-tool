# 小六太乙・陽宅風水 PWA（1.7.0）

包含紫白飛星、玄空宅盤、電子羅盤、飛星動畫，以及本次新增的「存檔」「讀取」「加入主畫面」。已保留九宮數字間距、紫白頁面捲動與中心底色修正。

## 上傳 GitHub

1. 解壓縮 `FengShui-GitHub-upload.zip`。
2. 將解壓後的所有網站檔案與整個 `icons` 資料夾，上傳到 `Nakaiwen/FengShui-tool` 原本 `index.html` 所在的位置，覆蓋同名檔案。
3. 提交變更，等候 GitHub Pages 部署完成後重新整理網站。

請上傳解壓後的內容，不要只上傳 ZIP，也不要把整包再放入另一層資料夾。`manifest.webmanifest`、`sw.js`、`app-storage.js`、`pwa.js`、`app-tools.css` 和 `icons` 都需要一併上傳。

純靜態網站，不需安裝 npm、不需建置、不需額外付費伺服器。

網站：https://nakaiwen.github.io/FengShui-tool/

## 安裝到 iPhone／iPad

1. 在 Safari 開啟上方 HTTPS 網址。
2. 首次保持連網，等工具上方顯示「離線已就緒」。
3. 點 Safari 的「分享」→「加入主畫面」。若顯示「以網頁 App 開啟」，請保持開啟。
4. 之後從主畫面的「小六風水」圖示進入。

Android／電腦可按頁面的「安裝工具」，或從瀏覽器選單安裝。未提供自動安裝提示時，「加入主畫面」按鈕會顯示操作說明。

## 存檔與讀取

1. 可以先填「案件名稱」，例如「自宅客廳」。
2. 點「存檔」，下載 `.json` 檔；iPhone／iPad 請在下載項目或「檔案」App 保留它。
3. 點「讀取」，選擇這份 JSON，還原兩頁設定。

存檔包含命主／家人的出生年月日與性別、宅卦、觀測日期、星氣勾選、五氣模式、鎖定狀態、展開宮位，以及玄空建宅／當前元運、目前角度、檢視模式、平面圖與疊圖位置、旋轉、縮放、透明度。

讀取後角度會固定，方便核對原盤；需要現場測量時再按「啟動電子羅盤」。兩頁使用原計算引擎重新起盤，不把舊的解讀結果寫死在存檔內。

平面圖支援 8 MB 以下的 PNG、JPEG、WebP、GIF；JSON 上限 16 MB。格式錯誤或不支援的檔案不會改動目前排盤。排盤檔案只在裝置上讀取及下載，沒有上傳個人資料的功能。

## 離線與版本更新

完成首次快取後，兩頁排盤、手動角度、存檔、讀取及已存入 JSON 的平面圖可離線使用。外連的每月吉時網站仍需連網。電子羅盤仍取決於裝置感測器與權限。

上線新版後，顯示「新版已就緒」時，先存檔再按「更新版本」。更新會重新載入頁面，之後可讀取先前的 JSON。

清除瀏覽器網站資料可能移除離線快取；重新連網載入即可。請把重要排盤另外存成 JSON。

本機單檔 HTML 可操作排盤與存讀檔；PWA 安裝與離線快取需使用已上線的 HTTPS 網址。

## 驗證與開發

已用模擬 DOM、感測事件及 service worker 執行環境，驗證雙頁存讀檔、無效檔案、平面圖還原、GitHub 子目錄離線快取與更新隔離；尚未完成真實 iPad／Safari 安裝及硬體驗收。

若繼續修改程式，發布前執行 `python scripts/build-release.py --output /完整輸出路徑`，更新離線資源版本並產生新 ZIP。開發測試：`npm install` 後執行 `npm test`。這些開發步驟不需要由單純上傳本包的使用者執行。

PWA 安裝與離線機制參考：[MDN 安裝說明](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable)、[Service Worker 說明](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers)。
