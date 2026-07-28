// pages/reviews/reviews.js
Page({
  data: { skillId: '', rating: 5, text: '', reviews: [
    { user: '产品经理小王', rating: 5, text: '生成的PPT领导说很专业', date: '2026-07-20' },
    { user: '运营小李', rating: 4, text: 'Bento布局好看', date: '2026-07-22' }
  ]},
  onLoad: function(o) { this.setData({ skillId: o.id || '' }); },
  onRatingTap: function(e) { this.setData({ rating: e.currentTarget.dataset.r }); },
  onTextInput: function(e) { this.setData({ text: e.detail.value }); },
  onSubmit: function() {
    if (!this.data.text) { wx.showToast({title:'请写评价',icon:'none'}); return; }
    wx.showToast({ title: '评价提交成功', icon: 'success' });
    this.setData({ text: '', rating: 5 });
  }
});
