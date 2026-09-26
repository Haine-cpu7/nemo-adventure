ねも死なないローグライク v0.9.1

Webブラウザで遊べる、ねもちゃんの「死なないローグライク」。
NFTなしでもゲストねもで遊べます。
NemoCollection2023ホルダーは、自分のNFTねもで深層12ROOM・Holder限定ルートへ進めます。

v0.9.1変更点
- PCのNFT自動取得を「Nemo Holder API（Cloudflare Worker）」経由に変更
- GitHub PagesからOpenSea APIを直接呼ぶ依存を減らした
- スマホで動いていたOpenSea直接取得はフォールバックとして維持
- Token ID手動確認も維持
- ゲーム本体、MetaMask Connect、図鑑・冒険記録・深層設定はそのまま

Nemo Holder API設定済み：
https://nemo-holder-api.hnhn-ovo-hnhn.workers.dev

Cloudflare Workerは公開済みなので、GitHub Pages側へこの版をアップロードすれば利用できます。
