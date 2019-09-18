import React from 'react'
import { View } from 'react-native'
import { Svg, Rect, G, Polyline, Path } from 'react-native-svg'
import AbstractChart from './abstract-chart'

const barWidth = 32

class BarChart extends AbstractChart {
  constructor(props) {
    super(props)
    let mergedData = []
    this.props.data.lineData && this.props.data.lineData.map(x => mergedData.push(...x.data))
    this.props.data.barData && this.props.data.barData.map(x => mergedData.push(...x.data))
    this.mergedData = mergedData
  }
  renderBars = config => {
    const { datasets, width, height, paddingTop, paddingRight } = config
    if (datasets == null || datasets.length == 0) return;
    const baseHeight = this.calcBaseHeight(this.mergedData, height)

    const interval = (((width - paddingRight) / datasets[0].data.length) - 10) / datasets.length
    return datasets.map((item, index) => {
      const { data } = item
      return data.map((x, i) => {
        const barHeight = this.calcHeight(x, this.mergedData, height)
        return (
          <Rect
            key={Math.random()}
            x={
              paddingRight +
              (i * (width - paddingRight)) / data.length + interval * index + 5
            }
            y={
              ((barHeight > 0 ? baseHeight - barHeight : baseHeight) / 4) * 3 +
              paddingTop
            }
            width={interval / 2}
            height={(Math.abs(barHeight) / 4) * 3}
            fill={`url(#fillBarGradient${index})`}
          />
        )
      })
    })

  }

  renderBarTops = config => {
    const { data, width, height, paddingTop, paddingRight } = config
    const baseHeight = this.calcBaseHeight(data, height)
    return data.map((x, i) => {
      const barHeight = this.calcHeight(x, data, height)
      return (
        <Rect
          key={Math.random()}
          x={
            paddingRight +
            (i * (width - paddingRight)) / data.length +
            barWidth / 2
          }
          y={((baseHeight - barHeight) / 4) * 3 + paddingTop}
          width={barWidth}
          height={2}
          fill={this.props.chartConfig.color(0.6)}
        />
      )
    })
  }

  getColor = (dataset, opacity) => {
    return (dataset.color || this.props.chartConfig.color)(opacity)
  }

  getStrokeWidth = dataset => {
    return dataset.strokeWidth || this.props.chartConfig.strokeWidth || 3
  }

  getDatas = data =>
    data.reduce((acc, item) => (item.data ? [...acc, ...item.data] : acc), [])

  getBezierLinePoints = (dataset, config) => {
    const { width, height, paddingRight, paddingTop, data } = config
    if (dataset.data.length === 0) {
      return 'M0,0'
    }

    const x = i =>
      Math.floor(
        paddingRight + (i * (width - paddingRight)) / (dataset.data.length - 1)
      )
    const baseHeight = this.calcBaseHeight(this.mergedData, height)
    const y = i => {
      const yHeight = this.calcHeight(dataset.data[i], this.mergedData, height)
      return Math.floor((baseHeight - yHeight) / 4 * 3 + paddingTop)
    }

    return [`M${x(0)},${y(0)}`]
      .concat(
        dataset.data.slice(0, -1).map((_, i) => {
          const x_mid = (x(i) + x(i + 1)) / 2
          const y_mid = (y(i) + y(i + 1)) / 2
          const cp_x1 = (x_mid + x(i)) / 2
          const cp_x2 = (x_mid + x(i + 1)) / 2
          return (
            `Q ${cp_x1}, ${y(i)}, ${x_mid}, ${y_mid}` +
            ` Q ${cp_x2}, ${y(i + 1)}, ${x(i + 1)}, ${y(i + 1)}`
          )
        })
      )
      .join(' ')
  }

  renderBezierLine = config => {
    const output = []
    config.data.map((dataset, index) => {
      const result = this.getBezierLinePoints(dataset, config)
      output.push(
        <Path
          key={index}
          d={result}
          fill="none"
          stroke={this.getColor(dataset, 1)}
          strokeWidth={this.getStrokeWidth(dataset)}
        />
      )
    })
    return output
  }

  renderLine = config => {

    const { width, height, paddingRight, paddingTop, data } = config
    const output = []
    if (data == null || data.length == 0) return
    const baseHeight = this.calcBaseHeight(this.mergedData, height)
    const interval = (((width - paddingRight) / data[0].data.length) - 10) / data.length
    data.forEach((dataset, index) => {
      const points = dataset.data.map(
        (d, i) => {
          const x = (i * (width - paddingRight)) / dataset.data.length + paddingRight + interval * index + interval / 4 + 5
          const y = (baseHeight - this.calcHeight(d, this.mergedData, height)) / 4 * 3 + paddingTop
          return `${x},${y}`
        }
      )

      output.push(
        <Polyline
          key={index}
          points={points.join(' ')}
          fill="none"
          stroke={this.getColor(dataset, 1)}
          strokeWidth={this.getStrokeWidth(dataset)}
        />
      )
    })

    return output
  }

  render() {
    const paddingTop = 16
    const paddingRight = 32
    const {
      width,
      height,
      data,
      style = {},
      withHorizontalLabels = true,
      withVerticalLabels = true,
    } = this.props
    const { borderRadius = 0 } = style
    const config = {
      width,
      height
    }
    return (
      <View style={style}>
        <Svg height={height} width={width}>
          {this.renderDefs({
            ...config,
            ...this.props.chartConfig
          })}
          <Rect
            width="100%"
            height={height}
            rx={borderRadius}
            ry={borderRadius}
            fill="url(#backgroundGradient)"
          />
          <G>
            {this.renderHorizontalLines({
              ...config,
              count: 4,
              paddingTop,
              paddingRight
            })}
          </G>
          <G>
            {withHorizontalLabels
              ? this.renderHorizontalLabels({
                ...config,
                count: 4,
                data: this.mergedData,
                paddingTop,
                paddingRight
              })
              : null}
          </G>
          <G>
            {withVerticalLabels
              ? this.renderVerticalLabels({
                ...config,
                labels: data.labels,
                paddingRight: paddingRight,
                paddingTop,
                horizontalOffset: 10
              })
              : null}
          </G>
          <G>
            {this.renderBars({
              ...config,
              datasets: data.barData,
              paddingTop,
              paddingRight
            })}
          </G>
          <G>
            {this.renderBezierLine({
              ...config,
              paddingRight,
              paddingTop,
              data: data.lineData
            })}
          </G>
          {/* <G>
            {withDots &&
              this.renderDots({
                ...config,
                data: data.datasets,
                paddingTop,
                paddingRight,
                onDataPointClick
              })}
          </G> */}
        </Svg>
      </View>
    )
  }
}

export default BarChart
