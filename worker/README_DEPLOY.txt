Nemo Holder API Worker v0.9.6

目的
- OpenSea APIを使わずPolygonを直接確認
- Cloudflare Workers Free の「外部subrequest 50件/1 invocation」制限を回避
- Shared Storefrontのedition数違いも確認してNemoCollection2023を取得

v0.9.5の問題
- 20種類のedition候補 x 1024 mint index を1回のWorkerで走査
- 256件ごとのbalanceOfBatchで最低80回のRPC subrequestが発生
- Freeプラン上限50件を超え「Too many subrequests」になった

v0.9.6
- /scan を4分割（1回あたり通常10 RPC程度）
- /metadata は最大12 Token IDずつ処理
- ゲームv0.12.1が4回のscan結果を合流し、metadataを小分け取得

導入
1. Cloudflare Workers & Pages > nemo-holder-api > Edit code
2. worker.jsの内容を全部削除
3. src/index.jsを全文コピーして貼り付け
4. Deploy
5. Visitで "version":"0.9.6" を確認
6. ゲーム側もv0.12.1へ更新
