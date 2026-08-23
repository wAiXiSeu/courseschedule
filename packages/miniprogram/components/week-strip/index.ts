/**
 * 周选择条组件 —— 小程序端
 *
 * 显示当前周日期范围，支持左右切换。
 */
Component({
  options: {
    virtualHost: true,
  },

  properties: {
    /** 周一日期 YYYY-MM-DD */
    startDate: { type: String, value: '' },
    /** 周日日期 YYYY-MM-DD */
    endDate: { type: String, value: '' },
  },

  data: {
    _displayText: '',
  },

  observers: {
    'startDate, endDate'(start: string, end: string) {
      if (!start || !end) {
        this.setData({ _displayText: '' });
        return;
      }
      const startMonth = parseInt(start.slice(5, 7));
      const startDay = parseInt(start.slice(8, 10));
      const endMonth = parseInt(end.slice(5, 7));
      const endDay = parseInt(end.slice(8, 10));
      const displayText = `${startMonth}月${startDay}日 - ${endMonth}月${endDay}日`;
      this.setData({ _displayText });
    },
  },

  methods: {
    /**
     * 上一周
     */
    onPrevWeek() {
      this.triggerEvent('prev-week');
    },

    /**
     * 下一周
     */
    onNextWeek() {
      this.triggerEvent('next-week');
    },
  },
});
