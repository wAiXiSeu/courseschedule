/**
 * 错题本页面 - 查看和管理错题
 */
Page({
  data: {
    mistakes: [] as any[],
    currentFilter: '',
  },

  onLoad() {
    this.loadMistakes();
  },

  onShow() {
    this.loadMistakes();
  },

  /**
   * 加载错题列表
   */
  loadMistakes() {
    // TODO: 从云数据库加载错题列表
    console.log('加载错题列表');
  },

  /**
   * 查看错题详情
   */
  onViewMistake(e: any) {
    const mistakeId = e.currentTarget.dataset.id;
    console.log('查看错题', mistakeId);
    // TODO: 跳转到错题详情页
  },

  /**
   * 筛选科目
   */
  onFilterChange(e: any) {
    this.setData({
      currentFilter: e.detail.value,
    });
    this.loadMistakes();
  },
});
