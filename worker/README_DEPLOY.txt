Nemo Holder API Worker v0.9.5

変更点
- OpenSea APIは使いません。
- Polygon上のOpenSea Shared Storefront (ERC-1155) を直接確認します。
- v0.9.4ではToken IDのmaxSupply部分を「1」に固定していたため、1/1以外のNemoを取りこぼしていました。
- v0.9.5では複数のedition/maxSupply値を走査し、保有中の候補だけメタデータを取得します。
- メタデータがNemoCollection2023のものだけをゲームへ返します。
- balanceOfBatchを256件単位、4並列で処理します。

更新方法
1. Cloudflare Dashboard > Workers & Pages > nemo-holder-api > Edit code
2. worker.js の中を Ctrl+A → Delete
3. このZIPの src/index.js を全文コピーして Ctrl+V
4. Deploy
5. Visit を開き、version が 0.9.5 になっていることを確認
6. ゲームに戻り「Nemo NFTを再確認」を1回押す

GitHub Pages側のファイル更新は不要です。
