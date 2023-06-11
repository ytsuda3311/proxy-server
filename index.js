const express = require("express");
const app = express();
const { createProxyMiddleware } = require("http-proxy-middleware");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const limiter = rateLimit({
  // 「windowMs」= アクセス数の制限を設ける時間幅。以下はミリ秒表記で15分
  windowMs: 15 * 60 * 1000,
  // 「max」= windowMsの時間幅の間に受け付けるアクセス数
  max: 10000,
});

// このプロキシサーバー全てのURLに適用する時には以下を実行
// app.use(limiter)

// 「get」= GETリクエスト
// 「/」= コードのURL
// 「req」= ブラウザからのリクエスト
// 「res」= ブラウザに返すレスポンス
app.get("/", (req, res) => {
  res.send("This is my proxy server");
});

app.use("/weather-data", (req, res, next) => {
  // URL末尾に${city}があるので、パラメーターを取得する
  const city = new URL(req.url).query;
  createProxyMiddleware({
    target: `${process.env.BASE_API_URL_WEATHERAPI}${city}&aqi=no`,
    changeOrigin: true,
    pathRewrite: {
      [`^"/weather-data`]: "",
    },
  })(req, res, next);
});

// 個別のURLにのみ適用する時には以下のように書く
app.use("/corona-tracker-world-data", limiter, (req, res, next) => {
  createProxyMiddleware({
    // 「target」= このプロキシサーバーからアクセスしたいデータの供給元のURL
    target: process.env.BASE_API_URL_CORONA_WORLD,
    // 「changeOrigin」= フロントエンドからのリクエスト、およびそれに対するレスポンスにはヘッダーという追加情報を書き込むスペースがあり、それに関係するもの
    changeOrigin: true,
    // 「pathRewite」= app.use()で設定しているURLをtargetのURLに追加したり、置き換えたりするときに使う
    pathRewrite: {
      [`^/corona-tracker-world-data`]: "",
    },
  })(req, res, next);
});

app.use("/corona-tracker-country-data", (req, res, next) => {
  const country = new URL(req.url).query;
  createProxyMiddleware({
    target: `process.env.BASE_API_URL_CORONA_COUNTRY/${country}`,
    changeOrigin: true,
    pathRewrite: {
      [`^/corona-tracker-country-data`]: "",
    },
  })(req, res, next);
});

const port = process.env.PORT || 5000;

// サーバーを実行するポートを指定
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

module.exports = app;
