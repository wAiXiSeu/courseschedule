/**
 * 学习计划页面 - 展示和管理学习计划
 */
Page({
  data: {
    plans: [] as any[],
  },

  onLoad() {
    this.loadPlans();
  },

  onShow() {
    this.loadPlans();
  },

  /**
   * 加载学习计划
   */
  loadPlans() {
    // TODO: 从云数据库加载学习计划
    console.log('加载学习计划');
  },

  /**
   * 查看计划详情
   */
  onViewPlan(e: any) {
    const planId = e.currentTarget.dataset.id;
    console.log('查看计划', planId);
    // TODO: 跳转到计划详情页
  },
});
