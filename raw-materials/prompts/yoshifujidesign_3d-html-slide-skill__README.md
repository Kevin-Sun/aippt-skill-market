# 3D HTML Slide Skill
<img width="1913" height="1039" alt="WS002985" src="https://github.com/user-attachments/assets/7d150a1c-73ee-429a-8315-8be2650ebe11" />

*生成されるスライドの一例*


ワイヤーフレームデザインのモーション設定済みHTMLスライドを生成する、Claude Code 用の Skill です。

「3DワイヤーフレームHTMLスライドを作って」とClaudeに伝えるだけで、Three.jsの3D背景・横スクロール・テーマカラー自動切替を備えた単一HTMLファイルのプレゼンスライドが生成されます。
<img width="1379" height="782" alt="EP133-2_2" src="https://github.com/user-attachments/assets/1e3be001-6598-40b8-bf9f-da10e7d77f5d" />
*スクロールによる画面遷移の様子*


## 特徴

- **Three.js 3D背景** — スライドごとに異なるワイヤーフレームジオメトリが浮かぶ
- **横スクロール** — scroll-snap による1枚ずつのページめくり
- **テーマカラー自動切替** — スライド切替時に背景色・アクセントカラーが滑らかに変化
- **視差効果(Parallax)** — 要素ごとに奥行き感を演出
- **完全レスポンシブ** — PC・スマホ両対応
- **単一HTMLファイル** — 外部ライブラリはすべてCDN、ファイル1つで完結

## インストール方法

1. このリポジトリから `3d-html-slide-skill.skill` をダウンロード
2. Claude.ai の 設定 → 機能 → スキル → カスタマイズ → スキルをアップロードを選択
3. ダウンロードした `.skill` ファイルをアップロード

## 使い方

Claudeとの会話で以下のようにトリガーワード「3DワイヤーフレームHTMLスライド」というキーワードを含めて依頼してください。

> 「3DワイヤーフレームHTMLスライドで、〇〇についてのプレゼンを作って」

生成されたHTMLファイルをブラウザで開くだけで、そのままプレゼンとして使えます。

## 動作要件

- モダンブラウザ(Chrome / Safari / Edge / Firefox の最新版)
- インターネット接続(CDNからThree.js等を読み込むため)

## 作者

**Fuji (Tomohiro Yoshifuji)**
プレゼンテーションデザイナー / Microsoft MVP (PowerPoint) / Prezi Independent Expert

- Web: [re-presentation.jp](https://re-presentation.jp)
- X: [@yoshifujidesign](https://x.com/yoshifujidesign)
- note: [AIスライド実験室](https://note.com/yoshifujidesign)
- 著書: 『刺さるプレゼン全書』『伝わるプレゼンの法則100』

## ライセンス

MIT License
