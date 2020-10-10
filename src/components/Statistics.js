var R = require("rlab");

function round(v) {
  return Math.round(v * 1000) / 1000;
}

// //正規乱数の生成
// function rnorm(n, mean, sigma) {
//   return R.rnorm(n, mean, Math.sqrt(sigma));
//   // return Math.sqrt(-2 * Math.log(1 - Math.random())) * Math.cos(2 * Math.PI * Math.random());
// }

// //確率密度関数
// function dnorm(x, mean, sigma) {
//   return R.dnorm(x, mean, Math.sqrt(sigma));
//   // return Math.exp(-(x - mean) * (x - mean) / (2 * sigma)) / Math.sqrt(2 * Math.PI * sigma);
// }

// //累積分布関数
// function cdf(x, mean, sigma) {
//   return R.pnorm(x ,mean, Math.sqrt(sigma));
//   // let v = (1 + erf((x - mean) / Math.sqrt(2 * sigma))) / 2;
//   // return round(v);
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

// var qnorm = function (p, mean, sigma) {
//   return R.qnorm(p, mean, Math.sqrt(sigma));
// }

var Gamma = (function () {
  var p = [
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.13857109526572012,
    9.9843695780195716e-6,
    1.5056327351493116e-7
  ];
  var g = 7;

  function Gamma(z) {
    if (z < 0.5) {
      return Math.PI / (Math.sin(Math.PI * z) * Gamma(1 - z));
    }

    z--;
    var x = 0.99999999999980993;

    for (var i = p.length; i--;) {
      x += p[i] / (z + i + 1);
    }

    var t = z + g + 0.5;
    var G = Math.sqrt(Math.PI * 2) * Math.exp((z + 0.5) * Math.log(t) - t) * x;

    if (Math.floor(z) === z) {
      return Math.round(G);
    } else {
      return G;
    }
  }

  return Gamma;
})();

function tnorm(t, df) {
  return (Gamma((df+1)/2)/(Math.sqrt(df*Math.PI)*Gamma(df/2)))*Math.pow((1+t*t/df), -(df+1)/2)
}

// t分布のCDFとPDF
function tDist(t, df) {
  return R.dt(t, df);
  // 双対数の四則演算を定義
  const dadd = (d1, d2) => [d1[0] + d2[0], d1[1] + d2[1]];
  const dsub = (d1, d2) => [d1[0] - d2[0], d1[1] - d2[1]];
  const dmult = (d1, d2) => [d1[0] * d2[0], d1[0] * d2[1] + d1[1] * d2[0]];
  const ddiv = (d1, d2) => [d1[0] / d2[0], (d2[0] * d1[1] - d1[0] * d2[1]) / d2[0] / d2[0]];
  // 双対数の平方根とarctanを定義
  const dsqrt = (d) => [Math.sqrt(d[0]), d[1] * 0.5 / Math.sqrt(d[0])];
  const darctan = (d) => [Math.atan(d[0]), d[1] / (1 + d[0] * d[0])];
  // ここからt分布のCDFとPDFを求める計算
  const c2 = ddiv([df, 0], dadd([df, 0], dmult([t, 1], [t, 1])));
  let s = dmult([Math.sign(t), 0], dsqrt(dsub([1, 0], c2)));
  let p = [0, 0];
  for (let i = df % 2 + 2; i <= df; i += 2) {
    p = dadd(p, s);
    s = dmult(s, dmult([((i - 1) / i), 0], c2));
  }
  const theta = darctan(ddiv([t, 1], dsqrt([df, 0])));
  // 自由度が奇数か偶数かで計算結果を変える
  const result = df % 2 === 0 ?
    dmult([0.5, 0], dadd([1, 0], p)) :
    dadd([0.5, 0], ddiv(dadd(dmult(p, dsqrt(c2)), theta), [Math.PI, 0]));
  if (t == 0) result[1] = tnorm(0, df);
  return { 'CDF': result[0], 'PDF': result[1] };
}

// t分布の分位点関数(CDFの逆関数) <- t分布のCDFとPDF
function TQUANTILE(p, df, tol = 1e-10, maxiter = 1000) {
  let t, gain, iter;
  [t, gain, iter] = [0, Infinity, 0];
  // tをNewton法で更新
  while (Math.abs(gain) > tol && iter <= maxiter) {
    gain = -(tDist(t, df).CDF - p) / tDist(t, df).PDF;
    t += gain;
    iter++;
  }
  return t;
}


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
  // rnorm,
  // dnorm,
  // cdf,
  // erf,
  // qnorm,
  // tnorm,
  // tDist,
  // tQ: TQUANTILE,
  calcParams,
}
