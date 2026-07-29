// pages/reviews/reviews.js · P11: UGC 仿真
var MOCK_REVIEWS = {
  'work-report-pro': [
    { user: '打工人小王', avatar: 'https://i.pravatar.cc/150?img=12', rating: 5, text: '真的救了我一命😭 周五要汇报周四晚上才开始做，用这个10分钟出稿，领导还问我是不是请外援了哈哈', date: '2026-07-25' },
    { user: '周报写不完', avatar: 'https://i.pravatar.cc/150?img=23', rating: 5, text: '姐妹们冲！数据图表自动生成就很绝🚀 我只要把数字填进去就行，配色是真的舒服', date: '2026-07-23' },
    { user: '述职焦虑中', avatar: 'https://i.pravatar.cc/150?img=34', rating: 4, text: '用了三个月了，每次汇报都被夸 PPT 做得专业，其实是它生成的哈哈😂 打工人狂喜', date: '2026-07-20' },
    { user: '财务小李', avatar: 'https://i.pravatar.cc/150?img=45', rating: 5, text: '述职报告直接用它生成，领导说今年述职最清晰✨ 数据可视化比我手画的强 100 倍', date: '2026-07-18' },
    { user: '产品经理阿杰', avatar: 'https://i.pravatar.cc/150?img=56', rating: 5, text: '之前一页 PPT 抠半天配色，现在直接套模板，效率翻了 5 倍不止💪 强推', date: '2026-07-15' },
  ],
  'thesis-defense': [
    { user: '答辩焦虑中', avatar: 'https://i.pravatar.cc/150?img=8', rating: 5, text: '开题答辩过了！导师说 PPT 做得清爽，学术感很强🎓 救命这个模板太香了', date: '2026-07-24' },
    { user: '研三狗', avatar: 'https://i.pravatar.cc/150?img=15', rating: 5, text: '图表布局超合理，我数据直接填进去就行📊 导师说比上一届专业多了', date: '2026-07-22' },
    { user: '毕业冲刺中', avatar: 'https://i.pravatar.cc/150?img=27', rating: 5, text: '答辩前一天才发现这个😱 熬夜改完，居然拿了优秀论文🙏 299 太值了', date: '2026-07-19' },
    { user: '博士生小张', avatar: 'https://i.pravatar.cc/150?img=38', rating: 4, text: '学术英文 PPT skill 也很好用，国际会议汇报被外国教授夸了👍', date: '2026-07-16' },
  ],
  'consulting-report': [
    { user: '咨询顾问乙方', avatar: 'https://i.pravatar.cc/150?img=5', rating: 5, text: '客户看了我们的咨询报告 PPT，直接问是哪家设计公司做的😂 麦肯锡风真的绝', date: '2026-07-23' },
    { user: '数据分析师', avatar: 'https://i.pravatar.cc/150?img=18', rating: 5, text: '数据可视化比我花钱请的设计师还专业📈 投标用它做方案，中标了！', date: '2026-07-21' },
    { user: '战略咨询小林', avatar: 'https://i.pravatar.cc/150?img=29', rating: 5, text: '甲方说 PPT 逻辑很清晰，其实是 skill 帮我搭的框架👍 已安利给同事', date: '2026-07-18' },
  ],
};

Page({
  data: { skillId: '', rating: 5, text: '', reviews: [] },

  onLoad: function(o) {
    var skillId = o.id || '';
    this.setData({ skillId: skillId });
    this.loadReviews(skillId);
  },

  loadReviews: function(skillId) {
    try {
      var userReviews = wx.getStorageSync('reviews_' + skillId) || [];
      var mockReviews = MOCK_REVIEWS[skillId] || [];
      // 用户评价在前，mock 评价在后
      var all = userReviews.concat(mockReviews);
      this.setData({ reviews: all });
    } catch (e) {
      this.setData({ reviews: MOCK_REVIEWS[skillId] || [] });
    }
  },

  onRatingTap: function(e) { this.setData({ rating: e.currentTarget.dataset.r }); },
  onTextInput: function(e) { this.setData({ text: e.detail.value }); },

  onSubmit: function() {
    if (!this.data.text) { wx.showToast({ title: '请写评价', icon: 'none' }); return; }
    var review = {
      user: '我',
      avatar: 'https://i.pravatar.cc/150?img=68',
      rating: this.data.rating,
      text: this.data.text,
      date: new Date().toISOString().substring(0, 10),
    };
    try {
      var reviews = wx.getStorageSync('reviews_' + this.data.skillId) || [];
      reviews.unshift(review);
      wx.setStorageSync('reviews_' + this.data.skillId, reviews);
    } catch (e) {}
    wx.showToast({ title: '评价提交成功', icon: 'success' });
    this.setData({ text: '', rating: 5 });
    this.loadReviews(this.data.skillId);
  },
});
