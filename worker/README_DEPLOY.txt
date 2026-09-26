ねも死なないローグライク v0.9.1
Nemo Holder API (Cloudflare Worker)

【いちばん簡単な公開方法：Cloudflare画面から】
1. Cloudflareにログイン
2. Workers & Pages → Create → Worker を作成
3. Workerの編集画面で src/index.js の中身を貼り付けて Deploy
4. 発行された https://xxxx.workers.dev を控える
5. ブラウザで https://xxxx.workers.dev/health を開き、ok:true が出れば成功
6. ゲーム側 api-config.js の baseUrl に、そのURLを貼る
   例:
   window.NEMO_API_CONFIG = {
     baseUrl: 'https://xxxx.workers.dev',
   };
7. api-config.js をGitHub Pagesへアップロードして反映

OpenSea APIキーは必須設定ではありません。
未設定の場合、このWorkerがOpenSeaのInstant API Keyをサーバー側で取得して利用します。

【任意：固定のOpenSea API Keyを使う場合】
Cloudflare Workerの Settings → Variables and Secrets で
OPENSEA_API_KEY を Secret として設定してください。

【CORS】
初期設定は https://haine-cpu7.github.io からの利用を想定しています。
別ドメインへ移した場合は ALLOWED_ORIGIN を変更してください。
