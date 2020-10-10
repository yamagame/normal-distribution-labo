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

  const [state, setState] = React.useState({
    showDistribution: false,
    showSamplingDistribution: false,
    showTDistribution: true,
    showPaintDistribution: false,
    showNormalCumulative: false,
    showSamplingCumulative: false,
    showTValueCumulative: true,
    normalLeftValue: left,
    samplingLeftValue: left,
    tLeftValue: -10,
    mean: left + (right - left) / 2,
    variance: 1,
    std: 1,
    samplingNumber: 3,
    showBoth: false,
    enableMeanOffset: false,
    avgSamplingNumber: 0,
    stdErr: 0,
    enableMeanZero: false,
  })

  const [percentFix, setPercentFix] = React.useState(false);
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
    updateChart();
  }, []);

  React.useEffect(() => {
    setState({
      ...state,
      stdErr: state.std / Math.sqrt(state.samplingNumber),
    });
  }, [state.std, state.samplingNumber]);

  React.useEffect(() => {
    setState({
      ...state,
      std: Math.sqrt(state.variance),
    });
  }, [state.variance]);

  React.useEffect(() => {
    setState({
      ...state,
      mean: left + (right - left) / 2,
      normalLeftValue: left,
      samplingLeftValue: left,
    })
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
    state,
  ]);

  const get_random_samples = (n) => {
    function getRandomInt(max) {
      return Math.floor(Math.random() * Math.floor(max));
    }
    avgSamplingPoint.current = [];
    for (var i=0;i<n;i++) {
      const t = [];
      for (var j=0;j<state.samplingNumber;j++) {
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
    R.rnorm(200, state.mean, state.std).forEach( v => {
      samplingPoint.current.push(v);
    });
    get_random_samples(200);
    updateChart();
  }

  const doResetSampling = () => {
    samplingPoint.current = [];
    setState({
      ...state,
       avgSamplingNumber: 0,
    });
    updateChart();
  }

  const updateChart = () => {
    var xmin = chartOptions.current.xmin;
    var xmax = chartOptions.current.xmax;
    var nx = 100;

    if (percentFix) {
      setState({
        ...state,
        normalLeftValue: R.qnorm(normalPercent, state.mean, state.std),
        samplingLeftValue: R.qnorm(samplingPercent, state.mean, state.stdErr),
        tLeftValue: R.qt(tValuePercent, state.samplingNumber - 1),
      })
    }

    function calc_normal_distribution() {
      var data = [];
      for (let i = 0; i < nx + 1; i++) {
        var x = (xmin + (xmax - xmin) / nx * i);
        var y = R.dnorm(x, state.mean, state.std);
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
      fill: state.showPaintDistribution,
    }

    const get_samples = () => {
      const t = samplingPoint.current.slice(0, state.samplingNumber).map(v => {
        return {
          x: v, y: 20,
          r: 4,
        }
      });
      return t;
    }

    var samples = get_samples();
    var avg = samples.reduce((a, c) => a + c.x, 0) / samples.length;
    var params = Stat.calcParams(samplingPoint.current.slice(0, state.samplingNumber));
    const tValue = params.stderr>0?(params.mean - state.mean) / params.stderr:0;
    setState({ ...state, tValue });
    setSampleValues(params);

    var alpha = 0.6 / state.samplingNumber;
    if (alpha < 0.05) alpha = 0.05;

    var dataSet2 = {
      type: 'point',
      data: state.avgSamplingNumber==0?samples:[],
      backgroundColor: color('blue').alpha(alpha * 2).rgbString(),
      borderColor: color('blue').alpha(alpha * 5).rgbString(),
      yAxisID: 'y-axis-2',
    }

    const avg_samples = [
      { x: avg, y: 40, r: 4, },
      ...avgSamplingPoint.current.slice(0, state.avgSamplingNumber),
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
      { x: state.normalLeftValue, y: 0, r: 0 },
    ];

    if (state.showBoth) {
      areaData.push({ x: state.mean*2-state.normalLeftValue, y: 0, r: 100 });
    }

    var dataSet3 = {
      type: 'area',
      data: areaData,
      backgroundColor: color(chartColors.red).alpha(0.5).rgbString(),
      borderColor: chartColors.red,
      pointRadius: 0,
    }

    var areaData_A = [
      { x: state.samplingLeftValue+(state.enableMeanOffset?params.enableMeanOffset-state.mean:0), y: 0, r: 0 },
    ];

    if (state.showBoth) {
      areaData_A.push({ x: (state.enableMeanOffset?params.mean:state.mean)*2-(state.samplingLeftValue+(state.enableMeanOffset?params.mean-state.mean:0)), y: 0, r: 100 });
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
        var y = R.dnorm(x, (state.enableMeanOffset?params.mean-state.mean:0)+state.mean, state.stdErr);
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
      fill: state.showPaintDistribution,
    }

    function calc_func_t_distribution() {
      var data = [];
      for (let i = 0; i < nx + 1; i++) {
        var x = (xmin + (xmax - xmin) / nx * i)-state.mean;
        var y = R.dt(x, state.samplingNumber - 1);
        data.push({ x: x+(state.enableMeanOffset?params.mean-state.mean:0)+state.mean, y: y });
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
      fill: state.showPaintDistribution,
    }

    var tErr = params.stderr==0?1:params.stderr;

    var areaData_T = [
      { x: state.tLeftValue*tErr+state.mean+(state.enableMeanOffset?params.mean-state.mean:0), y: 0, r: 0 },
    ];

    if (state.showBoth) {
      areaData_T.push({ x: -state.tLeftValue*tErr+state.mean+(state.enableMeanOffset?params.mean-state.mean:0), y: 0, r: 100 })
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
    if (state.showDistribution) {
      chartData.current.push(dataSet1);
    }
    if (state.showSamplingDistribution) {
      chartData.current.push(dataSet4);
    }
    if (state.showTDistribution) {
      chartData.current.push(dataSet5);
    }
    if (state.showNormalCumulative) {
      chartData.current.push(dataSet3);
    }
    if (state.showSamplingCumulative) {
      chartData.current.push(dataSet3_A);
    }
    if (state.showTValueCumulative) {
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
          checked={state.showDistribution}
          onChange={(e) => {
            setState({ ...state, showDistribution: e.target.checked });
          }}
        />
        <div className="inline-block">:母集団分布</div>
      </div>
      <div className="inline-block w-1/3">
        <input
          type="checkbox"
          checked={state.showSamplingDistribution}
          onChange={(e) => {
            setState({ ...state, showSamplingDistribution: e.target.checked });
          }}
        />
        <div className="inline-block">:標本平均の分布</div>
      </div>
      <div className="inline-block w-1/3">
        <input
          type="checkbox"
          checked={state.showTDistribution}
          onChange={(e) => {
            setState({ ...state, showTDistribution: e.target.checked });
          }}
        />
        <div className="inline-block">:t分布</div>
      </div>
      <div className="inline-block w-1/3">
        <input
          type="checkbox"
          checked={state.showPaintDistribution}
          onChange={(e) => {
            setState({ ...state, showPaintDistribution: e.target.checked });
          }}
        />
        <div className="inline-block">:塗り潰し</div>
      </div>
      <div className="inline-block w-1/3">
        <input
          type="checkbox"
          checked={state.enableMeanOffset}
          onChange={(e) => {
            setState({ ...state, enableMeanOffset: e.target.checked })
          }}
        />
        <div className="inline-block">:平均補正</div>
      </div>
      <div className="inline-block w-1/3">
        <input
          type="checkbox"
          checked={state.enableMeanZero}
          onChange={(e) => {
            if (e.target.checked) {
              setLeft(-10);
              setRight(10);
            } else {
              setLeft(30);
              setRight(50);
            }
            setState({
              ...state,
              enableMeanZero: e.target.checked,
            })
          }}
        />
        <div className="inline-block">:0平均化</div>
      </div>
      <div>
        <div className="inline-block w-1/3">母平均:{state.mean}</div>
        <input
          value={state.mean} type="range"
          min={chartOptions.current.xmin}
          max={chartOptions.current.xmax}
          step="0.1"
          onChange={(e) => {
            setState({
              ...state,
              mean: parseFloat(e.target.value),
            })
          }}
        />
      </div>
      <div>
        <div className="inline-block w-1/3">母分散:{state.variance}</div>
        <input
          value={state.variance}
          type="range"
          min="0.1"
          max="3"
          step="0.1"
          onChange={(e) => {
            setState({
              ...state,
              variance: parseFloat(e.target.value),
            })
          }}
        />
      </div>
      <div>
        <div className="inline-block w-1/3">サンプリング数:{state.samplingNumber}</div>
        <input
          value={state.samplingNumber} type="range" min="3" max="200" step="1"
          onChange={(e) => {
            setState({
              ...state,
              samplingNumber: parseInt(e.target.value),
            })
          }}
        />
        <input type="button" value="サンプリング" onClick={doSampling} />
        <input type="button" value="リセット" onClick={doResetSampling} />
      </div>
      <div>
        <div className="inline-block w-1/3">標本平均の個数:{state.avgSamplingNumber+1}</div>
        <input
          value={state.avgSamplingNumber} type="range" min="0" max="99" step="1"
          onChange={(e) => {
            setState({
              ...state,
              avgSamplingNumber: parseInt(e.target.value),
            })
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
        <div className="inline-block w-1/3">t値:{Stat.round(state.tValue)}</div>
      </div>

      <div>累積分布</div>

      <div>
        <div className="inline-block w-1/3">
          <input
            type="checkbox"
            checked={state.showBoth}
            onChange={(e) => {
              setState({
                ...state,
                showBoth: e.target.checked,
              })
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
                setNormalPercent(Stat.round(R.pnorm(state.normalLeftValue, state.mean, state.std)));
                setSamplingPercent(Stat.round(R.pnorm(state.samplingLeftValue, state.mean, state.stdErr)));
                setTValuePercent(Stat.round(R.pt(state.tLeftValue, state.samplingNumber-1)));
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
          checked={state.showNormalCumulative}
          onChange={(e) => {
            setState({ ...state, showNormalCumulative: e.target.checked });
          }}
        />
        <div className="inline-block">:母分布:{Stat.round(state.normalLeftValue)}/{Stat.round(R.pnorm(state.normalLeftValue, state.mean, state.std)*100)}%</div>
        </div>
        <div className="inline-block">
          <input
            value={state.normalLeftValue}
            type="range"
            min={chartOptions.current.xmin}
            max={chartOptions.current.xmax}
            step="0.05"
            disabled={percentFix}
            onChange={(e) => {
              setState({
                ...state,
                normalLeftValue: parseFloat(e.target.value),
              })
            }}
          />
          <input type="button" value="0.5%点" onClick={() => {
            setState({
              ...state,
              normalLeftValue: R.qnorm(0.005, state.mean, state.std),
            })
          }} />
          <input type="button" value="1.0%点" onClick={() => {
            setState({
              ...state,
              normalLeftValue: R.qnorm(0.001, state.mean, state.std),
            })
          }} />
          <input type="button" value="2.5%点" onClick={() => {
            setState({
              ...state,
              normalLeftValue: R.qnorm(0.025, state.mean, state.std),
            })
          }} />
          <input type="button" value="5%点" onClick={() => {
            setState({
              ...state,
              normalLeftValue: R.qnorm(0.05, state.mean, state.std),
            })
          }} />
          <input type="button" value="25%点" onClick={() => {
            setState({
              ...state,
              normalLeftValue: R.qnorm(0.25, state.mean, state.std),
            })
          }} />
        </div>
      </div>

      <div>
        <div className="inline-block w-1/3">
        <input
          type="checkbox"
          checked={state.showSamplingCumulative}
          onChange={(e) => {
            setState({ ...state, showSamplingCumulative: e.target.checked });
          }}
        />
        <div className="inline-block">:標本分布:{Stat.round(state.samplingLeftValue)}/{Stat.round(R.pnorm(state.samplingLeftValue, state.mean, state.stdErr)*100)}%</div>
        </div>
        <div className="inline-block">
          <input
            value={state.samplingLeftValue}
            type="range"
            min={chartOptions.current.xmin}
            max={chartOptions.current.xmax}
            step="0.05"
            disabled={percentFix}
            onChange={(e) => {
              setState({
                ...state,
                samplingLeftValue: parseFloat(e.target.value),
              })
            }}
          />
          <input type="button" value="0.5%点" onClick={() => {
            setState({
              ...state,
              samplingLeftValue: R.qnorm(0.005, state.mean, state.stdErr),
            })
          }} />
          <input type="button" value="1.0%点" onClick={() => {
            setState({
              ...state,
              samplingLeftValue: R.qnorm(0.001, state.mean, state.stdErr),
            })
          }} />
          <input type="button" value="2.5%点" onClick={() => {
            setState({
              ...state,
              samplingLeftValue: R.qnorm(0.025, state.mean, state.stdErr),
            })
          }} />
          <input type="button" value="5%点" onClick={() => {
            setState({
              ...state,
              samplingLeftValue: R.qnorm(0.05, state.mean, state.stdErr),
            })
          }} />
          <input type="button" value="25%点" onClick={() => {
             setState({
              ...state,
              samplingLeftValue: R.qnorm(0.25, state.mean, state.stdErr),
            })
         }} />
        </div>
      </div>

      <div>
        <div className="inline-block w-1/3">
        <input
          type="checkbox"
          checked={state.showTValueCumulative}
          onChange={(e) => {
            setState({ ...state, showTValueCumulative: e.target.checked });
          }}
        />
        <div className="inline-block">:t分布:{Stat.round(state.tLeftValue)}/{Stat.round(R.pt(state.tLeftValue, state.samplingNumber-1)*100)}%</div>
        </div>
        <div className="inline-block">
          <input
            value={state.tLeftValue}
            type="range"
            min={-10}
            max={ 10}
            step="0.05"
            disabled={percentFix}
            onChange={(e) => {
              setState({
                ...state,
                tLeftValue: parseFloat(e.target.value),
              })
            }}
          />
          <input type="button" value="0.5%点" onClick={() => {
            setState({
              ...state,
              tLeftValue: R.qt(0.005, state.samplingNumber - 1),
            })
          }} />
          <input type="button" value="1.0%点" onClick={() => {
            setState({
              ...state,
              tLeftValue: R.qt(0.001, state.samplingNumber - 1),
            })
          }} />
          <input type="button" value="2.5%点" onClick={() => {
            setState({
              ...state,
              tLeftValue: R.qt(0.025, state.samplingNumber - 1),
            })
          }} />
          <input type="button" value="5%点" onClick={() => {
            setState({
              ...state,
              tLeftValue: R.qt(0.05, state.samplingNumber - 1),
            })
          }} />
          <input type="button" value="25%点" onClick={() => {
            setState({
              ...state,
              tLeftValue: R.qt(0.25, state.samplingNumber - 1),
            })
          }} />
        </div>
      </div>
    </>
  )
}
