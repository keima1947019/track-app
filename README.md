# 陸上競技大会運営支援ツール

## プロジェクト概要

このプロジェクトは、陸上競技の記録会や大会を運営する際に役立つツールを開発するためのものです。選手のエントリー管理から競技結果の記録、速報の共有、帳票作成まで、大会運営に関わる情報を扱いやすくすることを目指しています。

競技役員や大会事務局の作業負担を軽減し、記録や進行状況を関係者が確認しやすくすることで、円滑で正確な大会運営を支援します。選手や観客にとっても、競技結果を分かりやすく確認できる環境づくりを目標としています。

## 主な機能

- 選手エントリー情報の一覧・検索・管理
- 持ち記録を参考にしたプログラム編成のシミュレーション
- トラック競技の記録、順位、風速の入力
- 1000m・1500m・3000mタイム決勝の到着順入力とエントリー番号からの選手情報表示
- フィールド競技の試技記録と最高記録の管理
- チーム順位・総合得点の表示
- 選手や観客向けのリアルタイム速報画面プレビュー
- 賞状、プログラム、公式リザルトなどの帳票出力画面
- 選手情報および競技記録のGoogle Driveバックアップ

## 開発状況

本アプリは、大会運営を支援する画面と操作の実用性を検討しながら開発中です。サンプルデータやシミュレーションを使う機能、外部サービスとの接続設定が必要な機能が含まれます。実際の大会で使用する場合は、記録の正確性、権限管理、バックアップ、使用する競技規則への適合を事前に確認してください。

## 技術スタック

- React
- Vite
- Tailwind CSS
- lucide-react
- Docker / Nginx

## 開発環境の起動

Node.js 20以降を用意し、プロジェクトのルートで次を実行します。

```bash
npm install
npm run dev
```

本番向けの静的ファイルを生成するには、次を実行します。

```bash
npm run build
```

## Dockerでの起動

```powershell
docker build -t track-app .
docker run -d --name track-app -p 8081:80 track-app
```

起動後は `http://localhost:8081` でアクセスできます。

## Google Drive連携

アプリを開くと、Google OAuthでログインするまで大会管理画面は表示されません。OAuth同意画面ではアカウント識別用の`openid`・`email`・`profile`と、バックアップ用の`drive.file`スコープを使用します。

Google Driveへのバックアップには、Google CloudでDrive APIを有効化し、Webアプリケーション用のOAuth Client IDを設定する必要があります。Client IDはビルド時に指定します。

```powershell
docker build --build-arg VITE_GOOGLE_CLIENT_ID="your-web-client-id.apps.googleusercontent.com" -t track-app .
```

OAuthの承認済みJavaScript生成元には、実際にアプリへアクセスするURL（例: `http://localhost:8081`）を登録してください。ブラウザーに置くClient IDは公開識別子です。Client Secretなどの秘密情報をフロントエンドへ含めないでください。
