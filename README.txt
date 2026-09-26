ねも死なないローグライク v0.9

Webブラウザで遊べる、ねもちゃんの「死なないローグライク」。
NFTなしでもゲストねもで遊べます。
NemoCollection2023ホルダーは、自分のNFTねもで深層12ROOM・Holder限定ルートへ進めます。

v0.9変更点
- PCのNFT自動取得を「Nemo Holder API（Cloudflare Worker）」経由に変更
- GitHub PagesからOpenSea APIを直接呼ぶ依存を減らした
- スマホで動いていたOpenSea直接取得はフォールバックとして維持
- Token ID手動確認も維持
- ゲーム本体、MetaMask Connect、図鑑・冒険記録・深層設定はそのまま

重要：PCで自動取得を使うには、worker/ のCloudflare Workerを1回公開し、
api-config.js の baseUrl に workers.dev URLを設定してください。
詳しくは worker/README_DEPLOY.txt を参照してください。
