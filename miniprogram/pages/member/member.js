// pages/member/member.js · 会员页（SKU对比+权益+推荐+开通）
var tiers = [
  { id: 'free', name: '免费', price: 0, period: '', features: ['浏览 skill', '免费 skill 领取'], recommended: false, badge: '' },
  { id: 'single', name: '单 skill', price: 2.9, period: '一次性', features: ['1 个 skill', '基础预览'], recommended: false, badge: '' },
  { id: 'category', name: '一类 skill', price: 9.9, period: '一次性', features: ['n 个同类 skill', '预览+导出'], recommended: false, badge: '' },
  { id: 'monthly', name: '月度会员', price: 19.9, period: '月', features: ['全库 skill', '预览+导出', '每月更新'], recommended: true, badge: '最热' },
  { id: 'annual', name: '年度会员', price: 99.9, period: '年', features: ['全库 skill', '预览+导出', '定制调优', '社群'], recommended: false, badge: '最值' },
];

var allFeatures = ['浏览 skill', '免费 skill', '单 skill 购买', '一类 skill', '全库 skill', '预览+导出', '定制调优', '社群'];

Page({
  data: { tiers: tiers, allFeatures: allFeatures },
  onSubscribeTap: function(e) {
    var id = e.currentTarget.dataset.id;
    wx.showToast({ title: '支付功能联调中', icon: 'none' });
  },
  onCommunityTap: function() {
    wx.navigateTo({ url: '/pages/community/community' });
  }
});
