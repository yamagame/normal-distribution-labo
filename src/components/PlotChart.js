import Chart from 'chart.js';

function plotChart(element, datasets, options) {
  const ctx = element.getContext('2d');

  return new Chart(ctx, {
    type: 'bar',
    data: {
      datasets,
    },
    options: {
      animation: false,
      legend: { display: false },
      scales: {
        yAxes: [{
          id: 'y-axis-1',
          scaleLabel: {
            display: true,
            labelString: 'f(x)',
          },
          position: 'left',
          ticks: { min: options.ymin, max: options.ymax, },
          gridLines: {
            drawOnChartArea: false,
          }
        }, {
          id: 'y-axis-2',
          scaleLabel: {
            display: true,
            labelString: 'count',
          },
          position: 'right',
          ticks: { min: 0, max: 100, },
          gridLines: {
            drawOnChartArea: false,
          }
        }],
        xAxes: [{
          scaleLabel: {
            display: true,
            labelString: 'x',
          },
          type: 'linear',
          position: 'bottom',
          ticks: { min: options.xmin, max: options.xmax, stepSize: options.xstep }
        }]
      },
    }
  });
}

Chart.controllers.point = Chart.controllers.bubble.extend({
  draw: function (ease) {
    Chart.controllers.bubble.prototype.draw.call(this, ease);
    var ctx = this.chart.ctx;
    var chartArea = this.chart.chartArea;
    ctx.save();
    var meta = this.getMeta();
    meta.data.forEach(data => {
      var pt0 = data;
      ctx.fillStyle = pt0._options.backgroundColor;
      ctx.beginPath();
      ctx.moveTo(pt0._view.x, pt0._view.y+pt0._view.radius);
      ctx.lineTo(pt0._view.x, chartArea.bottom);
      ctx.closePath();
      ctx.stroke();
    });
    ctx.restore();
  },
});

Chart.controllers.area = Chart.controllers.bubble.extend({
  draw: function (ease) {
    var ctx = this.chart.ctx;
    var chartArea = this.chart.chartArea;
    ctx.save();
    var meta = this.getMeta();
    meta.data.forEach(data => {
      var pt0 = data;
      ctx.fillStyle = pt0._options.backgroundColor;
      if (pt0._view.radius > 0) {
        if (chartArea.right > pt0._view.x) {
          ctx.fillRect(pt0._view.x, chartArea.top, chartArea.right - pt0._view.x, pt0._view.y - chartArea.top);
        }
      } else {
        if (0 < pt0._view.x - chartArea.left) {
          ctx.fillRect(chartArea.left, chartArea.top, pt0._view.x - chartArea.left, pt0._view.y - chartArea.top);
        }
      }
    });
    ctx.restore();
  },
});

export default {
  Chart: plotChart,
}
