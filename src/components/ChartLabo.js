import React from 'react';
import Chart from 'chart.js';
import PlotChart from './PlotChart';
import Stat from './Statistics';
import R from 'rlab';

const color = Chart.helpers.color;
const chartColors = {
  red: 'rgb(255, 99, 132)',
  orange: 'rgb(255, 159, 64)',
  yellow: 'rgb(255, 205, 86)',
  green: 'rgb(75, 192, 192)',
  blue: 'rgb(54, 162, 235)',
  purple: 'rgb(153, 102, 255)',
  grey: 'rgb(201, 203, 207)'
};

export default function () {
  const chartCanvas = React.useRef(null);
  const chart = React.useRef(null);
  const samplingPoint = React.useRef([]);
  const avgSamplingPoint = React.useRef([]);
  const [left, setLeft] = React.useState(30);
  const [right, setRight] = React.useState(50);
  const [std, setStd] = React.useState(1);
  const [stdErr, setStdErr] = React.useState(0);
  const [variance, setVariance] = React.useState(1);
  const [mean, setMean] = React.useState(left + (right - left) / 2);
  const [normalLeftValue, setNormalLeftValue] = React.useState(left);
  const [samplingLeftValue, setSamplingLeftValue] = React.useState(left);
  const [tLeftValue, setTLeftValue] = React.useState(-10);
  const [tValue, setTValue] = React.useState(0);
  const [samplingNumber, setSamplingNumber] = React.useState(3);
  const [avgSamplingNumber, setAvgSamplingNumber] = React.useState(0);
  const [showDistribution, setShowDistribution] = React.useState(false);
  const [showSamplingDistribution, setShowSamplingDistribution] = React.useState(true);
  const [showTDistribution, setShowTDistribution] = React.useState(false);
  const [showPaintDistribution, setShowPaintDistribution] = React.useState(false);
  const [showNormalCumulative, setShowNormalCumulative] = React.useState(false);
  const [showSamplingCumulative, setShowSamplingCumulative] = React.useState(true);
  const [showTValueCumulative, setShowTValueCumulative] = React.useState(false);
  const [showBoth, setShowBoth] = React.useState(true);
  const [percentFix, setPercentFix] = React.useState(false);
  const [enableMeanOffset, setEnableMeanOffset] = React.useState(false);
  const [enableMeanZero, setEnableMeanZero] = React.useState(false);
  const [sampleValues, setSampleValues] = React.useState(Stat.calcParams([0]));
  const [normalPercent, setNormalPercent] = React.useState(0);
  const [samplingPercent, setSamplingPercent] = React.useState(0);
  const [tValuePercent, setTValuePercent] = React.useState(0);
  const chartData = React.useRef([]);
  const chartOptions = React.useRef({
    xmin: left,
    xmax: right,
    xstep: 1,
    ymin: 0,
    ymax: 1,
  });

  React.useEffect(() => {
    chart.current = PlotChart.Chart(
      chartCanvas.current,
      chartData.current,
      chartOptions.current,
    );
    // doSampling();
    updateChart();
  }, []);

  React.useEffect(() => {
    setStdErr(std / Math.sqrt(samplingNumber));
  }, [std, samplingNumber]);

  React.useEffect(() => {
    setStd(Math.sqrt(variance));
  }, [variance]);

  React.useEffect(() => {
    setMean(left + (right - left) / 2);
    setNormalLeftValue(left);
    setSamplingLeftValue(left);
    chartOptions.current.xmin = left;
    chartOptions.current.xmax = right;
    chart.current = PlotChart.Chart(
      chartCanvas.current,
      chartData.current,
      chartOptions.current,
    );
    updateChart();
  }, [left, right]);

  React.useEffect(() => {
    updateChart();
  }, [
    showDistribution, showSamplingDistribution, showTDistribution,
    showPaintDistribution, showNormalCumulative, showSamplingCumulative,
    normalLeftValue, samplingLeftValue, tLeftValue, showTValueCumulative,
    mean, std, samplingNumber, showBoth, enableMeanOffset, avgSamplingNumber, stdErr,
  ]);

  const get_random_samples = (n) => {
    function getRandomInt(max) {
      return Math.floor(Math.random() * Math.floor(max));
    }
    avgSamplingPoint.current = [];
    for (var i=0;i<n;i++) {
      const t = [];
      for (var j=0;j<samplingNumber;j++) {
        const idx = getRandomInt(200);
        t.push(samplingPoint.current[idx]);
      }
      avgSamplingPoint.current.push({
        x: t.reduce( (a,c) => a+c, 0)/t.length,
        y: 40, r: 4,
      })
    }
  }

  const doSampling = () => {
    samplingPoint.current = [];
    R.rnorm(200, mean, std).forEach( v => {
      samplingPoint.current.push(v);
    });
    get_random_samples(200);
    updateChart();
  }

  const doResetSampling = () => {
    samplingPoint.current = [];
    setAvgSamplingNumber(0);
    updateChart();
  }

  const updateChart = () => {
    var xmin = chartOptions.current.xmin;
    var xmax = chartOptions.current.xmax;
    var nx = 100;

    if (percentFix) {
      setNormalLeftValue(R.qnorm(normalPercent, mean, std));
      setSamplingLeftValue(R.qnorm(samplingPercent, mean, stdErr));
      setTLeftValue(R.pt(tValuePercent, samplingNumber - 1));
    }

    function calc_normal_distribution() {
      var data = [];
      for (let i = 0; i < nx + 1; i++) {
        var x = (xmin + (xmax - xmin) / nx * i);
        var y = R.dnorm(x, mean, std);
        data.push({ x: x, y: y });
      }
      return data;
    }

    var dataSet1 = {
      type: 'line',
      data: calc_normal_distribution(),
      backgroundColor: color(chartColors.red).alpha(0.5).rgbString(),
      borderColor: chartColors.red,
      yAxisID: 'y-axis-1',
      pointRadius: 0,
      fill: showPaintDistribution,
    }

    const get_samples = () => {
      const t = samplingPoint.current.slice(0, samplingNumber).map(v => {
        return {
          x: v, y: 20,
          r: 4,
        }
      });
      return t;
    }

    var samples = get_samples();
    var avg = samples.reduce((a, c) => a + c.x, 0) / samples.length;
    var params = Stat.calcParams(samplingPoint.current.slice(0, samplingNumber));
    const tvalue = params.stderr>0?(params.mean - mean) / params.stderr:0;
    setTValue(tvalue);
    setSampleValues(params);

    var alpha = 0.6 / samplingNumber;
    if (alpha < 0.05) alpha = 0.05;

    var dataSet2 = {
      type: 'point',
      data: avgSamplingNumber==0?samples:[],
      backgroundColor: color('blue').alpha(alpha * 2).rgbString(),
      borderColor: color('blue').alpha(alpha * 5).rgbString(),
      yAxisID: 'y-axis-2',
    }

    const avg_samples = [
      { x: avg, y: 40, r: 4, },
      ...avgSamplingPoint.current.slice(0, avgSamplingNumber),
    ];

    var alpha = 0.6 / avg_samples.length;
    if (alpha < 0.05) alpha = 0.05;

    var dataSet2_A = {
      type: 'point',
      data: avg_samples,
      backgroundColor: color('red').alpha(alpha * 2).rgbString(),
      borderColor: color('red').alpha(alpha * 5).rgbString(),
      yAxisID: 'y-axis-2',
    }

    var areaData = [
      { x: normalLeftValue, y: 0, r: 0 },
    ];

    if (showBoth) {
      areaData.push({ x: xmax-(normalLeftValue-xmin)-((xmax+xmin)/2-mean)*2, y: 0, r: 100 });
    }

    var dataSet3 = {
      type: 'area',
      data: areaData,
      backgroundColor: color(chartColors.red).alpha(0.5).rgbString(),
      borderColor: chartColors.red,
      pointRadius: 0,
    }

    var areaData_A = [
      { x: samplingLeftValue-((xmax+xmin)/2-mean), y: 0, r: 0 },
    ];

    if (showBoth) {
      areaData_A.push({ x: xmax-(setSamplingLeftValue-xmin)-((xmax+xmin)/2-mean), y: 0, r: 100 });
    }

    var dataSet3_A = {
      type: 'area',
      data: areaData_A,
      backgroundColor: color(chartColors.green).alpha(0.5).rgbString(),
      borderColor: chartColors.green,
      pointRadius: 0,
    }

    function calc_sample_distribution() {
      var data = [];
      for (let i = 0; i < nx + 1; i++) {
        var x = (xmin + (xmax - xmin) / nx * i);
        var y = R.dnorm(x, (enableMeanOffset?params.mean-mean:0)+mean, stdErr);
        data.push({ x: x, y: y });
      }
      return data;
    }

    var dataSet4 = {
      type: 'line',
      data: calc_sample_distribution(),
      backgroundColor: color(chartColors.green).alpha(0.5).rgbString(),
      borderColor: chartColors.green,
      yAxisID: 'y-axis-1',
      pointRadius: 0,
      fill: showPaintDistribution,
    }

    function calc_func_t_distribution() {
      var data = [];
      for (let i = 0; i < nx + 1; i++) {
        var x = (xmin + (xmax - xmin) / nx * i)-mean;
        var y = R.dt(x, samplingNumber - 1);
        data.push({ x: x+(enableMeanOffset?params.mean-mean:0)+mean, y: y });
      }
      return data;
    }

    var dataSet5 = {
      type: 'line',
      data: calc_func_t_distribution(),
      backgroundColor: color(chartColors.orange).alpha(0.5).rgbString(),
      borderColor: chartColors.orange,
      yAxisID: 'y-axis-1',
      pointRadius: 0,
      fill: showPaintDistribution,
    }

    var areaData_T = [
      { x: tLeftValue*params.stderr+(enableMeanOffset?params.mean-mean:0)+mean, y: 0, r: 0 },
    ];

    if (showBoth) {
      areaData_T.push({ x: -tLeftValue*params.stderr+(enableMeanOffset?params.mean-mean:0)+mean, y: 0, r: 100 });
    }

    var dataSet3_T = {
      type: 'area',
      data: areaData_T,
      backgroundColor: color(chartColors.orange).alpha(0.5).rgbString(),
      borderColor: chartColors.orange,
      pointRadius: 0,
    }

    chartData.current.splice(0);

    chartData.current.push(dataSet2_A);
    chartData.current.push(dataSet2);
    if (showDistribution) {
      chartData.current.push(dataSet1);
    }
    if (showSamplingDistribution) {
      chartData.current.push(dataSet4);
    }
    if (showTDistribution) {
      chartData.current.push(dataSet5);
    }
    if (showNormalCumulative) {
      chartData.current.push(dataSet3);
    }
    if (showSamplingCumulative) {
      chartData.current.push(dataSet3_A);
    }
    if (showTValueCumulative) {
      chartData.current.push(dataSet3_T);
    }
    chart.current.update();
  }

  return (
    <>
      <canvas ref={chartCanvas} width="400" height="200"></canvas>
      <div className="inline-block w-1/3">
        <input
          type="checkbox"
          checked={showDistribution}
          onChange={(e) => {
            setShowDistribution(e.target.checked)
          }}
        />
        <div className="inline-block">:母集団分布</div>
      </div>
      <div className="inline-block w-1/3">
        <input
          type="checkbox"
          checked={showSamplingDistribution}
          onChange={(e) => {
            setShowSamplingDistribution(e.target.checked)
          }}
        />
        <div className="inline-block">:標本平均の分布</div>
      </div>
      <div className="inline-block w-1/3">
        <input
          type="checkbox"
          checked={showTDistribution}
          onChange={(e) => {
            setShowTDistribution(e.target.checked)
          }}
        />
        <div className="inline-block">:t分布</div>
      </div>
      <div className="inline-block w-1/3">
        <input
          type="checkbox"
          checked={showPaintDistribution}
          onChange={(e) => {
            setShowPaintDistribution(e.target.checked)
          }}
        />
        <div className="inline-block">:塗り潰し</div>
      </div>
      <div className="inline-block w-1/3">
        <input
          type="checkbox"
          checked={enableMeanOffset}
          onChange={(e) => {
            setEnableMeanOffset(e.target.checked)
          }}
        />
        <div className="inline-block">:平均補正</div>
      </div>
      <div className="inline-block w-1/3">
        <input
          type="checkbox"
          checked={enableMeanZero}
          onChange={(e) => {
            if (e.target.checked) {
              setLeft(-10);
              setRight(10);
            } else {
              setLeft(30);
              setRight(50);
            }
            setEnableMeanZero(e.target.checked)
          }}
        />
        <div className="inline-block">:0平均化</div>
      </div>
      <div>
        <div className="inline-block w-1/3">母平均:{mean}</div>
        <input
          value={mean} type="range"
          min={chartOptions.current.xmin}
          max={chartOptions.current.xmax}
          step="0.1"
          onChange={(e) => {
            setMean(parseFloat(e.target.value));
          }}
        />
      </div>
      <div>
        <div className="inline-block w-1/3">母分散:{variance}</div>
        <input
          value={variance}
          type="range"
          min="0.1"
          max="3"
          step="0.1"
          onChange={(e) => {
            setVariance(parseFloat(e.target.value));
          }}
        />
      </div>
      <div>
        <div className="inline-block w-1/3">サンプリング数:{samplingNumber}</div>
        <input
          value={samplingNumber} type="range" min="3" max="200" step="1"
          onChange={(e) => {
            setSamplingNumber(e.target.value);
          }}
        />
        <input type="button" value="サンプリング" onClick={doSampling} />
        <input type="button" value="リセット" onClick={doResetSampling} />
      </div>
      <div>
        <div className="inline-block w-1/3">標本平均の個数:{avgSamplingNumber+1}</div>
        <input
          value={avgSamplingNumber} type="range" min="0" max="99" step="1"
          onChange={(e) => {
            setAvgSamplingNumber(parseInt(e.target.value));
          }}
        />
      </div>
      <div>
        <div className="inline-block w-1/3">標本平均:{Stat.round(sampleValues.mean)}</div>
      </div>
      <div>
        <div className="inline-block w-1/3">標準偏差:{Stat.round(sampleValues.std)}</div>
      </div>
      <div>
        <div className="inline-block w-1/3">標準誤差:{Stat.round(sampleValues.stderr)}</div>
      </div>
      <div>
        <div className="inline-block w-1/3">t値:{Stat.round(tValue)}</div>
      </div>

      <div>累積分布</div>

      <div>
        <div className="inline-block w-1/3">
          <input
            type="checkbox"
            checked={showBoth}
            onChange={(e) => {
              setShowBoth(e.target.checked)
            }}
          />
          <div className="inline-block">:両側表示</div>
        </div>
        <div className="inline-block w-1/3">
          <input
            type="checkbox"
            checked={percentFix}
            onChange={(e) => {
              if (e.target.checked) {
                setNormalPercent(Stat.round(R.pnorm(normalLeftValue, mean, std)));
                setSamplingPercent(Stat.round(R.pnorm(samplingLeftValue, mean, std/(samplingNumber-1))));
                setTValuePercent(Stat.round(R.pt(tLeftValue, samplingNumber-1)));
              }
              setPercentFix(e.target.checked)
            }}
          />
          <div className="inline-block">:パーセント固定</div>
        </div>
      </div>

      <div>
        <div className="inline-block w-1/3">
        <input
          type="checkbox"
          checked={showNormalCumulative}
          onChange={(e) => {
            setShowNormalCumulative(e.target.checked)
          }}
        />
        <div className="inline-block">:母分布:{Stat.round(normalLeftValue)}/{Stat.round(R.pnorm(normalLeftValue, mean, std)*100)}%</div>
        </div>
        <div className="inline-block">
          <input
            value={normalLeftValue}
            type="range"
            min={chartOptions.current.xmin}
            max={chartOptions.current.xmax}
            step="0.05"
            disabled={percentFix}
            onChange={(e) => {
              setNormalLeftValue(parseFloat(e.target.value));
            }}
          />
          <input type="button" value="0.5%点" onClick={() => {
            setNormalLeftValue(R.qnorm(0.005, mean, std));
          }} />
          <input type="button" value="1.0%点" onClick={() => {
            setNormalLeftValue(R.qnorm(0.01, mean, std));
          }} />
          <input type="button" value="2.5%点" onClick={() => {
            setNormalLeftValue(R.qnorm(0.025, mean, std));
          }} />
          <input type="button" value="5%点" onClick={() => {
            setNormalLeftValue(R.qnorm(0.05, mean, std));
          }} />
          <input type="button" value="25%点" onClick={() => {
            setNormalLeftValue(R.qnorm(0.25, mean, std));
          }} />
        </div>
      </div>

      <div>
        <div className="inline-block w-1/3">
        <input
          type="checkbox"
          checked={showSamplingCumulative}
          onChange={(e) => {
            setShowSamplingCumulative(e.target.checked)
          }}
        />
        <div className="inline-block">:標本分布:{Stat.round(samplingLeftValue)}/{Stat.round(R.pnorm(samplingLeftValue, mean, stdErr)*100)}%</div>
        </div>
        <div className="inline-block">
          <input
            value={samplingLeftValue}
            type="range"
            min={chartOptions.current.xmin}
            max={chartOptions.current.xmax}
            step="0.05"
            disabled={percentFix}
            onChange={(e) => {
              setSamplingLeftValue(parseFloat(e.target.value));
            }}
          />
          <input type="button" value="0.5%点" onClick={() => {
            setSamplingLeftValue(R.qnorm(0.005, mean, stdErr));
          }} />
          <input type="button" value="1.0%点" onClick={() => {
            setSamplingLeftValue(R.qnorm(0.01, mean, stdErr));
          }} />
          <input type="button" value="2.5%点" onClick={() => {
            setSamplingLeftValue(R.qnorm(0.025, mean, stdErr));
          }} />
          <input type="button" value="5%点" onClick={() => {
            setSamplingLeftValue(R.qnorm(0.05, mean, stdErr));
          }} />
          <input type="button" value="25%点" onClick={() => {
            setSamplingLeftValue(R.qnorm(0.25, mean, stdErr));
          }} />
        </div>
      </div>

      <div>
        <div className="inline-block w-1/3">
        <input
          type="checkbox"
          checked={showTValueCumulative}
          onChange={(e) => {
            setShowTValueCumulative(e.target.checked)
          }}
        />
        <div className="inline-block">:t分布:{Stat.round(tLeftValue)}/{Stat.round(R.pt(tLeftValue, samplingNumber-1)*100)}%</div>
        </div>
        <div className="inline-block">
          <input
            value={tLeftValue}
            type="range"
            min={-10}
            max={ 10}
            step="0.05"
            disabled={percentFix}
            onChange={(e) => {
              setTLeftValue(parseFloat(e.target.value));
            }}
          />
          <input type="button" value="0.5%点" onClick={() => {
            setTLeftValue(R.qt(0.005, samplingNumber - 1))
          }} />
          <input type="button" value="1.0%点" onClick={() => {
            setTLeftValue(R.qt(0.01, samplingNumber - 1));
          }} />
          <input type="button" value="2.5%点" onClick={() => {
            setTLeftValue(R.qt(0.025, samplingNumber - 1))
          }} />
          <input type="button" value="5%点" onClick={() => {
            setTLeftValue(R.qt(0.05, samplingNumber - 1))
          }} />
          <input type="button" value="25%点" onClick={() => {
            setTLeftValue(R.qt(0.25, samplingNumber - 1))
          }} />
        </div>
      </div>
    </>
  )
}
