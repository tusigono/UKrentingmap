# 倫敦住處 × 英國旅行地圖

互動地圖：分類搜尋、縮放拖曳、地點詳情及瀏覽器本機收藏比較。

網站：https://tusigono.github.io/UKrentingmap/

由 GitHub Pages 發布 `main` 分支根目錄；更新並推送後會自動重新發布。

## 預覽

直接用瀏覽器開啟 `index.html`，或執行 `python3 -m http.server 8000`。

## 更新

- `places.json`：地點與推薦資訊。
- `template.html`：網頁版型、樣式及互動功能。
- `tube-map.svg`：從原始 PDF 轉出的向量地鐵圖，站名轉為向量輪廓，放大不受 PNG 像素限制。
- `convert_map.py`：使用 PyMuPDF 轉換使用者提供的 PDF；沿用原圖裁切與標記座標。
- `build.py`：將資料與圖片嵌入單一 HTML。

修改後執行 `python3 build.py`，再將產生的 `index.html` 提交至 Git。

## 來源與使用

地鐵圖來自使用者提供的 TfL PDF（2026 年 9 月版），保留原圖著作權標示。地點資料內附來源連結。圖像權利屬 TfL，使用須遵守原圖授權條件；原圖標明供個人使用，商業使用須另外取得授權。

居住推薦依個人需求比較，不代表治安保證。租金為先前刊登的參考，非即時報價。收藏只存於使用者瀏覽器，不上傳伺服器。

## 地圖清晰度

地鐵圖以 inline SVG 呈現，不使用點陣圖片。保留原圖路線、站名與版權資訊；縮放時更新 SVG 的實際顯示尺寸，不以 CSS scale 放大快取圖層；標記使用百分比座標並維持固定按鈕尺寸。移除縮放平面的 `will-change`。更新原 PDF 時，先安裝 PyMuPDF 並執行 `python3 convert_map.py /path/to/standard-tube-map.pdf`，再執行 `python3 build.py`。

## 搜尋定位

- 搜尋車站全名會自動定位，也可點建議結果或按 Enter。黃色框標示原 PDF 中的站名位置；涵蓋地鐵、DLR、Overground、Elizabeth line 與 Tram。
- 已收錄地區會保留原本的居住、旅行與治安備註，另列最近五個、直線距離 5 公里內的 TfL 車站。直線距離由地區的代表定位點計算，不是房源的步行距離。
- 地鐵圖上的附近車站僅作交通定位，不畫不可靠的行政區邊界。沒有鄰近車站的目的地會切到英國旅行方位圖。
- 其他英國地區／小鎮可用英文名稱按「搜尋定位」，透過 Photon 查詢 OpenStreetMap。重名結果需選擇；不會自行新增居住推薦或治安評等。線上查詢有 12 秒逾時及取消過期結果機制；本機車站／已收錄地點不依賴線上服務。
- `search.js`：搜尋、附近車站、地圖定位與搜尋說明互動；由 `build.py` 內嵌。
- `stations.json`：2026-10-10 TfL API 車站資料快照與原圖站名框，共 455 個去重車站。
- `build_station_index.py`：從 TfL 回應與原 PDF 重建索引，需 PyMuPDF。例：`python3 build_station_index.py /path/to/standard-tube-map.pdf /path/to/tfl-stops.json`。

資料來源：[TfL API](https://api.tfl.gov.uk/StopPoint/Mode/tube,dlr,overground,elizabeth-line,tram?stopTypes=NaptanMetroStation,NaptanRailStation)、[Photon](https://github.com/komoot/photon)、[OpenStreetMap](https://www.openstreetmap.org/copyright)。

## 街道與郵遞區號搜尋

街道／地址不再被結果類型篩選排除。街名有精確同名結果時保留同名選項，顯示所在市區與郵遞區號供使用者核對；搜尋偏向倫敦但保留其他英國結果。

郵遞區號獨立透過 [Postcodes.io](https://postcodes.io/docs/overview/) 查詢，接受大小寫與空白變化：

- 完整碼（SW12 9LP）：郵遞區號代表座標。
- 分區（SW12）：官方 API 的 outcode 代表座標。
- 區段／部分碼（SW12 9、SW12 9L）：前綴搜尋返回最多 100 個有效座標的平均位置。此處不是整區中心、邊界或房源門口，說明面板明確標示其限制。

完整碼與街道定位仍以附近 TfL 車站呈現在示意圖，距離為直線距離。

執行 `node tests/search.cjs` 驗證格式解析、同名街道保留、前綴定位限制、完整碼與不存在郵碼處理。測試使用精簡公開 Photon 回應，無需連線。

輸入後停頓 800 毫秒會自動搜尋（線上查詢至少四字元）；也可按 Enter 或搜尋定位。換字或清除輸入會取消舊請求，選擇結果會取消待執行查詢。
