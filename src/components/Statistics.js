var R = require("rlab");

function round(v) {
  return Math.round(v * 1000) / 1000;
}

function round6(v) {
  return Math.round(v * 100000) / 100000;
}

// //正規乱数の生成
// function rnorm(n, mean, sigma) {
//   return Math.sqrt(-2 * Math.log(1 - Math.random())) * Math.cos(2 * Math.PI * Math.random());
// }

// //確率密度関数
// function dnorm(x, mean, sigma) {
//   return Math.exp(-(x - mean) * (x - mean) / (2 * sigma)) / Math.sqrt(2 * Math.PI * sigma);
// }

// //累積分布関数
// function cdf(x, mean, sigma) {
//   let v = (1 + erf((x - mean) / Math.sqrt(2 * sigma))) / 2;
//   return round(v);
// }

// //誤差関数
// function erf(x) {
//   // constants
//   var p = 0.3275911;
//   var a1 = 0.254829592;
//   var a2 = -0.284496736;
//   var a3 = 1.421413741;
//   var a4 = -1.453152027;
//   var a5 = 1.061405429;

//   var t = 1 / (1 + p * Math.abs(x));
//   var y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

//   return (x > 0) ? y : -y;
// }

function calcParams(array) {
  const zeroCheck = (c) => {
    if (array.length <= 0) return 0;
    return c;
  }
  const mean = zeroCheck(array.reduce((a, c) => a + c, 0) / array.length);
  //不偏分散
  const vari = zeroCheck(array.reduce((a, c) => a + (c - mean) * (c - mean), 0) / (array.length - 1));
  //標準偏差
  const std = zeroCheck(Math.sqrt(vari));
  //標準誤差
  const stderr = zeroCheck(Math.sqrt(vari / array.length));
  return {
    mean,
    vari,
    std,
    stderr,
  }
}

export default {
  round,
  round6,
  // rnorm,
  // dnorm,
  // cdf,
  // erf,
  calcParams,
}
