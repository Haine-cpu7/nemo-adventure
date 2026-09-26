ねもの冒険記録 v0.4
====================

Nemo Collectionの世界観で遊ぶ「死なないローグライク」Webゲームです。
インストール不要。GitHub Pagesなどの静的Web公開で動きます。

v0.4の追加
- MetaMaskなどのブラウザウォレット接続を実装
- NemoCollection2023の保有確認を実装
- まずOpenSea APIから接続ウォレットのNemo NFTを自動取得
- 自動取得できない環境向けに、OpenSea URL / Token IDによる保有確認も用意
- NFTねもの画像・名前をキャラクター選択画面に表示
- NFT Holderは最大8ROOM → 12ROOMまで探索可能
- Holder限定ダンジョン「記録者の地下回廊」を追加
- Holder限定おみやげ3種を追加
- Holder専用称号と冒険履歴表示を追加
- ゲストねも5体は引き続きNFTなしで遊べます

安全面
- ウォレット接続で確認するのは公開アドレスとNFT保有状況です
- 送金・購入・NFT移動・ガス代の処理はありません
- シークレットリカバリーフレーズや秘密鍵を入力する欄はありません
- 自動取得に失敗した場合のToken ID確認では、Polygonへネットワーク切替を求めることがありますが、eth_callのみで保有数を読み取ります

スマホ
- 通常のSafari/Chromeではブラウザウォレットが見つからない場合があります
- その場合は「MetaMaskアプリで開く」からMetaMask内ブラウザで開いてください

GitHub Pagesへの更新方法
1. このZIPを解凍
2. GitHubの nemo-adventure リポジトリを開く
3. index.html / app.js / styles.css / README.txt と assets フォルダをアップロード
4. 同名ファイルを置き換えて Commit changes
5. Pagesは既に有効なら、そのまま数十秒〜数分待って再読み込み

重要
- assets フォルダを忘れるとゲストねもの画像が表示されません
- Nemo NFT自動取得はOpenSea側のAPI/CORS仕様変更の影響を受ける可能性があります
- 自動取得が失敗しても、Token ID確認のフォールバックを使えます
