# 倫敦住處 × 英國旅行地圖

互動地圖：分類搜尋、縮放拖曳、地點詳情及瀏覽器本機收藏比較。

網站：https://tusigono.github.io/UKrentingmap/

由 GitHub Pages 發布 `main` 分支根目錄；更新並推送後會自動重新發布。

## 預覽

直接用瀏覽器開啟 `index.html`，或執行 `python3 -m http.server 8000`。

## 更新

- `places.json`：地點與推薦資訊。
- `template.html`：網頁版型、樣式及互動功能。
- `tube-map.png`：地鐵圖背景。
- `build.py`：將資料與圖片嵌入單一 HTML。

修改後執行 `python3 build.py`，再將產生的 `index.html` 提交至 Git。

## 來源與使用

地鐵圖來自使用者提供的 TfL PDF（2026 年 9 月版），保留原圖著作權標示。地點資料內附來源連結。圖像權利屬 TfL，使用須遵守原圖授權條件；原圖標明供個人使用，商業使用須另外取得授權。

居住推薦依個人需求比較，不代表治安保證。租金為先前刊登的參考，非即時報價。收藏只存於使用者瀏覽器，不上傳伺服器。
