/**
 * 种子数据云函数
 *
 * 初始化数据库集合与示例数据。
 * 微信小程序端调用：
 *   wx.cloud.callFunction({ name: 'seed' })
 */
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();

/**
 * 初始化种子数据
 * - 创建默认课程
 * - 创建示例排课规则
 */
async function seedCourses() {
  const defaultCourses = [
    {
      id: 'course-math',
      name: '数学',
      subjectKey: 'math',
      color: '#1E88E5',
      icon: '🔢',
      teacher: '',
      createdAt: db.serverDate(),
      updatedAt: db.serverDate(),
    },
    {
      id: 'course-chinese',
      name: '语文',
      subjectKey: 'chinese',
      color: '#E53935',
      icon: '📖',
      teacher: '',
      createdAt: db.serverDate(),
      updatedAt: db.serverDate(),
    },
    {
      id: 'course-english',
      name: '英语',
      subjectKey: 'english',
      color: '#43A047',
      icon: '🔤',
      teacher: '',
      createdAt: db.serverDate(),
      updatedAt: db.serverDate(),
    },
  ];

  for (const course of defaultCourses) {
    const existing = await db
      .collection('courses')
      .where({ id: course.id })
      .limit(1)
      .get();
    if (existing.data.length === 0) {
      await db.collection('courses').add({ data: course });
      console.log(`创建课程：${course.name}`);
    }
  }
}

/**
 * 云函数入口
 */
exports.main = async (event, context) => {
  try {
    await seedCourses();
    return { success: true, message: '种子数据初始化完成' };
  } catch (err) {
    console.error('种子数据初始化失败：', err);
    return { success: false, error: err.message };
  }
};
