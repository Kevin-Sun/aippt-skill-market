// pages/community/community.js · P12: WorkBuddy 办公效率社群
var MEMBER_REVIEWS = [
  { user: '打工人小王（财务）', avatar: 'https://i.pravatar.cc/150?img=12', rating: 5, text: '真的哭死😭 月底对账对到眼瞎，星球教的 Excel 透视表 5 分钟搞定！之前加班到 10 点，现在 6 点准时下班，WorkBuddy 真的绝绝子✨', date: '2026-07-25' },
  { user: '运营小李（互联网）', avatar: 'https://i.pravatar.cc/150?img=23', rating: 5, text: '姐妹们冲！用 WorkBuddy 生成周报 PPT 真的香🚀 数据分析部分直接喂数据，图表自动出，比我手画的强 100 倍😂', date: '2026-07-23' },
  { user: '答辩焦虑中（研究生）', avatar: 'https://i.pravatar.cc/150?img=8', rating: 5, text: '救命！开题答辩前一天才发现这个星球😱 PPT skill 生成答辩 PPT，导师说比上届清爽多了。Excel 技巧也帮我整理了调研数据，299 太值了🙏', date: '2026-07-20' },
  { user: '数据分析小白（转岗）', avatar: 'https://i.pravatar.cc/150?img=34', rating: 5, text: '刚转数据分析，啥也不会，星球每天一个小技巧真的救命😭 上周学的 Excel 函数，这周 WorkBuddy 数据清洗，进步飞快📈 强推！', date: '2026-07-18' },
  { user: '咨询顾问（乙方）', avatar: 'https://i.pravatar.cc/150?img=5', rating: 5, text: '给客户做方案，用星球的咨询报告 skill 出 PPT，客户问是哪家设计公司做的哈哈👍 Excel 数据分析技巧也很实用，已安利给同事', date: '2026-07-16' },
  { user: 'WorkBuddy重度用户（产品经理）', avatar: 'https://i.pravatar.cc/150?img=56', rating: 5, text: '每天都在 WorkBuddy 里泡着，星球的技能包真的全❤️ 从 PPT 到 Excel 到数据分析，一个 WorkBuddy 搞定所有办公', date: '2026-07-14' },
];

var OPERATIONS = [
  { date: '2026-07-29', time: '09:00', title: '今日更新：Excel 透视表 3 个实战技巧（月底对账必学）📊', tag: 'Excel' },
  { date: '2026-07-28', time: '21:30', title: '本周答疑：WorkBuddy 生成 PPT 字体不一致怎么修？🔧', tag: 'WorkBuddy' },
  { date: '2026-07-28', time: '09:00', title: '新上架：数据分析报告 skill（Excel+图表自动化）📈', tag: '数据分析' },
  { date: '2026-07-27', time: '20:00', title: '用户案例：用 Excel 技巧 5 分钟搞定月底对账💼', tag: 'Excel' },
  { date: '2026-07-27', time: '09:00', title: '本周预告：2 个新 skill + WorkBuddy 技能包分享🎁', tag: 'WorkBuddy' },
  { date: '2026-07-26', time: '21:00', title: '数据分析：用 WorkBuddy 清洗 10 万行数据的 3 步法🔍', tag: '数据分析' },
  { date: '2026-07-26', time: '09:00', title: 'PPT 技巧：Bento Grid 布局让汇报 PPT 专业 10 倍🎨', tag: 'PPT' },
];

var BENEFITS = [
  { icon: '/images/icons/star.png', title: '每日更新', desc: 'PPT/Excel/数据分析技巧，每天一个新玩法' },
  { icon: '/images/icons/check.png', title: 'WorkBuddy 玩法', desc: '技能包/提示词/自动化，办公效率翻倍' },
  { icon: '/images/icons/crown.png', title: '定制调优', desc: '1v1 帮你调 skill/公式/模板' },
  { icon: '/images/icons/chat.png', title: '社群互助', desc: '问答/分享/灵感，同频的人一起成长' },
  { icon: '/images/icons/bell.png', title: '直播答疑', desc: '每周一次直播，实时解答问题' },
  { icon: '/images/icons/box.png', title: '资源下载', desc: '模板库/工具包/技能包持续更新' },
];

Page({
  data: {
    title: 'WorkBuddy 办公效率社群',
    slogan: '用 WorkBuddy 搞定 PPT/Excel/数据分析，每天一个新玩法',
    tags: ['PPT', 'Excel', '数据分析', 'WorkBuddy'],
    benefits: BENEFITS,
    operations: OPERATIONS,
    reviews: MEMBER_REVIEWS,
    price: 299,
    period: '年',
    memberCount: 356,
  },

  onJoinTap: function() {
    wx.setClipboardData({
      data: '知识星球：WorkBuddy 办公效率社群（299年费）',
      success: function() {
        wx.showToast({ title: '星球号已复制', icon: 'success' });
      },
    });
  },
});
