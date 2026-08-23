/**
 * 课程色块组件 —— 小程序端复用
 *
 * 用于今日时间轴与周视图网格，展示单个课程实例。
 * 背景色由父级通过 color 属性指定（来自 Course.color）。
 */
Component({
  options: {
    virtualHost: true,
    pureDataPattern: /^_/,
  },

  properties: {
    /** 课程名称 */
    name: { type: String, value: '' },
    /** 开始时间 HH:mm */
    startTime: { type: String, value: '' },
    /** 结束时间 HH:mm */
    endTime: { type: String, value: '' },
    /** 上课地点 */
    location: { type: String, value: '' },
    /** 背景色（hex，如 #1E88E5） */
    color: { type: String, value: '#1E88E5' },
    /** 紧凑模式（周视图使用），隐藏地点 */
    compact: { type: Boolean, value: false },
  },

  data: {
    /** 合并到 style 字符串，避免小程序 setData 限制 */
    _bgStyle: '',
  },

  observers: {
    color(newVal: string) {
      this.setData({
        _bgStyle: `background-color: ${newVal || '#1E88E5'};`,
      });
    },
  },

  lifetimes: {
    attached() {
      this.setData({
        _bgStyle: `background-color: ${this.properties.color || '#1E88E5'};`,
      });
    },
  },
});
