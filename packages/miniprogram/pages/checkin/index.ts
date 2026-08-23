/**
 * 打卡页面 - 每日学习打卡
 */
Page({
  data: {
    today: '',
    checkInList: [] as any[],
    duration: 0,
    selectedCourseId: '',
  },

  onLoad() {
    this.setData({
      today: this.formatDate(new Date()),
    });
    this.loadCheckInList();
  },

  onShow() {
    this.loadCheckInList();
  },

  /**
   * 提交打卡
   */
  onSubmitCheckIn() {
    if (!this.data.selectedCourseId) {
      wx.showToast({ title: '请选择课程', icon: 'none' });
      return;
    }
    if (this.data.duration <= 0) {
      wx.showToast({ title: '请输入学习时长', icon: 'none' });
      return;
    }
    // TODO: 写入云数据库
    wx.showToast({ title: '打卡成功！', icon: 'success' });
  },

  /**
   * 选择课程
   */
  onCourseChange(e: any) {
    this.setData({
      selectedCourseId: e.detail.value,
    });
  },

  /**
   * 输入学习时长
   */
  onDurationInput(e: any) {
    this.setData({
      duration: Number(e.detail.value),
    });
  },

  /**
   * 加载打卡记录
   */
  loadCheckInList() {
    // TODO: 从云数据库加载打卡记录
    console.log('加载打卡记录');
  },

  /**
   * 格式化日期
   */
  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },
});
